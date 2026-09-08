// ============================================================
// Voice Command Button Component
// ============================================================

'use client';

import { useVoiceCommands } from '@/hooks/useVoiceCommands';

export function VoiceButton() {
  const { isListening, transcript, lastCommand, error, toggleListening } = useVoiceCommands();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Transcript display */}
      {(transcript || lastCommand) && (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 max-w-xs animate-slide-up shadow-xl">
          {transcript && (
            <p className="text-sm text-text-secondary italic">&quot;{transcript}&quot;</p>
          )}
          {lastCommand && !transcript && (
            <p className="text-sm text-accent-blue">{lastCommand}</p>
          )}
          {error && <p className="text-sm text-accent-red">{error}</p>}
        </div>
      )}

      {/* Voice Button */}
      <button
        onClick={toggleListening}
        className={`w-14 h-14 rounded-full flex items-center justify-center
          shadow-lg transition-all duration-300 group
          ${isListening
            ? 'bg-accent-red text-white animate-glow scale-110'
            : 'bg-accent-blue text-white hover:bg-accent-blue/90 hover:scale-105'
          }`}
        title={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {isListening ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}

        {/* Pulse ring when active */}
        {isListening && (
          <span className="absolute w-14 h-14 rounded-full border-2 border-accent-red animate-ping opacity-30" />
        )}
      </button>

      {/* Label */}
      <span className="text-xs text-text-muted">
        {isListening ? 'Listening...' : 'Voice'}
      </span>
    </div>
  );
}
