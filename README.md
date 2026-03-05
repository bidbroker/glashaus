# 🌿 Glashaus - Tropfbewässerungs-Management

Eine Web-Anwendung zur Verwaltung und Dokumentation von 40 Wannen mit variabler Tropfer-Anzahl.

---

## 🚀 Quick Start

```bash
# Installation
npm install

# Datenbank initialisieren
npm run seed

# Development Server starten
npm run dev
```

➡️ App läuft auf: **http://localhost:3000**

---

## ✨ Hauptfunktionen

### 📱 Mobile-Ansicht (iOS-optimiert)
- ✅ **40 Wannen** im Grid-Layout
- ✅ **Suchfunktion** nach Name/Nummer
- ✅ **Tropfer-Anpassung**: +/- 1, 2, 3, 4 Teilstriche
- ✅ **Notizen** bei jeder Änderung (optional)
- ✅ **Tropfer-Verwaltung**: Hinzufügen/Entfernen
- ✅ **Wannen umbenennen**: Individuelle Namen + Beschreibung

### 💻 Desktop-Ansicht
- ✅ **Dashboard** mit vollständiger Historie
- ✅ **Filter**: Alle / Heute / Gestern
- ✅ **Notizen-Anzeige** in der Historie
- ✅ **Detailansicht**: Stand vorher → nachher

---

## 📖 Dokumentation

### Für Entwickler
➡️ **[DOKUMENTATION.md](./DOKUMENTATION.md)** - Vollständige technische Dokumentation:
- Datenbank-Schema
- API-Endpunkte
- Komponenten-Struktur
- Erweiterungsmöglichkeiten

### Schnellreferenz

#### Datenbank
- **Datei**: `glashaus.db` (SQLite)
- **Tabellen**: `wannen`, `tropfer`, `aenderungen`
- **Standard**: 40 Wannen, je 1 Tropfer

#### API-Endpunkte
```
GET    /api/wannen          # Alle Wannen
GET    /api/wannen/[id]     # Eine Wanne mit Tropfern
PATCH  /api/wannen/[id]     # Wanne umbenennen

POST   /api/tropfer         # Tropfer hinzufügen
DELETE /api/tropfer/[id]    # Tropfer löschen

GET    /api/aenderungen     # Historie abrufen
POST   /api/aenderungen     # Änderung speichern
```

#### Seiten
```
/                   # Wannen-Übersicht (Startseite)
/wanne/[id]         # Tropfer-Management
/dashboard          # Historie-Dashboard
```

---

## 🎯 Verwendung

### 1. Wanne benennen
1. Wanne öffnen
2. **"✏️ Bearbeiten"** klicken
3. Name eingeben (z.B. "Tomaten Hochbeet")
4. Optional: Beschreibung (z.B. "Sorte: Roma")
5. **Speichern**

### 2. Tropfer anpassen
1. Wanne öffnen
2. **"Anpassen"** beim gewünschten Tropfer
3. **+1 bis +4** (erhöhen) oder **-1 bis -4** (reduzieren)
4. Optional: **Notiz** eingeben (z.B. "Pflanze trocken")
5. **Speichern**

### 3. Tropfer hinzufügen
1. Wanne öffnen
2. **"+ Neuen Tropfer hinzufügen"** (lila Button)
3. Neuer Tropfer wird mit Stand 0 erstellt

### 4. Tropfer entfernen
1. Wanne öffnen
2. **🗑️ Symbol** beim Tropfer klicken
3. Bestätigen
4. ⚠️ Mind. 1 Tropfer muss bleiben

### 5. Historie ansehen
1. **"📊 Zum Dashboard"** klicken
2. Filter wählen: **Alle / Heute / Gestern**
3. Alle Änderungen mit Notizen werden angezeigt

---

## 🛠️ Technologie

- **Next.js 16** - React Framework mit App Router
- **TypeScript** - Type Safety
- **Tailwind CSS 4** - Styling
- **Better SQLite3** - Datenbank
- **Responsive Design** - Mobile & Desktop optimiert

---

## 📱 Mobile Zugriff (optional)

### Im lokalen Netzwerk
1. Finde IP-Adresse deines PCs: `ipconfig` (Windows) / `ifconfig` (Mac/Linux)
2. Öffne auf iPhone: `http://[DEINE-IP]:3000`

### Online (Deployment)
```bash
# Mit Vercel (kostenlos)
npm install -g vercel
vercel
```

Andere Optionen: Railway, Render, Fly.io

---

## 🔧 Maintenance

### Backup erstellen
```bash
cp glashaus.db backups/glashaus_$(date +%Y%m%d).db
```

### Datenbank zurücksetzen
```bash
# ACHTUNG: Löscht alle Daten!
rm glashaus.db
npm run seed
```

### Auf 1 Tropfer pro Wanne zurücksetzen
```bash
node update-db.js
```

### Build-Cache löschen (bei Fehlern)
```bash
rm -rf .next
npm run dev
```

---

## 📊 Datenbank-Struktur (Kurzübersicht)

### `wannen`
- `id`, `nummer` (1-40), `name`, `beschreibung`

### `tropfer`
- `id`, `wanne_id`, `position`, `aktueller_stand`

### `aenderungen`
- `id`, `tropfer_id`, `datum`, `aenderung`, `vorher`, `nachher`, `notiz`

---

## 🔮 Mögliche Erweiterungen

Ideen für die Zukunft:
- [ ] Bulk-Operations (mehrere Tropfer gleichzeitig)
- [ ] CSV-Export der Historie
- [ ] Graphen / Verlaufskurven
- [ ] Alarme bei extremen Änderungen
- [ ] Foto-Upload pro Wanne
- [ ] Wetter-Integration
- [ ] Multi-User mit Login
- [ ] PWA für Offline-Nutzung

---

## 📝 Commands

```bash
npm run dev          # Development Server
npm run build        # Production Build
npm start            # Production Server
npm run lint         # Code-Prüfung
npm run seed         # Datenbank initialisieren
node update-db.js    # Reset auf 1 Tropfer/Wanne
```

---

## 📞 Support

Bei Problemen:
1. Browser-Konsole prüfen (F12)
2. Terminal-Ausgabe prüfen
3. Port 3000 frei? → `lsof -i :3000` (Mac/Linux) / Task Manager (Windows)
4. Build-Cache löschen: `rm -rf .next`

---

## 📄 Dateien

```
glashaus/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Startseite (Wannen-Grid)
│   ├── wanne/[id]/page.tsx    # Tropfer-Management
│   ├── dashboard/page.tsx     # Historie
│   └── api/                   # API Routes
├── lib/db.ts                  # Datenbank-Setup
├── database/                  # Datenbank-Dateien
│   └── seed.js               # DB-Initialisierung
├── glashaus.db                # SQLite Datenbank
├── DOKUMENTATION.md           # Vollständige Doku
└── README.md                  # Diese Datei
```

---

**Version**: 1.0.0
**Stand**: 04.03.2026
**Entwickelt für**: Tropfbewässerungs-Management

Viel Erfolg mit Glashaus! 🌿💧
