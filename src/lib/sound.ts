let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) ctx = new Ctx();
  }
  return ctx;
}

function tone(freq: number, durMs: number, type: OscillatorType = 'sine', gainPeak = 0.12) {
  const a = getCtx();
  if (!a) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, a.currentTime);
  gain.gain.linearRampToValueAtTime(gainPeak, a.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + durMs / 1000);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + durMs / 1000);
}

export function soundAdd() {
  tone(660, 120, 'triangle', 0.08);
  setTimeout(() => tone(880, 80, 'triangle', 0.06), 70);
}

export function soundRemove() {
  tone(440, 80, 'sine', 0.05);
}

export function soundRare() {
  tone(587.33, 120, 'triangle', 0.08);
  setTimeout(() => tone(739.99, 120, 'triangle', 0.08), 90);
  setTimeout(() => tone(987.77, 180, 'triangle', 0.08), 180);
}

export function soundMythic() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => setTimeout(() => tone(n, 180, 'triangle', 0.09), i * 100));
}

export function soundFoil() {
  const notes = [1046.5, 1318.5, 1567.98, 2093];
  notes.forEach((n, i) => setTimeout(() => tone(n, 150, 'sine', 0.07), i * 60));
}

export function playForRarity(rarity: string, foil = false) {
  if (foil) soundFoil();
  else if (rarity === 'mythic') soundMythic();
  else if (rarity === 'rare') soundRare();
  else soundAdd();
}
