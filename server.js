// server.js (version robuste pour debug)
const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const GAMES_DIR = path.join(__dirname, 'games');

try {
  if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR, { recursive: true });
} catch (err) {
  console.error('Impossible de créer le dossier games/:', err);
  process.exit(1);
}

app.use(helmet());
// augmenter la limite si tes jeux sont lourds
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

// helper simple logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.url}`);
  next();
});

app.get('/api/games', (req, res) => {
  try {
    const games = fs.readdirSync(GAMES_DIR)
      .map(folder => {
        const metaPath = path.join(GAMES_DIR, folder, 'meta.json');
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          return { id: folder, title: meta.title, date: meta.date };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(games);
  } catch (err) {
    console.error('Erreur GET /api/games:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la lecture des jeux', details: String(err) });
  }
});

app.post('/api/games', (req, res) => {
  try {
    const { title, html } = req.body || {};
    if (!title || !html) {
      return res.status(400).json({ error: 'Titre et HTML requis' });
    }

    const id = uuidv4();
    const folder = path.join(GAMES_DIR, id);

    fs.mkdirSync(folder, { recursive: true });

    // write index.html and meta.json
    fs.writeFileSync(path.join(folder, 'index.html'), String(html), 'utf8');
    fs.writeFileSync(path.join(folder, 'meta.json'), JSON.stringify({
      title: String(title),
      date: new Date().toISOString()
    }), 'utf8');

    console.log(`Jeu créé: ${id} (${title})`);
    res.json({ id, title });
  } catch (err) {
    console.error('Erreur POST /api/games:', err);
    // si erreur d'écriture disque, renvoyer info utile
    res.status(500).json({ error: 'Impossible de créer le jeu', details: String(err) });
  }
});

app.get('/play/:id', (req, res) => {
  try {
    const folder = path.join(GAMES_DIR, req.params.id);
    const file = path.join(folder, 'index.html');
    if (!fs.existsSync(file)) return res.status(404).send('Jeu introuvable.');
    res.sendFile(file);
  } catch (err) {
    console.error('Erreur GET /play/:id', err);
    res.status(500).send('Erreur serveur');
  }
});

app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));
