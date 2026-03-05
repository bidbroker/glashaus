import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Wanne mit Tropfern abrufen
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wanneId = parseInt(id);

    const wanne = db.prepare('SELECT * FROM wannen WHERE id = ?').get(wanneId);

    if (!wanne) {
      return NextResponse.json({ error: 'Wanne nicht gefunden' }, { status: 404 });
    }

    const tropfer = db.prepare(`
      SELECT * FROM tropfer WHERE wanne_id = ? ORDER BY position
    `).all(wanneId);

    return NextResponse.json({ ...wanne, tropfer });
  } catch (error) {
    console.error('Fehler beim Laden der Wanne:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Wanne' }, { status: 500 });
  }
}

// PATCH - Wanne aktualisieren
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wanneId = parseInt(id);
    const { name, beschreibung } = await request.json();

    // Prüfe ob Wanne existiert
    const wanne = db.prepare('SELECT * FROM wannen WHERE id = ?').get(wanneId);

    if (!wanne) {
      return NextResponse.json({ error: 'Wanne nicht gefunden' }, { status: 404 });
    }

    // Update Wanne
    const updates: string[] = [];
    const params_array: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params_array.push(name);
    }

    if (beschreibung !== undefined) {
      updates.push('beschreibung = ?');
      params_array.push(beschreibung);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params_array.push(wanneId);

      const query = `UPDATE wannen SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...params_array);
    }

    // Hole aktualisierte Wanne
    const updatedWanne = db.prepare('SELECT * FROM wannen WHERE id = ?').get(wanneId);

    return NextResponse.json(updatedWanne);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Wanne:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Wanne' }, { status: 500 });
  }
}
