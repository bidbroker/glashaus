import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { tropferId, aenderung, notiz } = await request.json();

    if (!tropferId || aenderung === undefined) {
      return NextResponse.json(
        { error: 'tropferId und aenderung sind erforderlich' },
        { status: 400 }
      );
    }

    // Aktuellen Stand des Tropfers holen
    const tropfer = db.prepare('SELECT * FROM tropfer WHERE id = ?').get(tropferId) as any;

    if (!tropfer) {
      return NextResponse.json({ error: 'Tropfer nicht gefunden' }, { status: 404 });
    }

    const vorher = tropfer.aktueller_stand;
    const nachher = vorher + aenderung;

    // Änderung protokollieren
    const insertAenderung = db.prepare(`
      INSERT INTO aenderungen (tropfer_id, aenderung, vorher, nachher, notiz)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Tropfer aktualisieren
    const updateTropfer = db.prepare(`
      UPDATE tropfer
      SET aktueller_stand = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    // Beide Operationen in einer Transaktion
    const transaction = db.transaction(() => {
      insertAenderung.run(tropferId, aenderung, vorher, nachher, notiz || null);
      updateTropfer.run(nachher, tropferId);
    });

    transaction();

    return NextResponse.json({
      success: true,
      vorher,
      nachher,
      aenderung,
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Änderung:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Änderung' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tropferId = searchParams.get('tropferId');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = `
      SELECT
        a.*,
        t.position,
        w.nummer as wanne_nummer,
        w.name as wanne_name
      FROM aenderungen a
      JOIN tropfer t ON a.tropfer_id = t.id
      JOIN wannen w ON t.wanne_id = w.id
    `;

    const params: any[] = [];

    if (tropferId) {
      query += ' WHERE a.tropfer_id = ?';
      params.push(tropferId);
    }

    query += ' ORDER BY a.datum DESC LIMIT ?';
    params.push(limit);

    const aenderungen = db.prepare(query).all(...params);

    return NextResponse.json(aenderungen, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Fehler beim Laden der Änderungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Änderungen' }, { status: 500 });
  }
}
