import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Alle Filter-Optionen laden (für Dropdowns)
export async function GET() {
  try {
    const bereiche = db.prepare(`
      SELECT DISTINCT bereich FROM pflanzplaetze WHERE bereich IS NOT NULL AND bereich != '' ORDER BY bereich
    `).all() as { bereich: string }[];

    const lagen = db.prepare(`
      SELECT DISTINCT lage FROM pflanzplaetze WHERE lage IS NOT NULL AND lage != '' ORDER BY lage
    `).all() as { lage: string }[];

    const lichtverhaeltnisse = db.prepare(`
      SELECT DISTINCT licht FROM pflanzplaetze WHERE licht IS NOT NULL AND licht != '' ORDER BY licht
    `).all() as { licht: string }[];

    const pflanzorte = db.prepare(`
      SELECT DISTINCT pflanzort FROM pflanzplaetze WHERE pflanzort IS NOT NULL AND pflanzort != '' ORDER BY pflanzort
    `).all() as { pflanzort: string }[];

    const gefaesse = db.prepare(`
      SELECT DISTINCT gefaess FROM pflanzplaetze WHERE gefaess IS NOT NULL AND gefaess != '' ORDER BY gefaess
    `).all() as { gefaess: string }[];

    return NextResponse.json({
      bereiche: bereiche.map(b => b.bereich),
      lagen: lagen.map(l => l.lage),
      lichtverhaeltnisse: lichtverhaeltnisse.map(l => l.licht),
      pflanzorte: pflanzorte.map(p => p.pflanzort),
      gefaesse: gefaesse.map(g => g.gefaess),
    });
  } catch (error) {
    console.error('Fehler beim Laden der Optionen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Optionen' }, { status: 500 });
  }
}
