// Professional Web Audio API Sound Engine
// Reliable, zero external asset dependencies, works offline, zero 404s/CORS issues.

class SoundEffectsEngine {
  constructor() {
    this.audioCtx = null;
    this.isRinging = false;
    this.ringInterval = null;
    this.activeNodes = [];
  }

  // Ensure AudioContext is initialized and resumed
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Continuous Incoming Call Ringtone
   * Plays a pleasant, modern smartphone/WhatsApp style melodic ring cadence.
   * Cadence: 4 rhythmic chime notes (C5, E5, G5, C6) followed by a 1.2s pause, repeating continuously.
   */
  startIncomingCallRingtone() {
    if (this.isRinging) return;
    this.isRinging = true;

    const playOneRingCycle = () => {
      if (!this.isRinging) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Melodic chords for incoming call (C5: 523Hz, E5: 659Hz, G5: 784Hz, C6: 1046Hz)
      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.22 },
        { freq: 659.25, time: 0.24, dur: 0.22 },
        { freq: 783.99, time: 0.48, dur: 0.22 },
        { freq: 1046.50, time: 0.72, dur: 0.45 },
        // Second melodic pulse
        { freq: 659.25, time: 1.30, dur: 0.22 },
        { freq: 783.99, time: 1.54, dur: 0.22 },
        { freq: 1046.50, time: 1.78, dur: 0.45 }
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Dual sine wave with subtle triangle for warm tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        // Envelope: soft attack, sustained body, smooth release
        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.35, now + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
        this.activeNodes.push(osc);
      });
    };

    // Play first cycle immediately
    playOneRingCycle();

    // Repeat every 3.2 seconds
    this.ringInterval = setInterval(() => {
      if (!this.isRinging) {
        clearInterval(this.ringInterval);
        return;
      }
      playOneRingCycle();
    }, 3200);
  }

  /**
   * Stop Incoming Call Ringtone immediately
   */
  stopIncomingCallRingtone() {
    this.isRinging = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    // Stop any currently playing nodes
    this.activeNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
  }

  /**
   * Pleasant chime for new incoming chat messages
   * 2-tone bright marimba bell (880Hz -> 1320Hz)
   */
  playChatNotificationChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second bell tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.28, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  }

  /**
   * Pleasant connected tone when call starts
   */
  playCallConnectedTone() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880]; // D5 -> A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  }

  /**
   * Descending tone when call ends
   */
  playCallEndedTone() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [659.25, 493.88, 329.63]; // E5 -> B4 -> E4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.2, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.2);
    });
  }
}

export const soundEffects = new SoundEffectsEngine();
