'use client';

/**
 * playLeadSound() — Generates a pleasant 3-tone notification chime using
 * the Web Audio API. No external sound files required.
 */
export function playLeadSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Three ascending notes for a pleasant "ding-ding-ding" chime
    const notes = [
      { freq: 587.33, start: 0, duration: 0.12 },      // D5
      { freq: 739.99, start: 0.13, duration: 0.12 },    // F#5
      { freq: 880.0, start: 0.26, duration: 0.22 },     // A5 (held slightly longer)
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.015); // quick attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration); // smooth decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });

    // Auto-close the audio context after the chime finishes
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Silently fail if AudioContext is not available
  }
}
