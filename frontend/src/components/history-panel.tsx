'use client';

import { useState, useEffect } from 'react';
import { Mic, MapPin, Download, Trash2, Play, Pause } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { VoiceRecording, GPSLog } from '@/lib/supabase';

interface VoiceRecordingItem extends VoiceRecording {
  type: 'voice';
}

interface GPSRecord extends GPSLog {
  type: 'gps';
  location?: string;
}

type HistoryItem = VoiceRecordingItem | GPSRecord;

export default function HistoryPanel() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'voice' | 'gps'>('all');
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecordingItem[]>([]);
  const [gpsRecordings, setGpsRecordings] = useState<GPSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch voice recordings from Supabase
  useEffect(() => {
    fetchVoiceRecordings();
    fetchGPSLogs();
  }, []);

  const fetchVoiceRecordings = async () => {
    try {
      setFetchError(null);
      const { data, error } = await supabase
        .from('voice_recordings')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        setFetchError(`Database error: ${error.message}`);
        return;
      }

      const recordings: VoiceRecordingItem[] = (data || []).map(rec => ({
        ...rec,
        type: 'voice' as const,
      }));

      setVoiceRecordings(recordings);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching voice recordings:', error);
      setFetchError(`Failed to fetch recordings: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchGPSLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('gps_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('GPS logs error:', error);
        return;
      }

      const logs: GPSRecord[] = (data || []).map(log => ({
        ...log,
        type: 'gps' as const,
        location: 'Unknown Location', // You can add reverse geocoding here
      }));

      setGpsRecordings(logs);
    } catch (error) {
      console.error('Error fetching GPS logs:', error);
    }
  };

  const handlePlayPause = (recording: VoiceRecordingItem) => {
    if (playingId === recording.id) {
      // Pause current
      audioElement?.pause();
      setPlayingId(null);
    } else {
      // Stop previous
      audioElement?.pause();
      
      // Play new
      const audio = new Audio(recording.file_url);
      audio.play();
      setAudioElement(audio);
      setPlayingId(recording.id);

      audio.onended = () => {
        setPlayingId(null);
      };
    }
  };

  const handleDelete = async (recording: VoiceRecordingItem) => {
    if (!confirm('Delete this recording?')) return;

    try {
      // Delete from storage
      const fileName = recording.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('voice-recordings')
          .remove([fileName]);
      }

      // Delete from database
      await supabase
        .from('voice_recordings')
        .delete()
        .eq('id', recording.id);

      // Refresh list
      fetchVoiceRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  const handleDownload = (recording: VoiceRecordingItem) => {
    const a = document.createElement('a');
    a.href = recording.file_url;
    a.download = recording.file_name || 'recording.webm';
    a.click();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 0) return 'Today, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Filter data based on active filter
  const allData: HistoryItem[] = [...voiceRecordings, ...gpsRecordings].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA;
  });

  const filteredData = activeFilter === 'all' 
    ? allData 
    : allData.filter(item => item.type === activeFilter);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-400">Loading recordings...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-red-400 text-center mb-4">
          <p className="font-bold mb-2">⚠️ Database Connection Error</p>
          <p className="text-sm text-gray-400">{fetchError}</p>
        </div>
        <div className="text-sm text-gray-500 text-center space-y-2">
          <p>Make sure you have:</p>
          <ul className="text-left list-disc list-inside space-y-1">
            <li>Created the tables in Supabase</li>
            <li>Disabled RLS or added policies</li>
            <li>Set correct credentials in .env.local</li>
          </ul>
        </div>
        <button
          onClick={() => {
            setFetchError(null);
            setLoading(true);
            fetchVoiceRecordings();
            fetchGPSLogs();
          }}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

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
          All ({allData.length})
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
          Voice ({voiceRecordings.length})
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
          GPS ({gpsRecordings.length})
        </button>
      </div>

      {/* History Items */}
      <div className="space-y-2 overflow-y-auto flex-1">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No recordings yet</p>
            <p className="text-xs mt-2">Start recording to see history</p>
          </div>
        ) : (
          filteredData.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="p-3 bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700 hover:bg-gray-750 dark:hover:bg-gray-700 hover:border-gray-600 dark:hover:border-gray-600 transition-all"
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
                  {item.type === 'voice' ? (
                    <>
                      <p className="font-medium text-gray-100 dark:text-gray-100 text-sm truncate">
                        {item.file_name || 'Voice Recording'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                        {formatDate(item.timestamp)}
                      </p>
                      <p className="text-xs text-blue-400 dark:text-blue-400 mt-1">
                        Duration: {formatDuration(item.duration)}
                      </p>
                      
                      {/* Voice Controls */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handlePlayPause(item as VoiceRecordingItem)}
                          className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs flex items-center gap-1"
                        >
                          {playingId === item.id ? (
                            <>
                              <Pause size={14} /> Pause
                            </>
                          ) : (
                            <>
                              <Play size={14} /> Play
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(item as VoiceRecordingItem)}
                          className="p-1.5 bg-gray-600 hover:bg-gray-700 rounded text-white text-xs flex items-center gap-1"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button
                          onClick={() => handleDelete(item as VoiceRecordingItem)}
                          className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-xs flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </>
                  ) : item.type === 'gps' ? (
                    <>
                      <p className="font-medium text-gray-100 dark:text-gray-100 text-sm">
                        {item.location || 'GPS Log'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                        {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E
                      </p>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-400 dark:text-gray-400">
                          {formatDate(item.timestamp)}
                        </p>
                        {item.accuracy && (
                          <p className="text-xs text-green-400">
                            Accuracy: {item.accuracy.toFixed(0)}m
                          </p>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Refresh Button */}
      <button 
        onClick={() => {
          fetchVoiceRecordings();
          fetchGPSLogs();
        }}
        className="w-full mt-4 py-2 bg-blue-600 dark:bg-blue-600 text-white dark:text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors font-medium text-sm shrink-0"
      >
        Refresh Data
      </button>
    </div>
  );
}
