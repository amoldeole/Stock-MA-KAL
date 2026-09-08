// ============================================================
// Voice Command Hook
// Uses Web Speech API for voice recognition
// ============================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStockStore } from '@/lib/store';

interface UseVoiceResult {
  isListening: boolean;
  transcript: string;
  lastCommand: string | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useVoiceCommands(): UseVoiceResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const store = useStockStore();

  const processCommand = useCallback(async (text: string) => {
    try {
      const result = await api.parseVoiceCommand(text);
      if (result.success && result.data?.success) {
        const { action, data } = result.data;
        setLastCommand(`${action}: ${JSON.stringify(data)}`);
        executeAction(action, data);
      } else {
        setLastCommand(`Unknown: "${text}"`);
      }
    } catch (err) {
      setError('Failed to process command');
    }
  }, []);

  const executeAction = useCallback(
    (action: string, data: Record<string, string>) => {
      switch (action) {
        case 'search_stock':
        case 'show_chart':
          if (data.symbol) store.setSymbol(data.symbol);
          break;
        case 'set_timeframe':
          if (data.timeframe) store.setTimeframe(data.timeframe as any);
          break;
        case 'toggle_dark_mode':
          store.toggleTheme();
          break;
        case 'add_indicator':
          // Parse indicator from voice
          const type = parseIndicatorType(data.indicator);
          if (type) store.addIndicator({ type, period: 20 });
          break;
        default:
          console.log('Unhandled voice action:', action);
      }
    },
    [store]
  );

  const startListening = useCallback(() => {
    setError(null);

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      setTranscript(interimTranscript || finalTranscript);

      if (finalTranscript) {
        processCommand(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [processCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    lastCommand,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}

function parseIndicatorType(input: string): string | null {
  const lower = input.toLowerCase();
  if (lower.includes('sma') || lower.includes('simple')) return 'SMA';
  if (lower.includes('ema') || lower.includes('exponential')) return 'EMA';
  if (lower.includes('wma') || lower.includes('weighted')) return 'WMA';
  if (lower.includes('hma') || lower.includes('hull')) return 'HMA';
  if (lower.includes('kama') || lower.includes('kaufman')) return 'KAMA';
  if (lower.includes('dema') || lower.includes('double')) return 'DEMA';
  if (lower.includes('tema') || lower.includes('triple')) return 'TEMA';
  return null;
}
