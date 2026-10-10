/**
 * DreadSoundtrack — proceduraal gegenereerde 8-bit soundtrack (Web Audio API)
 * voor de bank escape room game. Geen samples, alles synthese.
 *
 * Gebruik in je game:
 *
 *   const soundtrack = new DreadSoundtrack();
 *
 *   // Belangrijk: browsers blokkeren audio zonder user-gesture.
 *   // Roep de start-methodes aan vanuit een klik/toets-handler.
 *   startButton.addEventListener('click', () => soundtrack.start());   // volledige mix ineens
 *
 *   // Of laag voor laag opbouwen (bv. voor een intro):
 *   soundtrack.playMotifIntro();   // laag 1: alleen het motief, herhalend
 *   soundtrack.addNervousLayer();  // laag 2: + het nerveuze getik
 *   soundtrack.addBassLayer();     // laag 3: + de lage drone (volledige mix)
 *
 *   soundtrack.stop();                 // stopt alles netjes
 *   soundtrack.setVolume(0.3);         // 0..1
 *   soundtrack.setMotifInterval(3);    // motief elke N maten (2, 3 of 4)
 *
 * Structuur van de track:
 *  - Bass: continue lage drone (sawtooth+triangle) die met portamento
 *    langzaam tussen wortelnoten glijdt (D2-C2-Bb1-B1-D2), met een
 *    langzame "ademende" lowpass-filter LFO.
 *  - Nervous: strakke hoge tik (square, 220ms) uit een dissonante
 *    cluster (kleine secondes/tritonus), voor de onderliggende spanning.
 *  - Motief: terugkerend signature-motief, ritme "tutu, tu, tu, tu"
 *    (D5-D5-Ab4-F4-D4), met lange decay en een eigen reverb-bus.
 *
 * De drie lagen zijn onafhankelijk start/stopbaar en idempotent: een laag
 * die al draait, opnieuw aanroepen doet niets (geen dubbele oscillators).
 */
class DreadSoundtrack {
  constructor({ volume = 0.22, motifIntervalBars = 3 } = {}) {
    this.motifIntervalBars = motifIntervalBars;
    this._initialVolume = volume;

    this.audioCtx = null;
    this.masterGain = null;
    this.reverbConvolver = null;
    this.reverbSend = null;

    this.isPlaying = false;
    this._bassRunning = false;
    this._nervousRunning = false;
    this._motifRunning = false;

    // bass drone
    this._bassOsc1 = null;
    this._bassOsc2 = null;
    this._bassFilter = null;
    this._bassGain = null;
    this._lfo = null;
    this._lfoGain = null;
    this._bassSequenceTimer = null;
    this._BASS_NOTE_SEQUENCE = [
      { freq: 73.42, hold: 7.0 },  // D2
      { freq: 65.41, hold: 5.5 },  // C2
      { freq: 58.27, hold: 6.0 },  // Bb1
      { freq: 61.74, hold: 5.0 },  // B1 (net iets fout klinkend -> onrust)
      { freq: 73.42, hold: 6.5 },  // terug naar D2
    ];
    this._GLIDE_TIME = 2.2;

    // nervous layer
    this._nervousTimer = null;
    this._NERVOUS_NOTES = [587.33, 622.25, 659.25, 698.46, 830.61, 932.33]; // D5,Eb5,E5,F5,Ab5,Bb5

    // motif
    this._MOTIF_BPM = 62;
    this._BEAT_DUR = 60 / this._MOTIF_BPM;
    this._BAR_DUR = this._BEAT_DUR * 4;
    this._MOTIF_PATTERN = [
      { freq: 587.33, beats: 0.5 }, // D5 (tu)
      { freq: 587.33, beats: 0.5 }, // D5 (tu)
      { freq: 415.30, beats: 1.0 }, // Ab4
      { freq: 349.23, beats: 1.0 }, // F4
      { freq: 293.66, beats: 1.0 }, // D4
    ];
    this._barCount = 0;
    this._barTimer = null;
  }

  // ---- publieke API ----

  start() {
    this.addBassLayer();
    this.addNervousLayer();
    this.playMotifIntro();
  }

  playMotifIntro() {
    this._initAudio();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.isPlaying = true;
    if (this._motifRunning) return;
    this._motifRunning = true;
    this._startBarClock();
  }

  addNervousLayer() {
    this._initAudio();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.isPlaying = true;
    if (this._nervousRunning) return;
    this._nervousRunning = true;
    this._scheduleNervousLoop();
  }

  addBassLayer() {
    this._initAudio();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.isPlaying = true;
    if (this._bassRunning) return;
    this._bassRunning = true;
    this._startBassDrone();
  }

  stop() {
    this.isPlaying = false;
    this._bassRunning = false;
    this._nervousRunning = false;
    this._motifRunning = false;
    clearTimeout(this._nervousTimer);
    this._stopBarClock();
    this._stopBassDrone();
  }

  setVolume(v) {
    this._initialVolume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  setMotifInterval(bars) {
    this.motifIntervalBars = bars;
  }

  // ---- interne opzet ----

  _initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = this._initialVolume;
    this.masterGain.connect(this.audioCtx.destination);

    this.reverbConvolver = this.audioCtx.createConvolver();
    this.reverbConvolver.buffer = this._buildImpulseResponse(2.2, 2.5);
    this.reverbSend = this.audioCtx.createGain();
    this.reverbSend.gain.value = 0.4;
    this.reverbConvolver.connect(this.reverbSend);
    this.reverbSend.connect(this.masterGain);
  }

  _buildImpulseResponse(duration, decay) {
    const rate = this.audioCtx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = this.audioCtx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  // ---- bass drone ----

  _startBassDrone() {
    const ctx = this.audioCtx;
    this._bassFilter = ctx.createBiquadFilter();
    this._bassFilter.type = 'lowpass';
    this._bassFilter.frequency.value = 220;
    this._bassFilter.Q.value = 0.8;

    this._bassGain = ctx.createGain();
    this._bassGain.gain.setValueAtTime(0, ctx.currentTime);
    this._bassGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5);

    this._bassOsc1 = ctx.createOscillator();
    this._bassOsc1.type = 'sawtooth';
    this._bassOsc2 = ctx.createOscillator();
    this._bassOsc2.type = 'triangle';
    this._bassOsc2.detune.value = 6;

    const startFreq = this._BASS_NOTE_SEQUENCE[0].freq;
    this._bassOsc1.frequency.setValueAtTime(startFreq, ctx.currentTime);
    this._bassOsc2.frequency.setValueAtTime(startFreq, ctx.currentTime);

    this._bassOsc1.connect(this._bassFilter);
    this._bassOsc2.connect(this._bassFilter);
    this._bassFilter.connect(this._bassGain);
    this._bassGain.connect(this.masterGain);

    this._lfo = ctx.createOscillator();
    this._lfo.frequency.value = 0.08;
    this._lfoGain = ctx.createGain();
    this._lfoGain.gain.value = 60;
    this._lfo.connect(this._lfoGain);
    this._lfoGain.connect(this._bassFilter.frequency);

    this._bassOsc1.start();
    this._bassOsc2.start();
    this._lfo.start();

    this._scheduleBassSequence(0);
  }

  _scheduleBassSequence(index) {
    const seq = this._BASS_NOTE_SEQUENCE;
    const step = seq[index % seq.length];
    const now = this.audioCtx.currentTime;
    this._bassOsc1.frequency.linearRampToValueAtTime(step.freq, now + this._GLIDE_TIME);
    this._bassOsc2.frequency.linearRampToValueAtTime(step.freq, now + this._GLIDE_TIME);
    this._bassSequenceTimer = setTimeout(() => {
      if (this._bassRunning) this._scheduleBassSequence(index + 1);
    }, step.hold * 1000);
  }

  _stopBassDrone() {
    clearTimeout(this._bassSequenceTimer);
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    if (this._bassGain) {
      this._bassGain.gain.cancelScheduledValues(now);
      this._bassGain.gain.setValueAtTime(this._bassGain.gain.value, now);
      this._bassGain.gain.linearRampToValueAtTime(0, now + 0.4);
    }
    [this._bassOsc1, this._bassOsc2, this._lfo].forEach(o => {
      if (o) { try { o.stop(now + 0.5); } catch (e) {} }
    });
    this._bassOsc1 = this._bassOsc2 = this._lfo = this._lfoGain = this._bassFilter = this._bassGain = null;
  }

  // ---- nervous layer (strakke tik) ----

  _playNervousBlip() {
    const ctx = this.audioCtx;
    const freq = this._NERVOUS_NOTES[Math.floor(Math.random() * this._NERVOUS_NOTES.length)];
    const now = ctx.currentTime;
    const dur = 0.06 + Math.random() * 0.05;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 14 + Math.random() * 10;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = 8;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    const panner = ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 2 - 1) * 0.6;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start(now);
    vibrato.start(now);
    osc.stop(now + dur + 0.02);
    vibrato.stop(now + dur + 0.02);
  }

  _scheduleNervousLoop() {
    this._playNervousBlip();
    const steady = 220;
    const nextDelay = steady + (Math.random() * 10 - 5); // kleine humanizing-jitter
    this._nervousTimer = setTimeout(() => {
      if (this._nervousRunning) this._scheduleNervousLoop();
    }, nextDelay);
  }

  // ---- motief ----

  _playMotif() {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    let cursor = 0;

    this._MOTIF_PATTERN.forEach(({ freq, beats }) => {
      const t = now + cursor;
      const slotLen = beats * this._BEAT_DUR;
      const decayLen = slotLen * 0.95;

      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.34, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decayLen);

      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbConvolver);

      const subOsc = ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(freq / 2, t);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, t);
      subGain.gain.linearRampToValueAtTime(0.16, t + 0.008);
      subGain.gain.exponentialRampToValueAtTime(0.0001, t + decayLen);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subGain.connect(this.reverbConvolver);

      osc.start(t);
      osc.stop(t + decayLen + 0.05);
      subOsc.start(t);
      subOsc.stop(t + decayLen + 0.05);

      cursor += slotLen;
    });
  }

  _startBarClock() {
    this._barCount = 1;
    if ((this._barCount - 1) % this.motifIntervalBars === 0) this._playMotif();
    this._barTimer = setInterval(() => {
      if (!this._motifRunning) return;
      this._barCount++;
      if ((this._barCount - 1) % this.motifIntervalBars === 0) this._playMotif();
    }, this._BAR_DUR * 1000);
  }

  _stopBarClock() {
    clearInterval(this._barTimer);
    this._barCount = 0;
  }
}

// Beschikbaar als globaal, voor gebruik via <script src="dread-soundtrack.js"></script>
if (typeof window !== 'undefined') window.DreadSoundtrack = DreadSoundtrack;
