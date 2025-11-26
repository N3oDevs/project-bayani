'use client';

import { useState } from 'react';
import { Mic, Square } from 'lucide-react';

export default function RecordButton() {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="w-full">
      <div className="bg-gray-900 dark:bg-gray-900 border border-gray-700 dark:border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
        <button
          onClick={toggleRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
            isRecording
              ? 'bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 animate-pulse'
              : 'bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700'
          }`}
        >
          {isRecording ? (
            <Square size={40} className="text-white" />
          ) : (
            <Mic size={40} className="text-white" />
          )}
        </button>
        <p className="mt-6 text-center text-gray-300 dark:text-gray-300 font-medium">
          {isRecording ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-red-500 dark:bg-red-500 rounded-full animate-pulse"></span>
              Recording in progress...
            </span>
          ) : (
            'Click to start recording'
          )}
        </p>
        {isRecording && (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-400">Recording will be saved to history</p>
        )}
      </div>
    </div>
  );
}
