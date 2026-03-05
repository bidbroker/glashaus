import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PUT - Bepflanzung aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE bepflanzung SET
        pflanze_id = ?,
        anzahl = ?,
        notiz = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      body.pflanze_id,
      body.anzahl || 1,
      body.notiz || '',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Bepflanzung:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Bepflanzung' }, { status: 500 });
  }
}

// DELETE - Bepflanzung löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.prepare('DELETE FROM bepflanzung WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Bepflanzung:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Bepflanzung' }, { status: 500 });
  }
}
