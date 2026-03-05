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
  pflanzen: Pflanze[];
}

interface KatalogPflanze {
  id: number;
  katalog_nr: number;
  name: string;
  gruppe: string;
}

interface FilterOptionen {
  bereiche: string[];
  lagen: string[];
  lichtverhaeltnisse: string[];
  pflanzorte: string[];
  gefaesse: string[];
}

export default function BepflanzungPage() {
  const [pflanzplaetze, setPflanzplaetze] = useState<Pflanzplatz[]>([]);
  const [katalog, setKatalog] = useState<KatalogPflanze[]>([]);
  const [filterOptionen, setFilterOptionen] = useState<FilterOptionen>({
    bereiche: [],
    lagen: [],
    lichtverhaeltnisse: [],
    pflanzorte: [],
    gefaesse: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [filterBereich, setFilterBereich] = useState('');
  const [filterLage, setFilterLage] = useState('');
  const [filterLicht, setFilterLicht] = useState('');
  const [filterPflanzort, setFilterPflanzort] = useState('');

  // Gruppierung
  const [groupBy, setGroupBy] = useState<'keine' | 'bereich' | 'lage' | 'pflanzort'>('bereich');

  // Modal für neue Bepflanzung
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatz, setSelectedPlatz] = useState<Pflanzplatz | null>(null);
  const [newPflanzeId, setNewPflanzeId] = useState<number | ''>('');
  const [newAnzahl, setNewAnzahl] = useState(1);
  const [newNotiz, setNewNotiz] = useState('');
  const [pflanzeSearchTerm, setPflanzeSearchTerm] = useState('');

  // Expandierte Plätze - initial alle offen
  const [expandedPlaetze, setExpandedPlaetze] = useState<Set<number>>(new Set());
  const [initialExpanded, setInitialExpanded] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterBereich, filterLage, filterLicht, filterPflanzort]);

  useEffect(() => {
    loadFilterOptionen();
    loadKatalog();
  }, []);

  // Alle Kacheln initial öffnen wenn Daten geladen
  useEffect(() => {
    if (pflanzplaetze.length > 0 && !initialExpanded) {
      setExpandedPlaetze(new Set(pflanzplaetze.map(p => p.id)));
      setInitialExpanded(true);
    }
  }, [pflanzplaetze, initialExpanded]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterBereich) params.set('bereich', filterBereich);
      if (filterLage) params.set('lage', filterLage);
      if (filterLicht) params.set('licht', filterLicht);
      if (filterPflanzort) params.set('pflanzort', filterPflanzort);

      const res = await fetch(`/api/pflanzplaetze?${params}`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const data = await res.json();
      setPflanzplaetze(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
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

  const loadKatalog = async () => {
    try {
      const res = await fetch('/api/pflanzenkatalog');
      if (res.ok) {
        const data = await res.json();
        setKatalog(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden des Katalogs:', err);
    }
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedPlaetze);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPlaetze(newExpanded);
  };

  const expandAll = () => {
    setExpandedPlaetze(new Set(pflanzplaetze.map(p => p.id)));
  };

  const collapseAll = () => {
    setExpandedPlaetze(new Set());
  };

  const handleAddPflanze = async () => {
    if (!selectedPlatz || !newPflanzeId) return;

    try {
      const res = await fetch('/api/bepflanzung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pflanzplatz_id: selectedPlatz.id,
          pflanze_id: newPflanzeId,
          anzahl: newAnzahl,
          notiz: newNotiz,
        }),
      });

      if (!res.ok) throw new Error('Fehler beim Hinzufügen');

      setShowAddModal(false);
      setNewPflanzeId('');
      setNewAnzahl(1);
      setNewNotiz('');
      setSelectedPlatz(null);
      setPflanzeSearchTerm('');
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
    }
  };

  const handleDeleteBepflanzung = async (bepflanzungId: number) => {
    if (!confirm('Pflanze wirklich entfernen?')) return;

    try {
      const res = await fetch(`/api/bepflanzung/${bepflanzungId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Fehler beim Löschen');
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  const openAddModal = (platz: Pflanzplatz) => {
    setSelectedPlatz(platz);
    setShowAddModal(true);
  };

  const getGroupedPlaetze = (): Map<string, Pflanzplatz[]> => {
    const grouped = new Map<string, Pflanzplatz[]>();

    if (groupBy === 'keine') {
      grouped.set('Alle Pflanzplätze', pflanzplaetze);
      return grouped;
    }

    pflanzplaetze.forEach(platz => {
      const key = platz[groupBy] || 'Nicht zugeordnet';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(platz);
    });

    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  };

  const resetFilters = () => {
    setFilterBereich('');
    setFilterLage('');
    setFilterLicht('');
    setFilterPflanzort('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-red-600">Fehler: {error}</div>
      </div>
    );
  }

  const groupedPlaetze = getGroupedPlaetze();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              🏠 Übersicht
            </Link>
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
            <span className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg">
              🌻 Bepflanzung
            </span>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ⚙️ Setup
            </Link>
          </div>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bepflanzungsschema
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {pflanzplaetze.length} Pflanzplätze mit{' '}
                {pflanzplaetze.reduce((sum, p) => sum + p.pflanzen.length, 0)} Bepflanzungen
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                title="Alle aufklappen"
              >
                ⬇️ Alle öffnen
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                title="Alle zuklappen"
              >
                ⬆️ Alle schließen
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Gruppierung */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filter Bereich */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bereich
              </label>
              <select
                value={filterBereich}
                onChange={(e) => setFilterBereich(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle</option>
                {filterOptionen.bereiche.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Filter Lage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lage
              </label>
              <select
                value={filterLage}
                onChange={(e) => setFilterLage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle</option>
                {filterOptionen.lagen.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Filter Licht */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Licht
              </label>
              <select
                value={filterLicht}
                onChange={(e) => setFilterLicht(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle</option>
                {filterOptionen.lichtverhaeltnisse.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Filter Pflanzort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pflanzort
              </label>
              <select
                value={filterPflanzort}
                onChange={(e) => setFilterPflanzort(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle</option>
                {filterOptionen.pflanzorte.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Gruppierung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gruppieren nach
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="keine">Keine Gruppierung</option>
                <option value="bereich">Bereich</option>
                <option value="lage">Lage</option>
                <option value="pflanzort">Pflanzort</option>
              </select>
            </div>
          </div>

          {/* Filter zurücksetzen */}
          {(filterBereich || filterLage || filterLicht || filterPflanzort) && (
            <div className="mt-4">
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Pflanzplätze nach Gruppen */}
        {Array.from(groupedPlaetze.entries()).map(([groupName, plaetze]) => (
          <div key={groupName} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                {plaetze.length}
              </span>
              {groupName}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plaetze.map((platz) => (
                <div
                  key={platz.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  {/* Platz Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpanded(platz.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {platz.kennzahl}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {[platz.bereich, platz.lage, platz.licht].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                          {platz.pflanzen.length} Pflanzen
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            expandedPlaetze.has(platz.id) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Zusätzliche Infos */}
                    {(platz.gefaess || platz.pflanzhilfe) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {platz.gefaess && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            {platz.gefaess}
                          </span>
                        )}
                        {platz.pflanzhilfe && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                            {platz.pflanzhilfe}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expandierter Bereich */}
                  {expandedPlaetze.has(platz.id) && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      {/* Pflanzen Liste */}
                      {platz.pflanzen.length > 0 ? (
                        <ul className="space-y-2 mb-4">
                          {platz.pflanzen.map((pflanze) => (
                            <li
                              key={pflanze.id}
                              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                            >
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded text-sm mr-2">
                                    {pflanze.anzahl}×
                                  </span>
                                  {pflanze.pflanze_name}
                                </span>
                                {pflanze.pflanze_gruppe && (
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    ({pflanze.pflanze_gruppe})
                                  </span>
                                )}
                                {pflanze.notiz && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {pflanze.notiz}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBepflanzung(pflanze.id);
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                                title="Entfernen"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                          Keine Pflanzen zugeordnet
                        </p>
                      )}

                      {/* Pflanze hinzufügen Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddModal(platz);
                        }}
                        className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        + Pflanze hinzufügen
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {pflanzplaetze.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Keine Pflanzplätze gefunden
            </p>
          </div>
        )}
      </div>

      {/* Modal: Pflanze hinzufügen */}
      {showAddModal && selectedPlatz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Pflanze zu {selectedPlatz.kennzahl} hinzufügen
            </h3>

            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pflanze suchen
                </label>
                <input
                  type="text"
                  placeholder="Pflanzennamen eingeben..."
                  value={pflanzeSearchTerm}
                  onChange={(e) => {
                    setPflanzeSearchTerm(e.target.value);
                    setNewPflanzeId('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                />
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg max-h-48">
                  {katalog
                    .filter(p =>
                      pflanzeSearchTerm === '' ||
                      p.name.toLowerCase().includes(pflanzeSearchTerm.toLowerCase()) ||
                      (p.gruppe && p.gruppe.toLowerCase().includes(pflanzeSearchTerm.toLowerCase()))
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setNewPflanzeId(p.id);
                          setPflanzeSearchTerm(p.name);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          newPflanzeId === p.id
                            ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        <span className="font-medium">{p.name}</span>
                        {p.gruppe && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({p.gruppe})
                          </span>
                        )}
                      </button>
                    ))
                  }
                  {katalog.filter(p =>
                    pflanzeSearchTerm === '' ||
                    p.name.toLowerCase().includes(pflanzeSearchTerm.toLowerCase()) ||
                    (p.gruppe && p.gruppe.toLowerCase().includes(pflanzeSearchTerm.toLowerCase()))
                  ).length === 0 && (
                    <p className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                      Keine Pflanzen gefunden
                    </p>
                  )}
                </div>
                {newPflanzeId && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Ausgewählt: {katalog.find(p => p.id === newPflanzeId)?.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Anzahl
                </label>
                <input
                  type="number"
                  min="1"
                  value={newAnzahl}
                  onChange={(e) => setNewAnzahl(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notiz (optional)
                </label>
                <textarea
                  value={newNotiz}
                  onChange={(e) => setNewNotiz(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPlatz(null);
                  setPflanzeSearchTerm('');
                  setNewPflanzeId('');
                }}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddPflanze}
                disabled={!newPflanzeId}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
