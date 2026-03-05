'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Wanne {
  id: number;
  nummer: number;
  name: string;
  beschreibung: string | null;
}

export default function MassenbearbeitungPage() {
  const [wannen, setWannen] = useState<Wanne[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWannen();
  }, []);

  const loadWannen = async () => {
    try {
      const response = await fetch('/api/wannen');
      const data = await response.json();
      setWannen(data);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Wannen:', error);
      setErrorMessage('Fehler beim Laden der Wannen');
      setLoading(false);
    }
  };

  const handleNameChange = (id: number, name: string) => {
    setWannen(wannen.map(w => w.id === id ? { ...w, name } : w));
  };

  const handleBeschreibungChange = (id: number, beschreibung: string) => {
    setWannen(wannen.map(w => w.id === id ? { ...w, beschreibung } : w));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Speichere alle Wannen parallel
      const promises = wannen.map(wanne =>
        fetch(`/api/wannen/${wanne.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: wanne.name,
            beschreibung: wanne.beschreibung || null,
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.ok);

      if (allSuccess) {
        setSuccessMessage(`✅ Alle ${wannen.length} Wannen erfolgreich gespeichert!`);
        await loadWannen();
      } else {
        setErrorMessage('Einige Wannen konnten nicht gespeichert werden');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setErrorMessage('Fehler beim Speichern der Wannen');
    } finally {
      setSaving(false);
    }
  };

  const filteredWannen = wannen.filter(
    (wanne) =>
      wanne.nummer.toString().includes(searchTerm) ||
      wanne.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wanne.beschreibung?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Lade Wannen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📝 Massenbearbeitung</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Alle Wannen auf einmal bearbeiten
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/setup"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Zurück
              </Link>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
              >
                {saving ? 'Speichere...' : '💾 Alle speichern'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            ❌ {errorMessage}
          </div>
        )}

        {/* Suchfeld */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Suchen nach Nummer, Name oder Beschreibung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {filteredWannen.length} von {wannen.length} Wannen angezeigt
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Tipps:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc ml-5">
            <li><strong>Name</strong>: Hauptbezeichnung der Wanne (z.B. "Tomaten", "Salat")</li>
            <li><strong>Beschreibung</strong>: Zusatzinfo wie Standort (z.B. "1UM", "Sorte Roma")</li>
            <li>Änderungen werden erst beim Klick auf "💾 Alle speichern" übernommen</li>
            <li>Leere Felder werden als Standard-Werte gespeichert</li>
          </ul>
        </div>

        {/* Wannen-Tabelle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                    Nr.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Beschreibung
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWannen.map((wanne) => (
                  <tr key={wanne.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {wanne.nummer}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={wanne.name}
                        onChange={(e) => handleNameChange(wanne.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={`Wanne ${wanne.nummer}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={wanne.beschreibung || ''}
                        onChange={(e) => handleBeschreibungChange(wanne.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="z.B. 1UM, Sorte Roma, Hochbeet A..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sticky Footer mit Speichern-Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {filteredWannen.length} Wannen bearbeitet
            </p>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg transition-colors font-semibold text-lg shadow-lg"
            >
              {saving ? '⏳ Speichere...' : '💾 Alle speichern'}
            </button>
          </div>
        </div>

        {/* Spacer für Sticky Footer */}
        <div className="h-24"></div>
      </main>
    </div>
  );
}
