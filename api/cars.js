const { put, head } = require('@vercel/blob');

const PATHNAME = 'cars.json';

// Fonction serverless Vercel : lit/écrit le catalogue partagé (Vercel Blob),
// utilisée par le site pour que toute voiture ajoutée depuis n'importe quel
// appareil soit visible par tous les visiteurs, sans rebuild ni redéploiement.
// Fichier en CommonJS pur (pas de TS) pour éviter tout conflit avec le
// tsconfig Angular du projet ("module": "preserve"), qui casse le chargement
// des fonctions Node si TypeScript est laissé en charge de la compilation.
module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const blob = await head(PATHNAME);
      const response = await fetch(blob.url, { cache: 'no-store' });
      const data = await response.json();
      res.status(200).json(data);
    } catch {
      // Aucun catalogue enregistré encore (ou store non configuré) : liste vide.
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    const cars = req.body;
    if (!Array.isArray(cars)) {
      res.status(400).json({ error: 'Le corps de la requête doit être un tableau de voitures.' });
      return;
    }
    try {
      await put(PATHNAME, JSON.stringify(cars), {
        access: 'public',
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
