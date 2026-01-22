class SoundService {
  private audioCtx: AudioContext | null = null;

  constructor() {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  private ensureContext() {
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.audioCtx) {
       try {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {}
    }
  }

  playCorrect() {
    this.ensureContext();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1046.50, this.audioCtx.currentTime); // C6
    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.2);

    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + 0.2);
  }

  playWrong() {
    this.ensureContext();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(110, this.audioCtx.currentTime); // A2
    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.3);

    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + 0.3);
  }
  
  playTick() {
    this.ensureContext();
    if (!this.audioCtx) return;
    
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.05);
    
    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + 0.05);
  }
}

export const soundService = new SoundService();