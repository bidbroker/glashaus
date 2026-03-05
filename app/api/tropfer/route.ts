import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST - Neuen Blumat hinzufügen (für Wanne oder Pflanzplatz)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wanneId, pflanzplatzId } = body;

    if (!wanneId && !pflanzplatzId) {
      return NextResponse.json({ error: 'wanneId oder pflanzplatzId ist erforderlich' }, { status: 400 });
    }

    // Bestimme den Kontext (Wanne oder Pflanzplatz)
    const isWanne = !!wanneId;
    const parentId = isWanne ? wanneId : pflanzplatzId;
    const idColumn = isWanne ? 'wanne_id' : 'pflanzplatz_id';

    // Finde die höchste Position
    const result = db
      .prepare(`SELECT MAX(position) as max_position FROM tropfer WHERE ${idColumn} = ?`)
      .get(parentId) as { max_position: number | null };

    const neuePosition = (result?.max_position || 0) + 1;

    // Berechne Durchschnitts-Stand der bestehenden Blumaten
    const avgResult = db
      .prepare(`SELECT AVG(aktueller_stand) as avg FROM tropfer WHERE ${idColumn} = ?`)
      .get(parentId) as { avg: number | null };

    const startwert = Math.round(avgResult?.avg || 0);

    // Füge neuen Blumat hinzu
    const insertResult = db
      .prepare(`INSERT INTO tropfer (${idColumn}, position, aktueller_stand) VALUES (?, ?, ?)`)
      .run(parentId, neuePosition, startwert);

    return NextResponse.json({
      success: true,
      blumat: {
        id: insertResult.lastInsertRowid,
        [idColumn]: parentId,
        position: neuePosition,
        aktueller_stand: startwert,
      },
    });
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Blumats:', error);
    return NextResponse.json({ error: 'Fehler beim Hinzufügen des Blumats' }, { status: 500 });
  }
}
