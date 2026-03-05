'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Aenderung {
  id: number;
  tropfer_id: number;
  datum: string;
  aenderung: number;
  vorher: number;
  nachher: number;
  notiz: string | null;
  position: number;
  wanne_nummer: number;
  wanne_name: string;
}

interface WanneDetail {
  id: number;
  nummer: number;
  name: string;
  tropfer: Array<{
    id: number;
    position: number;
    aktueller_stand: number;
  }>;
}

export default function Dashboard() {
  const [aenderungen, setAenderungen] = useState<Aenderung[]>([]);
  const [wannen, setWannen] = useState<WanneDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'alle' | 'heute' | 'gestern'>('alle');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aenderungenRes, wannenRes] = await Promise.all([
        fetch('/api/aenderungen?limit=100'),
        fetch('/api/wannen'),
      ]);

      const aenderungenData = await aenderungenRes.json();
      const wannenData = await wannenRes.json();

      setAenderungen(aenderungenData);
      setWannen(wannenData);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAenderungen = () => {
    const now = new Date();
    const heute = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const gestern = new Date(heute);
    gestern.setDate(gestern.getDate() - 1);

    return aenderungen.filter((a) => {
      const datum = new Date(a.datum);
      if (filter === 'heute') {
        return datum >= heute;
      }
      if (filter === 'gestern') {
        return datum >= gestern && datum < heute;
      }
      return true;
    });
  };

  const formatDatum = (datum: string) => {
    const d = new Date(datum);
    const heute = new Date();
    const gestern = new Date(heute);
    gestern.setDate(gestern.getDate() - 1);

    if (d.toDateString() === heute.toDateString()) {
      return `Heute, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (d.toDateString() === gestern.toDateString()) {
      return `Gestern, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAenderungen = filterAenderungen();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📊 Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Übersicht aller Änderungen
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
              🏠 Übersicht
            </Link>
            <span className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg">
              📊 Dashboard
            </span>
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

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('alle')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'alle'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Alle ({aenderungen.length})
          </button>
          <button
            onClick={() => setFilter('heute')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'heute'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Heute
          </button>
          <button
            onClick={() => setFilter('gestern')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'gestern'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Gestern
          </button>
        </div>

        {/* Änderungen Liste */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Wanne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Blumat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Änderung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Notiz
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAenderungen.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Keine Änderungen gefunden
                  </td>
                </tr>
              ) : (
                filteredAenderungen.map((aenderung) => (
                  <tr key={aenderung.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDatum(aenderung.datum)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Wanne {aenderung.wanne_nummer}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {aenderung.wanne_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      Blumat {aenderung.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          aenderung.aenderung > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {aenderung.aenderung > 0 ? '+' : ''}
                        {aenderung.aenderung} Teilstriche
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {aenderung.vorher} → {aenderung.nachher}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                      {aenderung.notiz ? (
                        <span className="italic">"{aenderung.notiz}"</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
