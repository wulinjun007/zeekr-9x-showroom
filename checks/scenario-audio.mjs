import assert from 'node:assert/strict';
import { scenarios } from '../app/scenarios.ts';
import { soundCue } from '../app/scenario-audio.ts';
const motifs = new Set();
for (const scenario of scenarios) {
  for (const progress of [0, 0.3, 0.6, 0.99]) {
    const cue = soundCue({
      hmi: scenario.id,
      progress,
      playing: true,
      weather: 'clear',
    });
    assert(
      cue.notes.length > 0 &&
        cue.notes.every((f) => Number.isFinite(f) && f > 20 && f < 20000),
    );
    assert(Number.isFinite(cue.speed));
    if (progress === 0) motifs.add(cue.notes.join(','));
  }
}
assert(motifs.size >= 15);
const cue = (hmi, progress) =>
  soundCue({ hmi, progress, playing: true, weather: 'clear' });
assert.equal(cue('takeover', 0.3).urgent, true);
assert.notEqual(cue('takeover', 0.3).key, cue('takeover', 0.4).key);
assert.equal(cue('navigation', 0.3).key, cue('navigation', 0.4).key);
assert.equal(
  soundCue({ hmi: 'startup', progress: 0, playing: true, weather: 'storm' })
    .rain,
  true,
);
console.log(
  `PASS: ${scenarios.length} scenarios, ${motifs.size} distinct motifs, repeated alerts and rain mapping`,
);
