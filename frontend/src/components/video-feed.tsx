'use client';

import { Play, Pause, Volume2, Maximize2 } from 'lucide-react';

export default function VideoFeed() {
  return (
    <div className="w-full h-full">
      <div className="bg-black dark:bg-black border-2 border-gray-700 dark:border-gray-700 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center relative shadow-2xl">
        {/* No Signal Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-gray-900 via-black to-gray-900 dark:from-gray-900 dark:via-black dark:to-gray-900 flex flex-col items-center justify-center z-10">
          <div className="text-center">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-600 dark:text-gray-600 mb-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0 4v2M6 9a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
              <p className="text-4xl font-bold text-gray-500 dark:text-gray-500 mb-3">NO SIGNAL</p>
              <p className="text-base text-gray-600 dark:text-gray-600">Waiting for video stream...</p>
            </div>
          </div>
        </div>

        {/* Grayed out controls at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black to-transparent dark:from-black dark:via-black dark:to-transparent p-4 flex items-center justify-between z-20 opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex gap-4">
            <button className="text-gray-400 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 disabled:opacity-50 transition-colors" disabled>
              <Play size={28} />
            </button>
            <button className="text-gray-400 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 disabled:opacity-50 transition-colors" disabled>
              <Pause size={28} />
            </button>
            <button className="text-gray-400 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 disabled:opacity-50 transition-colors" disabled>
              <Volume2 size={28} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 dark:text-gray-500 text-sm font-medium">00:00 / 00:00</span>
            <button className="text-gray-400 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 disabled:opacity-50 transition-colors" disabled>
              <Maximize2 size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
