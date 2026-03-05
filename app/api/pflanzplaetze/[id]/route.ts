import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Einzelnen Pflanzplatz laden mit Tropfern und Bepflanzung
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Lade Pflanzplatz-Daten
    const platz = db.prepare(`
      SELECT pp.*
      FROM pflanzplaetze pp
      WHERE pp.id = ?
    `).get(id) as {
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
    } | undefined;

    if (!platz) {
      return NextResponse.json({ error: 'Pflanzplatz nicht gefunden' }, { status: 404 });
    }

    // Lade Tropfer für diesen Pflanzplatz
    const tropfer = db.prepare(`
      SELECT id, position, aktueller_stand
      FROM tropfer
      WHERE pflanzplatz_id = ?
      ORDER BY position
    `).all(id);

    // Lade Bepflanzung
    const pflanzen = db.prepare(`
      SELECT
        b.id,
        b.pflanze_id,
        pk.name as pflanze_name,
        pk.gruppe as pflanze_gruppe,
        b.anzahl,
        b.notiz
      FROM bepflanzung b
      LEFT JOIN pflanzenkatalog pk ON b.pflanze_id = pk.id
      WHERE b.pflanzplatz_id = ?
    `).all(id);

    return NextResponse.json({
      ...platz,
      tropfer,
      pflanzen
    });
  } catch (error) {
    console.error('Fehler beim Laden des Pflanzplatzes:', error);
    return NextResponse.json({ error: 'Fehler beim Laden des Pflanzplatzes' }, { status: 500 });
  }
}

// PUT - Pflanzplatz aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE pflanzplaetze SET
        kennzahl = ?,
        bereich = ?,
        lage = ?,
        licht = ?,
        pflanzort = ?,
        nummer = ?,
        hoehe = ?,
        platz = ?,
        gefaess = ?,
        pflanzhilfe = ?,
        ernaehrung = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
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
      body.ernaehrung || '',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Pflanzplatzes:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Pflanzplatzes' }, { status: 500 });
  }
}

// DELETE - Pflanzplatz löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.prepare('DELETE FROM pflanzplaetze WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen des Pflanzplatzes:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Pflanzplatzes' }, { status: 500 });
  }
}

// PATCH - Pflanzplatz-Felder aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.kennzahl !== undefined) {
      updates.push('kennzahl = ?');
      values.push(body.kennzahl);
    }
    if (body.bereich !== undefined) {
      updates.push('bereich = ?');
      values.push(body.bereich);
    }
    if (body.lage !== undefined) {
      updates.push('lage = ?');
      values.push(body.lage);
    }
    if (body.licht !== undefined) {
      updates.push('licht = ?');
      values.push(body.licht);
    }
    if (body.pflanzort !== undefined) {
      updates.push('pflanzort = ?');
      values.push(body.pflanzort);
    }
    if (body.gefaess !== undefined) {
      updates.push('gefaess = ?');
      values.push(body.gefaess);
    }
    if (body.pflanzhilfe !== undefined) {
      updates.push('pflanzhilfe = ?');
      values.push(body.pflanzhilfe);
    }
    if (body.ernaehrung !== undefined) {
      updates.push('ernaehrung = ?');
      values.push(body.ernaehrung);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE pflanzplaetze SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Lade aktualisierten Pflanzplatz
    const platz = db.prepare('SELECT * FROM pflanzplaetze WHERE id = ?').get(id);
    return NextResponse.json(platz);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Pflanzplatzes:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Pflanzplatzes' }, { status: 500 });
  }
}
