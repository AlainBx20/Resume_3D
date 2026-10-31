// ---------------------------------------------------------------------------
// Fully procedural ambient audio — wind, rain, thunder and footsteps are all
// synthesized from filtered noise buffers, so the site ships zero audio files.
// The context is created lazily on the first pointer-lock (a user gesture), as
// browsers require.
// ---------------------------------------------------------------------------

const MASTER_LEVEL = 0.7;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private muffle!: BiquadFilterNode; // closes down when the player is indoors
  private windGain!: GainNode;
  private windFilter!: BiquadFilterNode;
  private rainGain!: GainNode;
  private noiseBuffer!: AudioBuffer;
  private brownBuffer!: AudioBuffer;
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

    // rain: brighter band of the same noise
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "bandpass";
    rainFilter.frequency.value = 2400;
    rainFilter.Q.value = 0.4;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    this.loopNoise(ctx, this.noiseBuffer).connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.muffle);
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
  update(wind: number, rain: number, indoors: boolean, dt: number) {
    if (!this.ctx) return;
    const k = Math.min(dt * 3, 1); // gentle smoothing so gains never click
    const windTarget = 0.03 + wind * 0.14;
    const rainTarget = rain * (indoors ? 0.12 : 0.22);
    this.windGain.gain.value += (windTarget - this.windGain.gain.value) * k;
    this.rainGain.gain.value += (rainTarget - this.rainGain.gain.value) * k;
    const muffleTarget = indoors ? 480 : 16000;
    this.muffle.frequency.value += (muffleTarget - this.muffle.frequency.value) * Math.min(dt * 5, 1);
  }

  /** Distant rolling thunder; delaySeconds simulates the strike distance. */
  thunder(delaySeconds: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const at = ctx.currentTime + delaySeconds;
    const loudness = 0.9 - delaySeconds * 0.22; // closer strikes are louder

    const src = ctx.createBufferSource();
    src.buffer = this.brownBuffer;
    src.playbackRate.value = 0.55 + Math.random() * 0.25;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, at);
    filter.frequency.exponentialRampToValueAtTime(60, at + 2.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(loudness, 0.15), at + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.muffle);
    src.start(at);
    src.stop(at + 3.4);
  }

  /** Soft footstep thump, subtly varied per step. */
  footstep(running: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;
    const at = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240 + Math.random() * 80;
    const gain = ctx.createGain();
    const level = running ? 0.16 : 0.1;
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(at, Math.random() * 1.5, 0.12);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.master.gain.value = muted ? 0 : MASTER_LEVEL;
  }
}

export const audio = new AudioEngine();
