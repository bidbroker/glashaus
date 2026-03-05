'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Blumat {
  id: number;
  position: number;
  aktueller_stand: number;
}

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
  tropfer: Blumat[];
  pflanzen: Pflanze[];
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

interface KatalogPflanze {
  id: number;
  name: string;
  gruppe: string;
}

export default function PflanzplatzPage({ params }: { params: Promise<{ id: string }> }) {
  const [pflanzplatz, setPflanzplatz] = useState<Pflanzplatz | null>(null);
  const [aenderungen, setAenderungen] = useState<Aenderung[]>([]);
  const [katalog, setKatalog] = useState<KatalogPflanze[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlumat, setSelectedBlumat] = useState<number | null>(null);
  const [platzId, setPlatzId] = useState<string | null>(null);
  const [notiz, setNotiz] = useState('');
  const [showNotiz, setShowNotiz] = useState(false);
  const [pendingAenderung, setPendingAenderung] = useState<{ blumatId: number; aenderung: number } | null>(null);

  // Bearbeiten State
  const [isEditing, setIsEditing] = useState(false);
  const [editKennzahl, setEditKennzahl] = useState('');
  const [editBereich, setEditBereich] = useState('');
  const [editLage, setEditLage] = useState('');
  const [editPflanzort, setEditPflanzort] = useState('');
  const [editGefaess, setEditGefaess] = useState('');

  // Pflanze hinzufügen Modal
  const [showAddPflanzeModal, setShowAddPflanzeModal] = useState(false);
  const [newPflanzeId, setNewPflanzeId] = useState<number | ''>('');
  const [newAnzahl, setNewAnzahl] = useState(1);
  const [newPflanzeNotiz, setNewPflanzeNotiz] = useState('');
  const [pflanzeSearchTerm, setPflanzeSearchTerm] = useState('');

  useEffect(() => {
    params.then(p => setPlatzId(p.id));
  }, [params]);

  useEffect(() => {
    if (platzId) {
      loadPflanzplatz();
      loadKatalog();
    }
  }, [platzId]);

  const loadPflanzplatz = async () => {
    if (!platzId) return;

    try {
      const response = await fetch(`/api/pflanzplaetze/${platzId}`);
      const data = await response.json();
      setPflanzplatz(data);
      setEditKennzahl(data.kennzahl);
      setEditBereich(data.bereich || '');
      setEditLage(data.lage || '');
      setEditPflanzort(data.pflanzort || '');
      setEditGefaess(data.gefaess || '');

      // Lade Historie
      if (data.tropfer?.length > 0) {
        await loadAenderungen(data.tropfer.map((t: Blumat) => t.id));
      }
    } catch (error) {
      console.error('Fehler beim Laden des Pflanzplatzes:', error);
    } finally {
      setLoading(false);
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

  const loadAenderungen = async (tropferIds: number[]) => {
    if (tropferIds.length === 0) return;

    try {
      const promises = tropferIds.map(id =>
        fetch(`/api/aenderungen?tropferId=${id}&limit=10`).then(r => r.json())
      );

      const results = await Promise.all(promises);
      const allAenderungen = results.flat();

      const sortedAenderungen = allAenderungen
        .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
        .slice(0, 10);

      setAenderungen(sortedAenderungen);
    } catch (error) {
      console.error('Fehler beim Laden der Änderungen:', error);
    }
  };

  const handleSave = async () => {
    if (!pflanzplatz) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/pflanzplaetze/${pflanzplatz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennzahl: editKennzahl,
          bereich: editBereich,
          lage: editLage,
          pflanzort: editPflanzort,
          gefaess: editGefaess,
        }),
      });

      if (response.ok) {
        await loadPflanzplatz();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleAenderungClick = (blumatId: number, aenderung: number) => {
    setPendingAenderung({ blumatId, aenderung });
    setShowNotiz(true);
  };

  const handleAenderung = async () => {
    if (!pendingAenderung) return;

    const { blumatId, aenderung } = pendingAenderung;

    setSaving(true);
    try {
      const response = await fetch('/api/aenderungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tropferId: blumatId,
          aenderung,
          notiz: notiz.trim() || null
        }),
      });

      if (response.ok) {
        await loadPflanzplatz();
        setSelectedBlumat(null);
        setShowNotiz(false);
        setNotiz('');
        setPendingAenderung(null);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Änderung');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlumat = async () => {
    if (!pflanzplatz) return;

    setSaving(true);
    try {
      const response = await fetch('/api/tropfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pflanzplatzId: pflanzplatz.id }),
      });

      if (response.ok) {
        await loadPflanzplatz();
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Blumats:', error);
      alert('Fehler beim Hinzufügen des Blumats');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlumat = async (blumatId: number) => {
    if (!confirm('Möchtest du diesen Blumat wirklich löschen?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/tropfer/${blumatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPflanzplatz();
      } else {
        const data = await response.json();
        alert(data.error || 'Fehler beim Löschen des Blumats');
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Blumats:', error);
      alert('Fehler beim Löschen des Blumats');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPflanze = async () => {
    if (!pflanzplatz || !newPflanzeId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/bepflanzung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pflanzplatz_id: pflanzplatz.id,
          pflanze_id: newPflanzeId,
          anzahl: newAnzahl,
          notiz: newPflanzeNotiz,
        }),
      });

      if (res.ok) {
        setShowAddPflanzeModal(false);
        setNewPflanzeId('');
        setNewAnzahl(1);
        setNewPflanzeNotiz('');
        setPflanzeSearchTerm('');
        await loadPflanzplatz();
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error);
      alert('Fehler beim Hinzufügen der Pflanze');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePflanze = async (bepflanzungId: number) => {
    if (!confirm('Pflanze wirklich entfernen?')) return;

    try {
      const res = await fetch(`/api/bepflanzung/${bepflanzungId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadPflanzplatz();
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Entfernen der Pflanze');
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

  if (loading || !pflanzplatz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Pflanzplatz...</p>
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
            {!isEditing ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pflanzplatz.kennzahl}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {[pflanzplatz.bereich, pflanzplatz.lage, pflanzplatz.pflanzort].filter(Boolean).join(' · ') || 'Keine Details'}
                  </p>
                  {pflanzplatz.gefaess && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                      {pflanzplatz.gefaess}
                    </span>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    ✏️ Bearbeiten
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editKennzahl}
                  onChange={(e) => setEditKennzahl(e.target.value)}
                  placeholder="Kennzahl"
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editBereich}
                    onChange={(e) => setEditBereich(e.target.value)}
                    placeholder="Bereich"
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                  />
                  <input
                    type="text"
                    value={editLage}
                    onChange={(e) => setEditLage(e.target.value)}
                    placeholder="Lage"
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                  />
                  <input
                    type="text"
                    value={editPflanzort}
                    onChange={(e) => setEditPflanzort(e.target.value)}
                    placeholder="Pflanzort"
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                  />
                  <input
                    type="text"
                    value={editGefaess}
                    onChange={(e) => setEditGefaess(e.target.value)}
                    placeholder="Gefäß"
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditKennzahl(pflanzplatz.kennzahl);
                      setEditBereich(pflanzplatz.bereich || '');
                      setEditLage(pflanzplatz.lage || '');
                      setEditPflanzort(pflanzplatz.pflanzort || '');
                      setEditGefaess(pflanzplatz.gefaess || '');
                    }}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
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

        {/* Bepflanzung Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🌱 Bepflanzung
            </h2>
            <button
              onClick={() => setShowAddPflanzeModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              + Pflanze hinzufügen
            </button>
          </div>

          {pflanzplatz.pflanzen.length > 0 ? (
            <div className="space-y-2">
              {pflanzplatz.pflanzen.map((pflanze) => (
                <div
                  key={pflanze.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-sm mr-2">
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
                    onClick={() => handleDeletePflanze(pflanze.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Entfernen"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              Keine Pflanzen zugeordnet
            </p>
          )}
        </div>

        {/* Blumaten Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              💧 {pflanzplatz.tropfer.length === 1 ? '1 Blumat' : `${pflanzplatz.tropfer.length} Blumaten`}
            </h2>
          </div>

          <button
            onClick={handleAddBlumat}
            disabled={saving}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <span className="text-xl">+</span> Neuen Blumat hinzufügen
          </button>

          {/* Blumat Cards */}
          <div className="space-y-4">
            {pflanzplatz.tropfer.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500 dark:text-gray-400">
                Noch keine Blumaten vorhanden. Fügen Sie den ersten hinzu!
              </div>
            ) : (
              pflanzplatz.tropfer.map((blumat) => (
                <div
                  key={blumat.id}
                  data-blumat={blumat.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Blumat {blumat.position}
                      </h3>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                        {blumat.aktueller_stand} <span className="text-lg text-gray-500">Teilstriche</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedBlumat(selectedBlumat === blumat.id ? null : blumat.id)
                        }
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        {selectedBlumat === blumat.id ? 'Schließen' : 'Anpassen'}
                      </button>
                      {pflanzplatz.tropfer.length > 1 && (
                        <button
                          onClick={() => handleDeleteBlumat(blumat.id)}
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
                  {selectedBlumat === blumat.id && (
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
                              onClick={() => handleAenderungClick(blumat.id, val)}
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
                              onClick={() => handleAenderungClick(blumat.id, -val)}
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
              ))
            )}
          </div>
        </div>

        {/* Historie */}
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

      {/* Pflanze hinzufügen Modal */}
      {showAddPflanzeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Pflanze hinzufügen
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
                </div>
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
                  value={newPflanzeNotiz}
                  onChange={(e) => setNewPflanzeNotiz(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddPflanzeModal(false);
                  setPflanzeSearchTerm('');
                  setNewPflanzeId('');
                }}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddPflanze}
                disabled={!newPflanzeId || saving}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Hinzufügen...' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
