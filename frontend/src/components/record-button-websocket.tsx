'use client';

import { useState } from 'react';
import { Mic, Square, Pause, Play, Trash2, Save, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useWebSocketVoiceRecorder } from '@/hooks/useWebSocketVoiceRecorder';
import { supabase } from '@/lib/supabase';

interface RecordButtonWebSocketProps {
  websocketUrl?: string;
}

export default function RecordButtonWebSocket({ websocketUrl }: RecordButtonWebSocketProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    error,
    isConnecting,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useWebSocketVoiceRecorder({
    wsUrl: websocketUrl || process.env.NEXT_PUBLIC_AUDIO_WS_URL || 'ws://localhost:8000/ws/audio',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setSaveSuccess(false);
    setSaveError(null);
    await startRecording();
  };

  const handleStop = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const recordingData = await stopRecording();
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `voice-recording-ws-${timestamp}.webm`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, recordingData.blob, {
          contentType: recordingData.blob.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('voice_recordings')
        .insert({
          file_url: urlData.publicUrl,
          file_name: fileName,
          duration: recordingData.duration,
          timestamp: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Clean up blob URL
      URL.revokeObjectURL(recordingData.url);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save recording';
      setSaveError(message);
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    setSaveSuccess(false);
    setSaveError(null);
  };

  return (
    <div className="w-full">
      <div className="bg-gray-900 dark:bg-gray-900 border border-gray-700 dark:border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
        
        {/* Connection Status Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 text-xs">
            {isConnecting ? (
              <>
                <WifiOff className="text-yellow-500 animate-pulse" size={16} />
                <span className="text-yellow-500">Connecting...</span>
              </>
            ) : (
              <>
                <Wifi className="text-green-500" size={16} />
                <span className="text-green-500">WebSocket Connected</span>
              </>
            )}
          </div>
        )}

        {/* Recording Time Display */}
        {isRecording && (
          <div className="mb-6 text-center">
            <div className="text-5xl font-mono font-bold text-white mb-2">
              {formatTime(recordingTime)}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {isPaused ? 'Paused' : 'Recording from WebSocket'}
            </div>
          </div>
        )}

        {/* Main Action Button */}
        {!isRecording ? (
          <button
            onClick={handleStart}
            disabled={isSaving || isConnecting}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving || isConnecting ? (
              <Loader2 size={40} className="text-white animate-spin" />
            ) : (
              <Mic size={40} className="text-white" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-4">
            {/* Pause/Resume Button */}
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              disabled={isConnecting}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-yellow-600 dark:bg-yellow-600 hover:bg-yellow-700 dark:hover:bg-yellow-700 disabled:opacity-50"
            >
              {isPaused ? (
                <Play size={28} className="text-white ml-1" />
              ) : (
                <Pause size={28} className="text-white" />
              )}
            </button>

            {/* Stop and Save Button */}
            <button
              onClick={handleStop}
              disabled={isSaving || isConnecting}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={36} className="text-white animate-spin" />
              ) : (
                <Save size={36} className="text-white" />
              )}
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={28} className="text-white" />
            </button>
          </div>
        )}

        {/* Status Message */}
        <div className="mt-6 text-center min-h-[60px]">
          {error && (
            <p className="text-red-400 text-sm font-medium">
              ⚠️ {error}
            </p>
          )}
          
          {saveError && (
            <p className="text-red-400 text-sm font-medium">
              ⚠️ {saveError}
            </p>
          )}
          
          {saveSuccess && (
            <p className="text-green-400 text-sm font-medium">
              ✓ Recording saved successfully!
            </p>
          )}
          
          {isConnecting && (
            <p className="text-yellow-400 text-sm font-medium">
              🔌 Connecting to WebSocket...
            </p>
          )}
          
          {!isRecording && !error && !saveError && !saveSuccess && !isSaving && !isConnecting && (
            <p className="text-gray-300 dark:text-gray-300 font-medium">
              Click to start recording from WebSocket
            </p>
          )}
          
          {isRecording && !error && (
            <p className="text-sm text-gray-400 dark:text-gray-400">
              Receiving audio stream from WebSocket
            </p>
          )}
          
          {isSaving && (
            <p className="text-blue-400 text-sm font-medium">
              Uploading to Supabase...
            </p>
          )}
        </div>

        {/* Instructions */}
        {!isRecording && !isSaving && (
          <div className="mt-4 text-xs text-gray-500 text-center max-w-xs">
            <p>WebSocket audio streaming • Stop to save • Cancel to discard</p>
          </div>
        )}
      </div>
    </div>
  );
}
