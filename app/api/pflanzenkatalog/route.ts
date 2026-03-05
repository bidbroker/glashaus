import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Alle Pflanzen laden (mit optionaler Filterung)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const gruppe = searchParams.get('gruppe') || '';

    let query = `
      SELECT * FROM pflanzenkatalog
      WHERE 1=1
    `;
    const params: string[] = [];

    if (search) {
      query += ` AND (name LIKE ? OR beschreibung LIKE ? OR pflanzpartner LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (gruppe) {
      query += ` AND gruppe = ?`;
      params.push(gruppe);
    }

    query += ` ORDER BY katalog_nr`;

    const pflanzen = db.prepare(query).all(...params);

    return NextResponse.json(pflanzen);
  } catch (error) {
    console.error('Fehler beim Laden des Pflanzenkatalogs:', error);
    return NextResponse.json({ error: 'Fehler beim Laden des Pflanzenkatalogs' }, { status: 500 });
  }
}

// POST - Neue Pflanze hinzufügen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const stmt = db.prepare(`
      INSERT INTO pflanzenkatalog (
        katalog_nr, name, vorkultur, keimtemperatur, keimdauer, saattiefe,
        aussetzen, direktsaat, abstand_pflanze, abstand_reihe, ernte_start,
        wuchs, samen_quelle, pflanzpartner, beipflanze, pflanzgegner,
        pflege, beschreibung, kommentar, gruppe
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      body.katalog_nr || null,
      body.name,
      body.vorkultur || '',
      body.keimtemperatur || '',
      body.keimdauer || '',
      body.saattiefe || '',
      body.aussetzen || '',
      body.direktsaat || '',
      body.abstand_pflanze || '',
      body.abstand_reihe || '',
      body.ernte_start || '',
      body.wuchs || '',
      body.samen_quelle || '',
      body.pflanzpartner || '',
      body.beipflanze || '',
      body.pflanzgegner || '',
      body.pflege || '',
      body.beschreibung || '',
      body.kommentar || '',
      body.gruppe || ''
    );

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error('Fehler beim Erstellen der Pflanze:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen der Pflanze' }, { status: 500 });
  }
}
