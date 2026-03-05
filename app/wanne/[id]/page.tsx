'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tropfer {
  id: number;
  position: number;
  aktueller_stand: number;
}

interface Wanne {
  id: number;
  nummer: number;
  name: string;
  beschreibung: string | null;
  tropfer: Tropfer[];
}

interface Aenderung {
  id: number;
  tropfer_id: number;
  datum: string;
  aenderung: number;
  vorher: number;
  nachher: number;
  notiz: string | null;
  position: number;
}

export default function WannePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [wanne, setWanne] = useState<Wanne | null>(null);
  const [aenderungen, setAenderungen] = useState<Aenderung[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTropfer, setSelectedTropfer] = useState<number | null>(null);
  const [wanneId, setWanneId] = useState<string | null>(null);
  const [notiz, setNotiz] = useState('');
  const [showNotiz, setShowNotiz] = useState(false);
  const [pendingAenderung, setPendingAenderung] = useState<{ tropferId: number; aenderung: number } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');

  useEffect(() => {
    params.then(p => setWanneId(p.id));
  }, [params]);

  useEffect(() => {
    if (wanneId) {
      loadWanne();
    }
  }, [wanneId]);

  const loadWanne = async () => {
    if (!wanneId) return;

    try {
      const response = await fetch(`/api/wannen/${wanneId}`);
      const data = await response.json();
      setWanne(data);
      setEditName(data.name);
      setEditBeschreibung(data.beschreibung || '');

      // Lade Historie dieser Wanne
      await loadAenderungen(data.tropfer.map((t: Tropfer) => t.id));
    } catch (error) {
      console.error('Fehler beim Laden der Wanne:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAenderungen = async (tropferIds: number[]) => {
    if (tropferIds.length === 0) return;

    try {
      // Lade die letzten 10 Änderungen für alle Tropfer dieser Wanne
      const promises = tropferIds.map(id =>
        fetch(`/api/aenderungen?tropferId=${id}&limit=10`).then(r => r.json())
      );

      const results = await Promise.all(promises);
      const allAenderungen = results.flat();

      // Sortiere nach Datum (neueste zuerst) und nehme die letzten 10
      const sortedAenderungen = allAenderungen
        .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
        .slice(0, 10);

      setAenderungen(sortedAenderungen);
    } catch (error) {
      console.error('Fehler beim Laden der Änderungen:', error);
    }
  };

  const handleSaveName = async () => {
    if (!wanne) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/wannen/${wanne.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          beschreibung: editBeschreibung || null,
        }),
      });

      if (response.ok) {
        await loadWanne();
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Namens');
    } finally {
      setSaving(false);
    }
  };

  const handleAenderungClick = (tropferId: number, aenderung: number) => {
    setPendingAenderung({ tropferId, aenderung });
    setShowNotiz(true);
  };

  const handleAenderung = async (skipNotiz = false) => {
    if (!pendingAenderung) return;

    const { tropferId, aenderung } = pendingAenderung;

    setSaving(true);
    try {
      const response = await fetch('/api/aenderungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tropferId,
          aenderung,
          notiz: notiz.trim() || null
        }),
      });

      if (response.ok) {
        await loadWanne();
        setSelectedTropfer(null);
        setShowNotiz(false);
        setNotiz('');
        setPendingAenderung(null);

        // Erfolgs-Feedback
        const button = document.querySelector(`[data-tropfer="${tropferId}"]`);
        if (button) {
          button.classList.add('animate-pulse');
          setTimeout(() => button.classList.remove('animate-pulse'), 500);
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Änderung');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTropfer = async () => {
    if (!wanne) return;

    setSaving(true);
    try {
      const response = await fetch('/api/tropfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wanneId: wanne.id }),
      });

      if (response.ok) {
        await loadWanne();
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Tropfers:', error);
      alert('Fehler beim Hinzufügen des Tropfers');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTropfer = async (tropferId: number) => {
    if (!confirm('Möchtest du diesen Tropfer wirklich löschen?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/tropfer/${tropferId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadWanne();
      } else {
        const data = await response.json();
        alert(data.error || 'Fehler beim Löschen des Tropfers');
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Tropfers:', error);
      alert('Fehler beim Löschen des Tropfers');
    } finally {
      setSaving(false);
    }
  };

  const formatDatum = (datum: string) => {
    const date = new Date(datum);
    const now = new Date();
    const heute = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const gestern = new Date(heute);
    gestern.setDate(gestern.getDate() - 1);
    const changeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    if (changeDate.getTime() === heute.getTime()) {
      return `Heute, ${timeStr}`;
    } else if (changeDate.getTime() === gestern.getTime()) {
      return `Gestern, ${timeStr}`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (loading || !wanne) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Wanne...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ← Zurück
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Wanne {wanne.nummer}
            </h1>
            {!isEditingName ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">{wanne.name}</p>
                {wanne.beschreibung && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">• {wanne.beschreibung}</span>
                )}
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  ✏️ Bearbeiten
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name der Wanne"
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={editBeschreibung}
                  onChange={(e) => setEditBeschreibung(e.target.value)}
                  placeholder="Beschreibung (optional)"
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded transition-colors"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(wanne.name);
                      setEditBeschreibung(wanne.beschreibung || '');
                    }}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
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

        {/* Blumat hinzufügen Button */}
        <div className="mb-6">
          <button
            onClick={handleAddTropfer}
            disabled={saving}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Neuen Blumat hinzufügen
          </button>
        </div>

        {/* Blumat Cards */}
        <div className="space-y-4">
          {wanne.tropfer.map((tropfer) => (
            <div
              key={tropfer.id}
              data-blumat={tropfer.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Blumat {tropfer.position}
                  </h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {tropfer.aktueller_stand} <span className="text-lg text-gray-500">Teilstriche</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setSelectedTropfer(selectedTropfer === tropfer.id ? null : tropfer.id)
                    }
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    {selectedTropfer === tropfer.id ? 'Schließen' : 'Anpassen'}
                  </button>
                  {wanne.tropfer.length > 1 && (
                    <button
                      onClick={() => handleDeleteTropfer(tropfer.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      title="Blumat löschen"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Anpassungs-Buttons */}
              {selectedTropfer === tropfer.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Wie viele Teilstriche möchtest du ändern?
                  </p>

                  {/* Erhöhen */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Erhöhen
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((val) => (
                        <button
                          key={`plus-${val}`}
                          onClick={() => handleAenderungClick(tropfer.id, val)}
                          disabled={saving}
                          className="px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reduzieren */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Reduzieren
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((val) => (
                        <button
                          key={`minus-${val}`}
                          onClick={() => handleAenderungClick(tropfer.id, -val)}
                          disabled={saving}
                          className="px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
                        >
                          -{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Historie dieser Wanne */}
        {aenderungen.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              📜 Letzte Änderungen
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Blumat
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Änderung
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Stand
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Notiz
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {aenderungen.map((aenderung) => (
                      <tr key={aenderung.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDatum(aenderung.datum)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          Blumat {aenderung.position}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              aenderung.aenderung > 0
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {aenderung.aenderung > 0 ? '+' : ''}
                            {aenderung.aenderung}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {aenderung.vorher} → {aenderung.nachher}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 italic">
                          {aenderung.notiz ? `"${aenderung.notiz}"` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notiz Modal */}
      {showNotiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notiz hinzufügen (optional)
            </h3>
            <textarea
              value={notiz}
              onChange={(e) => setNotiz(e.target.value)}
              placeholder="z.B. Pflanze sieht trocken aus..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleAenderung()}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Speichere...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setShowNotiz(false);
                  setNotiz('');
                  setPendingAenderung(null);
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
