import { useCallback } from 'react';

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const useSoundEffects = () => {
  const playHover = useCallback(() => {
    try {
      const audio = getAudioContext();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, audio.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
      osc.start();
      osc.stop(audio.currentTime + 0.1);
    } catch (e) {
      // AudioContext might be blocked by browser policy until user interaction
    }
  }, []);

  const playClick = useCallback(() => {
    try {
      const audio = getAudioContext();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audio.currentTime);
      gain.gain.setValueAtTime(0.1, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
      osc.start();
      osc.stop(audio.currentTime + 0.1);
    } catch (e) {
      // AudioContext might be blocked by browser policy until user interaction
    }
  }, []);

  return { playHover, playClick };
};
