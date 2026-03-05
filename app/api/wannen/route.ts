import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const wannen = db.prepare(`
      SELECT
        w.id,
        w.nummer,
        w.name,
        w.beschreibung,
        COUNT(t.id) as tropfer_anzahl
      FROM wannen w
      LEFT JOIN tropfer t ON w.id = t.wanne_id
      GROUP BY w.id
      ORDER BY w.nummer
    `).all();

    return NextResponse.json(wannen);
  } catch (error) {
    console.error('Fehler beim Laden der Wannen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Wannen' }, { status: 500 });
  }
}
