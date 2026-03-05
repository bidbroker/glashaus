'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Pflanze {
  id: number;
  katalog_nr: number | null;
  name: string;
  vorkultur: string;
  keimtemperatur: string;
  keimdauer: string;
  saattiefe: string;
  aussetzen: string;
  direktsaat: string;
  abstand_pflanze: string;
  abstand_reihe: string;
  ernte_start: string;
  wuchs: string;
  samen_quelle: string;
  pflanzpartner: string;
  beipflanze: string;
  pflanzgegner: string;
  pflege: string;
  beschreibung: string;
  kommentar: string;
  gruppe: string;
}

type GroupByOption = 'keine' | 'gruppe' | 'vorkultur' | 'direktsaat';

interface FieldFilter {
  field: keyof Pflanze;
  label: string;
  value: string;
}

const filterableFields: { field: keyof Pflanze; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'gruppe', label: 'Gruppe' },
  { field: 'vorkultur', label: 'Vorkultur' },
  { field: 'direktsaat', label: 'Direktsaat' },
  { field: 'aussetzen', label: 'Aussetzen' },
  { field: 'keimtemperatur', label: 'Keimtemperatur' },
  { field: 'keimdauer', label: 'Keimdauer' },
  { field: 'saattiefe', label: 'Saattiefe' },
  { field: 'abstand_pflanze', label: 'Abstand Pflanze' },
  { field: 'abstand_reihe', label: 'Abstand Reihe' },
  { field: 'ernte_start', label: 'Ernte' },
  { field: 'wuchs', label: 'Wuchs' },
  { field: 'samen_quelle', label: 'Samenquelle' },
  { field: 'pflanzpartner', label: 'Pflanzpartner' },
  { field: 'beipflanze', label: 'Beipflanze' },
  { field: 'pflanzgegner', label: 'Pflanzgegner' },
  { field: 'pflege', label: 'Pflege' },
  { field: 'beschreibung', label: 'Beschreibung' },
  { field: 'kommentar', label: 'Kommentar' },
];

export default function PflanzenkatalogPage() {
  const [pflanzen, setPflanzen] = useState<Pflanze[]>([]);
  const [allPflanzen, setAllPflanzen] = useState<Pflanze[]>([]);
  const [gruppen, setGruppen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPflanze, setEditingPflanze] = useState<Pflanze | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByOption>('keine');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [fieldFilters, setFieldFilters] = useState<FieldFilter[]>([]);

  useEffect(() => {
    loadGruppen();
    loadAllPflanzen();
  }, []);

  // Filter anwenden wenn sich Suchterm oder Feldfilter ändern
  useEffect(() => {
    applyFilters();
  }, [searchTerm, fieldFilters, allPflanzen]);

  const loadGruppen = async () => {
    try {
      const response = await fetch('/api/pflanzenkatalog/gruppen');
      const data = await response.json();
      setGruppen(data);
    } catch (error) {
      console.error('Fehler beim Laden der Gruppen:', error);
    }
  };

  const loadAllPflanzen = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pflanzenkatalog');
      const data = await response.json();
      setAllPflanzen(data);
      setPflanzen(data);
    } catch (error) {
      console.error('Fehler beim Laden der Pflanzen:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allPflanzen];

    // Allgemeine Suche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.beschreibung?.toLowerCase().includes(term) ||
        p.pflanzpartner?.toLowerCase().includes(term) ||
        p.gruppe?.toLowerCase().includes(term)
      );
    }

    // Feldspezifische Filter
    fieldFilters.forEach(filter => {
      if (filter.value) {
        const term = filter.value.toLowerCase();
        filtered = filtered.filter(p => {
          const fieldValue = p[filter.field];
          if (fieldValue === null || fieldValue === undefined) return false;
          return String(fieldValue).toLowerCase().includes(term);
        });
      }
    });

    setPflanzen(filtered);
  };

  const addFieldFilter = () => {
    // Finde ein Feld das noch nicht gefiltert wird
    const usedFields = new Set(fieldFilters.map(f => f.field));
    const availableField = filterableFields.find(f => !usedFields.has(f.field));
    if (availableField) {
      setFieldFilters([...fieldFilters, { ...availableField, value: '' }]);
    }
  };

  const updateFieldFilter = (index: number, field: keyof Pflanze | null, value?: string) => {
    const newFilters = [...fieldFilters];
    if (field === null) {
      // Filter entfernen
      newFilters.splice(index, 1);
    } else if (value !== undefined) {
      // Wert aktualisieren
      newFilters[index].value = value;
    } else {
      // Feld wechseln
      const fieldInfo = filterableFields.find(f => f.field === field);
      if (fieldInfo) {
        newFilters[index] = { ...fieldInfo, value: newFilters[index].value };
      }
    }
    setFieldFilters(newFilters);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFieldFilters([]);
  };

  const getUniqueValues = (field: keyof Pflanze): string[] => {
    const values = new Set<string>();
    allPflanzen.forEach(p => {
      const val = p[field];
      if (val && typeof val === 'string' && val.trim()) {
        values.add(val);
      }
    });
    return Array.from(values).sort();
  };

  const activeFilterCount = fieldFilters.filter(f => f.value).length + (searchTerm ? 1 : 0);

  const savePflanze = async (pflanze: Partial<Pflanze>) => {
    try {
      if (pflanze.id) {
        await fetch(`/api/pflanzenkatalog/${pflanze.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pflanze),
        });
      } else {
        await fetch('/api/pflanzenkatalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pflanze),
        });
      }
      setEditingPflanze(null);
      setShowNewForm(false);
      loadAllPflanzen();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const deletePflanze = async (id: number) => {
    if (!confirm('Pflanze wirklich löschen?')) return;
    try {
      await fetch(`/api/pflanzenkatalog/${id}`, { method: 'DELETE' });
      loadAllPflanzen();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const gruppeColor = (gruppe: string) => {
    const colors: Record<string, string> = {
      'Frucht': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Blatt': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Kräuter': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'Hülse': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Wurzel': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Zwiebel': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Kohl': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Beeren': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    return colors[gruppe] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  // Hilfsfunktion zum Extrahieren des Start-Monats aus einem Datumsbereich
  const extractMonth = (dateStr: string): string => {
    if (!dateStr || dateStr === 'nein') return '';
    // Versuche den ersten Teil zu extrahieren (z.B. "15.03-15.04" -> "März")
    const match = dateStr.match(/(\d{1,2})\.(\d{1,2})/);
    if (match) {
      const month = parseInt(match[2]);
      const months = ['', 'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      return months[month] || '';
    }
    return dateStr;
  };

  // Gruppiere Pflanzen nach ausgewähltem Kriterium
  const getGroupedPflanzen = (): Map<string, Pflanze[]> => {
    const grouped = new Map<string, Pflanze[]>();

    if (groupBy === 'keine') {
      grouped.set('Alle Pflanzen', pflanzen);
      return grouped;
    }

    pflanzen.forEach(pflanze => {
      let key: string;

      switch (groupBy) {
        case 'gruppe':
          key = pflanze.gruppe || 'Ohne Gruppe';
          break;
        case 'vorkultur':
          key = extractMonth(pflanze.vorkultur) || 'Keine Vorkultur';
          break;
        case 'direktsaat':
          if (!pflanze.direktsaat || pflanze.direktsaat === 'nein') {
            key = 'Keine Direktsaat';
          } else {
            key = extractMonth(pflanze.direktsaat) || 'Direktsaat (ohne Datum)';
          }
          break;
        default:
          key = 'Sonstige';
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(pflanze);
    });

    // Sortiere die Gruppen
    const sortedGroups = new Map([...grouped.entries()].sort((a, b) => {
      // "Keine..." immer ans Ende
      if (a[0].startsWith('Keine') && !b[0].startsWith('Keine')) return 1;
      if (!a[0].startsWith('Keine') && b[0].startsWith('Keine')) return -1;
      if (a[0] === 'Ohne Gruppe') return 1;
      if (b[0] === 'Ohne Gruppe') return -1;

      // Bei Monaten nach Kalender sortieren
      if (groupBy === 'vorkultur' || groupBy === 'direktsaat') {
        const months = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
                        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        const indexA = months.indexOf(a[0]);
        const indexB = months.indexOf(b[0]);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
      }

      return a[0].localeCompare(b[0]);
    }));

    return sortedGroups;
  };

  const toggleGroupCollapse = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  const expandAllGroups = () => setCollapsedGroups(new Set());
  const collapseAllGroups = () => setCollapsedGroups(new Set(getGroupedPflanzen().keys()));

  const groupedPflanzen = getGroupedPflanzen();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🌱 Pflanzenkatalog
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {pflanzen.length} Pflanzen
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              🏠 Startseite
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              📊 Dashboard
            </Link>
            <span className="inline-flex items-center gap-2 bg-green-600 text-white font-medium px-4 py-2 rounded-lg">
              🌱 Pflanzenkatalog
            </span>
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

        {/* Schnellsuche und Aktionen */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Schnellsuche (Name, Beschreibung, Pflanzpartner, Gruppe)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
              showAdvancedFilter || activeFilterCount > 0
                ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
            <span>{showAdvancedFilter ? '▲' : '▼'}</span>
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            + Neue Pflanze
          </button>
        </div>

        {/* Erweiterter Filter */}
        {showAdvancedFilter && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Erweiterte Filter</h3>
              <div className="flex gap-2">
                {(activeFilterCount > 0) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                  >
                    Alle Filter löschen
                  </button>
                )}
                <button
                  onClick={addFieldFilter}
                  disabled={fieldFilters.length >= filterableFields.length}
                  className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Filter hinzufügen
                </button>
              </div>
            </div>

            {fieldFilters.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Klicke auf &quot;+ Filter hinzufügen&quot; um nach bestimmten Feldern zu filtern.
              </p>
            ) : (
              <div className="space-y-3">
                {fieldFilters.map((filter, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFieldFilter(index, e.target.value as keyof Pflanze)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm min-w-[160px]"
                    >
                      {filterableFields.map(f => (
                        <option
                          key={f.field}
                          value={f.field}
                          disabled={fieldFilters.some((ff, i) => i !== index && ff.field === f.field)}
                        >
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">enthält</span>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFieldFilter(index, filter.field, e.target.value)}
                        placeholder={`Nach ${filter.label} filtern...`}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                        list={`suggestions-${filter.field}`}
                      />
                      <datalist id={`suggestions-${filter.field}`}>
                        {getUniqueValues(filter.field).slice(0, 20).map(val => (
                          <option key={val} value={val} />
                        ))}
                      </datalist>
                    </div>
                    <button
                      onClick={() => updateFieldFilter(index, null)}
                      className="px-2 py-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Filter entfernen"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Aktive Filter als Tags */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Aktive Filter:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded dark:bg-blue-900 dark:text-blue-200">
                      Suche: &quot;{searchTerm}&quot;
                      <button onClick={() => setSearchTerm('')} className="hover:text-blue-600">✕</button>
                    </span>
                  )}
                  {fieldFilters.filter(f => f.value).map((filter, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded dark:bg-green-900 dark:text-green-200"
                    >
                      {filter.label}: &quot;{filter.value}&quot;
                      <button
                        onClick={() => updateFieldFilter(fieldFilters.indexOf(filter), filter.field, '')}
                        className="hover:text-green-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ergebnis-Info */}
        {activeFilterCount > 0 && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {pflanzen.length} von {allPflanzen.length} Pflanzen gefunden
          </div>
        )}

        {/* Gruppierung */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gruppieren nach:</span>
            <select
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value as GroupByOption);
                setCollapsedGroups(new Set());
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="keine">Keine Gruppierung</option>
              <option value="gruppe">Pflanzengruppe</option>
              <option value="vorkultur">Vorkultur-Monat</option>
              <option value="direktsaat">Direktsaat-Monat</option>
            </select>
          </div>
          {groupBy !== 'keine' && (
            <div className="flex gap-2">
              <button
                onClick={expandAllGroups}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Alle aufklappen
              </button>
              <button
                onClick={collapseAllGroups}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Alle zuklappen
              </button>
            </div>
          )}
          {groupBy !== 'keine' && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {groupedPflanzen.size} Gruppen
            </span>
          )}
        </div>

        {/* Neue Pflanze Form */}
        {showNewForm && (
          <PflanzeForm
            pflanze={{} as Pflanze}
            gruppen={gruppen}
            onSave={savePflanze}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {/* Pflanzenliste */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Pflanzen...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedPflanzen.entries()).map(([groupName, groupPflanzen]) => (
              <div key={groupName} className="space-y-2">
                {/* Gruppen-Header (nur wenn gruppiert) */}
                {groupBy !== 'keine' && (
                  <div
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => toggleGroupCollapse(groupName)}
                  >
                    <span className="text-gray-400 text-lg">
                      {collapsedGroups.has(groupName) ? '▶' : '▼'}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {groupName}
                    </h2>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      groupBy === 'gruppe' ? gruppeColor(groupName) : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {groupPflanzen.length} {groupPflanzen.length === 1 ? 'Pflanze' : 'Pflanzen'}
                    </span>
                  </div>
                )}

                {/* Pflanzen in der Gruppe */}
                {!collapsedGroups.has(groupName) && (
                  <div className="space-y-2">
                    {groupPflanzen.map((pflanze) => (
                      <div
                        key={pflanze.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ml-0 sm:ml-4"
                      >
                        {editingPflanze?.id === pflanze.id ? (
                          <PflanzeForm
                            pflanze={pflanze}
                            gruppen={gruppen}
                            onSave={savePflanze}
                            onCancel={() => setEditingPflanze(null)}
                          />
                        ) : (
                          <>
                            {/* Kopfzeile */}
                            <div
                              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => setExpandedId(expandedId === pflanze.id ? null : pflanze.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                                    #{pflanze.katalog_nr}
                                  </span>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {pflanze.name}
                                  </h3>
                                  {groupBy !== 'gruppe' && (
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${gruppeColor(pflanze.gruppe)}`}>
                                      {pflanze.gruppe}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPflanze(pflanze);
                                    }}
                                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                                  >
                                    Bearbeiten
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePflanze(pflanze.id);
                                    }}
                                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                                  >
                                    Löschen
                                  </button>
                                  <span className="text-gray-400 ml-2">
                                    {expandedId === pflanze.id ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>
                              {/* Kurz-Info immer sichtbar */}
                              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                {pflanze.vorkultur && groupBy !== 'vorkultur' && (
                                  <span>Vorkultur: {pflanze.vorkultur}</span>
                                )}
                                {pflanze.direktsaat && pflanze.direktsaat !== 'nein' && groupBy !== 'direktsaat' && (
                                  <span>Direktsaat: {pflanze.direktsaat}</span>
                                )}
                                {pflanze.ernte_start && (
                                  <span>Ernte: {pflanze.ernte_start}</span>
                                )}
                              </div>
                            </div>

                            {/* Details (ausgeklappt) */}
                            {expandedId === pflanze.id && (
                              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                  <DetailSection title="Aussaat" items={[
                                    { label: 'Vorkultur', value: pflanze.vorkultur },
                                    { label: 'Direktsaat', value: pflanze.direktsaat },
                                    { label: 'Aussetzen', value: pflanze.aussetzen },
                                    { label: 'Keimtemperatur', value: pflanze.keimtemperatur ? `${pflanze.keimtemperatur}°C` : '' },
                                    { label: 'Keimdauer', value: pflanze.keimdauer ? `${pflanze.keimdauer} Tage` : '' },
                                    { label: 'Saattiefe', value: pflanze.saattiefe ? (pflanze.saattiefe === 'Licht' ? 'Lichtkeimer' : `${pflanze.saattiefe} cm`) : '' },
                                  ]} />
                                  <DetailSection title="Pflanzung" items={[
                                    { label: 'Abstand Pflanze', value: pflanze.abstand_pflanze ? `${pflanze.abstand_pflanze} cm` : '' },
                                    { label: 'Abstand Reihe', value: pflanze.abstand_reihe ? `${pflanze.abstand_reihe} cm` : '' },
                                    { label: 'Wuchs', value: pflanze.wuchs },
                                    { label: 'Ernte', value: pflanze.ernte_start },
                                  ]} />
                                  <DetailSection title="Mischkultur" items={[
                                    { label: 'Pflanzpartner', value: pflanze.pflanzpartner },
                                    { label: 'Beipflanze', value: pflanze.beipflanze },
                                    { label: 'Pflanzgegner', value: pflanze.pflanzgegner, highlight: true },
                                  ]} />
                                </div>
                                {(pflanze.pflege || pflanze.beschreibung) && (
                                  <div className="mt-4 space-y-4">
                                    {pflanze.pflege && (
                                      <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Pflege</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{pflanze.pflege}</p>
                                      </div>
                                    )}
                                    {pflanze.beschreibung && (
                                      <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Beschreibung</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{pflanze.beschreibung}</p>
                                      </div>
                                    )}
                                    {pflanze.kommentar && (
                                      <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Kommentar</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{pflanze.kommentar}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                  Samenquelle: {pflanze.samen_quelle || 'unbekannt'}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DetailSection({ title, items }: { title: string; items: { label: string; value: string; highlight?: boolean }[] }) {
  const filteredItems = items.filter(item => item.value);
  if (filteredItems.length === 0) return null;

  return (
    <div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{title}</h4>
      <dl className="space-y-1">
        {filteredItems.map((item, index) => (
          <div key={index} className="flex">
            <dt className="text-sm text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">{item.label}:</dt>
            <dd className={`text-sm ${item.highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PflanzeForm({
  pflanze,
  gruppen,
  onSave,
  onCancel,
}: {
  pflanze: Partial<Pflanze>;
  gruppen: string[];
  onSave: (pflanze: Partial<Pflanze>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Pflanze>>(pflanze);

  const handleChange = (field: keyof Pflanze, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Katalog-Nr.
          </label>
          <input
            type="number"
            value={formData.katalog_nr || ''}
            onChange={(e) => handleChange('katalog_nr', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gruppe
          </label>
          <select
            value={formData.gruppe || ''}
            onChange={(e) => handleChange('gruppe', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          >
            <option value="">-- Auswählen --</option>
            {gruppen.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
            <option value="Andere">Andere</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vorkultur
          </label>
          <input
            type="text"
            value={formData.vorkultur || ''}
            onChange={(e) => handleChange('vorkultur', e.target.value)}
            placeholder="z.B. 15.03-15.04"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Direktsaat
          </label>
          <input
            type="text"
            value={formData.direktsaat || ''}
            onChange={(e) => handleChange('direktsaat', e.target.value)}
            placeholder="z.B. 01.05.-30.06. oder nein"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Aussetzen
          </label>
          <input
            type="text"
            value={formData.aussetzen || ''}
            onChange={(e) => handleChange('aussetzen', e.target.value)}
            placeholder="z.B. 15.05-31.05."
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Keimtemperatur (°C)
          </label>
          <input
            type="text"
            value={formData.keimtemperatur || ''}
            onChange={(e) => handleChange('keimtemperatur', e.target.value)}
            placeholder="z.B. 20-25"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Keimdauer (Tage)
          </label>
          <input
            type="text"
            value={formData.keimdauer || ''}
            onChange={(e) => handleChange('keimdauer', e.target.value)}
            placeholder="z.B. 8-10"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Saattiefe
          </label>
          <input
            type="text"
            value={formData.saattiefe || ''}
            onChange={(e) => handleChange('saattiefe', e.target.value)}
            placeholder="z.B. 2 oder Licht"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Abstand Pflanze (cm)
          </label>
          <input
            type="text"
            value={formData.abstand_pflanze || ''}
            onChange={(e) => handleChange('abstand_pflanze', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Abstand Reihe (cm)
          </label>
          <input
            type="text"
            value={formData.abstand_reihe || ''}
            onChange={(e) => handleChange('abstand_reihe', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ernte Start
          </label>
          <input
            type="text"
            value={formData.ernte_start || ''}
            onChange={(e) => handleChange('ernte_start', e.target.value)}
            placeholder="z.B. Juli oder August"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Wuchs
          </label>
          <input
            type="text"
            value={formData.wuchs || ''}
            onChange={(e) => handleChange('wuchs', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Samenquelle
          </label>
          <input
            type="text"
            value={formData.samen_quelle || ''}
            onChange={(e) => handleChange('samen_quelle', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pflanzpartner
          </label>
          <textarea
            value={formData.pflanzpartner || ''}
            onChange={(e) => handleChange('pflanzpartner', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Beipflanze
          </label>
          <textarea
            value={formData.beipflanze || ''}
            onChange={(e) => handleChange('beipflanze', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pflanzgegner
          </label>
          <textarea
            value={formData.pflanzgegner || ''}
            onChange={(e) => handleChange('pflanzgegner', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pflege
          </label>
          <textarea
            value={formData.pflege || ''}
            onChange={(e) => handleChange('pflege', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Beschreibung
          </label>
          <textarea
            value={formData.beschreibung || ''}
            onChange={(e) => handleChange('beschreibung', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Kommentar
        </label>
        <textarea
          value={formData.kommentar || ''}
          onChange={(e) => handleChange('kommentar', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Speichern
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
