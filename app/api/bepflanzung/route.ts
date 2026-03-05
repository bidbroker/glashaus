import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Alle Bepflanzungen laden
export async function GET() {
  try {
    const bepflanzungen = db.prepare(`
      SELECT
        b.*,
        pp.kennzahl,
        pp.bereich,
        pp.lage,
        pk.name as pflanze_name,
        pk.gruppe as pflanze_gruppe
      FROM bepflanzung b
      JOIN pflanzplaetze pp ON b.pflanzplatz_id = pp.id
      LEFT JOIN pflanzenkatalog pk ON b.pflanze_id = pk.id
      ORDER BY pp.kennzahl, pk.name
    `).all();

    return NextResponse.json(bepflanzungen);
  } catch (error) {
    console.error('Fehler beim Laden der Bepflanzungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Bepflanzungen' }, { status: 500 });
  }
}

// POST - Neue Bepflanzung hinzufügen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const stmt = db.prepare(`
      INSERT INTO bepflanzung (pflanzplatz_id, pflanze_id, anzahl, notiz)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      body.pflanzplatz_id,
      body.pflanze_id,
      body.anzahl || 1,
      body.notiz || ''
    );

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error('Fehler beim Erstellen der Bepflanzung:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen der Bepflanzung' }, { status: 500 });
  }
}
