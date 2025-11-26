'use client';

import { useState } from 'react';
import { X, Mic, History, Map } from 'lucide-react';
import RecordButton from './record-button';
import MapComponent from './map';
import HistoryPanel from './history-panel';
import { predictImage } from '@/services/api';

type SidebarTab = 'voice' | 'history' | 'maps' | 'api';

export default function FloatingSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('voice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
  };

  const handlePredict = async () => {
    if (!selectedFile) return;
    setIsPredicting(true);
    setApiError(null);
    setPredictions(null);
    try {
      const res = await predictImage(selectedFile);
      setPredictions(res);
    } catch (err: any) {
      setApiError(err?.message ?? 'Request failed');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700' : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
        }`}
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        )}
      </button>

      {/* Overlay with Blur Effect */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-black/30 dark:bg-black/30 z-30 transition-all duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sliding Sidebar */}
      <div
        className={`fixed right-0 top-0 h-screen w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden border-l border-gray-200 dark:border-gray-800 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between transition-colors shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Controls</h2>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-2 gap-2 transition-colors shrink-0">
          <button
            onClick={() => handleTabClick('voice')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'voice'
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <Mic size={20} />
            Voice
          </button>
          <button
            onClick={() => handleTabClick('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <History size={20} />
            History
          </button>
          <button
            onClick={() => handleTabClick('maps')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'maps'
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <Map size={20} />
            Maps
          </button>
          <button
            onClick={() => handleTabClick('api')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'api'
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            API
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          {activeTab === 'voice' && (
            <div>
              <RecordButton />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="overflow-y-auto flex-1">
              <HistoryPanel />
            </div>
          )}
          {activeTab === 'maps' && (
            <div className="flex-1 overflow-hidden">
              <MapComponent />
            </div>
          )}
          {activeTab === 'api' && (
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <button
                onClick={handlePredict}
                disabled={!selectedFile || isPredicting}
                className={`py-2 px-4 rounded-lg text-sm font-medium ${
                  isPredicting
                    ? 'bg-gray-400 dark:bg-gray-700 text-white'
                    : 'bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700'
                }`}
              >
                {isPredicting ? 'Predicting...' : 'Send to /predict'}
              </button>
              {apiError && (
                <div className="text-red-500 text-sm">{apiError}</div>
              )}
              {predictions && (
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs overflow-auto max-h-64 text-gray-800 dark:text-gray-100">
                  {JSON.stringify(predictions, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
