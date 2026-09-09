import { scenarioFrame, type Effect } from './scenarios';
export type SoundState = {
  hmi: string;
  progress: number;
  playing: boolean;
  weather: string;
};
const motifs: Record<Effect, number[]> = {
  welcome: [523, 659, 784],
  charge: [392, 523, 659],
  route: [660, 880],
  perception: [440, 554],
  takeover: [880, 660, 880],
  dms: [620, 620],
  brake: [940, 740, 540],
  blindspot: [720, 960],
  door: [780, 780],
  sensor: [460, 350],
  park: [820],
  music: [262, 330, 392, 523],
  climate: [294, 440],
  call: [587, 784, 587],
  rear: [330, 494],
  child: [523, 659, 523],
  cinema: [196, 294, 392],
  camp: [262, 392],
  ota: [440, 554, 659],
  wash: [349, 466],
  offroad: [130, 164],
  impact: [660, 440, 330],
  exit: [659, 523, 392],
};
/** Use the visual timeline as the sound clock. Seeking never queues missed alarms. */
export function soundCue(s: SoundState) {
  const f = scenarioFrame(s.hmi, s.progress);
  const repeated = f.alert || (f.scenario.effect === 'park' && f.active);
  const period =
    f.scenario.effect === 'park' ? (f.phase === 2 ? 0.45 : 0.9) : 0.85;
  return {
    key: `${s.hmi}:${f.phase}:${repeated ? Math.floor((f.p * 16) / period) : 'phase'}`,
    notes: f.ended && !f.alert ? [523, 784] : motifs[f.scenario.effect],
    urgent: f.alert,
    speed: f.speed,
    rain: ['rain', 'storm', 'hail'].includes(s.weather),
    wind: ['wind', 'sand', 'blizzard'].includes(s.weather),
  };
}
export function createScenarioAudio(context: AudioContext) {
  const master = context.createGain();
  master.gain.value = 0.35;
  master.connect(context.destination);
  const voices = new Set<{
    source: AudioScheduledSourceNode;
    gain: GainNode;
  }>();
  let lastKey = '',
    lastScenario = '',
    disposed = false;
  let ambient: {
    noise: AudioBufferSourceNode;
    filter: BiquadFilterNode;
    gain: GainNode;
    motor: OscillatorNode;
    motorGain: GainNode;
  } | null = null;
  const noise = context.createBuffer(
    1,
    context.sampleRate * 2,
    context.sampleRate,
  );
  let seed = 1703;
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    samples[i] = seed / 2147483648 - 1;
  }
  function stop() {
    const t = context.currentTime;
    for (const v of voices) {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setTargetAtTime(0, t, 0.004);
      try {
        v.source.stop(t + 0.025);
      } catch {}
    }
    if (ambient) {
      const a = ambient;
      ambient = null;
      a.gain.gain.setTargetAtTime(0, t, 0.006);
      a.motorGain.gain.setTargetAtTime(0, t, 0.006);
      a.noise.stop(t + 0.04);
      a.motor.stop(t + 0.04);
      a.noise.onended = () => {
        a.noise.disconnect();
        a.filter.disconnect();
        a.gain.disconnect();
        a.motor.disconnect();
        a.motorGain.disconnect();
      };
    }
    lastKey = '';
    lastScenario = '';
  }
  function cue(s: SoundState) {
    const c = soundCue(s),
      now = context.currentTime;
    c.notes.forEach((frequency, i) => {
      const source = context.createOscillator(),
        gain = context.createGain();
      source.type = 'sine';
      source.frequency.value = frequency;
      const start = now + i * (c.urgent ? 0.14 : 0.2),
        duration = c.urgent ? 0.1 : 0.2;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(
        c.urgent ? 0.085 : 0.055,
        start + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(gain);
      gain.connect(master);
      const voice = { source, gain };
      voices.add(voice);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        voices.delete(voice);
      };
      source.start(start);
      source.stop(start + duration + 0.025);
    });
  }
  return {
    async unlock() {
      if (disposed) throw new Error('disposed');
      await context.resume();
      if (context.state !== 'running') throw new Error('audio suspended');
    },
    volume(value: number) {
      master.gain.setTargetAtTime(
        Math.max(0, Math.min(1, value)),
        context.currentTime,
        0.02,
      );
    },
    update(s: SoundState) {
      if (disposed) return;
      if (!s.playing || context.state !== 'running') {
        stop();
        return;
      }
      if (lastScenario && lastScenario !== s.hmi) stop();
      lastScenario = s.hmi;
      const c = soundCue(s);
      if (c.key !== lastKey) {
        cue(s);
        lastKey = c.key;
      }
      if (!ambient && (c.speed > 0 || c.rain || c.wind)) {
        const source = context.createBufferSource(),
          filter = context.createBiquadFilter(),
          gain = context.createGain(),
          motor = context.createOscillator(),
          motorGain = context.createGain();
        source.buffer = noise;
        source.loop = true;
        filter.type = 'lowpass';
        gain.gain.value = 0;
        motorGain.gain.value = 0;
        motor.type = 'sine';
        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        motor.connect(motorGain);
        motorGain.connect(master);
        source.start();
        motor.start();
        ambient = { noise: source, filter, gain, motor, motorGain };
      }
      if (ambient) {
        const t = context.currentTime;
        ambient.filter.frequency.setTargetAtTime(
          c.rain ? 2400 : c.wind ? 800 : 280 + c.speed * 5,
          t,
          0.12,
        );
        ambient.gain.gain.setTargetAtTime(
          c.rain ? 0.075 : c.wind ? 0.05 : Math.min(0.055, c.speed * 0.0006),
          t,
          0.12,
        );
        ambient.motor.frequency.setTargetAtTime(55 + c.speed * 1.5, t, 0.12);
        ambient.motorGain.gain.setTargetAtTime(
          c.speed > 0 ? 0.022 : 0,
          t,
          0.12,
        );
      }
    },
    preview(s: SoundState) {
      if (!disposed) {
        stop();
        cue(s);
      }
    },
    stop,
    async dispose() {
      disposed = true;
      stop();
      master.disconnect();
      await context.close();
    },
  };
}
