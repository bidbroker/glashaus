'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Pflanze {
  id: number;
  pflanze_id: number;
  pflanze_name: string;
  pflanze_gruppe: string;
  anzahl: number;
  notiz: string;
}

interface Pflanzplatz {
  id: number;
  kennzahl: string;
  bereich: string;
  lage: string;
  licht: string;
  pflanzort: string;
  nummer: number;
  hoehe: string;
  platz: string;
  gefaess: string;
  pflanzhilfe: string;
  ernaehrung: string;
  tropfer_anzahl: number;
  pflanzen: Pflanze[];
}

interface FilterOptionen {
  bereiche: string[];
  lagen: string[];
  lichtverhaeltnisse: string[];
  pflanzorte: string[];
  gefaesse: string[];
}

export default function Home() {
  const [pflanzplaetze, setPflanzplaetze] = useState<Pflanzplatz[]>([]);
  const [filterOptionen, setFilterOptionen] = useState<FilterOptionen>({
    bereiche: [],
    lagen: [],
    lichtverhaeltnisse: [],
    pflanzorte: [],
    gefaesse: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter State
  const [filterBereich, setFilterBereich] = useState('');
  const [filterPflanzort, setFilterPflanzort] = useState('');

  // Modal für neuen Pflanzplatz
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKennzahl, setNewKennzahl] = useState('');
  const [newBereich, setNewBereich] = useState('');
  const [newLage, setNewLage] = useState('');
  const [newPflanzort, setNewPflanzort] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPflanzplaetze();
    loadFilterOptionen();
  }, [filterBereich, filterPflanzort]);

  const loadPflanzplaetze = async () => {
    try {
      const params = new URLSearchParams();
      if (filterBereich) params.set('bereich', filterBereich);
      if (filterPflanzort) params.set('pflanzort', filterPflanzort);

      const response = await fetch(`/api/pflanzplaetze?${params}`);
      const data = await response.json();
      setPflanzplaetze(data);
    } catch (error) {
      console.error('Fehler beim Laden der Pflanzplätze:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptionen = async () => {
    try {
      const res = await fetch('/api/pflanzplaetze/optionen');
      if (res.ok) {
        const data = await res.json();
        setFilterOptionen(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Optionen:', err);
    }
  };

  const handleAddPflanzplatz = async () => {
    if (!newKennzahl.trim()) {
      alert('Kennzahl ist erforderlich');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/pflanzplaetze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennzahl: newKennzahl.trim(),
          bereich: newBereich,
          lage: newLage,
          pflanzort: newPflanzort,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewKennzahl('');
        setNewBereich('');
        setNewLage('');
        setNewPflanzort('');
        await loadPflanzplaetze();
        await loadFilterOptionen();
      } else {
        const error = await res.json();
        alert(error.error || 'Fehler beim Erstellen');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen des Pflanzplatzes');
    } finally {
      setSaving(false);
    }
  };

  const filteredPflanzplaetze = pflanzplaetze.filter(
    (platz) =>
      platz.kennzahl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (platz.bereich && platz.bereich.toLowerCase().includes(searchTerm.toLowerCase())) ||
      platz.pflanzen.some(p => p.pflanze_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetFilters = () => {
    setFilterBereich('');
    setFilterPflanzort('');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🌿 Glashaus
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Tropfbewässerungs-Management
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 bg-gray-600 text-white font-medium px-4 py-2 rounded-lg">
              🏠 Übersicht
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/pflanzenkatalog"
              className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              🌱 Pflanzenkatalog
            </Link>
            <Link
              href="/bepflanzung"
              className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              🌻 Bepflanzung
            </Link>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ⚙️ Setup
            </Link>
          </div>
        </nav>

        {/* Filter & Suche */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Suchfeld */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Suchen (Kennzahl, Bereich, Pflanze)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filter Bereich */}
            <div>
              <select
                value={filterBereich}
                onChange={(e) => setFilterBereich(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle Bereiche</option>
                {filterOptionen.bereiche.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Filter Pflanzort */}
            <div>
              <select
                value={filterPflanzort}
                onChange={(e) => setFilterPflanzort(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle Pflanzorte</option>
                {filterOptionen.pflanzorte.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter zurücksetzen */}
          {(filterBereich || filterPflanzort || searchTerm) && (
            <div className="mt-3">
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Neuen Pflanzplatz hinzufügen */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Neuen Pflanzplatz hinzufügen
          </button>
        </div>

        {/* Statistik */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredPflanzplaetze.length} Pflanzplätze
          {filteredPflanzplaetze.length !== pflanzplaetze.length && ` (von ${pflanzplaetze.length})`}
        </div>

        {/* Pflanzplätze Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Pflanzplätze...</p>
          </div>
        ) : filteredPflanzplaetze.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {pflanzplaetze.length === 0
                ? 'Noch keine Pflanzplätze vorhanden. Erstellen Sie den ersten!'
                : 'Keine Pflanzplätze gefunden'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPflanzplaetze.map((platz) => (
              <Link
                key={platz.id}
                href={`/pflanzplatz/${platz.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow p-4 flex flex-col"
              >
                {/* Kennzahl */}
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {platz.kennzahl}
                </div>

                {/* Bereich & Pflanzort */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {[platz.bereich, platz.pflanzort].filter(Boolean).join(' · ') || 'Kein Bereich'}
                </div>

                {/* Bepflanzung */}
                {platz.pflanzen.length > 0 ? (
                  <div className="flex-1 mb-2">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {platz.pflanzen.slice(0, 2).map((p, i) => (
                        <div key={p.id} className="truncate">
                          <span className="text-green-600 dark:text-green-400 font-medium">{p.anzahl}×</span>{' '}
                          {p.pflanze_name}
                        </div>
                      ))}
                      {platz.pflanzen.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{platz.pflanzen.length - 2} weitere
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 mb-2 text-sm text-gray-400 italic">
                    Keine Pflanzen
                  </div>
                )}

                {/* Blumat-Anzahl */}
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                  💧 {platz.tropfer_anzahl || 0} {(platz.tropfer_anzahl || 0) === 1 ? 'Blumat' : 'Blumaten'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Neuen Pflanzplatz hinzufügen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Neuen Pflanzplatz erstellen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kennzahl *
                </label>
                <input
                  type="text"
                  value={newKennzahl}
                  onChange={(e) => setNewKennzahl(e.target.value)}
                  placeholder="z.B. GH-01-A"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bereich
                </label>
                <input
                  type="text"
                  value={newBereich}
                  onChange={(e) => setNewBereich(e.target.value)}
                  placeholder="z.B. Glashaus, Garten"
                  list="bereiche-list"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <datalist id="bereiche-list">
                  {filterOptionen.bereiche.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lage
                </label>
                <input
                  type="text"
                  value={newLage}
                  onChange={(e) => setNewLage(e.target.value)}
                  placeholder="z.B. Nord, Süd, Mitte"
                  list="lagen-list"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <datalist id="lagen-list">
                  {filterOptionen.lagen.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pflanzort
                </label>
                <input
                  type="text"
                  value={newPflanzort}
                  onChange={(e) => setNewPflanzort(e.target.value)}
                  placeholder="z.B. Wanne, Hochbeet, Boden"
                  list="pflanzorte-list"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <datalist id="pflanzorte-list">
                  {filterOptionen.pflanzorte.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddPflanzplatz}
                disabled={saving || !newKennzahl.trim()}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Erstelle...' : 'Erstellen'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewKennzahl('');
                  setNewBereich('');
                  setNewLage('');
                  setNewPflanzort('');
                }}
                disabled={saving}
                className="px-4 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
