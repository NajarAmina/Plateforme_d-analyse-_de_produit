require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Aligné sur le proxy CRA (package.json → http://localhost:5000)
const port = process.env.PORT || 5000;

// Démarrage du serveur + tentative de connexion DB (ne bloque pas le serveur)
app.listen(port, () => console.log(`✅ Serveur démarré sur http://localhost:${port}`));

connectDB()
    .then(() => {
        console.log('✅ Connecté à MongoDB');
    })
    .catch((err) => {
        console.error('⚠️ MongoDB indisponible, API démarrée sans DB:', err.message || err);
    });