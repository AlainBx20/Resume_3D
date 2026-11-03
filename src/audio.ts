import { nearestCarDistance } from "./streetLayout";

// ---------------------------------------------------------------------------
// Fully procedural ambient audio — wind, rain, thunder and footsteps are all
// synthesized from filtered noise buffers, so the site ships zero audio files.
// The context is created lazily on the first pointer-lock (a user gesture), as
// browsers require.
// ---------------------------------------------------------------------------

const MASTER_LEVEL = 0.7;

interface RadioStation {
  name: string;
  bpm: number;
  chords: number[][]; // MIDI notes, root first
  wave: OscillatorType;
  cutoff: number;
  dense: boolean;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    name: "Lo-fi Café",
    bpm: 76,
    chords: [[48, 52, 55, 59], [45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53]],
    wave: "triangle",
    cutoff: 1700,
    dense: false,
  },
  {
    name: "Midnight Jazz",
    bpm: 62,
    chords: [[50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59], [45, 49, 52, 55]],
    wave: "sine",
    cutoff: 2400,
    dense: false,
  },
  {
    name: "Neon Synthwave",
    bpm: 104,
    chords: [[45, 48, 52, 55], [41, 45, 48, 52], [48, 52, 55, 59], [43, 47, 50, 55]],
    wave: "sawtooth",
    cutoff: 1300,
    dense: true,
  },
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private muffle!: BiquadFilterNode; // closes down when the player is indoors
  private windGain!: GainNode;
  private windFilter!: BiquadFilterNode;
  private rainGain!: GainNode;
  private carRainGain!: GainNode;
  private waterGain!: GainNode;
  private natureGain!: GainNode;
  private noiseBuffer!: AudioBuffer;
  private brownBuffer!: AudioBuffer;
  private nextBirdAt = 0;
  private nextCarTapAt = 0;
  muted = false;

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.noiseBuffer = this.makeNoise(ctx, 2, false);
    this.brownBuffer = this.makeNoise(ctx, 4, true);

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER_LEVEL;
    this.master.connect(ctx.destination);

    this.muffle = ctx.createBiquadFilter();
    this.muffle.type = "lowpass";
    this.muffle.frequency.value = 16000;
    this.muffle.connect(this.master);

    // wind: looped noise through a low lowpass, slowly breathing via an LFO
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "lowpass";
    this.windFilter.frequency.value = 320;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.loopNoise(ctx, this.noiseBuffer).connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.muffle);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 140;
    lfo.connect(lfoDepth);
    lfoDepth.connect(this.windFilter.frequency);
    lfo.start();

    // Rain is a three-layer soundscape: low roof/ground wash, the body of
    // the shower, and a quiet high-frequency spray. A single filtered noise
    // band sounded like radio static, especially during storms.
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.muffle);

    const addRainLayer = (
      buffer: AudioBuffer,
      type: BiquadFilterType,
      frequency: number,
      q: number,
      level: number,
      playbackRate = 1,
    ) => {
      const source = this.loopNoise(ctx, buffer);
      source.playbackRate.value = playbackRate;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = q;
      const layerGain = ctx.createGain();
      layerGain.gain.value = level;
      source.connect(filter);
      filter.connect(layerGain);
      layerGain.connect(this.rainGain);
    };
    addRainLayer(this.brownBuffer, "lowpass", 720, 0.45, 0.52, 1.18);
    addRainLayer(this.noiseBuffer, "bandpass", 2350, 0.34, 0.72, 0.94);
    addRainLayer(this.noiseBuffer, "highpass", 5800, 0.3, 0.19, 1.07);

    // Bright, tightly filtered patter that becomes audible only beside a car.
    // Individual resonant pings are layered over this bed in update().
    const carRainFilter = ctx.createBiquadFilter();
    carRainFilter.type = "bandpass";
    carRainFilter.frequency.value = 4300;
    carRainFilter.Q.value = 1.8;
    this.carRainGain = ctx.createGain();
    this.carRainGain.gain.value = 0;
    this.loopNoise(ctx, this.noiseBuffer).connect(carRainFilter);
    carRainFilter.connect(this.carRainGain);
    this.carRainGain.connect(this.muffle);

    // Nearby fountain / pond water: a gentle filtered stream that gets louder
    // only when the player approaches either landmark.
    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = "bandpass";
    waterFilter.frequency.value = 1050;
    waterFilter.Q.value = 0.55;
    this.waterGain = ctx.createGain();
    this.waterGain.gain.value = 0;
    this.loopNoise(ctx, this.noiseBuffer).connect(waterFilter);
    waterFilter.connect(this.waterGain);
    this.waterGain.connect(this.muffle);

    // Very quiet leaf / meadow texture under the wind. Kept low so it creates
    // depth without sounding like continuous static.
    const natureFilter = ctx.createBiquadFilter();
    natureFilter.type = "bandpass";
    natureFilter.frequency.value = 1700;
    natureFilter.Q.value = 0.8;
    this.natureGain = ctx.createGain();
    this.natureGain.gain.value = 0;
    this.loopNoise(ctx, this.noiseBuffer).connect(natureFilter);
    natureFilter.connect(this.natureGain);
    this.natureGain.connect(this.muffle);
  }

  private makeNoise(ctx: AudioContext, seconds: number, brown: boolean) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }

  private loopNoise(ctx: AudioContext, buffer: AudioBuffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start();
    return src;
  }

  /** Called every frame with the current atmosphere values. */
  update(
    wind: number,
    rain: number,
    indoors: boolean,
    dt: number,
    playerX = 0,
    playerZ = 0,
    day = 1,
  ) {
    if (!this.ctx) return;
    const k = Math.min(dt * 3, 1); // gentle smoothing so gains never click
    const windTarget = 0.03 + wind * 0.14;
    const rainTarget = rain * (indoors ? 0.1 : 0.25);
    this.windGain.gain.value += (windTarget - this.windGain.gain.value) * k;
    this.rainGain.gain.value += (rainTarget - this.rainGain.gain.value) * k;
    const carDistance = nearestCarDistance(playerX, playerZ);
    const carPresence = indoors ? 0 : Math.max(0, 1 - carDistance / 10);
    const carRainTarget = rain * carPresence * 0.075;
    this.carRainGain.gain.value += (carRainTarget - this.carRainGain.gain.value) * k;
    if (!indoors && rain > 0.22 && carDistance < 7 && this.ctx.currentTime >= this.nextCarTapAt) {
      this.carRainTap(rain * carPresence);
      this.nextCarTapAt = this.ctx.currentTime + (0.055 + Math.random() * 0.14) / Math.max(rain, 0.3);
    }
    const fountainDistance = Math.hypot(playerX, playerZ);
    const pondDistance = Math.hypot(playerX - 17.5, playerZ);
    const waterPresence = Math.max(
      Math.max(0, 1 - fountainDistance / 15),
      Math.max(0, 1 - pondDistance / 11) * 0.72,
    );
    const waterTarget = indoors ? 0 : waterPresence * 0.075;
    this.waterGain.gain.value += (waterTarget - this.waterGain.gain.value) * k;
    const natureTarget = indoors ? 0 : (0.006 + wind * 0.007) * day * (1 - rain * 0.75);
    this.natureGain.gain.value += (natureTarget - this.natureGain.gain.value) * k;
    const muffleTarget = indoors ? 480 : 16000;
    this.muffle.frequency.value += (muffleTarget - this.muffle.frequency.value) * Math.min(dt * 5, 1);
    this.musicTick();
    this.fireTick();
    if (!indoors && day > 0.55 && rain < 0.2 && this.ctx.currentTime >= this.nextBirdAt) {
      this.birdChirp(this.ctx.currentTime + 0.05);
      this.nextBirdAt = this.ctx.currentTime + 4.5 + Math.random() * 7;
    }
  }

  private birdChirp(at: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.018, at + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
    gain.connect(this.muffle);

    for (let index = 0; index < 2; index += 1) {
      const osc = ctx.createOscillator();
      const start = at + index * 0.13;
      osc.type = "sine";
      osc.frequency.setValueAtTime(1700 + index * 260 + Math.random() * 180, start);
      osc.frequency.exponentialRampToValueAtTime(2550 + index * 220, start + 0.16);
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + 0.22);
    }
  }

  private carRainTap(strength: number) {
    const ctx = this.ctx;
    if (!ctx || strength <= 0) return;
    const at = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    const pitch = 1900 + Math.random() * 2700;
    oscillator.frequency.setValueAtTime(pitch, at);
    oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.62, at + 0.045);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.012 + strength * 0.018, at + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.055 + Math.random() * 0.035);
    oscillator.connect(gain);
    gain.connect(this.muffle);
    oscillator.start(at);
    oscillator.stop(at + 0.1);
  }

  /** Distant rolling thunder; delaySeconds simulates the strike distance. */
  thunder(delaySeconds: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const at = ctx.currentTime + delaySeconds;
    const proximity = Math.max(0.28, 1 - delaySeconds * 0.2);

    const noiseLayer = (
      offset: number,
      duration: number,
      level: number,
      startFrequency: number,
      endFrequency: number,
      playbackRate: number,
    ) => {
      const start = at + offset;
      const source = ctx.createBufferSource();
      source.buffer = this.brownBuffer;
      source.loop = true;
      source.playbackRate.value = playbackRate;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 0.55;
      filter.frequency.setValueAtTime(startFrequency, start);
      filter.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level * proximity, start + Math.min(0.08, duration * 0.15));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.muffle);
      source.start(start, Math.random() * 2);
      source.stop(start + duration + 0.05);
    };

    // Close strikes get a sharp, brief crack; distant ones lose it and only
    // the low rumble survives (air absorbs high frequencies).
    const closeness = Math.max(0, 1 - delaySeconds / 1.8);
    if (closeness > 0.05) {
      const crack = ctx.createBufferSource();
      crack.buffer = this.noiseBuffer;
      crack.playbackRate.value = 1.1;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 0.7;
      band.frequency.setValueAtTime(2600, at);
      band.frequency.exponentialRampToValueAtTime(380, at + 0.45);
      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.0001, at);
      crackGain.gain.exponentialRampToValueAtTime(0.42 * closeness, at + 0.004);
      crackGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      crack.connect(band);
      band.connect(crackGain);
      crackGain.connect(this.muffle);
      crack.start(at, Math.random() * 1.5);
      crack.stop(at + 0.55);
    }

    // Overlapping rumbles with irregular swells read as rolling thunder.
    const rolls = 3 + Math.floor(Math.random() * 3);
    for (let index = 0; index < rolls; index += 1) {
      const offset = 0.08 + index * (0.55 + Math.random() * 0.6);
      noiseLayer(
        offset,
        2.4 + Math.random() * 2.2,
        (0.3 - index * 0.04) * (0.7 + Math.random() * 0.5),
        170 - index * 20,
        40,
        0.4 + Math.random() * 0.25,
      );
    }

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(52, at);
    sub.frequency.exponentialRampToValueAtTime(28, at + 2.6);
    subGain.gain.setValueAtTime(0.0001, at);
    subGain.gain.exponentialRampToValueAtTime(0.11 * proximity, at + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.0001, at + 2.8);
    sub.connect(subGain);
    subGain.connect(this.muffle);
    sub.start(at);
    sub.stop(at + 2.85);
  }

  /** Soft footstep thump, subtly varied per step. */
  footstep(running: boolean, surface: "dry" | "wet" | "snow" = "dry") {
    const ctx = this.ctx;
    if (!ctx) return;
    const at = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = surface === "wet" ? "bandpass" : "lowpass";
    filter.frequency.value =
      surface === "wet"
        ? 1150 + Math.random() * 450
        : surface === "snow"
          ? 620 + Math.random() * 240
          : 240 + Math.random() * 80;
    filter.Q.value = surface === "wet" ? 0.7 : 0.45;
    const gain = ctx.createGain();
    const base = surface === "wet" ? 0.115 : surface === "snow" ? 0.09 : 0.1;
    const level = base * (running ? 1.45 : 1);
    const duration = surface === "snow" ? 0.17 : surface === "wet" ? 0.14 : 0.09;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(at, Math.random() * 1.5, duration + 0.02);
  }

  // ---- interaction sounds & radio -----------------------------------------

  private blip(freq: number, duration: number, type: OscillatorType, level: number, delay = 0, freqEnd?: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const at = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  private burst(duration: number, level: number, type: BiquadFilterType, from: number, to: number, delay = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const at = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + Math.min(0.02, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(at, Math.random() * 1.5);
    src.stop(at + duration + 0.02);
  }

  pageTurn() {
    this.burst(0.28, 0.13, "bandpass", 2600, 700);
  }

  bookThud() {
    this.blip(110, 0.18, "sine", 0.22, 0, 60);
  }

  uiClick() {
    this.blip(1200, 0.05, "square", 0.04);
  }

  uiOpen() {
    this.blip(520, 0.12, "triangle", 0.07, 0, 880);
  }

  uiClose() {
    this.blip(780, 0.12, "triangle", 0.06, 0, 420);
  }

  bootChime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => this.blip(freq, 0.5, "sine", 0.07, index * 0.14));
  }

  powerOff() {
    this.blip(900, 0.35, "sawtooth", 0.05, 0, 40);
    this.burst(0.3, 0.05, "highpass", 4000, 800);
  }

  tvSwitch(on: boolean) {
    this.burst(on ? 0.45 : 0.2, on ? 0.12 : 0.08, "highpass", 1800, 5200);
    if (on) this.blip(60, 0.5, "sine", 0.05);
  }

  lightSwitch() {
    this.blip(1500, 0.025, "square", 0.06);
    this.blip(900, 0.04, "square", 0.05, 0.06);
  }

  chime(hour = 1) {
    const count = Math.max(1, Math.min(hour, 12));
    for (let i = 0; i < count; i += 1) {
      this.blip(392, 1.1, "sine", 0.1, i * 0.7);
      this.blip(784, 0.8, "sine", 0.04, i * 0.7);
    }
  }

  tick(tock: boolean) {
    this.blip(tock ? 1800 : 2200, 0.025, "square", 0.025);
  }

  starCollect(count: number) {
    [880, 1109, 1319, 1760].forEach((f, i) => this.blip(f * (1 + count * 0.03), 0.35, "sine", 0.07, i * 0.07));
  }

  /** Short friendly blip for NPC dialog lines. */
  chirp(freq: number) {
    this.blip(freq, 0.09, "triangle", 0.05);
    this.blip(freq * 1.25, 0.1, "triangle", 0.04, 0.07);
  }

  achievement() {
    [659, 880, 1175].forEach((f, i) => this.blip(f, 0.4, "triangle", 0.07, i * 0.1));
  }

  /** A nasal duck quack; angry ones are lower and come in a stuttering burst. */
  quack(angry = false) {
    const pitch = angry ? 0.8 : 1;
    const hits = angry ? 3 : 1;
    for (let i = 0; i < hits; i += 1) {
      const d = i * 0.2;
      this.blip(520 * pitch, 0.16, "sawtooth", 0.07, d, 330 * pitch);
      this.blip(780 * pitch, 0.14, "square", 0.025, d, 460 * pitch);
      this.burst(0.12, 0.04, "bandpass", 1800, 900, d);
    }
  }

  partFound() {
    [440, 554, 659].forEach((f, i) => this.blip(f, 0.12, "square", 0.05, i * 0.07));
  }

  repairHit() {
    this.blip(900, 0.05, "square", 0.06);
    this.burst(0.08, 0.06, "highpass", 3000, 6000);
  }

  /** Short ominous swell for the looming planet. */
  dread() {
    this.blip(55, 2.4, "sawtooth", 0.05, 0, 38);
    this.blip(58, 2.4, "sine", 0.06, 0, 40);
  }

  /** Two-tone car horn. */
  honk(long = false) {
    const ctx = this.ctx;
    if (!ctx) return;
    const d = long ? 0.85 : 0.32;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.035);
    gain.gain.setValueAtTime(0.045, t + d - 0.05);
    gain.gain.linearRampToValueAtTime(0, t + d + 0.04);
    filter.connect(gain);
    gain.connect(this.muffle);
    // minor-third pair of detuned sawtooth voices, like a real dual-tone horn
    for (const f of [349, 349 * 1.2, 436]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + d + 0.08);
    }
  }

  private engine: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode } | null = null;

  /** Continuous engine hum for the arrival cutscene; pass null to switch it off. */
  setEngine(speed: number | null) {
    const ctx = this.ctx;
    if (!ctx) return;
    if (speed === null) {
      if (this.engine) {
        const { osc, sub, gain } = this.engine;
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
        osc.stop(ctx.currentTime + 0.8);
        sub.stop(ctx.currentTime + 0.8);
        this.engine = null;
      }
      return;
    }
    if (!this.engine) {
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = "sawtooth";
      sub.type = "triangle";
      filter.type = "lowpass";
      filter.frequency.value = 420;
      gain.gain.value = 0;
      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(this.muffle);
      osc.start();
      sub.start();
      this.engine = { osc, sub, gain };
    }
    const now = ctx.currentTime;
    const f = 38 + speed * 5.5;
    this.engine.osc.frequency.setTargetAtTime(f, now, 0.1);
    this.engine.sub.frequency.setTargetAtTime(f * 0.5, now, 0.1);
    this.engine.gain.gain.setTargetAtTime(0.05 + Math.min(speed, 10) * 0.004, now, 0.12);
  }

  private fireOn = false;
  private nextCrackleAt = 0;

  setFire(on: boolean) {
    this.fireOn = on;
    if (on) this.burst(0.4, 0.08, "bandpass", 300, 900);
  }

  private fireTick() {
    const ctx = this.ctx;
    if (!ctx || !this.fireOn || ctx.currentTime < this.nextCrackleAt) return;
    this.nextCrackleAt = ctx.currentTime + 0.05 + Math.random() * 0.35;
    this.burst(0.03 + Math.random() * 0.05, 0.035 + Math.random() * 0.05, "bandpass", 1500 + Math.random() * 3000, 600);
    if (Math.random() < 0.3) this.burst(0.6, 0.02, "lowpass", 500, 200);
  }

  private radioActive = false;
  private radioStation = 0;
  private radioStep = 0;
  private radioNextAt = 0;
  private musicGain: GainNode | null = null;

  setRadio(on: boolean, station: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    if (!this.musicGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.master);
    }
    if (on && (!this.radioActive || station !== this.radioStation)) {
      this.radioStep = 0;
      this.radioNextAt = ctx.currentTime + 0.08;
      this.burst(0.25, 0.1, "bandpass", 3000, 1200);
    }
    this.radioActive = on;
    this.radioStation = station;
    this.musicGain.gain.setTargetAtTime(on ? 0.42 : 0, ctx.currentTime, 0.12);
  }

  private musicTick() {
    const ctx = this.ctx;
    if (!ctx || !this.radioActive) return;
    const station = RADIO_STATIONS[this.radioStation % RADIO_STATIONS.length];
    const stepLength = 60 / station.bpm / 2;
    while (this.radioNextAt < ctx.currentTime + 0.25) {
      this.playRadioStep(station, this.radioNextAt, this.radioStep);
      this.radioNextAt += stepLength;
      this.radioStep += 1;
    }
  }

  private tone(
    midi: number,
    at: number,
    duration: number,
    level: number,
    type: OscillatorType,
    cutoff: number,
    attack = 0.015,
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(at);
    osc.stop(at + duration + 0.05);
  }

  private playRadioStep(station: RadioStation, at: number, step: number) {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const within = step % 8;
    const bar = Math.floor(step / 8) % station.chords.length;
    const chord = station.chords[bar];

    if (within === 0) {
      this.tone(chord[0] - 12, at, 1.6, 0.34, "sine", 400);
      chord.slice(1).forEach((note) => this.tone(note, at, 3.2, 0.05, "sine", 900, 0.5));
    }
    if (within === 4) this.tone(chord[0] - 12, at, 0.8, 0.22, "sine", 400);

    const stepsPerNote = station.dense ? 1 : 2;
    if (within % stepsPerNote === 0 || (!station.dense && within === 5)) {
      const pick = chord[(within * 3 + bar * 2) % chord.length] + 12;
      if ((within * 7 + bar * 5) % 5 !== 0) this.tone(pick, at, station.dense ? 0.28 : 0.9, 0.11, station.wave, station.cutoff);
    }

    if (within === 0 || within === 4) {
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kick.frequency.setValueAtTime(130, at);
      kick.frequency.exponentialRampToValueAtTime(45, at + 0.12);
      kickGain.gain.setValueAtTime(0.0001, at);
      kickGain.gain.exponentialRampToValueAtTime(0.28, at + 0.005);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      kick.connect(kickGain);
      kickGain.connect(this.musicGain);
      kick.start(at);
      kick.stop(at + 0.2);
    }
    if (within % 2 === 1) {
      const hat = ctx.createBufferSource();
      hat.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 7000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
      hat.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      hat.start(at, Math.random());
      hat.stop(at + 0.06);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.master.gain.value = muted ? 0 : MASTER_LEVEL;
  }
}

export const audio = new AudioEngine();
