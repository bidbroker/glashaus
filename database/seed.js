const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'glashaus.db');
const db = new Database(dbPath);

console.log('🌱 Seeding database...');

// Erstelle Tabellen falls nicht vorhanden
db.exec(`
  CREATE TABLE IF NOT EXISTS wannen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nummer INTEGER UNIQUE NOT NULL,
    name TEXT,
    beschreibung TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tropfer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wanne_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    aktueller_stand INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wanne_id) REFERENCES wannen(id) ON DELETE CASCADE,
    UNIQUE(wanne_id, position)
  );

  CREATE TABLE IF NOT EXISTS aenderungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tropfer_id INTEGER NOT NULL,
    datum DATETIME DEFAULT CURRENT_TIMESTAMP,
    aenderung INTEGER NOT NULL,
    vorher INTEGER NOT NULL,
    nachher INTEGER NOT NULL,
    notiz TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tropfer_id) REFERENCES tropfer(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_aenderungen_datum ON aenderungen(datum);
  CREATE INDEX IF NOT EXISTS idx_aenderungen_tropfer ON aenderungen(tropfer_id);

  CREATE TABLE IF NOT EXISTS pflanzenkatalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    katalog_nr INTEGER,
    name TEXT NOT NULL,
    vorkultur TEXT,
    keimtemperatur TEXT,
    keimdauer TEXT,
    saattiefe TEXT,
    aussetzen TEXT,
    direktsaat TEXT,
    abstand_pflanze TEXT,
    abstand_reihe TEXT,
    ernte_start TEXT,
    wuchs TEXT,
    samen_quelle TEXT,
    pflanzpartner TEXT,
    beipflanze TEXT,
    pflanzgegner TEXT,
    pflege TEXT,
    beschreibung TEXT,
    kommentar TEXT,
    gruppe TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_pflanzenkatalog_name ON pflanzenkatalog(name);
  CREATE INDEX IF NOT EXISTS idx_pflanzenkatalog_gruppe ON pflanzenkatalog(gruppe);

  CREATE TABLE IF NOT EXISTS pflanzplaetze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kennzahl TEXT UNIQUE NOT NULL,
    bereich TEXT,
    lage TEXT,
    licht TEXT,
    pflanzort TEXT,
    nummer INTEGER,
    hoehe TEXT,
    platz TEXT,
    gefaess TEXT,
    pflanzhilfe TEXT,
    ernaehrung TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bepflanzung (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pflanzplatz_id INTEGER NOT NULL,
    pflanze_id INTEGER,
    anzahl INTEGER DEFAULT 1,
    notiz TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pflanzplatz_id) REFERENCES pflanzplaetze(id) ON DELETE CASCADE,
    FOREIGN KEY (pflanze_id) REFERENCES pflanzenkatalog(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pflanzplaetze_kennzahl ON pflanzplaetze(kennzahl);
  CREATE INDEX IF NOT EXISTS idx_pflanzplaetze_bereich ON pflanzplaetze(bereich);
  CREATE INDEX IF NOT EXISTS idx_bepflanzung_platz ON bepflanzung(pflanzplatz_id);
  CREATE INDEX IF NOT EXISTS idx_bepflanzung_pflanze ON bepflanzung(pflanze_id);
`);

// Erstelle 40 Wannen mit jeweils 1 Tropfer (Standard)
const insertWanne = db.prepare('INSERT OR IGNORE INTO wannen (nummer, name) VALUES (?, ?)');
const insertTropfer = db.prepare('INSERT OR IGNORE INTO tropfer (wanne_id, position, aktueller_stand) VALUES (?, ?, 0)');

for (let i = 1; i <= 40; i++) {
  const result = insertWanne.run(i, `Wanne ${i}`);

  if (result.changes > 0) {
    const wanneId = result.lastInsertRowid;

    // Erstelle 1 Tropfer pro Wanne (Standard)
    insertTropfer.run(wanneId, 1);

    console.log(`✓ Wanne ${i} mit 1 Tropfer erstellt`);
  }
}

// Pflanzenkatalog-Daten einfügen
const pflanzenkatalogDaten = [
  { katalog_nr: 1, name: 'Fleischparadeiser Rotes Herz', vorkultur: '15.03-15.04', keimtemperatur: '20-25', keimdauer: '8-10', saattiefe: 'Licht', aussetzen: '15.05-31.05.', direktsaat: 'nein', abstand_pflanze: '50', abstand_reihe: '100', ernte_start: 'August', wuchs: 'unbegrenzt, locker belaubt, wirkt im Jugendstadium schwach, bisweilen bräunliche Blätter die später verschwinden', samen_quelle: 'Arche Noah', pflanzpartner: 'Buschbohne, Knoblauch, Kohl, Kohlrabi', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nTagetes, gegen Nematoden, Viren und weiße Fliege', pflanzgegner: 'Erbse, Fenchel, Kartoffeln', pflege: 'Ausgeizen, Mulchen, warm, Schutz vor Regen, mäßig von unten gießen', beschreibung: 'Das rotes Ochsenherz lässt sich vielfältig verwenden, für Suppen, Saucen und Salate. Die Ausgewogenheit von Süße und Säure ergibt einen sehr guten Geschmack, herzförmig, schwach gerippt und 10-12 cm groß. Ursprünglich stammt die Sorte aus Kroatien.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 2, name: 'Salatparadeiser Quedlinburger Frühe Liebe', vorkultur: '15.03-15.04', keimtemperatur: '20-25', keimdauer: '8-10', saattiefe: 'Licht', aussetzen: '15.05-31.05.', direktsaat: 'nein', abstand_pflanze: '50', abstand_reihe: '80', ernte_start: 'Juli', wuchs: 'Stabtomate wächst bis 1,2 m hoch und hat kartoffelblättriges lockeres Laub', samen_quelle: 'Arche Noah', pflanzpartner: 'Buschbohne, Knoblauch, Kohl, Kohlrabi', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nTagetes, gegen Nematoden, Viren und weiße Fliege', pflanzgegner: 'Erbse, Fenchel, Kartoffeln', pflege: 'nicht ausgeizen, Mulchen, warm, Schutz vor Regen, mäßig von unten gießen', beschreibung: 'Im Salat kommt der süß-aromatische Geschmack hervorragend zur Geltung. Extrem frühreifend ist die Sorte auch für rauhere Lagen empfehlenswert. Die roten, runden, ca. 4 cm großen Früchte kann man die ganze Saison über ernten.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 3, name: 'Basilikum Genoveser', vorkultur: '01.01.-31.12.', keimtemperatur: '18-22', keimdauer: '14-18', saattiefe: 'Licht', aussetzen: '01.05.', direktsaat: '31.05.-31.07.', abstand_pflanze: '30', abstand_reihe: '30', ernte_start: 'Ganzjährig', wuchs: 'Busch bis 50 cm', samen_quelle: 'samenmaier Bio', pflanzpartner: 'Tomaten, Gurken, Kohl gegen Mehltau und weiße Fliege', beipflanze: '', pflanzgegner: '', pflege: 'sonniger Standort, durchlässiger Boden', beschreibung: 'Bekommt sie genügend Wärme, wächst sie sehr rasch.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 4, name: 'Kohlrabi Superschmelz', vorkultur: '15.02.-15.03.', keimtemperatur: '16-20', keimdauer: '5-8', saattiefe: '2', aussetzen: '01.04.', direktsaat: '01.04.-31.05.', abstand_pflanze: '60', abstand_reihe: '60', ernte_start: 'August', wuchs: 'Riesenkohlrabi, bis zu 8 kg', samen_quelle: 'samenmaier Bio', pflanzpartner: 'Bohnen, Erbsen, Kartoffeln, Kopfsalat, Tomaten, Radieschen, Rote Bete, Sellerie, Spinat, Lauch', beipflanze: '', pflanzgegner: '', pflege: 'Frostfrei! Schatten, Knolle kein Erdkontakt wegen Schimmel. Kohlanbaufläche jährlich wechseln! Nährstoffreicher, humosen Boder. Bei Trockenheit regelmäßig gießen, damit die Kohlrabi nicht platzen. Wasser- und Nährstoffmangel führt zu Wachstumsstockungen, mehrmals düngen.', beschreibung: 'Zur Lagerung und zum Tiefgefrieren bestens geeignet. Alle Kohlarten sind von allen Gemüse-Arten am längsten lagerbar und gelten als typisches Wintergemüse. Schon seit der Steinzeit wird vermutet, dass Kohl als Lebensmittel für uns gedient hat.', kommentar: '', gruppe: 'Kohl' },
  { katalog_nr: 5, name: 'Wintermarie', vorkultur: '01.02.-28.02.', keimtemperatur: '10-15', keimdauer: '5-7', saattiefe: 'Licht', aussetzen: '01.04.', direktsaat: '15.07.-31.08.', abstand_pflanze: '30', abstand_reihe: '30', ernte_start: 'April', wuchs: 'Kopf locker attraktiv durch Rotfärbung', samen_quelle: 'Arche Noah', pflanzpartner: 'Bohnen, Dill, Erbsen, Erdbeeren, Gurken, Kohl, Lauch, Möhren, Tomaten, Zwiebeln', beipflanze: 'Kerbel, gegen Läuse', pflanzgegner: 'Petersilie, Sellerie', pflege: 'sonnig feucht bevorzugt, Boden locker gut feucht', beschreibung: 'Der Kopfsalat ist außer frisch auch für die Spinatzubereitung geeignet. Die leichte Rotfärbung sieht sehr schön aus. Köstlich, sehr zart! Die Pflanzen sind raschwüchsig und robust gegen Pilzkrankheiten und Kälte. Er hat sich auch als Überwinterungskultur bewährt. Attraktiv durch Rotfärbung. Aus Kroatien.', kommentar: '', gruppe: 'Blatt' },
  { katalog_nr: 6, name: 'Cocktailparadeiser Golden Perfection', vorkultur: '15.03-15.04', keimtemperatur: '20-25', keimdauer: '8-10', saattiefe: 'Licht', aussetzen: '15.05-31.05.', direktsaat: 'nein', abstand_pflanze: '50', abstand_reihe: '100', ernte_start: 'Juni', wuchs: 'unbegrenzt', samen_quelle: 'Arche Noah', pflanzpartner: 'Buschbohne, Knoblauch, Kohl, Kohlrabi', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nTagetes, gegen Nematoden, Viren und weiße Fliege', pflanzgegner: 'Erbse, Fenchel, Kartoffeln', pflege: 'sonniger Standort', beschreibung: 'Goldgelbe Cocktailtomate. Die Früchte sind rund und werden ungefähr 2,5-3cm groß. Im Geschmack sehr süß und aromatisch. Unbegrenzt wachsende Pflanze, entwickelt viele Nebentriebe. Seit 1985 aus Tartu, Estland.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 7, name: 'Zuckererbse Ambrosia', vorkultur: '01.03.-31.05.', keimtemperatur: '10-20', keimdauer: '8-14', saattiefe: '3', aussetzen: '', direktsaat: '01.03.-31.05.', abstand_pflanze: '3', abstand_reihe: '30', ernte_start: 'Mai', wuchs: 'ca. 70 cm, ohne Rankhilfe möglich', samen_quelle: 'REINSAAT', pflanzpartner: 'Dill, Fenchel, Gurken, Kohlarten, Mais, Möhren, Kohlrabi, Kopfsalat, Radieschen, Zucchini', beipflanze: '', pflanzgegner: 'Bohnen, Kartoffeln, Knoblauch, Lauch, Tomaten, Zwiebeln', pflege: 'Halbschatten, Erbsen nicht zu spät aussäen. Die meisten Erbsensorten bilden an kühlen, kurzen Tagen nur Blätter. Erst wenn die Tage länger werden und die Temperaturen steigen, meist ab Mitte Mai, entwickeln sich Blüten. Wer viel ernten möchte, sät die Erbsen so früh wie möglich, damit die Pflanzen vor der Blütenbildung noch lange wachsen, empfehlenswert ist es, die Erbsen spätestens Ende April zu säen.', beschreibung: 'Mittelfrühe, ca. 70 cm hohe Zuckererbse mit hoher Ertragsleistung. Die standfeste Sorte benötigt keine Rankhilfe. Jung, mit noch nicht entwickelten Samen sind die mittelgroßen, hellgrünen Hülsen besonders süß und geschmackvoll.', kommentar: '', gruppe: 'Hülse' },
  { katalog_nr: 8, name: 'Knackerbse Spring Blush', vorkultur: '01.03.-31.05.', keimtemperatur: '10-20', keimdauer: '8-14', saattiefe: '3', aussetzen: '', direktsaat: '01.03.-31.05.', abstand_pflanze: '3', abstand_reihe: '30', ernte_start: 'Mai', wuchs: 'ca. bis 120 cm, Rankhilfe', samen_quelle: 'Sorten WERKSTATT', pflanzpartner: 'Dill, Fenchel, Gurken, Kohlarten, Mais, Möhren, Kohlrabi, Kopfsalat, Radieschen, Zucchini', beipflanze: '', pflanzgegner: 'Bohnen, Kartoffeln, Knoblauch, Lauch, Tomaten, Zwiebeln', pflege: 'Halbschatten, Erbsen nicht zu spät aussäen. Die meisten Erbsensorten bilden an kühlen, kurzen Tagen nur Blätter. Erst wenn die Tage länger werden und die Temperaturen steigen, meist ab Mitte Mai, entwickeln sich Blüten. Wer viel ernten möchte, sät die Erbsen so früh wie möglich, damit die Pflanzen vor der Blütenbildung noch lange wachsen, empfehlenswert ist es, die Erbsen spätestens Ende April zu säen.', beschreibung: 'Knackerbse, das heißt, die Hülsen sind sehr knackig und süß, nicht fädig und somit lang beerntbar. Nicht vergleichbar mit Zuckererbsen! Diese neue Sorte hat grün-violetten Schoten, ist aber noch nicht ganz einheitlich durchselektiert. Nutzbar sind die Schoten (frisch und gekocht), die frischen Erbsensamen und die Ranken, von denen die Pflanze zahlreiche bildet. Sehr schön! Aussaat ab März. Direktsaat. Rankhilfe notwenig.', kommentar: '', gruppe: 'Hülse' },
  { katalog_nr: 9, name: 'Cocktailparadeiser Red Currant', vorkultur: '15.03-15.04', keimtemperatur: '20-25', keimdauer: '8-10', saattiefe: 'Licht', aussetzen: '15.05-31.05.', direktsaat: 'nein', abstand_pflanze: '50', abstand_reihe: '100', ernte_start: 'Juni', wuchs: 'unbegrenzt wachsend, stark verzweigt', samen_quelle: 'Arche Noah', pflanzpartner: 'Buschbohne, Knoblauch, Kohl, Kohlrabi', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nTagetes, gegen Nematoden, Viren und weiße Fliege', pflanzgegner: 'Erbse, Fenchel, Kartoffeln', pflege: 'Das übliche Ausgeizen auf nur 1–3 Haupttriebe ist nicht sinnvoll. Wir empfehlen, die Pflanzen lediglich auszulichten, sonniger Standort', beschreibung: 'Cocktailtomate mit winzigen, max. 1,5 cm großen Früchten und süß-säuerlicherm Geschmack.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 10, name: 'Schnittsalat Asia Oriental Mix', vorkultur: '01.01.-30.04.', keimtemperatur: '10-20', keimdauer: '8-15', saattiefe: '1-2', aussetzen: '01.02.', direktsaat: '15.07.-01.10.', abstand_pflanze: 'Streu', abstand_reihe: 'Streu', ernte_start: 'März', wuchs: 'breitwürfig, mehrfacher Schnitt', samen_quelle: 'REINSAAT', pflanzpartner: 'Bohnen, Dill, Erbsen, Erdbeeren, Gurken, Kohl, Lauch, Möhren, Tomaten, Zwiebeln', beipflanze: 'Kerbel, gegen Läuse', pflanzgegner: 'Petersilie, Sellerie', pflege: 'frosttolerant, Direktsaat Freiland unter Vlies ab Februar/März und Juli bis Ende September, Voranzucht für frostfreies Gewächshaus ab Juli bis Jänner für satzweisen Anbau, Kalthaus Februar bis April', beschreibung: 'Oriental Mix ist eine bunte Cut-and-Come-Again-Salatmischung aus den frostverträglichen Asia-Blattgemüsesorten Pak Choi, Bok Choi, Mizuna, Mibuna, Purple Wave, Rouge metis, Grün im Schnee, Red Giant und anderen. Die Sortenmischung umfasst alle Geschmäcker von feinwürzig bis senfartig scharf.', kommentar: '', gruppe: 'Blatt' },
  { katalog_nr: 11, name: 'Schnittsalat Misticanza', vorkultur: '01.01.-30.04.', keimtemperatur: '10-15', keimdauer: '7-14', saattiefe: '1-2', aussetzen: '01.02.', direktsaat: '01.02.-01.09.', abstand_pflanze: 'Streu', abstand_reihe: 'Streu', ernte_start: 'Februar', wuchs: 'breitwürfig, mehrfacher Schnitt', samen_quelle: 'REINSAAT', pflanzpartner: 'Bohnen, Dill, Erbsen, Erdbeeren, Gurken, Kohl, Lauch, Möhren, Tomaten, Zwiebeln', beipflanze: 'Kerbel, gegen Läuse', pflanzgegner: 'Petersilie, Sellerie', pflege: 'Direktsaat ab Februar mit Folgesaaten bis Anfang September.', beschreibung: 'Traditioneller, italienischer Sorten- und Artenmix. Beliebte Pflücksalat-Mischung aus den roten und grünen Pflücksalaten, Romana- und Eichblattsalaten, Schnittzichorien, Rucola und der typischen Spezialität des Original-Misticanza Hirschhornwegerichs (Herba Stella).', kommentar: '', gruppe: 'Blatt' },
  { katalog_nr: 12, name: 'Pflücksalat Red Salat Bowl', vorkultur: '01.02.', keimtemperatur: '15', keimdauer: '', saattiefe: '0,2', aussetzen: '', direktsaat: '01.03.-30.09.', abstand_pflanze: '15', abstand_reihe: '15', ernte_start: 'Mai', wuchs: 'als Pflücksalat wird ein Abstand von 25 x 25 cm empfohlen', samen_quelle: 'Austrosaat', pflanzpartner: 'Bohnen, Dill, Erbsen, Erdbeeren, Gurken, Kohl, Lauch, Möhren, Tomaten, Zwiebeln', beipflanze: 'Kerbel, gegen Läuse', pflanzgegner: 'Petersilie, Sellerie', pflege: '', beschreibung: 'Ein schnellwüchsiger Schnitt- oder Pflücksalat mit eichblattförmigen, zarten rötlichen Blättern und lockerem Kopf.', kommentar: '', gruppe: 'Blatt' },
  { katalog_nr: 13, name: 'Spinat Matador', vorkultur: '01.01.-30.03.', keimtemperatur: '10-15', keimdauer: '7-14', saattiefe: '3', aussetzen: '01.03.', direktsaat: '01.03.-01.09.', abstand_pflanze: '3', abstand_reihe: '15', ernte_start: 'Februar', wuchs: 'breitwürfig, mehrfacher Schnitt', samen_quelle: 'REINSAAT', pflanzpartner: 'Zucchini, Kohlrabi, Erdbeeren', beipflanze: '', pflanzgegner: 'Petersilie, Sellerie', pflege: 'Direktsaat ab Februar mit Folgesaaten bis Anfang September.', beschreibung: 'Rasch wachsende, mittelfrühe Sorte mit sehr gutem Ertrag. Zarte, mittel- bis dunkelgrüne Blätter. Für den Frühjahrs- und Herbstanbau und den Überwinterungsanbau geeignet.', kommentar: '', gruppe: 'Blatt' },
  { katalog_nr: 14, name: 'Chili Lemon Drop', vorkultur: '01.03.', keimtemperatur: '25-30', keimdauer: '10-14', saattiefe: '1', aussetzen: '01.05.', direktsaat: 'nein', abstand_pflanze: '40', abstand_reihe: '40', ernte_start: 'August', wuchs: '80 cm, Anstäben', samen_quelle: 'samen greisslerei', pflanzpartner: 'Rucola, Radieschen, Pertersilie, Basilikum', beipflanze: '', pflanzgegner: '', pflege: 'mehrjährig! Jungpflanzen wachsen langsam, vor Frost schützen, langsam abhärten, feuchtes, lockeres und nährstoffreichen Substrat, Boden im Idealfall einen neutralen bis leicht sauren pH-Wert, mit Kompost düngen', beschreibung: 'Diese Sorte hat dünnwandige, leuchtend gelbe Schoten, die eine ausgesprochene Schärfe aufweisen (Schärfegrad 7 – 8). Zusätzlich besitzen sie ein typisches Zitronenaroma. Die Pflanze erreicht im Freiland bis 80 cm Wuchshöhe. Sie ist mehrjährig, aber nicht frosthart! Nutzung: Chilischoten zum Würzen frisch oder getrocknet. Daraus läßt sich ein farblich sehr schönes Chilipulver mahlen.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 15, name: 'Paprika Orange Kidds', vorkultur: '01.02.-15.04.', keimtemperatur: '22-25', keimdauer: '10-14', saattiefe: '0,5-1', aussetzen: '01.04.-01.06.', direktsaat: 'nein', abstand_pflanze: '60', abstand_reihe: '80', ernte_start: 'Juli', wuchs: '50 cm', samen_quelle: 'biotiger', pflanzpartner: 'Salat', beipflanze: 'Tagetes gegen Nematoden, Viren und weiße Fliege', pflanzgegner: '', pflege: 'Keimung bei möglichst stabiler Temperatur, sonnig, mäßig viel Wasser, gute Topf-Eignung', beschreibung: 'Kegelförmige, bis 10 cm große orange abreifende Früchte mit sehr süßem Geschmack. Die Ernte ist ist nicht besonders früh geht dann aber sehr lange in den Herbst hinein. Schärfe: 0, Fruchtfarbe: grün | orange', kommentar: '24.04.23 Bisher kein Saatkorn aufgegangen - bei 2 Versuchen', gruppe: 'Frucht' },
  { katalog_nr: 16, name: 'Zuckermelone', vorkultur: '01.04.', keimtemperatur: '24', keimdauer: '7-14', saattiefe: '', aussetzen: '01.05.', direktsaat: '01.05.', abstand_pflanze: '50', abstand_reihe: '100', ernte_start: 'August', wuchs: 'Rankend, Aufbinden', samen_quelle: 'own grown', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: 'Haupttrieb nach dem 4. oder 5. Blatt schneiden, Seitentriebe, nach dem 3.-5. Blatt schneiden. Die daraus entstehenden Seitentriebe bilden die weiblichen, fruchtenden Blüten. Behang pro Pflanze auf 4–6 Stück begrenzen. Im Glashaus manuell befruchten. Kalk, Frost, Windempfindlich', beschreibung: 'Die Charentais liebt sonnige, geschützte Standorte mit warmen, humusreichen Böden. Saftige Melonen aus Ihrem Garten. Die Zuckermelone bildet süße, faustgroße Früchte mit hellgrüner, genetzter Schale. Die Erntezeit beginnt im August.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 17, name: 'Chili spitz rot', vorkultur: '01.03.', keimtemperatur: '25-30', keimdauer: '10-14', saattiefe: '1', aussetzen: '01.05.', direktsaat: 'nein', abstand_pflanze: '40', abstand_reihe: '40', ernte_start: 'August', wuchs: '50-80 cm', samen_quelle: 'SPAR Bio', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 18, name: 'Paprika spitz rot', vorkultur: '01.02.-15.04.', keimtemperatur: '22-25', keimdauer: '10-14', saattiefe: '0,5-1', aussetzen: '01.04.-01.06.', direktsaat: 'nein', abstand_pflanze: '60', abstand_reihe: '80', ernte_start: 'Juli', wuchs: '50-80 cm', samen_quelle: 'SPAR Bio', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 19, name: 'Salat div.', vorkultur: '01.02.', keimtemperatur: '15', keimdauer: '', saattiefe: '0,2', aussetzen: '', direktsaat: '01.03.-30.09.', abstand_pflanze: '15', abstand_reihe: '15', ernte_start: 'Mai', wuchs: '', samen_quelle: '', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Blatt' },
  { katalog_nr: 20, name: 'Pflücksalat weiß', vorkultur: '01.02.', keimtemperatur: '15', keimdauer: '', saattiefe: '0,2', aussetzen: '', direktsaat: '01.03.-30.09.', abstand_pflanze: '15', abstand_reihe: '15', ernte_start: 'Mai', wuchs: 'als Pflücksalat wird ein Abstand von 25 x 25 cm empfohlen', samen_quelle: 'Austrosaat', pflanzpartner: 'Bohnen, Dill, Erbsen, Erdbeeren, Gurken, Kohl, Lauch, Möhren, Tomaten, Zwiebeln', beipflanze: 'Kerbel, gegen Läuse', pflanzgegner: 'Petersilie, Sellerie', pflege: '', beschreibung: 'Ein schnellwüchsiger Schnitt- oder Pflücksalat mit eichblattförmigen, zarten rötlichen Blättern und lockerem Kopf.', kommentar: '', gruppe: 'Blatt' },
  { katalog_nr: 21, name: 'Zwiebel Deep Purple', vorkultur: '01.02-31.03.', keimtemperatur: '10-20', keimdauer: '14-25', saattiefe: '1-3', aussetzen: '01.04.', direktsaat: '01.03.-30.04.', abstand_pflanze: '5', abstand_reihe: '25', ernte_start: 'Mai', wuchs: 'Jungzwiebel Mai/Juni, Knolle August (wenn Laub knickt)', samen_quelle: 'samen greisslerei', pflanzpartner: 'Bohnenkraut, Erdbeeren, Dill, Kopfsalat, Möhren, Rote Bete', beipflanze: '', pflanzgegner: 'Bohnen, Erbsen, Kohl', pflege: 'sonnig', beschreibung: 'Diese Sorte zeichnet sich durch feste, dunkelrote, plattrunde bis runde Zwiebeln aus, die gut lagerfähig sind. Sie ist sehr attraktiv als Jungzwiebel, der Schaft leuchtet dunkelrot unter dem grünem Laub hervor. Gute Lagerzwiebel. Nutzung: Jungzwiebeln, frisch oder gegart. Küchenzwiebel.', kommentar: '', gruppe: 'Zwiebel' },
  { katalog_nr: 22, name: 'Kräuter div.', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: 'nein', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: '', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 23, name: 'Aubergine Melanzani', vorkultur: '01.02.', keimtemperatur: '20-25', keimdauer: '7-21', saattiefe: '1-2', aussetzen: '15.05.', direktsaat: 'nein', abstand_pflanze: '60', abstand_reihe: '100', ernte_start: 'Juni', wuchs: '150 x 150 cm, Rankhilfe erforderlich', samen_quelle: 'Plantura', pflanzpartner: 'Salat', beipflanze: '', pflanzgegner: 'Zucchini, Kürbisse, rauben zuviel Platz, Tomaten und Paprika wegen der Schädlinge nicht zu Auberginen setzen', pflege: 'Auberginen lieben einen nährstoffreichen Boden. Es sollte deshalb am besten vor dem Auspflanzen reifer Kompost oder ein Langzeitdünger eingearbeitet werden, ein geschützter, sonniger Standort an einer Südwand ist ideal. Anbaupause von etwa vier Jahren.', beschreibung: '', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 24, name: 'Petersilie', vorkultur: '01.03.-31.08.', keimtemperatur: '18-22', keimdauer: '14-28', saattiefe: '0,5-1', aussetzen: '01.03.-31.08.', direktsaat: '01.03.-31.08.', abstand_pflanze: '30', abstand_reihe: '30', ernte_start: 'ganzjährig im Glashaus', wuchs: 'Busch, Herz immer stehen lassen, 2-jährig', samen_quelle: 'own grown', pflanzpartner: '', beipflanze: '', pflanzgegner: '4 Jahreswechsel mit Doldenblütlern wie z.B. Karrotte', pflege: 'halbschattigen Orten mit lockeren, humosen Böden und feinkrümeliger Oberfläche, keine Trockenheit, doch auch Staunässe kann der Pflanze schaden. Ein durchlässiger Boden ist ebenfalls von Vorteil.', beschreibung: 'Wichtig ist, dass du immer das Herz der Petersilie intakt lässt. Dieses erkennst du an dem verdickten Stiel, an dessen Seite neue Blätter wachsen. Meist befindet er sich in der Mitte der Pflanze. Wenn du ganze Stängel direkt über dem Boden schneidest, kann das Kraut immer wieder neu austreiben. Achtung: Sollte deine Pflanze blühen, darfst du die Blätter jedoch nicht mehr verwenden, da sie dann schwer verdaulich sind.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 25, name: 'Gewürztagetes', vorkultur: '01.03.', keimtemperatur: '15-18', keimdauer: '5-10', saattiefe: '0,5', aussetzen: '01.05.', direktsaat: '01.05.', abstand_pflanze: 'Streu', abstand_reihe: 'Streu', ernte_start: 'Juli', wuchs: 'niedrig wachsend bis 30 cm', samen_quelle: 'REINSAAT', pflanzpartner: 'Gurken Tomaten', beipflanze: '', pflanzgegner: '', pflege: 'sonnig, gut durchlässiger fruchtbarer Boden, Geruch zieht Schnecken an, wehrt Nematoden, Ameisen und die Weiße Fliege ab', beschreibung: 'Kompakt wachsende, ca. 30 cm hohe Staude mit leuchtend gelb-orangen, wohlschmeckenden Blüten, deren Aroma an Mandarinen erinnert. Köstliches Gewürz in Salaten, Süßspeisen und Punsch.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 26, name: 'Erdbeeren mix', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: 'nein', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: '', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Beeren' },
  { katalog_nr: 27, name: 'Gurke Melothria', vorkultur: '15.04.-30.04.', keimtemperatur: '25-28', keimdauer: '5-8', saattiefe: '2-3', aussetzen: '15.05.', direktsaat: '01.05.-30.06.', abstand_pflanze: '50', abstand_reihe: '150', ernte_start: 'September', wuchs: '1,5 m am Gitter', samen_quelle: 'samen hauefl', pflanzpartner: 'Bohnen, Dill, Erbsen, Fenchel, Kohl, Kopfsalat, Kümmel, Lauch, Mais, Rote Bete, Sellerie, Zwiebeln', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nBorretsch, Insektenbestäubten Pflanzen, z.B. Gurken, Zucchini, Lockt Insekten an', pflanzgegner: 'Tomaten, Radieschen', pflege: 'nicht pikieren! Die Pflänzchen werden bis zum ersten Blattpaar eingesetzt. Wenn der Stiel in der Erde ist, kann er neue Wurzeln bilden. Nach dem Pflanzen die Gurken unbedingt ausgiebig gießen. Besonders schlecht ist Staunässe.', beschreibung: 'Mexikanische Minigurke, grün weiß, junge Früchte roh oder zum Einlegen, auch für Topfkultur geeignet. Brauchen ein feines Rankgerüst, Früchte spät, September, Durchmesser ca. 3 cm,', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 28, name: 'Gurke Pappelchen', vorkultur: '15.04.-30.04.', keimtemperatur: '25-28', keimdauer: '5-8', saattiefe: '2-3', aussetzen: '15.05.', direktsaat: '01.05.-30.06.', abstand_pflanze: '50', abstand_reihe: '150', ernte_start: 'Juli', wuchs: '1,5 m am Gitter', samen_quelle: 'samen hauefl', pflanzpartner: 'Bohnen, Dill, Erbsen, Fenchel, Kohl, Kopfsalat, Kümmel, Lauch, Mais, Rote Bete, Sellerie, Zwiebeln', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nBorretsch, Insektenbestäubten Pflanzen, z.B. Gurken, Zucchini, Lockt Insekten an', pflanzgegner: 'Tomaten, Radieschen', pflege: 'nicht pikieren! Die Pflänzchen werden bis zum ersten Blattpaar eingesetzt. Wenn der Stiel in der Erde ist, kann er neue Wurzeln bilden. Nach dem Pflanzen die Gurken unbedingt ausgiebig gießen. Besonders schlecht ist Staunässe.', beschreibung: 'Kleine Salat ooder Einlegegurke mit glatter Schale, dunkelgrün, kaum bestachelt, Früchte ca. 8-12 cm lang, robust auch bei ungünstiger Witterung', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 29, name: 'Cocktailparadeiser Gelbe Johannisbeere', vorkultur: '01.02-31.03.', keimtemperatur: '20-22', keimdauer: '8-10', saattiefe: 'Licht', aussetzen: '15.05-31.05.', direktsaat: 'nein', abstand_pflanze: '50', abstand_reihe: '100', ernte_start: 'Juli', wuchs: 'Stark verzweigte, buschförmig, lange Rispen mit massenhaft Früchte', samen_quelle: 'REINSAAT', pflanzpartner: 'Buschbohne, Knoblauch, Kohl, Kohlrabi', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nTagetes, gegen Nematoden, Viren und weiße Fliege', pflanzgegner: 'Erbse, Fenchel, Kartoffeln', pflege: 'nicht ausgeizen, sonniger Standort', beschreibung: 'Stark verzweigte, buschförmig wachsende Wildtomate aus der EHZ von ReinSaat. Bildet an langen Rispen massenhaft runde, kleine, gelbe Früchte mit süßem, kräftigem Wildtomatenaroma. Pflanzen müssen nur nicht ausgegeizt werden. Ideale Naschtomate für die Topfkultur auf Balkon und Terrasse.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 30, name: 'Winterhecken Zwiebel', vorkultur: '01.03.-31.08.', keimtemperatur: '10-20', keimdauer: '14-25', saattiefe: '1-3', aussetzen: '01.03.', direktsaat: '01.03.-31.08.', abstand_pflanze: '5', abstand_reihe: '25', ernte_start: 'Februar', wuchs: 'Staude mit Blüte', samen_quelle: 'Sorten WERKSTATT', pflanzpartner: 'Bohnenkraut, Erdbeeren, Dill, Kopfsalat, Möhren, Rote Bete', beipflanze: '', pflanzgegner: 'Bohnen, Erbsen, Kohl', pflege: 'winterhart, ausdauernd', beschreibung: 'Blattgrün kann häufig beerntet werden, Feb.-Okt.. Im Sommer schöne Kugelblüte, Vermehrung auch über Teilung', kommentar: '', gruppe: 'Zwiebel' },
  { katalog_nr: 31, name: 'Zucchini Largo Blanco Serpiente', vorkultur: '15.04.', keimtemperatur: '18-22', keimdauer: '7-14', saattiefe: '2-3', aussetzen: '15.05.', direktsaat: '15.05.-15.06.', abstand_pflanze: '100', abstand_reihe: '100', ernte_start: 'Juli', wuchs: 'Buschig wachsend', samen_quelle: 'Maria Arnold', pflanzpartner: 'Kopfsalat, Lauch, Möhren, Petersilie, Rettich, Radieschen, Rote Bete, Sellerie, Spinat, Stangenbohnen, Zwiebeln', beipflanze: 'Borretsch, Insektenbestäubten Pflanzen, z.B. Gurken, Zucchini, Lockt Insekten an', pflanzgegner: '', pflege: 'Gute Drainage, gute Düngung, sonnig, warm, luftig. Hornspäne einmengen, frostempfindlich', beschreibung: 'Weiße Zucchini mit augeprägtem Geschmack. Stammt aus Sizilien. Die Pflanzen zeichnen sich durch Frühreife aus, ab Mitte Juli kann förmlich fortlaufend geernet werden. Ganz jung bei einer Dicke von 2cm geerntet unglaublich zart, selbst später bildet sie keine harte Schale aus, sondern sie bleiben weich bei knackigem Fleisch. Die Sorte unbedingt pur probieren, fein geschnitten oder geraspelt mit Salz, Olivenöl, Pfeffer und Tomatenessig total lecker.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 32, name: 'Stangenbohne Cornetti Viola Trionfo', vorkultur: '15.04.-30.04.', keimtemperatur: '12-25', keimdauer: '10-14', saattiefe: '3', aussetzen: '01.05.', direktsaat: '01.05.-30.06.', abstand_pflanze: '10', abstand_reihe: '10', ernte_start: 'August', wuchs: '5 Bohnen pro Stange 2 m', samen_quelle: 'Arche Noah', pflanzpartner: 'Bohnenkraut, Erdbeeren, Gurken, Sellerie, Rote Bete, Kohlarten, Kopfsalat, Pflücksalat, Tomate', beipflanze: 'Bohnenkraut, gegen schwarze Bohnenlaus, Duftstoffe fördern Wachstum und Aroma der Bohnen', pflanzgegner: 'Erbsen, Fenchel, Knoblauch, Lauch, Zwiebeln', pflege: 'nicht pikieren, Übernacht mit Kamillentee einweiken vor Aussaat, sonnig, mäßig feucht, wärmebedürftig, gute Vorfruchtwirkung', beschreibung: 'Die violetten Fisolen sind wohlschmeckend, leicht süß, mit Biss und schmecken als Salat oder Gemüse zubereitet. Die Samen sind nierenförmig, hautfarben mit grauer Sprenkelung. Die Sorte stammt aus Italien.', kommentar: '', gruppe: 'Hülse' },
  { katalog_nr: 33, name: 'Stangenbohne Aloisia schwarz', vorkultur: '15.04.-30.04.', keimtemperatur: '12-25', keimdauer: '10-14', saattiefe: '3', aussetzen: '01.05.', direktsaat: '01.05.-30.06.', abstand_pflanze: '10', abstand_reihe: '10', ernte_start: 'August', wuchs: '5 Bohnen pro Stange 2 m', samen_quelle: 'Sorten WERKSTATT', pflanzpartner: 'Bohnenkraut, Erdbeeren, Gurken, Sellerie, Rote Bete, Kohlarten, Kopfsalat, Pflücksalat, Tomate', beipflanze: 'Bohnenkraut, gegen schwarze Bohnenlaus, Duftstoffe fördern Wachstum und Aroma der Bohnen', pflanzgegner: 'Erbsen, Fenchel, Knoblauch, Lauch, Zwiebeln', pflege: 'nicht pikieren, Übernacht mit Kamillentee einweiken vor Aussaat, sonnig, mäßig feucht, wärmebedürftig, gute Vorfruchtwirkung', beschreibung: 'Alte Sorte aus der Südsteiermark, von einer Arche Noah Erhalterin bekommen. Leicht gebogene grüne Fisolen, fadenlos, die sehr knackig sind, wenn man sie dünstet. Die schwarzen Samen kann man als Trockenbohnen nutzen. Enthält mind. 30 Samen sortenreines Saatgut.', kommentar: '', gruppe: 'Hülse' },
  { katalog_nr: 34, name: 'Karotte Duwicker Streit', vorkultur: '', keimtemperatur: '10-20', keimdauer: '21', saattiefe: '1-2,5', aussetzen: '', direktsaat: '28.02.-30.06.', abstand_pflanze: '7', abstand_reihe: '40', ernte_start: 'Mai', wuchs: 'klein', samen_quelle: 'Arche Noah', pflanzpartner: 'Dill, Erbsen, Knoblauch, Lauch, Radieschen, Rettich, Tomaten, Zwiebeln, Schnittlauch', beipflanze: '', pflanzgegner: '', pflege: 'darf nie austrocknen bei Neusaat, Unkraut entfernen, Vereinzeln bei Bedarf, sonnig', beschreibung: 'Ihr Geschmack ist sehr süß und enorm aromatisch! Duwika ist eine raschwüchsige Frühkarotte, die sich als Treibmöhre im Frühbeet und früheste Freilandkarotte eignet. Sie wird aber auch den ganzen Sommer hindurch bis zu spätesten Ausaatterminen Anfang August gesät. Durch den hohen Zuckergehalt ist sie weniger frostempfindlich als andere Sorten. „Duwicker" werden Karotten mit kurzen, kreiselförmigen Wurzeln genannt. Die Sorte ist frühreifend, das Fruchtfleisch schmeckt süß und ist orange gefärbt. Auch auf schweren Böden nicht beinig und leicht zu ernten.', kommentar: '', gruppe: 'Wurzel' },
  { katalog_nr: 35, name: 'Stoppelrübe aus der Wildschönau', vorkultur: '', keimtemperatur: '10-20', keimdauer: '8-12', saattiefe: '3', aussetzen: '', direktsaat: '01.03.-31.08.', abstand_pflanze: '15', abstand_reihe: '15', ernte_start: 'Mai', wuchs: 'klein', samen_quelle: 'Arche Noah', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: 'Sonnige Lage', beschreibung: 'Diese Rübe wird in nur wenigen Wochen erntereif und kann im Frühjahr und auch im Sommer angebaut werden. Ihre Früchte schmecken sowohl roh als auch gekocht. Sie sind flach, weiß-violett gefärbt und besitzen eine angenehme Schärfe.', kommentar: '', gruppe: 'Wurzel' },
  { katalog_nr: 36, name: 'Radieschen', vorkultur: '', keimtemperatur: '8-15', keimdauer: '4-6', saattiefe: '1-1,5', aussetzen: '', direktsaat: '15.03.-15.09.', abstand_pflanze: '5', abstand_reihe: '10', ernte_start: 'Mai', wuchs: 'klein', samen_quelle: 'div.', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: 'Halbschatten, Sonne (Frühjahr, Herbst)', beschreibung: '', kommentar: '', gruppe: 'Wurzel' },
  { katalog_nr: 37, name: 'Kerbel', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: '', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: '', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: 'Gegen Läuse beim Salat', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 38, name: 'Borretsch', vorkultur: 'nein', keimtemperatur: '15-20', keimdauer: '30-90', saattiefe: '1,3', aussetzen: '', direktsaat: '01.03.-31.05.', abstand_pflanze: '20', abstand_reihe: '20', ernte_start: '01.07.-31.08.', wuchs: 'einjährige Staude 90 cm', samen_quelle: 'Thompson&Morgan', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: 'An einem leicht schattigen, geschützten Standort mit gut durchlässigem Boden', beschreibung: 'lockt Insekten für die Bestäubung an, hübsch auf dem Salat', kommentar: 'Forschungen zufolge ist dies eine der besten Blumen, um Honigbienen in den Garten zu locken. Eine fantastische essbare Blume: zum Kristallisieren für Kuchen, als Beigabe zu Salaten oder zum Einfrieren als Eiswürfel zum Gin & Tonic. Mit einer Höhe von 90 cm bildet Borretsch einen dekorativen, selbstsäenden Hintergrund sowohl für die Gemüse- als auch Blumenrabatte.', gruppe: 'Kräuter' },
  { katalog_nr: 39, name: 'Koriander', vorkultur: 'nein', keimtemperatur: '10-20', keimdauer: '5-8', saattiefe: '0,5', aussetzen: '01.04.-31.07.', direktsaat: '01.04.-31.07.', abstand_pflanze: '10', abstand_reihe: '30', ernte_start: 'Mai, mit Folgesaat alle 4 Wochen', wuchs: '100 cm', samen_quelle: 'SPAR Bio', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: 'Halbschatten für Blattwachstum, sonnig für Samenreife; liebt kalkhaltigen Boden, regelmäßig gießen, organisch düngen', beschreibung: 'Gewürzkraut für anspruchsvolle Kenner. Grünzeug wie Petersilie und Samenkörner als Gewürz verwendet.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 40, name: 'Paprika Neusiedler Ideal rot', vorkultur: '01.02.-15.04.', keimtemperatur: '20-25', keimdauer: '14-21', saattiefe: '0,5-1', aussetzen: '01.04.-01.06.', direktsaat: '15.05.', abstand_pflanze: '50', abstand_reihe: '70', ernte_start: 'Juli', wuchs: '', samen_quelle: 'KIEPENKERL', pflanzpartner: 'Salat', beipflanze: 'Tagetes gegen Nematoden, Viren und weiße Fliege', pflanzgegner: '', pflege: 'Neusiedler Ideal liefert hohe Erträge in der Ernteperiode von Mitte Juli bis Oktober. Eine Direktaussaat ins Freiland kann ab Mitte Mai erfolgen. Hier kommt es auf einen sonnigen, warmen und windgeschützten Standort an. Wer eher aussäen möchte, kann mit der Vorkultur im Haus ab Februar starten. Für den Gewächshausanbau ist die Sorte ebenfalls geeignet.', beschreibung: 'Bei der Paprika Neusiedler Ideal handelt es sich um eine leckere Speisepaprika mit blockigen Früchten, welche von Grün nach Rot abreifen. Sie können sowohl im grünen als auch im roten Stadium geerntet werden, wobei die voll abgereiften roten Paprika süßer im Geschmack sind. Bezüglich ihrer Inhaltsstoffe unterscheiden sie sich allerdings nicht. Die grünen und roten Früchte sind gleichermaßen gesund, da sie vor allem wichtige Vitamine enthalten, beispielsweise jede Menge Vitamin C. Voll ausgefärbte Früchte haben den höchsten Vitamin C-Gehalt.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 41, name: 'Zwiebel Mix', vorkultur: '01.02-31.03.', keimtemperatur: '10-20', keimdauer: '14-25', saattiefe: '1-3', aussetzen: '01.04.', direktsaat: '01.03.-30.04.', abstand_pflanze: '5', abstand_reihe: '25', ernte_start: 'Mai', wuchs: 'Jungzwiebel Mai/Juni, Knolle August (wenn Laub knickt)', samen_quelle: 'unbekannt', pflanzpartner: 'Bohnenkraut, Erdbeeren, Dill, Kopfsalat, Möhren, Rote Bete', beipflanze: '', pflanzgegner: 'Bohnen, Erbsen, Kohl', pflege: 'sonnig', beschreibung: 'Jungzwiebel', kommentar: '', gruppe: 'Zwiebel' },
  { katalog_nr: 42, name: 'Schnittlauch', vorkultur: '01.02-31.03.', keimtemperatur: '18-20', keimdauer: '14-25', saattiefe: '0,5-1', aussetzen: '01.04.', direktsaat: '01.03.-30.04.', abstand_pflanze: '', abstand_reihe: 'Streu', ernte_start: 'ganzjährig', wuchs: '20-50 cm', samen_quelle: 'unbekannt', pflanzpartner: 'Sein Duft vertreibt unter anderem die Möhrenfliege. Schon wenige Horste in der Nachbarschaft reduzieren bei Erdbeeren die Anfälligkeit für Grauschimmel und bei Gurken die Infektionsgefahr mit Falschem Mehltau.', beipflanze: '', pflanzgegner: 'Auf dem Beet darf Schnittlauch nicht nach sich selbst und anderen Allium-Arten angebaut werden, zudem verträgt er sich nicht gut mit Kohlgewächsen.', pflege: 'Günstig ist ein sonniger bis halbschattiger Platz. Eine Abdeckung mit Vlies beschleunigt bei früher Aussaat das Auflaufen.', beschreibung: 'Eine Direktsaat ist nur auf unkrautfreien Böden empfehlenswert, da die Samen sehr langsam keimen. Bei der Aussaat im Beet wartet man ab, bis der Boden eine Temperatur von fünf Grad Celsius erreicht hat. Wenn Sie die Samen mit grobem Sand mischen, lassen sie sich gleichmäßiger ausstreuen.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 43, name: 'Dill', vorkultur: 'nein', keimtemperatur: '15-20', keimdauer: '10-30', saattiefe: 'Licht', aussetzen: '15.05-31.07.', direktsaat: '15.05.-31.07.', abstand_pflanze: '5', abstand_reihe: '5', ernte_start: 'Einjährig, Juni', wuchs: '80 cm', samen_quelle: 'own grown', pflanzpartner: 'Möhren, Gurken oder auch Salat', beipflanze: '', pflanzgegner: '', pflege: 'Freiland, bevorzugt. Halbschattig bis sonnig und wächst auf allen durchlässigen Gartenböden ohne Staunässe', beschreibung: 'Die feinen Blätterspitzen des Dills können jederzeit geerntet werden und sind zum Sofortverzehr geeignet. Alternativ ist eine Trocknung und besonders auch eine Frostung der Blätter sehr gut möglich. Die Blätter am besten zur Blüte oder kurz vorher ernten, denn dann ist der höchste Gehalt an aromabildenden ätherischen Ölen erreicht.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 44, name: 'Bohnenkraut', vorkultur: 'nein', keimtemperatur: '15-20', keimdauer: '10-30', saattiefe: 'Licht', aussetzen: '01.04.-31.07.', direktsaat: '01.04.-31.07.', abstand_pflanze: '20', abstand_reihe: '20', ernte_start: 'Einjährig, Juni', wuchs: '30 cm', samen_quelle: 'own grown', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: 'Sonnige und warme Standorte im Freiland und schätzt lockere, humose Böden.', beschreibung: 'Die aromatischen Blätter können je nach Aussaat ab Juni stets geerntet und direkt roh oder gekocht verzehrt werden. Sie eignen sich auch zur Trocknung oder Frostung. Die Blätter am besten kurz vor der Blüte ernten. Bohnenkraut solltest du allgemein immer gegen Ende des Garvorgangs hinzugeben, da es ein sehr dominantes Aroma entwickelt.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 45, name: 'Liebstöckel Maggikraut', vorkultur: '01.02.-30.04.', keimtemperatur: '20', keimdauer: '10-30', saattiefe: 'Licht', aussetzen: '01.05.', direktsaat: 'nein', abstand_pflanze: '40', abstand_reihe: '40', ernte_start: 'Mehrjährig, Juni', wuchs: '20 cm', samen_quelle: 'Panteer', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: 'Freiland, bevorzugt. Halbschattig bis sonnig und wächst auf allen durchlässigen Gartenböden ohne Staunässe', beschreibung: 'Frische, junge Blätter erntest du am besten vor der Blüte. Die Samen werden erst im Spätsommer geerntet, wenn sie braun sind. Liebstöckel ist ein mehrjähriges Kraut, das etwa drei Mal im Jahr geschnitten werden sollte. Ab dem zweiten Jahr lassen sich auch die Wurzeln ernten.', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 46, name: 'Salbei', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: '', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: 'Panteer', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 47, name: 'Knoblauch', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: '', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: 'unbekannt', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Zwiebel' },
  { katalog_nr: 48, name: 'Salatparadeiser gestreift SPAR', vorkultur: '15.03-15.04.', keimtemperatur: '20-25', keimdauer: '8-10', saattiefe: 'Licht', aussetzen: '15.05-31.05.', direktsaat: 'nein', abstand_pflanze: '50', abstand_reihe: '80', ernte_start: 'Juli', wuchs: 'Stabtomate', samen_quelle: 'SPAR Bio', pflanzpartner: 'Buschbohne, Knoblauch, Kohl, Kohlrabi', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nTagetes, gegen Nematoden, Viren und weiße Fliege', pflanzgegner: 'Erbse, Fenchel, Kartoffeln', pflege: '', beschreibung: 'Im Salat kommt der süß-aromatische Geschmack hervorragend zur Geltung. Extrem frühreifend ist die Sorte auch für rauhere Lagen empfehlenswert. Die roten, runden, ca. 4 cm großen Früchte kann man die ganze Saison über ernten.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 49, name: 'Paradeiser Ochsenherz Tschernij Prinz', vorkultur: '01.02-31.03.', keimtemperatur: '20-25', keimdauer: '8-10', saattiefe: '0,5-1', aussetzen: '15.04.-15.05.', direktsaat: '15.05-31.05.', abstand_pflanze: '50', abstand_reihe: '60', ernte_start: 'Juli', wuchs: 'Stabtomate', samen_quelle: 'REINSAAT', pflanzpartner: 'Buschbohne, Knoblauch, Kohl, Kohlrabi', beipflanze: 'Basilikum, gegen Mehltau und weiße Fliege\nTagetes, gegen Nematoden, Viren und weiße Fliege', pflanzgegner: 'Erbse, Fenchel, Kartoffeln', pflege: '', beschreibung: 'Halbdeterminante Fleischtomate aus der EHZ von ReinSaat. Die braunroten, flachrunden Früchte sind von herausragend gutem Geschmack. Mehrkammerige, fleischige und sehr saftige Früchte mit einem Fruchtgewicht von ca. 200 – 300 g. Früh einsetzende Ernte. Sehr beliebte Hausgärtnersorte.', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 50, name: 'Paprika Snack Hamik', vorkultur: '15.01.-31.03.', keimtemperatur: '20-25', keimdauer: '14-21', saattiefe: '0,5-1', aussetzen: '15.04.-30.04.', direktsaat: '15.05.-15.06.', abstand_pflanze: '50', abstand_reihe: '70', ernte_start: 'Juli', wuchs: '20-50 cm', samen_quelle: 'REINSAAT', pflanzpartner: 'Salat', beipflanze: 'Tagetes gegen Nematoden, Viren und weiße Fliege', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 51, name: 'Chili Diavoletto', vorkultur: '15.02.-15.03.', keimtemperatur: '20-25', keimdauer: '10-14', saattiefe: '1', aussetzen: '15.04.-30.04.', direktsaat: 'nein', abstand_pflanze: '50', abstand_reihe: '70', ernte_start: 'Juli', wuchs: '50-80 cm', samen_quelle: 'REINSAAT', pflanzpartner: 'Rucola, Radieschen, Pertersilie, Basilikum', beipflanze: '', pflanzgegner: '', pflege: 'mehrjährig! Jungpflanzen wachsen langsam, vor Frost schützen, langsam abhärten, feuchtes, lockeres und nährstoffreichen Substrat, Boden im Idealfall einen neutralen bis leicht sauren pH-Wert, mit Kompost düngen', beschreibung: 'Züchtung ReinSaat. Dekorativer, langgestreckter, fleischiger Chili mit attraktiven lilafarbenen Blüten, Stielen, Kelchen und Blattadern. Die Früchte reifen von lila auf goldbraun zu orangerot ab. Gut geeignet zum Frischverzehr, in Salsas oder zum Einlegen. Für Gewächshaus und geschützte Freilandlagen. Schärfegrad 6 – 7', kommentar: '', gruppe: 'Frucht' },
  { katalog_nr: 52, name: 'Thymian', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: '', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: 'own grown', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 53, name: 'Rosmarin', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: '', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: 'own grown', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 54, name: 'Majoran', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: '', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: 'own grown', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Kräuter' },
  { katalog_nr: 55, name: 'Oregano', vorkultur: '', keimtemperatur: '', keimdauer: '', saattiefe: '', aussetzen: '', direktsaat: '', abstand_pflanze: '', abstand_reihe: '', ernte_start: '', wuchs: '', samen_quelle: 'own grown', pflanzpartner: '', beipflanze: '', pflanzgegner: '', pflege: '', beschreibung: '', kommentar: '', gruppe: 'Kräuter' }
];

const insertPflanze = db.prepare(`
  INSERT OR IGNORE INTO pflanzenkatalog (
    katalog_nr, name, vorkultur, keimtemperatur, keimdauer, saattiefe,
    aussetzen, direktsaat, abstand_pflanze, abstand_reihe, ernte_start,
    wuchs, samen_quelle, pflanzpartner, beipflanze, pflanzgegner,
    pflege, beschreibung, kommentar, gruppe
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const pflanze of pflanzenkatalogDaten) {
  insertPflanze.run(
    pflanze.katalog_nr, pflanze.name, pflanze.vorkultur, pflanze.keimtemperatur,
    pflanze.keimdauer, pflanze.saattiefe, pflanze.aussetzen, pflanze.direktsaat,
    pflanze.abstand_pflanze, pflanze.abstand_reihe, pflanze.ernte_start,
    pflanze.wuchs, pflanze.samen_quelle, pflanze.pflanzpartner, pflanze.beipflanze,
    pflanze.pflanzgegner, pflanze.pflege, pflanze.beschreibung, pflanze.kommentar,
    pflanze.gruppe
  );
}

console.log(`✓ ${pflanzenkatalogDaten.length} Pflanzen in den Katalog eingefügt`);

// Pflanzplätze und Bepflanzung einfügen
const pflanzplaetzeDaten = [
  { kennzahl: '1OA', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 1, hoehe: 'oben', platz: 'A', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '1OB', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 1, hoehe: 'oben', platz: 'B', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '1OC', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 1, hoehe: 'oben', platz: 'C', gefaess: 'Stahl 30', pflanzhilfe: 'Gitter', ernaehrung: 'Erde' },
  { kennzahl: '1UA', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 1, hoehe: 'unten', platz: 'A', gefaess: 'Stahl 30', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '1UB', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 1, hoehe: 'unten', platz: 'B', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '1UC', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 1, hoehe: 'unten', platz: 'C', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '2OA', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 2, hoehe: 'oben', platz: 'A', gefaess: 'Topf', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '2OB', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 2, hoehe: 'oben', platz: 'B', gefaess: 'Platte', pflanzhilfe: 'Licht', ernaehrung: 'Erde' },
  { kennzahl: '2OC', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 2, hoehe: 'oben', platz: 'C', gefaess: 'Platte', pflanzhilfe: 'Licht', ernaehrung: 'Erde' },
  { kennzahl: '2UA', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 2, hoehe: 'unten', platz: 'A', gefaess: 'Stahl 30', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '2UB', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 2, hoehe: 'unten', platz: 'B', gefaess: 'Platte', pflanzhilfe: 'nein', ernaehrung: 'trocken' },
  { kennzahl: '2UC', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 2, hoehe: 'unten', platz: 'C', gefaess: 'Platte', pflanzhilfe: 'nein', ernaehrung: 'trocken' },
  { kennzahl: '3OA', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 3, hoehe: 'oben', platz: 'A', gefaess: 'Stahl 20', pflanzhilfe: 'Stäbe', ernaehrung: 'Erde' },
  { kennzahl: '3OB', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 3, hoehe: 'oben', platz: 'B', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '3OC', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 3, hoehe: 'oben', platz: 'C', gefaess: 'Stahl 30', pflanzhilfe: 'Gitter', ernaehrung: 'Erde' },
  { kennzahl: '3UA', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 3, hoehe: 'unten', platz: 'A', gefaess: 'Stahl 30', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '3UB', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 3, hoehe: 'unten', platz: 'B', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '3UC', bereich: 'Glashaus', lage: 'Norden/Mauer', licht: 'Sonne', pflanzort: 'Niederregal', nummer: 3, hoehe: 'unten', platz: 'C', gefaess: 'Platte', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '4OA', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Niederregal', nummer: 4, hoehe: 'oben', platz: 'A', gefaess: 'Stahl 30', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '4OB', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Niederregal', nummer: 4, hoehe: 'oben', platz: 'B', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '4OC', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Niederregal', nummer: 4, hoehe: 'oben', platz: 'C', gefaess: 'Stahl 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '4UA', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Niederregal', nummer: 4, hoehe: 'unten', platz: 'A', gefaess: 'Stahl 30', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '4UB', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Niederregal', nummer: 4, hoehe: 'unten', platz: 'B', gefaess: 'Platte', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '4UC', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Niederregal', nummer: 4, hoehe: 'unten', platz: 'C', gefaess: 'Stahl 30', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '5MA', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Hochregal', nummer: 5, hoehe: 'mitte', platz: 'A', gefaess: 'Eurobox 20 klein', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '5MB', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Hochregal', nummer: 5, hoehe: 'mitte', platz: 'B', gefaess: 'Eurobox 10', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '5OA', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Hochregal', nummer: 5, hoehe: 'oben', platz: 'A', gefaess: 'Eurobox 20 klein', pflanzhilfe: 'nein', ernaehrung: 'trocken' },
  { kennzahl: '5OB', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Hochregal', nummer: 5, hoehe: 'oben', platz: 'B', gefaess: 'leer', pflanzhilfe: 'nein', ernaehrung: 'trocken' },
  { kennzahl: '5UA', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Hochregal', nummer: 5, hoehe: 'unten', platz: 'A', gefaess: 'Anzuchtschalen', pflanzhilfe: 'nein', ernaehrung: 'trocken' },
  { kennzahl: '5UB', bereich: 'Glashaus', lage: 'Süden/Thujen', licht: 'Halbschatten/Schatten', pflanzort: 'Hochregal', nummer: 5, hoehe: 'unten', platz: 'B', gefaess: 'Stahl 30', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '6MA', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'mitte', platz: 'A', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6MB', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'mitte', platz: 'B', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6MC', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'mitte', platz: 'C', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6MD', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'mitte', platz: 'D', gefaess: 'Eurobox 20', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6OA', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'oben', platz: 'A', gefaess: 'Eurobox 10', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6OB', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'oben', platz: 'B', gefaess: 'Eurobox 10', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6OC', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'oben', platz: 'C', gefaess: 'Eurobox 10', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6UA', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'unten', platz: 'A', gefaess: 'Topf', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6UB', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'unten', platz: 'B', gefaess: 'Topf', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '6UC', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 6, hoehe: 'unten', platz: 'C', gefaess: 'Topf', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7MA', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'mitte', platz: 'A', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7MB', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'mitte', platz: 'B', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7MC', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'mitte', platz: 'C', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7MD', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'mitte', platz: 'D', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7ME', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'mitte', platz: 'E', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7MF', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'mitte', platz: 'F', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7OA', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'oben', platz: 'A', gefaess: 'Topf', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7OB', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'oben', platz: 'B', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7OC', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'oben', platz: 'C', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7OD', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'oben', platz: 'D', gefaess: 'Topf', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7UA', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'unten', platz: 'A', gefaess: 'Topf', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7UB', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'unten', platz: 'B', gefaess: 'Kisterl', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '7UC', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Hochregal', nummer: 7, hoehe: 'unten', platz: 'C', gefaess: 'Stahl 30', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '8L', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Boot', nummer: 8, hoehe: 'links', platz: 'L', gefaess: 'Boot', pflanzhilfe: 'Gitter', ernaehrung: 'Erde' },
  { kennzahl: '8M', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Boot', nummer: 8, hoehe: 'mitte', platz: 'M', gefaess: 'Boot', pflanzhilfe: 'Gitter', ernaehrung: 'Erde' },
  { kennzahl: '8R', bereich: 'Freiland', lage: 'Westen/Haus', licht: 'Sonne', pflanzort: 'Boot', nummer: 8, hoehe: 'rechts', platz: 'R', gefaess: 'Boot', pflanzhilfe: 'Gitter', ernaehrung: 'Erde' },
  { kennzahl: '9L', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Sonne', pflanzort: 'Boot', nummer: 9, hoehe: 'links', platz: 'L', gefaess: 'Boot', pflanzhilfe: 'Tomatenhaken', ernaehrung: 'Erde' },
  { kennzahl: '9M', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Sonne', pflanzort: 'Boot', nummer: 9, hoehe: 'mitte', platz: 'M', gefaess: 'Boot', pflanzhilfe: 'nein', ernaehrung: 'Erde' },
  { kennzahl: '9R', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Sonne', pflanzort: 'Boot', nummer: 9, hoehe: 'rechts', platz: 'R', gefaess: 'Boot', pflanzhilfe: 'Tomatenstab', ernaehrung: 'Erde' },
  { kennzahl: '10L', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Halbschatten', pflanzort: 'Boot', nummer: 10, hoehe: 'links', platz: 'L', gefaess: 'Boot', pflanzhilfe: 'Tomatenstab', ernaehrung: 'Erde' },
  { kennzahl: '10M', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Halbschatten', pflanzort: 'Boot', nummer: 10, hoehe: 'mitte', platz: 'M', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
  { kennzahl: '10R', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Halbschatten', pflanzort: 'Boot', nummer: 10, hoehe: 'rechts', platz: 'R', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
  { kennzahl: '11L', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Schatten', pflanzort: 'Boot', nummer: 11, hoehe: 'links', platz: 'L', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
  { kennzahl: '11M', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Schatten', pflanzort: 'Boot', nummer: 11, hoehe: 'mitte', platz: 'M', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
  { kennzahl: '11R', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Schatten', pflanzort: 'Boot', nummer: 11, hoehe: 'rechts', platz: 'R', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
  { kennzahl: '12L', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Schatten', pflanzort: 'Boot', nummer: 12, hoehe: 'links', platz: 'L', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
  { kennzahl: '12M', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Schatten', pflanzort: 'Boot', nummer: 12, hoehe: 'mitte', platz: 'M', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
  { kennzahl: '12R', bereich: 'Freiland', lage: 'Osten/Wald', licht: 'Schatten', pflanzort: 'Boot', nummer: 12, hoehe: 'rechts', platz: 'R', gefaess: 'Boot', pflanzhilfe: '', ernaehrung: 'Erde' },
];

const insertPlatz = db.prepare(`
  INSERT OR IGNORE INTO pflanzplaetze (
    kennzahl, bereich, lage, licht, pflanzort, nummer, hoehe, platz, gefaess, pflanzhilfe, ernaehrung
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const platz of pflanzplaetzeDaten) {
  insertPlatz.run(
    platz.kennzahl, platz.bereich, platz.lage, platz.licht, platz.pflanzort,
    platz.nummer, platz.hoehe, platz.platz, platz.gefaess, platz.pflanzhilfe, platz.ernaehrung
  );
}

console.log(`✓ ${pflanzplaetzeDaten.length} Pflanzplätze eingefügt`);

// Bepflanzung: Zuordnung Pflanzplatz -> Pflanze (mit Katalog-Nr.)
const bepflanzungDaten = [
  { kennzahl: '1OA', katalog_nr: 17, anzahl: 1 },
  { kennzahl: '1OA', katalog_nr: 51, anzahl: 1 },
  { kennzahl: '1OB', katalog_nr: 40, anzahl: 1 },
  { kennzahl: '1OB', katalog_nr: 50, anzahl: 1 },
  { kennzahl: '1OC', katalog_nr: 18, anzahl: 1 },
  { kennzahl: '1OC', katalog_nr: 18, anzahl: 1 },
  { kennzahl: '1UA', katalog_nr: 6, anzahl: 1 },
  { kennzahl: '1UA', katalog_nr: 1, anzahl: 1 },
  { kennzahl: '1UA', katalog_nr: 3, anzahl: 1 },
  { kennzahl: '1UB', katalog_nr: 4, anzahl: 3 },
  { kennzahl: '1UC', katalog_nr: 41, anzahl: 10 },
  { kennzahl: '1UC', katalog_nr: 42, anzahl: 2 },
  { kennzahl: '2OA', katalog_nr: 16, anzahl: 1 },
  { kennzahl: '2OA', katalog_nr: 16, anzahl: 1 },
  { kennzahl: '2UA', katalog_nr: 2, anzahl: 1 },
  { kennzahl: '2UA', katalog_nr: 49, anzahl: 1 },
  { kennzahl: '3OA', katalog_nr: 14, anzahl: 2 },
  { kennzahl: '3OA', katalog_nr: 51, anzahl: 2 },
  { kennzahl: '3OB', katalog_nr: 18, anzahl: 2 },
  { kennzahl: '3OB', katalog_nr: 50, anzahl: 2 },
  { kennzahl: '3OC', katalog_nr: 8, anzahl: 10 },
  { kennzahl: '3UA', katalog_nr: 1, anzahl: 1 },
  { kennzahl: '3UA', katalog_nr: 48, anzahl: 1 },
  { kennzahl: '3UA', katalog_nr: 3, anzahl: 1 },
  { kennzahl: '3UB', katalog_nr: 4, anzahl: 3 },
  { kennzahl: '3UC', katalog_nr: 10, anzahl: 25 },
  { kennzahl: '3UC', katalog_nr: 11, anzahl: 25 },
  { kennzahl: '4OA', katalog_nr: 23, anzahl: 2 },
  { kennzahl: '4OB', katalog_nr: 20, anzahl: 6 },
  { kennzahl: '4OC', katalog_nr: 12, anzahl: 6 },
  { kennzahl: '4UA', katalog_nr: 49, anzahl: 1 },
  { kennzahl: '4UA', katalog_nr: 2, anzahl: 1 },
  { kennzahl: '4UC', katalog_nr: 48, anzahl: 1 },
  { kennzahl: '4UC', katalog_nr: 2, anzahl: 1 },
  { kennzahl: '5OB', katalog_nr: 19, anzahl: 1 },
  { kennzahl: '5UB', katalog_nr: 1, anzahl: 1 },
  { kennzahl: '5UB', katalog_nr: 49, anzahl: 1 },
  { kennzahl: '6MA', katalog_nr: 13, anzahl: 2 },
  { kennzahl: '6MB', katalog_nr: 37, anzahl: 2 },
  { kennzahl: '6MC', katalog_nr: 52, anzahl: 2 },
  { kennzahl: '6MD', katalog_nr: 34, anzahl: 10 },
  { kennzahl: '6OA', katalog_nr: 10, anzahl: 2 },
  { kennzahl: '6OB', katalog_nr: 36, anzahl: 2 },
  { kennzahl: '6OC', katalog_nr: 11, anzahl: 2 },
  { kennzahl: '6UA', katalog_nr: 26, anzahl: 2 },
  { kennzahl: '6UB', katalog_nr: 39, anzahl: 2 },
  { kennzahl: '6UC', katalog_nr: 5, anzahl: 2 },
  { kennzahl: '7MA', katalog_nr: 26, anzahl: 2 },
  { kennzahl: '7MB', katalog_nr: 22, anzahl: 2 },
  { kennzahl: '7MC', katalog_nr: 19, anzahl: 2 },
  { kennzahl: '7MD', katalog_nr: 19, anzahl: 2 },
  { kennzahl: '7ME', katalog_nr: 22, anzahl: 2 },
  { kennzahl: '7MF', katalog_nr: 26, anzahl: 2 },
  { kennzahl: '7OA', katalog_nr: 31, anzahl: 1 },
  { kennzahl: '7OD', katalog_nr: 31, anzahl: 1 },
  { kennzahl: '7UA', katalog_nr: 28, anzahl: 1 },
  { kennzahl: '7UB', katalog_nr: 21, anzahl: 1 },
  { kennzahl: '7UC', katalog_nr: 1, anzahl: 1 },
  { kennzahl: '7UC', katalog_nr: 2, anzahl: 1 },
  { kennzahl: '7UC', katalog_nr: 3, anzahl: 1 },
  { kennzahl: '8L', katalog_nr: 27, anzahl: 1 },
  { kennzahl: '8M', katalog_nr: 38, anzahl: 2 },
  { kennzahl: '8R', katalog_nr: 27, anzahl: 1 },
  { kennzahl: '9L', katalog_nr: 9, anzahl: 3 },
  { kennzahl: '9M', katalog_nr: 21, anzahl: 10 },
  { kennzahl: '9R', katalog_nr: 29, anzahl: 3 },
  { kennzahl: '10L', katalog_nr: 6, anzahl: 2 },
  { kennzahl: '10M', katalog_nr: 4, anzahl: 1 },
  { kennzahl: '10R', katalog_nr: 24, anzahl: 1 },
  { kennzahl: '11L', katalog_nr: 32, anzahl: 5 },
  { kennzahl: '11M', katalog_nr: 32, anzahl: 5 },
  { kennzahl: '11R', katalog_nr: 32, anzahl: 5 },
  { kennzahl: '12L', katalog_nr: 33, anzahl: 5 },
  { kennzahl: '12M', katalog_nr: 33, anzahl: 5 },
  { kennzahl: '12R', katalog_nr: 33, anzahl: 5 },
];

// Pflanzplatz-IDs und Pflanzen-IDs ermitteln
const getPlatzId = db.prepare('SELECT id FROM pflanzplaetze WHERE kennzahl = ?');
const getPflanzeId = db.prepare('SELECT id FROM pflanzenkatalog WHERE katalog_nr = ?');
const insertBepflanzung = db.prepare(`
  INSERT INTO bepflanzung (pflanzplatz_id, pflanze_id, anzahl)
  VALUES (?, ?, ?)
`);

let bepflanzungCount = 0;
for (const bepfl of bepflanzungDaten) {
  const platzRow = getPlatzId.get(bepfl.kennzahl);
  const pflanzeRow = getPflanzeId.get(bepfl.katalog_nr);

  if (platzRow && pflanzeRow) {
    insertBepflanzung.run(platzRow.id, pflanzeRow.id, bepfl.anzahl);
    bepflanzungCount++;
  }
}

console.log(`✓ ${bepflanzungCount} Bepflanzungen eingefügt`);

console.log('✅ Seeding abgeschlossen!');
db.close();
