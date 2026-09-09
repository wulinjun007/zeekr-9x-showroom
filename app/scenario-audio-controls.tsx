'use client';
import { useEffect, useRef, useState } from 'react';
import type { Settings } from './experience';
import { createScenarioAudio } from './scenario-audio';
import { Volume2, VolumeX, Play } from 'lucide-react';
const copy = {
  zh: [
    '场景音效',
    '启用联动音效',
    '静音',
    '试听当前音效',
    '音量',
    '合成演示音效 · 随场景进度播放，暂停即停',
    '声音不可用，请检查浏览器的声音设置后重试。',
  ],
  en: [
    'Scene audio',
    'Enable scene audio',
    'Mute',
    'Preview sound',
    'Volume',
    'Synthesised demo audio · follows playback and pauses with it',
    'Audio unavailable. Check browser sound settings and retry.',
  ],
  de: [
    'Szenenklang',
    'Szenenklang aktivieren',
    'Stumm',
    'Klang anhören',
    'Lautstärke',
    'Synthetischer Demo-Klang · folgt der Wiedergabe',
    'Audio nicht verfügbar. Browsereinstellungen prüfen.',
  ],
  ja: [
    'シーン音声',
    '連動音声を有効化',
    'ミュート',
    '音を試聴',
    '音量',
    '合成デモ音声 · シーンと同期して再生・停止',
    '音声を再生できません。ブラウザの設定を確認してください。',
  ],
  ar: [
    'صوت المشهد',
    'تفعيل صوت المشهد',
    'كتم الصوت',
    'معاينة الصوت',
    'مستوى الصوت',
    'صوت تجريبي مركّب يتبع تشغيل المشهد وإيقافه',
    'الصوت غير متاح. تحقق من إعدادات المتصفح.',
  ],
};
export function ScenarioAudioControls({ s }: { s: Settings }) {
  const [enabled, setEnabled] = useState(false),
    [volume, setVolume] = useState(0.35),
    [error, setError] = useState(false);
  const engine = useRef<ReturnType<typeof createScenarioAudio> | null>(null),
    alive = useRef(true),
    current = useRef({ s, enabled });
  const c = copy[s.locale] || copy.en;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      const a = engine.current;
      engine.current = null;
      void a?.dispose();
    };
  }, []);
  useEffect(() => {
    current.current = { s, enabled };
    if (!enabled || document.hidden) engine.current?.stop();
    else engine.current?.update(s);
  }, [s, enabled]);
  useEffect(() => {
    const onVisibility = () => {
      const v = current.current;
      if (document.hidden) engine.current?.stop();
      else if (v.enabled) engine.current?.update(v.s);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  async function getAudio() {
    if (!engine.current)
      engine.current = createScenarioAudio(new AudioContext());
    const a = engine.current;
    a.volume(volume);
    await a.unlock();
    return alive.current && engine.current === a ? a : null;
  }
  async function toggle() {
    if (enabled) {
      engine.current?.stop();
      setEnabled(false);
      return;
    }
    try {
      const a = await getAudio();
      if (a) {
        setError(false);
        setEnabled(true);
      }
    } catch {
      if (alive.current) setError(true);
    }
  }
  async function preview() {
    try {
      const a = await getAudio();
      if (a) {
        setError(false);
        a.preview(s);
      }
    } catch {
      if (alive.current) setError(true);
    }
  }
  return (
    <section className="scenario-audio" aria-label={c[0]}>
      <h3>
        <Volume2 size={16} />
        {c[0]}
      </h3>
      <div className="button-pair">
        <button
          type="button"
          className="audio-toggle"
          aria-pressed={enabled}
          onClick={toggle}
        >
          {enabled ? <VolumeX size={15} /> : <Volume2 size={15} />}{' '}
          {c[enabled ? 2 : 1]}
        </button>
        <button type="button" onClick={preview}>
          <Play size={14} />
          {c[3]}
        </button>
      </div>
      <label className="audio-volume">
        {c[4]} <output>{Math.round(volume * 100)}%</output>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          aria-label={c[4]}
          value={Math.round(volume * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            setVolume(v);
            engine.current?.volume(v);
          }}
        />
      </label>
      <p className="fineprint">{c[5]}</p>
      {error && (
        <p role="alert" className="fineprint">
          {c[6]}
        </p>
      )}
    </section>
  );
}
