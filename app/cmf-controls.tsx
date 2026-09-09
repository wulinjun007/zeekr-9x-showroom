'use client';
import { useEffect, useState } from 'react';
import {
  cmfAssets,
  cmfOptions,
  cmfRecipes,
  cmfReset,
  type CmfKey,
} from './cmf';
import type { Settings } from './experience';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
const labels: Record<string, string[]> = {
  title: [
    '内饰材质工坊',
    'Interior materials',
    'Innenraummaterialien',
    '内装素材',
    'مواد المقصورة',
  ],
  seatMaterial: [
    '座椅与方向盘',
    'Seats & steering wheel',
    'Sitze & Lenkrad',
    'シート・ステアリング',
    'المقاعد والمقود',
  ],
  doorMaterial: [
    '门板与扶手',
    'Door panels',
    'Türverkleidung',
    'ドアパネル',
    'ألواح الأبواب',
  ],
  dashMaterial: [
    '仪表台表皮',
    'Dashboard',
    'Armaturenbrett',
    'ダッシュボード',
    'لوحة القيادة',
  ],
  roofMaterial: ['顶棚', 'Headliner', 'Dachhimmel', '天井', 'بطانة السقف'],
  carpetMaterial: ['地毯', 'Floor covering', 'Bodenbelag', 'フロア', 'الأرضية'],
  trimMaterial: [
    '门板饰条',
    'Door trim',
    'Türzierleisten',
    'ドアトリム',
    'زخرفة الأبواب',
  ],
  original: ['原始材质', 'Original', 'Original', '元の素材', 'الأصلي'],
  leather: [
    '细纹皮革',
    'Fine-grain leather',
    'Feinnarbiges Leder',
    '細粒レザー',
    'جلد ناعم',
  ],
  fabric: ['编织面料', 'Woven fabric', 'Gewebe', '織物', 'نسيج منسوج'],
  suede: [
    '绒面织物',
    'Suede textile',
    'Veloursstoff',
    'スエード調生地',
    'نسيج شمواه',
  ],
  pu: [
    '柔哑仿皮 · 示意',
    'Matte leatherette · study',
    'Kunstleder · Studie',
    '合皮・スタディ',
    'جلد صناعي · دراسة',
  ],
  soft: [
    '软质搪塑 · 示意',
    'Soft skin · study',
    'Softtouch · Studie',
    'ソフト表皮・スタディ',
    'سطح ناعم · دراسة',
  ],
  abs: [
    '细纹硬塑料 · 示意',
    'Hard polymer · study',
    'Hartkunststoff · Studie',
    '硬質樹脂・スタディ',
    'بوليمر صلب · دراسة',
  ],
  wood: ['深色木纹', 'Dark wood', 'Dunkles Holz', 'ダークウッド', 'خشب داكن'],
  aluminium: [
    '拉丝铝 · 示意',
    'Brushed aluminium · study',
    'Gebürstetes Alu · Studie',
    'ヘアラインアルミ・スタディ',
    'ألمنيوم مصقول · دراسة',
  ],
  carbon: [
    '碳纤维编织 · 示意',
    'Carbon weave · study',
    'Carbongewebe · Studie',
    'カーボン織柄・スタディ',
    'نسيج كربون · دراسة',
  ],
  rubber: [
    '橡胶 · 示意',
    'Rubber · study',
    'Gummi · Studie',
    'ゴム・スタディ',
    'مطاط · دراسة',
  ],
  warm: [
    '温暖皮革',
    'Warm leather',
    'Warmes Leder',
    '温かいレザー',
    'جلد دافئ',
  ],
  nordic: [
    '北欧织物',
    'Nordic textile',
    'Nordische Textilien',
    '北欧テキスタイル',
    'نسيج شمالي',
  ],
  sport: [
    '运动绒面',
    'Sport suede',
    'Sportlicher Velours',
    'スポーツスエード',
    'شمواه رياضي',
  ],
  reset: [
    '恢复全部原始材质',
    'Restore all materials',
    'Alles zurücksetzen',
    'すべて元に戻す',
    'استعادة جميع المواد',
  ],
  loading: [
    '正在加载扫描贴图…',
    'Loading scanned textures…',
    'Texturen werden geladen…',
    'テクスチャを読込中…',
    'جارٍ تحميل الخامات…',
  ],
  ready: [
    '材质已就绪',
    'Materials ready',
    'Materialien bereit',
    '素材の準備完了',
    'المواد جاهزة',
  ],
  error: [
    '贴图未加载成功，请重试',
    'Textures failed. Retry',
    'Texturfehler. Erneut versuchen',
    '読込失敗・再試行',
    'تعذر التحميل. أعد المحاولة',
  ],
};
export function CmfControls({
  s,
  update,
}: {
  s: Settings;
  update: (p: Partial<Settings>) => void;
}) {
  const [status, setStatus] = useState('ready');
  const i = ['zh', 'en', 'de', 'ja', 'ar'].indexOf(s.locale);
  const t = (k: string) => labels[k]?.[i] ?? k;
  useEffect(() => {
    const fn = (e: Event) => setStatus((e as CustomEvent<string>).detail);
    window.addEventListener('cmf-status', fn);
    return () => window.removeEventListener('cmf-status', fn);
  }, []);
  return (
    <div className="cmf-studio">
      <h3>{t('title')}</h3>
      <div className="cmf-recipes">
        {Object.entries(cmfRecipes).map(([id, p]) => (
          <button
            key={id}
            onClick={() =>
              update({
                ...p,
                seatStyle:
                  id === 'sport' ? 'blue' : id === 'warm' ? 'cognac' : 'ivory',
              })
            }
          >
            {t(id)}
          </button>
        ))}
      </div>
      {(Object.entries(cmfOptions) as [CmfKey, readonly string[]][]).map(
        ([key, values]) => (
          <div className="cmf-region" key={key}>
            <label id={'cmf-' + key}>{t(key)}</label>
            <Select
              value={s[key]}
              onValueChange={(v) => v && update({ [key]: v })}
            >
              <SelectTrigger aria-labelledby={'cmf-' + key}>
                <SelectValue>{t(s[key])}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {values.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cmfAssets[s[key]] && (
              <a
                href={'https://polyhaven.com/a/' + cmfAssets[s[key]]}
                target="_blank"
                rel="noreferrer"
              >
                Poly Haven · CC0 ↗
              </a>
            )}
          </div>
        ),
      )}
      <output className="cmf-status">{t(status)}</output>
      {status === 'error' && (
        <button onClick={() => window.dispatchEvent(new Event('cmf-retry'))}>
          {t('error')}
        </button>
      )}
      <button
        className="cmf-reset"
        onClick={() => update({ ...cmfReset, seatStyle: 'blue' })}
      >
        {t('reset')}
      </button>
      <p className="cmf-note">
        {s.locale === 'zh'
          ? '材质搭配概念，可逐区修改。扫描纹理不代表极氪原厂选装或 Nappa / Alcantara 品牌认证。'
          : 'Material design study; scanned textures do not represent ZEEKR options or Nappa / Alcantara certification.'}
      </p>
    </div>
  );
}
