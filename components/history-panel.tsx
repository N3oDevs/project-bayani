'use client';

import { useState } from 'react';
import { Mic, MapPin } from 'lucide-react';

interface VoiceRecording {
  id: number;
  name: string;
  duration: string;
  date: string;
  type: 'voice';
}

interface GPSRecord {
  id: number;
  location: string;
  coordinates: string;
  date: string;
  type: 'gps';
  accuracy: string;
}

type HistoryItem = VoiceRecording | GPSRecord;

export default function HistoryPanel() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'voice' | 'gps'>('all');

  // Mock voice recording data
  const voiceRecordings: VoiceRecording[] = [
    { id: 1, name: 'Voice Recording 1', duration: '5:23', date: 'Today, 2:45 PM', type: 'voice' },
    { id: 2, name: 'Voice Recording 2', duration: '3:15', date: 'Today, 1:30 PM', type: 'voice' },
    { id: 3, name: 'Voice Recording 3', duration: '7:42', date: 'Yesterday, 4:20 PM', type: 'voice' },
    { id: 4, name: 'Voice Recording 4', duration: '2:10', date: 'Yesterday, 10:15 AM', type: 'voice' },
    { id: 5, name: 'Voice Recording 5', duration: '6:35', date: '2 days ago', type: 'voice' },
  ];

  // Mock GPS data
  const gpsRecordings: GPSRecord[] = [
    { id: 101, location: 'Manila, Philippines', coordinates: '14.59°N, 120.98°E', date: 'Today, 3:00 PM', type: 'gps', accuracy: '5m' },
    { id: 102, location: 'Quezon City', coordinates: '14.63°N, 121.04°E', date: 'Today, 2:15 PM', type: 'gps', accuracy: '8m' },
    { id: 103, location: 'Makati City', coordinates: '14.55°N, 121.02°E', date: 'Today, 1:45 PM', type: 'gps', accuracy: '3m' },
    { id: 104, location: 'Pasay City', coordinates: '14.55°N, 120.99°E', date: 'Yesterday, 5:30 PM', type: 'gps', accuracy: '6m' },
    { id: 105, location: 'Taguig City', coordinates: '14.55°N, 121.05°E', date: 'Yesterday, 4:00 PM', type: 'gps', accuracy: '4m' },
  ];

  // Filter data based on active filter
  const allData: HistoryItem[] = [...voiceRecordings, ...gpsRecordings].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const filteredData = activeFilter === 'all' 
    ? allData 
    : allData.filter(item => item.type === activeFilter);

  return (
    <div className="flex flex-col h-full">
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 shrink-0">
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-blue-600 dark:bg-blue-600 text-white'
              : 'bg-gray-700 dark:bg-gray-700 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('voice')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeFilter === 'voice'
              ? 'bg-blue-600 dark:bg-blue-600 text-white'
              : 'bg-gray-700 dark:bg-gray-700 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-600'
          }`}
        >
          <Mic size={16} />
          Voice
        </button>
        <button
          onClick={() => setActiveFilter('gps')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeFilter === 'gps'
              ? 'bg-blue-600 dark:bg-blue-600 text-white'
              : 'bg-gray-700 dark:bg-gray-700 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-600'
          }`}
        >
          <MapPin size={16} />
          GPS
        </button>
      </div>

      {/* History Items */}
      <div className="space-y-2 overflow-y-auto flex-1">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700 hover:bg-gray-750 dark:hover:bg-gray-700 hover:border-gray-600 dark:hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="pt-1 shrink-0">
                {item.type === 'voice' ? (
                  <Mic size={18} className="text-blue-400" />
                ) : (
                  <MapPin size={18} className="text-green-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {item.type === 'voice' && 'name' in item ? (
                  <>
                    <p className="font-medium text-gray-100 dark:text-gray-100 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{item.date}</p>
                    <p className="text-xs text-blue-400 dark:text-blue-400 mt-1">{item.duration}</p>
                  </>
                ) : item.type === 'gps' && 'location' in item ? (
                  <>
                    <p className="font-medium text-gray-100 dark:text-gray-100 text-sm">{item.location}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{item.coordinates}</p>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-400 dark:text-gray-400">{item.date}</p>
                      <p className="text-xs text-green-400">Accuracy: {item.accuracy}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <button className="w-full mt-4 py-2 bg-blue-600 dark:bg-blue-600 text-white dark:text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors font-medium text-sm shrink-0">
        Export All Data
      </button>
    </div>
  );
}
