// ============================================================
// Mobile Voice Commands Hook
// Uses @react-native-voice/voice for native speech recognition
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface VoiceResult {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useMobileVoice(): VoiceResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(async () => {
    try {
      // In production, use @react-native-voice/voice
      // For now, we'll use Expo's Speech Recognition when available
      setIsListening(true);
      setTranscript('');
      
      // Voice recognition would be initialized here
      // Voice.start('en-US');
    } catch (error) {
      Alert.alert('Voice Error', 'Could not start voice recognition');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // Voice.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Process voice command via server
  const processCommand = useCallback(async (text: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/voice/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();
      if (result.success && result.data?.success) {
        return result.data;
      }
    } catch (err) {
      console.error('Voice command processing failed:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      if (isListening) stopListening();
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}
