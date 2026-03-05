import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Alle Pflanzplätze mit Bepflanzung und Tropfer-Anzahl laden
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bereich = searchParams.get('bereich') || '';
    const lage = searchParams.get('lage') || '';
    const licht = searchParams.get('licht') || '';
    const pflanzort = searchParams.get('pflanzort') || '';

    let query = `
      SELECT
        pp.*,
        (SELECT COUNT(*) FROM tropfer WHERE pflanzplatz_id = pp.id) as tropfer_anzahl,
        (
          SELECT GROUP_CONCAT(
            json_object(
              'id', b.id,
              'pflanze_id', b.pflanze_id,
              'pflanze_name', pk.name,
              'pflanze_gruppe', pk.gruppe,
              'anzahl', b.anzahl,
              'notiz', b.notiz
            )
          )
          FROM bepflanzung b
          LEFT JOIN pflanzenkatalog pk ON b.pflanze_id = pk.id
          WHERE b.pflanzplatz_id = pp.id
        ) as pflanzen_json
      FROM pflanzplaetze pp
      WHERE 1=1
    `;
    const params: string[] = [];

    if (bereich) {
      query += ` AND pp.bereich = ?`;
      params.push(bereich);
    }
    if (lage) {
      query += ` AND pp.lage = ?`;
      params.push(lage);
    }
    if (licht) {
      query += ` AND pp.licht = ?`;
      params.push(licht);
    }
    if (pflanzort) {
      query += ` AND pp.pflanzort = ?`;
      params.push(pflanzort);
    }

    query += ` ORDER BY pp.nummer, pp.hoehe, pp.platz`;

    const plaetze = db.prepare(query).all(...params) as Array<{
      id: number;
      kennzahl: string;
      bereich: string;
      lage: string;
      licht: string;
      pflanzort: string;
      nummer: number;
      hoehe: string;
      platz: string;
      gefaess: string;
      pflanzhilfe: string;
      ernaehrung: string;
      tropfer_anzahl: number;
      pflanzen_json: string | null;
    }>;

    // Parse JSON für Pflanzen
    const result = plaetze.map(p => ({
      ...p,
      pflanzen: p.pflanzen_json
        ? p.pflanzen_json.split('},{').map((s, i, arr) => {
            let jsonStr = s;
            if (i === 0 && arr.length > 1) jsonStr = s + '}';
            else if (i === arr.length - 1 && arr.length > 1) jsonStr = '{' + s;
            else if (arr.length > 1) jsonStr = '{' + s + '}';
            try {
              return JSON.parse(jsonStr);
            } catch {
              return null;
            }
          }).filter(Boolean)
        : [],
      pflanzen_json: undefined
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fehler beim Laden der Pflanzplätze:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Pflanzplätze' }, { status: 500 });
  }
}

// POST - Neuen Pflanzplatz erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const stmt = db.prepare(`
      INSERT INTO pflanzplaetze (
        kennzahl, bereich, lage, licht, pflanzort, nummer, hoehe, platz, gefaess, pflanzhilfe, ernaehrung
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      body.kennzahl,
      body.bereich || '',
      body.lage || '',
      body.licht || '',
      body.pflanzort || '',
      body.nummer || null,
      body.hoehe || '',
      body.platz || '',
      body.gefaess || '',
      body.pflanzhilfe || '',
      body.ernaehrung || ''
    );

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error('Fehler beim Erstellen des Pflanzplatzes:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen des Pflanzplatzes' }, { status: 500 });
  }
}
