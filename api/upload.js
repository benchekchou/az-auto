const { put } = require('@vercel/blob');
const { randomUUID } = require('crypto');

// Fonction serverless Vercel : upload d'une photo de voiture vers Vercel Blob.
// Reçoit une image en base64 (data URL) depuis le formulaire admin, la stocke
// dans le Blob en accès "public" (nécessaire pour l'affichage <img src=...>
// côté visiteurs), et renvoie l'URL publique à stocker dans Car.photos.
// Séparer l'upload des photos de la sauvegarde du catalogue (cars.js) évite
// que chaque ajout/modification/suppression de voiture ne renvoie TOUTES les
// photos de TOUT le catalogue dans un seul POST /api/cars, qui finissait par
// dépasser la limite de taille de requête de Vercel (413 Payload Too Large).
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  // Même contrôle d'accès que POST /api/cars : seul l'admin authentifié peut
  // écrire dans le Blob store.
  const expected = process.env.ADMIN_PASSWORD;
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!expected || token !== expected) {
    res.status(401).json({ error: 'Authentification requise pour téléverser une photo.' });
    return;
  }

  const dataUrl = req.body?.data;
  const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    res.status(400).json({ error: 'Image invalide (data URL attendue).' });
    return;
  }
  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const ext = contentType.split('/')[1] || 'jpg';

  try {
    const blob = await put(`photos/${randomUUID()}.${ext}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    // Journalisé côté serveur (visible dans `vercel logs`) : le message
    // renvoyé au client seul ne suffisait pas à diagnostiquer les 500 ici.
    console.error('Échec de l’upload vers Vercel Blob :', err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur d'upload." });
  }
};
