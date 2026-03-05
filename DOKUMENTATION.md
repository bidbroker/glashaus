# 🌿 Glashaus - Funktionsdokumentation

**Version**: 2.0.0
**Stand**: 05.03.2026
**Entwickelt für**: Blumat-Bewässerungs-Management mit Pflanzplätzen

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Technische Architektur](#technische-architektur)
3. [Datenbank-Schema](#datenbank-schema)
4. [Hauptfunktionen](#hauptfunktionen)
5. [API-Endpunkte](#api-endpunkte)
6. [Benutzeroberfläche](#benutzeroberfläche)
7. [Dateistruktur](#dateistruktur)

---

## 🎯 Übersicht

Glashaus ist eine responsive Web-Anwendung zur Verwaltung von Blumat-Bewässerungssystemen. Sie ermöglicht:
- Verwaltung von Pflanzplätzen mit variabler Blumat-Anzahl
- Pflanzenkatalog mit umfangreichen Pflanzinformationen
- Bepflanzungsschema: Zuordnung von Pflanzen zu Pflanzplätzen
- Tägliche Justierung der Blumat-Dosierung (±1-4 Teilstriche)
- Vollständige Änderungshistorie mit optionalen Notizen
- Mobile-optimierte Eingabe (iOS)
- Desktop-Dashboard für Auswertungen

---

## 🏗️ Technische Architektur

### Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS 4
- **Datenbank**: SQLite (better-sqlite3)
- **Runtime**: Node.js

### Deployment
- Development Server: `npm run dev` → http://localhost:3000
- Production Build: `npm run build && npm start`

---

## 💾 Datenbank-Schema

### Datei: `glashaus.db` (SQLite)

#### Tabelle: `pflanzplaetze`
Speichert alle Pflanzplätze (Hauptentität der Anwendung)

```sql
CREATE TABLE pflanzplaetze (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kennzahl TEXT UNIQUE NOT NULL,     -- Eindeutige Kennung (z.B. "1OA", "GH-01")
  bereich TEXT,                       -- Bereich (z.B. "Glashaus", "Garten")
  lage TEXT,                          -- Lage (z.B. "Norden/Mauer", "Süd")
  licht TEXT,                         -- Lichtverhältnisse (z.B. "Sonne", "Schatten")
  pflanzort TEXT,                     -- Pflanzort-Typ (z.B. "Niederregal", "Hochbeet")
  nummer INTEGER,                     -- Optionale Nummer
  hoehe TEXT,                         -- Höhe (z.B. "oben", "unten")
  platz TEXT,                         -- Platz-Bezeichnung (z.B. "A", "B", "C")
  gefaess TEXT,                       -- Gefäß-Typ (z.B. "Stahl 20", "Stahl 30")
  pflanzhilfe TEXT,                   -- Pflanzhilfe (z.B. "Gitter", "Tomatenhaken")
  ernaehrung TEXT,                    -- Ernährungsart (z.B. "Erde", "Hydro")
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabelle: `tropfer` (Blumaten)
Speichert die Blumaten pro Pflanzplatz oder Wanne

```sql
CREATE TABLE tropfer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wanne_id INTEGER,                   -- Referenz zu wannen.id (optional, für Legacy)
  pflanzplatz_id INTEGER,             -- Referenz zu pflanzplaetze.id
  position INTEGER NOT NULL,          -- Position innerhalb des Pflanzplatzes (1, 2, 3...)
  aktueller_stand INTEGER DEFAULT 0,  -- Aktueller Stand in Teilstrichen
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wanne_id) REFERENCES wannen(id) ON DELETE CASCADE,
  FOREIGN KEY (pflanzplatz_id) REFERENCES pflanzplaetze(id) ON DELETE CASCADE
);
```

**Hinweis**: Die Tabelle heißt intern noch `tropfer`, wird aber in der UI als "Blumat/Blumaten" angezeigt.
- 1 Stück = "Blumat"
- 2+ Stück = "Blumaten"

#### Tabelle: `aenderungen`
Vollständige Historie aller Blumat-Anpassungen

```sql
CREATE TABLE aenderungen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tropfer_id INTEGER NOT NULL,        -- Referenz zu tropfer.id
  datum DATETIME DEFAULT CURRENT_TIMESTAMP,
  aenderung INTEGER NOT NULL,         -- Änderung: +1, +2, +3, +4 oder -1, -2, -3, -4
  vorher INTEGER NOT NULL,            -- Stand vor der Änderung
  nachher INTEGER NOT NULL,           -- Stand nach der Änderung
  notiz TEXT,                         -- Optional: Benutzer-Notiz
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tropfer_id) REFERENCES tropfer(id) ON DELETE CASCADE
);

CREATE INDEX idx_aenderungen_datum ON aenderungen(datum);
CREATE INDEX idx_aenderungen_tropfer ON aenderungen(tropfer_id);
```

#### Tabelle: `pflanzenkatalog`
Speichert alle Pflanzenarten mit detaillierten Informationen

```sql
CREATE TABLE pflanzenkatalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  katalog_nr INTEGER UNIQUE,          -- Katalog-Nummer
  name TEXT NOT NULL,                 -- Pflanzenname
  vorkultur TEXT,                     -- Vorkultur-Zeitraum
  keimtemperatur TEXT,                -- Keimtemperatur
  keimdauer TEXT,                     -- Keimdauer
  saattiefe TEXT,                     -- Saattiefe
  aussetzen TEXT,                     -- Aussetzen-Zeitraum
  direktsaat TEXT,                    -- Direktsaat-Zeitraum
  abstand_pflanze TEXT,               -- Abstand zwischen Pflanzen
  abstand_reihe TEXT,                 -- Abstand zwischen Reihen
  ernte_start TEXT,                   -- Ernte-Beginn
  wuchs TEXT,                         -- Wuchsform
  samen_quelle TEXT,                  -- Samenquelle
  pflanzpartner TEXT,                 -- Gute Pflanzpartner
  beipflanze TEXT,                    -- Beipflanzen
  pflanzgegner TEXT,                  -- Schlechte Nachbarn
  pflege TEXT,                        -- Pflegehinweise
  beschreibung TEXT,                  -- Beschreibung
  kommentar TEXT,                     -- Kommentar
  gruppe TEXT,                        -- Pflanzengruppe (z.B. "Frucht", "Blatt", "Kräuter")
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabelle: `bepflanzung`
Verknüpft Pflanzen mit Pflanzplätzen (Bepflanzungsschema)

```sql
CREATE TABLE bepflanzung (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pflanzplatz_id INTEGER NOT NULL,    -- Referenz zu pflanzplaetze.id
  pflanze_id INTEGER,                 -- Referenz zu pflanzenkatalog.id
  anzahl INTEGER DEFAULT 1,           -- Anzahl der Pflanzen
  notiz TEXT,                         -- Optionale Notiz
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pflanzplatz_id) REFERENCES pflanzplaetze(id) ON DELETE CASCADE,
  FOREIGN KEY (pflanze_id) REFERENCES pflanzenkatalog(id) ON DELETE SET NULL
);
```

#### Tabelle: `wannen` (Legacy)
Alte Wannen-Tabelle, wird für Rückwärtskompatibilität beibehalten

```sql
CREATE TABLE wannen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nummer INTEGER UNIQUE NOT NULL,
  name TEXT,
  beschreibung TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ Hauptfunktionen

### 1. Übersicht (Startseite)
**Route**: `/`
**Datei**: `app/page.tsx`

**Features**:
- Grid-Ansicht aller Pflanzplätze
- Anzeige: Kennzahl, Bereich/Pflanzort, Bepflanzung, Blumat-Anzahl
- Suchfunktion: Suche nach Kennzahl, Bereich oder Pflanzenname
- Filter nach Bereich und Pflanzort
- Button zum Hinzufügen neuer Pflanzplätze
- Mobile-optimiert: 2 Spalten auf Mobile, 5 Spalten auf Desktop
- Click → Weiterleitung zur Pflanzplatz-Detailansicht

### 2. Pflanzplatz-Detailansicht
**Route**: `/pflanzplatz/[id]`
**Datei**: `app/pflanzplatz/[id]/page.tsx`

**Features**:

#### a) Pflanzplatz-Verwaltung
- Anzeige: Kennzahl, Bereich, Lage, Pflanzort, Gefäß
- Bearbeiten-Funktion für alle Felder
- Zurück-Navigation zur Übersicht

#### b) Bepflanzung
- Anzeige aller zugeordneten Pflanzen aus dem Bepflanzungsschema
- Pflanzen hinzufügen (mit Suchfunktion im Katalog)
- Pflanzen entfernen
- Anzahl und Notiz pro Pflanze

#### c) Blumat-Verwaltung
- **Blumat hinzufügen**: Erstellt neuen Blumat mit Position = max + 1
- **Blumat löschen**: Nur wenn > 1 Blumat vorhanden
- **Blumat anpassen**: ±1-4 Teilstriche mit optionaler Notiz

#### d) Historie
- Zeigt die letzten 10 Änderungen für diesen Pflanzplatz
- Datum, Blumat-Position, Änderung, Stand vorher/nachher, Notiz

### 3. Pflanzenkatalog
**Route**: `/pflanzenkatalog`
**Datei**: `app/pflanzenkatalog/page.tsx`

**Features**:
- Vollständige Pflanzenliste mit allen Details
- Erweiterte Filterung nach mehreren Feldern gleichzeitig
- Gruppierung nach Gruppe, Vorkultur oder Direktsaat
- Such- und Filterfunktionen
- Detail-Modal mit allen Pflanzeninformationen
- Pflanzen bearbeiten und hinzufügen

### 4. Bepflanzungsschema
**Route**: `/bepflanzung`
**Datei**: `app/bepflanzung/page.tsx`

**Features**:
- Übersicht aller Pflanzplätze mit Bepflanzung
- Gruppierung nach Bereich, Lage oder Pflanzort
- Filter nach Bereich, Lage, Licht, Pflanzort
- Alle aufklappen / Alle schließen
- Pflanzen zu Pflanzplätzen hinzufügen/entfernen

### 5. Dashboard (Historie)
**Route**: `/dashboard`
**Datei**: `app/dashboard/page.tsx`

**Features**:
- Tabellarische Übersicht aller Änderungen
- **Filter**: Alle / Heute / Gestern
- **Spalten**:
  - Datum (formatiert: "Heute, 14:30" / "Gestern, 10:15" / "01.03.2026, 12:00")
  - Wanne (Nummer + Name) - für Legacy-Wannen
  - Blumat (Position)
  - Änderung (Badge: grün für +, rot für -)
  - Stand (vorher → nachher)
  - Notiz (kursiv, in Anführungszeichen)
- Sortierung: Neueste zuerst
- Limit: 100 Einträge

### 6. Setup-Screen
**Route**: `/setup`
**Datei**: `app/setup/page.tsx`

**Features**:
- Statistiken-Übersicht (Wannen, Blumaten, Änderungen, Ø Stand)
- Wannen-Anzahl ändern (1-200)
- Alle Blumaten auf Startwert setzen (0-100)
- Datenbank zurücksetzen
- Massenbearbeitung aller Wannen

---

## 🔌 API-Endpunkte

### Pflanzplätze

#### `GET /api/pflanzplaetze`
Gibt alle Pflanzplätze mit Bepflanzung und Blumat-Anzahl zurück.

**Query Parameters**:
- `bereich`: Filter nach Bereich
- `lage`: Filter nach Lage
- `licht`: Filter nach Lichtverhältnissen
- `pflanzort`: Filter nach Pflanzort

**Response**:
```json
[
  {
    "id": 1,
    "kennzahl": "1OA",
    "bereich": "Glashaus",
    "lage": "Norden/Mauer",
    "licht": "Sonne",
    "pflanzort": "Niederregal",
    "gefaess": "Stahl 20",
    "tropfer_anzahl": 2,
    "pflanzen": [
      {
        "id": 1,
        "pflanze_id": 17,
        "pflanze_name": "Chili spitz rot",
        "pflanze_gruppe": "Frucht",
        "anzahl": 1,
        "notiz": null
      }
    ]
  }
]
```

#### `GET /api/pflanzplaetze/[id]`
Gibt einen Pflanzplatz mit allen Blumaten und Bepflanzung zurück.

**Response**:
```json
{
  "id": 1,
  "kennzahl": "1OA",
  "bereich": "Glashaus",
  "tropfer": [
    { "id": 72, "position": 1, "aktueller_stand": 0 },
    { "id": 73, "position": 2, "aktueller_stand": 0 }
  ],
  "pflanzen": [...]
}
```

#### `POST /api/pflanzplaetze`
Erstellt einen neuen Pflanzplatz.

#### `PATCH /api/pflanzplaetze/[id]`
Aktualisiert Pflanzplatz-Felder.

#### `DELETE /api/pflanzplaetze/[id]`
Löscht einen Pflanzplatz.

### Blumaten (Tropfer)

#### `POST /api/tropfer`
Fügt neuen Blumat hinzu.

**Request Body**:
```json
{
  "pflanzplatzId": 1
}
```

**Response**:
```json
{
  "success": true,
  "blumat": {
    "id": 74,
    "pflanzplatz_id": 1,
    "position": 3,
    "aktueller_stand": 0
  }
}
```

#### `DELETE /api/tropfer/[id]`
Löscht einen Blumat (wenn nicht der letzte).

### Änderungen

#### `POST /api/aenderungen`
Speichert eine Blumat-Anpassung.

**Request Body**:
```json
{
  "tropferId": 72,
  "aenderung": 2,
  "notiz": "Pflanze trocken"
}
```

#### `GET /api/aenderungen`
Gibt Änderungen zurück.

### Pflanzenkatalog

#### `GET /api/pflanzenkatalog`
Gibt alle Pflanzen zurück.

#### `GET /api/pflanzenkatalog/[id]`
Gibt eine Pflanze zurück.

#### `POST /api/pflanzenkatalog`
Erstellt neue Pflanze.

#### `PUT /api/pflanzenkatalog/[id]`
Aktualisiert Pflanze.

### Bepflanzung

#### `POST /api/bepflanzung`
Fügt Pflanze zu Pflanzplatz hinzu.

#### `DELETE /api/bepflanzung/[id]`
Entfernt Pflanze von Pflanzplatz.

---

## 🎨 Benutzeroberfläche

### Design-System

**Farben**:
- Primary: Green (Bewässerungs-Thema)
- Success: Green-600 (Erhöhen-Buttons)
- Danger: Red-500 (Reduzieren-Buttons)
- Info: Blue-600 (Aktionen, Dashboard)
- Secondary: Purple-600 (Blumat hinzufügen)

**Responsive Breakpoints**:
- Mobile: < 640px (2 Spalten)
- Tablet: 640-1024px (3-4 Spalten)
- Desktop: > 1024px (5 Spalten)

**Touch-Optimierung**:
- Button-Mindestgröße: 44x44px (iOS Empfehlung)
- Große Klickflächen für +/- Buttons

### Navigation
Alle Seiten haben eine konsistente Navigation:
- 🏠 Übersicht (Startseite)
- 📊 Dashboard
- 🌱 Pflanzenkatalog
- 🌻 Bepflanzung
- ⚙️ Setup

---

## 📁 Dateistruktur

```
glashaus/
├── app/
│   ├── page.tsx                        # Übersicht (Pflanzplätze-Grid)
│   ├── layout.tsx                      # Root Layout
│   ├── globals.css                     # Tailwind Styles
│   │
│   ├── pflanzplatz/
│   │   └── [id]/
│   │       └── page.tsx                # Pflanzplatz-Detail (Blumat-Management)
│   │
│   ├── wanne/
│   │   └── [id]/
│   │       └── page.tsx                # Wanne-Detail (Legacy)
│   │
│   ├── dashboard/
│   │   └── page.tsx                    # Historie-Dashboard
│   │
│   ├── pflanzenkatalog/
│   │   └── page.tsx                    # Pflanzenkatalog
│   │
│   ├── bepflanzung/
│   │   └── page.tsx                    # Bepflanzungsschema
│   │
│   ├── setup/
│   │   └── page.tsx                    # Setup-Screen
│   │
│   └── api/
│       ├── pflanzplaetze/
│       │   ├── route.ts                # GET, POST /api/pflanzplaetze
│       │   ├── [id]/route.ts           # GET, PATCH, DELETE /api/pflanzplaetze/[id]
│       │   └── optionen/route.ts       # GET Filter-Optionen
│       │
│       ├── tropfer/
│       │   ├── route.ts                # POST /api/tropfer
│       │   └── [id]/route.ts           # DELETE /api/tropfer/[id]
│       │
│       ├── aenderungen/
│       │   └── route.ts                # GET, POST /api/aenderungen
│       │
│       ├── pflanzenkatalog/
│       │   ├── route.ts                # GET, POST /api/pflanzenkatalog
│       │   ├── [id]/route.ts           # GET, PUT, DELETE
│       │   └── gruppen/route.ts        # GET Gruppen
│       │
│       ├── bepflanzung/
│       │   ├── route.ts                # POST /api/bepflanzung
│       │   └── [id]/route.ts           # DELETE /api/bepflanzung/[id]
│       │
│       ├── wannen/
│       │   ├── route.ts                # GET /api/wannen (Legacy)
│       │   └── [id]/route.ts           # GET, PATCH /api/wannen/[id]
│       │
│       └── setup/
│           └── route.ts                # GET, POST /api/setup
│
├── lib/
│   └── db.ts                           # SQLite Datenbank-Setup
│
├── database/
│   └── seed.js                         # Datenbank-Initialisierung
│
├── glashaus.db                         # SQLite Datenbank-Datei
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── DOKUMENTATION.md                    # Diese Datei
└── README.md
```

---

## 🚀 Entwicklung

### Commands
```bash
# Development Server
npm run dev          # http://localhost:3000

# Datenbank initialisieren
npm run seed

# Production Build
npm run build
npm start

# Linting
npm run lint
```

### Environment
- Node.js Version: 20+
- Port: 3000 (Development)
- Datenbank: `./glashaus.db` (SQLite)

---

## 📝 Changelog

### Version 2.0.0 (05.03.2026)
- ✅ **Pflanzplätze als Hauptentität** - Startseite zeigt jetzt Pflanzplätze statt Wannen
- ✅ **Blumat statt Tropfer** - Umbenennung in der gesamten UI
  - Singular: "Blumat"
  - Plural: "Blumaten"
- ✅ **Übersicht statt Startseite** - Navigation umbenannt
- ✅ **Pflanzplatz-Detailseite** (`/pflanzplatz/[id]`)
  - Bepflanzung aus Bepflanzungsschema anzeigen
  - Pflanzen hinzufügen/entfernen
  - Blumat-Verwaltung (hinzufügen, löschen, anpassen)
  - Änderungshistorie
- ✅ **Datenbank erweitert** - tropfer-Tabelle hat jetzt pflanzplatz_id
- ✅ **API erweitert** - Neue Endpunkte für Pflanzplatz-Blumat-Verwaltung

### Version 1.1.0 (05.03.2026)
- ✅ Setup-Screen hinzugefügt
- ✅ UTF-8 Encoding implementiert
- ✅ Pflanzenkatalog
- ✅ Bepflanzungsschema

### Version 1.0.0 (04.03.2026)
- ✅ Initiales Release
- ✅ 40 Wannen mit variabler Tropfer-Anzahl
- ✅ Tropfer-Anpassung (±1-4 Teilstriche)
- ✅ Dashboard mit Historie

---

**Ende der Dokumentation**

Bei Fragen oder Änderungswünschen: Diese Datei als Referenz verwenden.
