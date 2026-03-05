const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'glashaus.db');
const db = new Database(dbPath);

console.log('🔄 Updating database...');

// Lösche alle bestehenden Tropfer außer Position 1
const deleteTropfer = db.prepare('DELETE FROM tropfer WHERE position > 1');
const result = deleteTropfer.run();

console.log(`✓ ${result.changes} zusätzliche Tropfer entfernt`);
console.log('✅ Alle Wannen haben jetzt nur noch 1 Tropfer!');

db.close();
