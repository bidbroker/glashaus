import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Alle Gruppen laden (für Filter-Dropdown)
export async function GET() {
  try {
    const gruppen = db.prepare(`
      SELECT DISTINCT gruppe FROM pflanzenkatalog
      WHERE gruppe IS NOT NULL AND gruppe != ''
      ORDER BY gruppe
    `).all() as { gruppe: string }[];

    return NextResponse.json(gruppen.map(g => g.gruppe));
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Gruppen' }, { status: 500 });
  }
}
