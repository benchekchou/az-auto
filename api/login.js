// Fonction serverless Vercel : vérifie le mot de passe admin.
// Le mot de passe attendu vit uniquement dans la variable d'environnement
// ADMIN_PASSWORD (Vercel > Project Settings > Environment Variables), jamais
// dans le code ni dans le bundle envoyé au navigateur. Le mot de passe fait
// aussi office de "token" réutilisé comme en-tête Authorization sur
// POST /api/cars (voir cars.js) : c'est ce contrôle serveur, pas l'UI, qui
// empêche un visiteur d'ajouter/modifier des voitures.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: "Mot de passe admin non configuré côté serveur (ADMIN_PASSWORD manquant)." });
    return;
  }

  const password = req.body?.password;
  if (typeof password !== 'string' || password !== expected) {
    res.status(401).json({ error: 'Mot de passe incorrect.' });
    return;
  }

  res.status(200).json({ ok: true });
};
