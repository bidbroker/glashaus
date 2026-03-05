'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SetupInfo {
  wannen: number;
  tropfer: number;
  aenderungen: number;
  durchschnitt_stand: number;
}

export default function SetupPage() {
  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [wannenAnzahl, setWannenAnzahl] = useState('40');
  const [tropferStartwert, setTropferStartwert] = useState('20');

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Confirmation dialogs
  const [showConfirmWannen, setShowConfirmWannen] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmDatabase, setShowConfirmDatabase] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const response = await fetch('/api/setup');
      const data = await response.json();
      setInfo(data);
      setWannenAnzahl(data.wannen.toString());
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Infos:', error);
      setErrorMessage('Fehler beim Laden der Informationen');
      setLoading(false);
    }
  };

  const executeAction = async (action: string, value?: number) => {
    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        await loadInfo();
      } else {
        setErrorMessage(data.error || 'Fehler bei der Ausführung');
      }
    } catch (error) {
      console.error('Fehler:', error);
      setErrorMessage('Fehler bei der Verbindung zur API');
    } finally {
      setActionLoading(false);
      setShowConfirmWannen(false);
      setShowConfirmReset(false);
      setShowConfirmDatabase(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Lade Setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Setup</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Systemeinstellungen verwalten
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
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
            <span className="inline-flex items-center gap-2 bg-gray-600 text-white font-medium px-4 py-2 rounded-lg">
              ⚙️ Setup
            </span>
          </div>
        </nav>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            ❌ {errorMessage}
          </div>
        )}

        {/* Aktuelle Statistiken */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Aktuelle Statistiken
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Wannen</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {info?.wannen}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Blumaten</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {info?.tropfer}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Änderungen</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {info?.aenderungen}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Ø Stand</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {info?.durchschnitt_stand}
              </p>
            </div>
          </div>
        </div>

        {/* Massenbearbeitung - NEU */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border-2 border-green-300 dark:border-green-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📝 Massenbearbeitung
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Bearbeite Namen und Beschreibungen aller Wannen auf einmal in einer übersichtlichen Tabelle.
          </p>
          <Link
            href="/setup/massenbearbeitung"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            📝 Alle Wannen bearbeiten
          </Link>
        </div>

        {/* Wannen-Anzahl ändern */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🗂️ Wannen-Anzahl ändern
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Ändere die Gesamtanzahl der Wannen. Bei Erhöhung werden neue Wannen mit je 1 Blumat
            (Stand: 0) erstellt. Bei Reduzierung werden die höchsten Nummern gelöscht.
          </p>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anzahl Wannen (1-200)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={wannenAnzahl}
                onChange={(e) => setWannenAnzahl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowConfirmWannen(true)}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Ändern
            </button>
          </div>
        </div>

        {/* Alle Blumaten zurücksetzen */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            💧 Alle Blumaten auf Startwert setzen
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Setze alle Blumaten auf einen einheitlichen Startwert. Die Historie bleibt erhalten.
          </p>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Startwert (0-100 Teilstriche)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={tropferStartwert}
                onChange={(e) => setTropferStartwert(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowConfirmReset(true)}
              disabled={actionLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        {/* Datenbank zurücksetzen */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-red-300">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            🗑️ Datenbank zurücksetzen
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            <strong>Achtung:</strong> Löscht alle Änderungen, setzt alle Blumaten auf 0 und
            benennt alle Wannen zurück. Die Wannen-Anzahl bleibt erhalten.
          </p>
          <button
            onClick={() => setShowConfirmDatabase(true)}
            disabled={actionLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Komplett zurücksetzen
          </button>
        </div>
      </main>

      {/* Confirmation Dialogs */}
      {showConfirmWannen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Wannen-Anzahl ändern?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Wannen-Anzahl von <strong>{info?.wannen}</strong> auf{' '}
              <strong>{wannenAnzahl}</strong> ändern?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmWannen(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => executeAction('set_wannen_anzahl', parseInt(wannenAnzahl))}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Wird geändert...' : 'Bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Alle Tropfer zurücksetzen?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Alle <strong>{info?.tropfer} Tropfer</strong> auf{' '}
              <strong>{tropferStartwert} Teilstriche</strong> setzen?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => executeAction('reset_all_tropfer', parseInt(tropferStartwert))}
                disabled={actionLoading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Wird zurückgesetzt...' : 'Bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDatabase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              ⚠️ Datenbank zurücksetzen?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Dies löscht:
              <ul className="list-disc ml-6 mt-2">
                <li>Alle {info?.aenderungen} Änderungen</li>
                <li>Alle Wannen-Namen und Beschreibungen</li>
                <li>Setzt alle Tropfer auf 0</li>
              </ul>
              <strong className="text-red-600 block mt-4">Diese Aktion kann nicht rückgängig gemacht werden!</strong>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDatabase(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => executeAction('reset_database')}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Wird zurückgesetzt...' : 'Zurücksetzen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
