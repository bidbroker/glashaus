import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'glashaus.db');
export const db = new Database(dbPath);

// UTF-8 Encoding aktivieren
db.pragma('encoding = "UTF-8"');

// Erstelle Tabellen
db.exec(`
  CREATE TABLE IF NOT EXISTS wannen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nummer INTEGER UNIQUE NOT NULL,
    name TEXT,
    beschreibung TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tropfer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wanne_id INTEGER,
    pflanzplatz_id INTEGER,
    position INTEGER NOT NULL,
    aktueller_stand INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wanne_id) REFERENCES wannen(id) ON DELETE CASCADE,
    FOREIGN KEY (pflanzplatz_id) REFERENCES pflanzplaetze(id) ON DELETE CASCADE,
    UNIQUE(wanne_id, position),
    UNIQUE(pflanzplatz_id, position)
  );

  CREATE TABLE IF NOT EXISTS aenderungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tropfer_id INTEGER NOT NULL,
    datum DATETIME DEFAULT CURRENT_TIMESTAMP,
    aenderung INTEGER NOT NULL,
    vorher INTEGER NOT NULL,
    nachher INTEGER NOT NULL,
    notiz TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tropfer_id) REFERENCES tropfer(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_aenderungen_datum ON aenderungen(datum);
  CREATE INDEX IF NOT EXISTS idx_aenderungen_tropfer ON aenderungen(tropfer_id);

  CREATE TABLE IF NOT EXISTS pflanzenkatalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    katalog_nr INTEGER UNIQUE,
    name TEXT NOT NULL,
    vorkultur TEXT,
    keimtemperatur TEXT,
    keimdauer TEXT,
    saattiefe TEXT,
    aussetzen TEXT,
    direktsaat TEXT,
    abstand_pflanze TEXT,
    abstand_reihe TEXT,
    ernte_start TEXT,
    wuchs TEXT,
    samen_quelle TEXT,
    pflanzpartner TEXT,
    beipflanze TEXT,
    pflanzgegner TEXT,
    pflege TEXT,
    beschreibung TEXT,
    kommentar TEXT,
    gruppe TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_pflanzenkatalog_name ON pflanzenkatalog(name);
  CREATE INDEX IF NOT EXISTS idx_pflanzenkatalog_gruppe ON pflanzenkatalog(gruppe);

  CREATE TABLE IF NOT EXISTS pflanzplaetze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kennzahl TEXT UNIQUE NOT NULL,
    bereich TEXT,
    lage TEXT,
    licht TEXT,
    pflanzort TEXT,
    nummer INTEGER,
    hoehe TEXT,
    platz TEXT,
    gefaess TEXT,
    pflanzhilfe TEXT,
    ernaehrung TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bepflanzung (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pflanzplatz_id INTEGER NOT NULL,
    pflanze_id INTEGER,
    anzahl INTEGER DEFAULT 1,
    notiz TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pflanzplatz_id) REFERENCES pflanzplaetze(id) ON DELETE CASCADE,
    FOREIGN KEY (pflanze_id) REFERENCES pflanzenkatalog(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pflanzplaetze_kennzahl ON pflanzplaetze(kennzahl);
  CREATE INDEX IF NOT EXISTS idx_pflanzplaetze_bereich ON pflanzplaetze(bereich);
  CREATE INDEX IF NOT EXISTS idx_bepflanzung_platz ON bepflanzung(pflanzplatz_id);
  CREATE INDEX IF NOT EXISTS idx_bepflanzung_pflanze ON bepflanzung(pflanze_id);
`);

console.log('✅ Datenbank initialisiert:', dbPath);
