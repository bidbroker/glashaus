import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Einzelne Pflanze laden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pflanze = db.prepare('SELECT * FROM pflanzenkatalog WHERE id = ?').get(id);

    if (!pflanze) {
      return NextResponse.json({ error: 'Pflanze nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(pflanze);
  } catch (error) {
    console.error('Fehler beim Laden der Pflanze:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Pflanze' }, { status: 500 });
  }
}

// PUT - Pflanze aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE pflanzenkatalog SET
        katalog_nr = ?,
        name = ?,
        vorkultur = ?,
        keimtemperatur = ?,
        keimdauer = ?,
        saattiefe = ?,
        aussetzen = ?,
        direktsaat = ?,
        abstand_pflanze = ?,
        abstand_reihe = ?,
        ernte_start = ?,
        wuchs = ?,
        samen_quelle = ?,
        pflanzpartner = ?,
        beipflanze = ?,
        pflanzgegner = ?,
        pflege = ?,
        beschreibung = ?,
        kommentar = ?,
        gruppe = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
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
      body.gruppe || '',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Pflanze:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Pflanze' }, { status: 500 });
  }
}

// DELETE - Pflanze löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.prepare('DELETE FROM pflanzenkatalog WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Pflanze:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Pflanze' }, { status: 500 });
  }
}
