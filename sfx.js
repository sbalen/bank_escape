// ---------------------------------------------------------------------
// CHIPTUNE SFX (procedural, no assets — Web Audio API)
// ---------------------------------------------------------------------
class ChiptuneSFX {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  unlock() {
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  _stepped(x, levels = 15) {
    const c = Math.max(0, Math.min(1, x));
    return Math.round(c * levels) / levels;
  }

  _makeBuffer(seconds) {
    const n = Math.ceil(this.ctx.sampleRate * seconds);
    return { buffer: this.ctx.createBuffer(1, n, this.ctx.sampleRate), n };
  }

  _play(buffer, gain = 1) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    if (gain !== 1) {
      const g = this.ctx.createGain();
      g.gain.value = gain;
      src.connect(g);
      g.connect(this.ctx.destination);
    } else {
      src.connect(this.ctx.destination);
    }
    src.start();
    return src;
  }

  playExplosion({ duration = 1.3 } = {}) {
    const sr = this.ctx.sampleRate;
    const { buffer, n } = this._makeBuffer(duration);
    const data = buffer.getChannelData(0);

    const noise = new Float32Array(n);
    let lfsr = 1;
    let phase = 0;
    let value = 1;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const clockHz = 9000 * Math.exp(-t / 0.22) + 120;
      phase += clockHz / sr;
      while (phase >= 1) {
        phase -= 1;
        const tap = t > 0.45 ? 6 : 1;
        const bit = (lfsr ^ (lfsr >> tap)) & 1;
        lfsr = (lfsr >> 1) | (bit << 14);
        value = (lfsr & 1) === 0 ? 1 : -1;
      }
      let env = this._stepped(Math.exp(-t / 0.28));
      if (t < 0.004) env *= t / 0.004;
      noise[i] = value * env;
    }

    const thump = new Float32Array(n);
    let thumpPhase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const freq = 30 + 170 * Math.exp(-t / 0.07);
      thumpPhase += freq / sr;
      thumpPhase %= 1;
      const env = this._stepped(Math.exp(-t / 0.16));
      thump[i] = (thumpPhase < 0.5 ? 1 : -1) * env;
    }

    const crackle = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const density = 0.0025 * Math.exp(-Math.max(0, t - 0.3) / 0.35);
      if (Math.random() < density) {
        const val = Math.random() < 0.5 ? -1 : 1;
        for (let k = 0; k < 3 && i + k < n; k++) crackle[i + k] += val;
      }
    }
    for (let i = 0; i < n; i++) {
      crackle[i] *= this._stepped(Math.exp(-(i / sr) / 0.6));
    }

    let peak = 1e-9;
    for (let i = 0; i < n; i++) {
      const m = 0.65 * noise[i] + 0.55 * thump[i] + 0.25 * crackle[i];
      data[i] = m;
      if (Math.abs(m) > peak) peak = Math.abs(m);
    }
    const fadeSamples = Math.floor(sr * 0.05);
    for (let i = 0; i < n; i++) {
      let v = data[i] / peak;
      if (i >= n - fadeSamples) v *= (n - i) / fadeSamples;
      data[i] = Math.round(v * 31) / 31 * 0.9;
    }

    return this._play(buffer, 0.4); // 60% softer than the raw normalized mix
  }

  playPickup({ notesHz = [523.25, 659.25, 783.99, 1046.5], noteDur = 0.055 } = {}) {
    const sr = this.ctx.sampleRate;
    const totalDur = notesHz.length * noteDur;
    const { buffer, n } = this._makeBuffer(totalDur);
    const data = buffer.getChannelData(0);
    const perNote = Math.floor(sr * noteDur);

    const square = (freq, i, duty) => {
      const ph = ((i / sr) * freq) % 1;
      return ph < duty ? 1 : -1;
    };
    const noteEnv = (localI, attack = 0.002, decay = 0.85) => {
      const t = localI / sr;
      let env = Math.exp((-t / decay) * 6);
      const a = Math.floor(sr * attack);
      if (localI < a) env *= localI / a;
      return this._stepped(env);
    };

    let peak = 1e-9;
    for (let noteIdx = 0; noteIdx < notesHz.length; noteIdx++) {
      const freq = notesHz[noteIdx];
      const base = noteIdx * perNote;
      for (let i = 0; i < perNote && base + i < n; i++) {
        const env = noteEnv(i);
        let v = square(freq, i, 0.5) * env;
        v += 0.35 * square(freq * 1.5, i, 0.25) * env;
        data[base + i] = v;
        if (Math.abs(v) > peak) peak = Math.abs(v);
      }
    }

    const fadeSamples = Math.floor(sr * 0.015);
    for (let i = 0; i < n; i++) {
      let v = data[i] / peak;
      if (i >= n - fadeSamples) v *= (n - i) / fadeSamples;
      data[i] = Math.round(v * 15) / 15 * 0.85;
    }

    return this._play(buffer);
  }
}
