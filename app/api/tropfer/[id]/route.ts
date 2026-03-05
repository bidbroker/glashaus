import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Blumat {
  id: number;
  wanne_id: number | null;
  pflanzplatz_id: number | null;
  position: number;
  aktueller_stand: number;
}

// DELETE - Blumat löschen
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blumatId = parseInt(id);

    // Prüfe ob Blumat existiert
    const blumat = db.prepare('SELECT * FROM tropfer WHERE id = ?').get(blumatId) as Blumat | undefined;

    if (!blumat) {
      return NextResponse.json({ error: 'Blumat nicht gefunden' }, { status: 404 });
    }

    // Bestimme den Kontext (Wanne oder Pflanzplatz)
    const isWanne = !!blumat.wanne_id;
    const parentId = isWanne ? blumat.wanne_id : blumat.pflanzplatz_id;
    const idColumn = isWanne ? 'wanne_id' : 'pflanzplatz_id';
    const entityName = isWanne ? 'Wanne' : 'Pflanzplatz';

    // Prüfe ob dies der letzte Blumat ist
    const count = db
      .prepare(`SELECT COUNT(*) as count FROM tropfer WHERE ${idColumn} = ?`)
      .get(parentId) as { count: number };

    if (count.count <= 1) {
      return NextResponse.json(
        { error: `Jeder ${entityName} muss mindestens einen Blumat haben` },
        { status: 400 }
      );
    }

    // Lösche Blumat (Änderungen werden durch CASCADE auch gelöscht)
    db.prepare('DELETE FROM tropfer WHERE id = ?').run(blumatId);

    // Aktualisiere Positionen der verbleibenden Blumaten
    const verbleibende = db
      .prepare(`SELECT id FROM tropfer WHERE ${idColumn} = ? ORDER BY position`)
      .all(parentId) as { id: number }[];

    const updatePosition = db.prepare('UPDATE tropfer SET position = ? WHERE id = ?');

    verbleibende.forEach((t, index) => {
      updatePosition.run(index + 1, t.id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen des Blumats:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Blumats' }, { status: 500 });
  }
}
