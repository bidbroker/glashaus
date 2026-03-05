const fs = require('fs');
const path = require('path');

const dataDir = '/data';
const targetDb = path.join(dataDir, 'glashaus.db');
const sourceDb = path.join(process.cwd(), 'glashaus.db');

// Prüfe ob wir auf Railway sind (Volume vorhanden)
if (fs.existsSync(dataDir)) {
  console.log('🚀 Railway-Umgebung erkannt');

  // Wenn keine DB im Volume existiert, kopiere die initiale DB
  if (!fs.existsSync(targetDb)) {
    console.log('📦 Kopiere initiale Datenbank ins Volume...');
    fs.copyFileSync(sourceDb, targetDb);
    console.log('✅ Datenbank kopiert nach:', targetDb);
  } else {
    console.log('✅ Datenbank existiert bereits:', targetDb);
  }

  // Setze DATABASE_PATH für die App
  process.env.DATABASE_PATH = targetDb;
  console.log('📁 DATABASE_PATH:', targetDb);
} else {
  console.log('💻 Lokale Umgebung - nutze Standard-Pfad');
}
