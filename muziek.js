// Lomari: Idle Village — muziek: zachte klankvelden, ter plekke gemaakt met Web Audio (geen bestanden, geen auteursrecht).
// Overdag warmer en lichter, 's nachts lager en stiller. Begint pas na de eerste tik; stopt als de app op de achtergrond staat.
window.MUZIEK = (() => {
  let ctx = null, uit = null, galm = null, filt = null, aan = false, vol = 0.5, nacht = false, timers = [], verborgen = false;
  // Toonsoorten: dag in D dorisch (warm), nacht in A eolisch, een octaaf lager.
  const DAG = { grond: 50, akk: [[0, 7, 10, 14], [-2, 5, 9, 14], [3, 7, 10, 15], [5, 9, 12, 16], [-4, 3, 7, 10]], bel: [62, 64, 65, 69, 72, 74, 76], kleur: 1400, chordSec: 11, belKans: 0.7 };
  const NACHT = { grond: 45, akk: [[0, 7, 12, 15], [-4, 3, 8, 12], [-2, 5, 10, 14], [-5, 2, 7, 10]], bel: [57, 60, 62, 64, 67, 69], kleur: 750, chordSec: 15, belKans: 0.35 };
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const kies = a => a[Math.floor(Math.random() * a.length)];
  const later = (f, ms) => { const id = setTimeout(() => { timers = timers.filter(x => x !== id); f(); }, ms); timers.push(id); };

  function galmImpuls(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.5; }
    return b;
  }
  function maak() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    uit = ctx.createGain(); uit.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = DAG.kleur; filt.Q.value = 0.3;
    galm = ctx.createConvolver(); galm.buffer = galmImpuls(5);
    const nat = ctx.createGain(); nat.gain.value = 0.55;
    filt.connect(uit); galm.connect(nat); nat.connect(uit); uit.connect(comp); comp.connect(ctx.destination);
    return true;
  }
  const stand = () => nacht ? NACHT : DAG;
  const doelVol = () => aan && !verborgen ? vol * vol * 0.6 : 0;

  // Eén laag akkoord: per toon twee licht ontstemde oscillatoren, traag aanzwellen en wegebben.
  function akkoord() {
    if (!aan || !ctx || ctx.state !== 'running') return;
    const s = stand(), t = ctx.currentTime, duur = s.chordSec * 1.9, akk = kies(s.akk);
    akk.forEach((iv, i) => {
      const g = ctx.createGain(), piek = (i === 0 ? 0.11 : 0.07) * (nacht ? 0.8 : 1);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(piek, t + duur * 0.35); g.gain.linearRampToValueAtTime(piek * 0.8, t + duur * 0.6); g.gain.linearRampToValueAtTime(0, t + duur);
      g.connect(filt); const gg = ctx.createGain(); gg.gain.value = 0.35; g.connect(gg); gg.connect(galm);
      [-5, 5].forEach(det => {
        const o = ctx.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = hz(s.grond + iv - (i === 0 ? 12 : 0)); o.detune.value = det + (Math.random() * 4 - 2);
        o.connect(g); o.start(t); o.stop(t + duur + 0.1);
      });
    });
    later(akkoord, s.chordSec * 1000 * (0.85 + Math.random() * 0.3));
  }
  // Losse belletjes en af en toe een fluitachtige toon, vooral in de galm.
  function bel() {
    if (!aan || !ctx || ctx.state !== 'running') return;
    const s = stand();
    if (Math.random() < s.belKans) {
      const t = ctx.currentTime, f = hz(kies(s.bel) + (Math.random() < 0.25 ? 12 : 0)), g = ctx.createGain(), sterk = 0.045;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(sterk, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      g.connect(galm); const d = ctx.createGain(); d.gain.value = 0.4; g.connect(d); d.connect(filt);
      [[1, 1], [2.76, 0.25], [5.4, 0.08]].forEach(([r, a]) => {
        const o = ctx.createOscillator(), ga = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r; ga.gain.value = a;
        o.connect(ga); ga.connect(g); o.start(t); o.stop(t + 4.1);
      });
    } else if (Math.random() < 0.3) fluit();
    later(bel, (nacht ? 7000 : 4500) + Math.random() * 7000);
  }
  function fluit() {
    const s = stand(), t = ctx.currentTime, d = 5 + Math.random() * 3, o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o.frequency.value = hz(kies(s.bel)); lfo.frequency.value = 4.5; lg.gain.value = 3; lfo.connect(lg); lg.connect(o.detune);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 1.5); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(g); g.connect(filt); g.connect(galm); o.start(t); lfo.start(t); o.stop(t + d + 0.1); lfo.stop(t + d + 0.1);
  }

  function stopLussen() { timers.forEach(clearTimeout); timers = []; }
  function startLussen() { stopLussen(); akkoord(); later(bel, 3000); }
  function zetVolume(snel) { if (uit) uit.gain.setTargetAtTime(doelVol(), ctx.currentTime, snel ? 0.1 : 1.2); }

  function speel() {
    if (!aan || verborgen) return;
    if (!ctx && !maak()) return;
    const go = () => { zetVolume(); if (!timers.length) startLussen(); };
    ctx.state === 'running' ? go() : ctx.resume().then(go).catch(() => {});
  }
  function pauze() { stopLussen(); if (ctx) { zetVolume(true); setTimeout(() => { if (!aan || verborgen) ctx.suspend().catch(() => {}); }, 400); } }

  // Browsers en Android laten pas geluid toe na een tik.
  const ontgrendel = () => { if (aan) speel(); };
  ['pointerdown', 'keydown', 'touchend'].forEach(e => document.addEventListener(e, ontgrendel, { passive: true }));
  document.addEventListener('visibilitychange', () => { verborgen = document.hidden; verborgen ? pauze() : speel(); });

  return {
    staat: () => ctx ? ctx.state : 'geen',
    instel(a, v) { aan = !!a; vol = Math.max(0, Math.min(1, v)); aan ? speel() : pauze(); zetVolume(); },
    nacht(n) {
      n = !!n; if (n === nacht) return; nacht = n;
      if (filt) filt.frequency.setTargetAtTime(stand().kleur, ctx.currentTime, 8);
    }
  };
})();
