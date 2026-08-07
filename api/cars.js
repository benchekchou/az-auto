const { put, get } = require('@vercel/blob');

const PATHNAME = 'cars.json';

// Fonction serverless Vercel : lit/écrit le catalogue partagé (Vercel Blob),
// utilisée par le site pour que toute voiture ajoutée depuis n'importe quel
// appareil soit visible par tous les visiteurs, sans rebuild ni redéploiement.
// Fichier en CommonJS pur (pas de TS) pour éviter tout conflit avec le
// tsconfig Angular du projet ("module": "preserve"), qui casse le chargement
// des fonctions Node si TypeScript est laissé en charge de la compilation.
// Le store Blob est en accès "private" : on utilise get() (authentifié via
// BLOB_READ_WRITE_TOKEN) plutôt qu'un fetch() direct de l'URL publique.
module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await get(PATHNAME, { access: 'private', useCache: false });
      if (!result || !result.stream) {
        res.status(200).json([]);
        return;
      }
      const text = await new Response(result.stream).text();
      res.status(200).json(JSON.parse(text));
    } catch {
      // Aucun catalogue enregistré encore (ou store non configuré) : liste vide.
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    // Écriture réservée à l'admin : vérifie le jeton envoyé en en-tête
    // Authorization (voir AuthService côté client, et login.js pour l'émission).
    // C'est ce contrôle-ci, pas l'interface, qui empêche un client de modifier
    // le catalogue — il reste actif même si quelqu'un appelle l'API directement.
    const expected = process.env.ADMIN_PASSWORD;
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!expected || token !== expected) {
      res.status(401).json({ error: 'Authentification requise pour modifier le catalogue.' });
      return;
    }

    const cars = req.body;
    if (!Array.isArray(cars)) {
      res.status(400).json({ error: 'Le corps de la requête doit être un tableau de voitures.' });
      return;
    }
    try {
      await put(PATHNAME, JSON.stringify(cars), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur de sauvegarde.' });
    }
    return;
  }

  res.status(405).json({ error: 'Méthode non autorisée' });
};
