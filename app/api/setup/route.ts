import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Aktuelle Setup-Informationen
export async function GET() {
  try {
    const wannenCount = db.prepare('SELECT COUNT(*) as count FROM wannen').get() as { count: number };
    const tropferCount = db.prepare('SELECT COUNT(*) as count FROM tropfer').get() as { count: number };
    const aenderungenCount = db.prepare('SELECT COUNT(*) as count FROM aenderungen').get() as { count: number };

    // Durchschnittlicher Tropfer-Stand
    const avgStand = db.prepare('SELECT AVG(aktueller_stand) as avg FROM tropfer').get() as { avg: number };

    return NextResponse.json({
      wannen: wannenCount.count,
      tropfer: tropferCount.count,
      aenderungen: aenderungenCount.count,
      durchschnitt_stand: Math.round(avgStand.avg || 0),
    });
  } catch (error) {
    console.error('Fehler beim Laden der Setup-Infos:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Setup-Informationen' }, { status: 500 });
  }
}

// POST - Setup-Aktionen ausführen
export async function POST(request: Request) {
  try {
    const { action, value } = await request.json();

    switch (action) {
      case 'set_wannen_anzahl':
        return await setWannenAnzahl(value);

      case 'reset_all_tropfer':
        return await resetAllTropfer(value);

      case 'reset_database':
        return await resetDatabase();

      default:
        return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Fehler beim Ausführen der Setup-Aktion:', error);
    return NextResponse.json({ error: 'Fehler beim Ausführen der Aktion' }, { status: 500 });
  }
}

// Wannen-Anzahl ändern
async function setWannenAnzahl(anzahl: number) {
  if (!anzahl || anzahl < 1 || anzahl > 200) {
    return NextResponse.json({ error: 'Anzahl muss zwischen 1 und 200 liegen' }, { status: 400 });
  }

  const currentCount = db.prepare('SELECT COUNT(*) as count FROM wannen').get() as { count: number };
  const current = currentCount.count;

  const transaction = db.transaction(() => {
    if (anzahl > current) {
      // Wannen hinzufügen
      const insertWanne = db.prepare('INSERT INTO wannen (nummer, name) VALUES (?, ?)');
      const insertTropfer = db.prepare('INSERT INTO tropfer (wanne_id, position, aktueller_stand) VALUES (?, 1, 0)');

      for (let i = current + 1; i <= anzahl; i++) {
        const result = insertWanne.run(i, `Wanne ${i}`);
        insertTropfer.run(result.lastInsertRowid);
      }
    } else if (anzahl < current) {
      // Wannen löschen (CASCADE löscht automatisch Tropfer und Änderungen)
      db.prepare('DELETE FROM wannen WHERE nummer > ?').run(anzahl);
    }
  });

  transaction();

  return NextResponse.json({
    success: true,
    message: `Wannen-Anzahl auf ${anzahl} gesetzt`,
    vorher: current,
    nachher: anzahl,
  });
}

// Alle Tropfer auf einen Startwert setzen
async function resetAllTropfer(startwert: number) {
  if (startwert === undefined || startwert < 0 || startwert > 100) {
    return NextResponse.json({ error: 'Startwert muss zwischen 0 und 100 liegen' }, { status: 400 });
  }

  const result = db.prepare(`
    UPDATE tropfer
    SET aktueller_stand = ?,
        updated_at = CURRENT_TIMESTAMP
  `).run(startwert);

  return NextResponse.json({
    success: true,
    message: `Alle ${result.changes} Tropfer auf ${startwert} Teilstriche gesetzt`,
    anzahl: result.changes,
    startwert,
  });
}

// Datenbank komplett zurücksetzen
async function resetDatabase() {
  const transaction = db.transaction(() => {
    // Lösche alle Änderungen
    db.prepare('DELETE FROM aenderungen').run();

    // Setze alle Tropfer auf 0
    db.prepare('UPDATE tropfer SET aktueller_stand = 0, updated_at = CURRENT_TIMESTAMP').run();

    // Setze Wannen-Namen zurück
    db.prepare('UPDATE wannen SET name = "Wanne " || nummer, beschreibung = NULL, updated_at = CURRENT_TIMESTAMP').run();
  });

  transaction();

  return NextResponse.json({
    success: true,
    message: 'Datenbank wurde zurückgesetzt (Wannen-Anzahl bleibt erhalten)',
  });
}
