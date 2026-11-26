// Lomari: Idle Village — muziek: zachte klankvelden, ter plekke gemaakt met Web Audio (geen bestanden, geen auteursrecht).
// Het spel wisselt tussen stukken, elk met een eigen toonsoort, akkoordgang, klank en tempo. Binnen een stuk groeit en krimpt
// Eigen nummers in muziek/ gaan voor; waar die ontbreken, speelt de gegenereerde muziek.
// de muziek (eerst alleen klankveld, dan bas, harp-melodie en belletjes) en de melodie herhaalt en varieert haar eigen motieven.
// Overdag lichter en warmer, 's nachts lager en stiller. Begint pas na de eerste tik; stopt als de app op de achtergrond staat.
window.MUZIEK = (() => {
  let ctx = null, uit = null, galm = null, filt = null, aan = false, vol = 0.5, nacht = false, timers = [], verborgen = false;
  const S = { dor: [0, 2, 3, 5, 7, 9, 10], eol: [0, 2, 3, 5, 7, 8, 10], lyd: [0, 2, 4, 6, 7, 9, 11], mix: [0, 2, 4, 5, 7, 9, 10], ion: [0, 2, 4, 5, 7, 9, 11], fry: [0, 1, 3, 5, 7, 8, 10] };
  // prog: trappen in de toonladder (0 = grondtoon). klank: warm, koor of glas. mel: hoe vaak de harp speelt.
  const DAG = [
    { naam: 'Ochtendmos', grond: 50, sch: S.dor, prog: [0, 3, 6, 4, 0, 5, 3, 4], sec: 9, klank: 'warm', mel: 0.7, kleur: 1500 },
    { naam: 'Kroonlicht', grond: 53, sch: S.lyd, prog: [0, 1, 0, 4, 5, 1, 3, 4], sec: 8, klank: 'glas', mel: 0.8, kleur: 1900 },
    { naam: 'Oude bron', grond: 48, sch: S.mix, prog: [0, 6, 3, 0, 4, 6, 5, 0], sec: 10, klank: 'koor', mel: 0.5, kleur: 1300 },
    { naam: 'Werkplaats', grond: 55, sch: S.ion, prog: [0, 5, 3, 4, 0, 2, 5, 4], sec: 7, klank: 'warm', mel: 0.9, kleur: 1700 },
    { naam: 'Wortelpad', grond: 52, sch: S.eol, prog: [0, 5, 2, 6, 0, 3, 4, 4], sec: 9, klank: 'glas', mel: 0.6, kleur: 1400 }
  ];
  const NACHT = [
    { naam: 'Nevel', grond: 45, sch: S.eol, prog: [0, 5, 3, 4, 0, 6, 5, 4], sec: 13, klank: 'koor', mel: 0.35, kleur: 800 },
    { naam: 'Sterrenwacht', grond: 47, sch: S.dor, prog: [0, 3, 0, 6, 2, 3, 4, 0], sec: 12, klank: 'glas', mel: 0.45, kleur: 1000 },
    { naam: 'Diepte', grond: 43, sch: S.fry, prog: [0, 1, 0, 6, 5, 1, 3, 0], sec: 14, klank: 'warm', mel: 0.3, kleur: 700 },
    { naam: 'Wake', grond: 48, sch: S.eol, prog: [0, 2, 5, 3, 0, 4, 6, 0], sec: 12, klank: 'koor', mel: 0.4, kleur: 900 }
  ];
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const kies = a => a[Math.floor(Math.random() * a.length)];
  const kans = p => Math.random() < p;
  const later = (f, ms) => { const id = setTimeout(() => { timers = timers.filter(x => x !== id); f(); }, ms); timers.push(id); };

  // Eigen nummers (mp3 in muziek/). Heeft dag of nacht geen nummers, dan speelt daar de gegenereerde muziek.
  const NUMMERS = { dag: ['muziek/dag-1.mp3'], nacht: [] };
  let speler = null, bg = null, nummer = '';
  const lijst = () => NUMMERS[nacht ? 'nacht' : 'dag'];
  const bestandModus = () => lijst().length > 0;
  function maakSpeler() {
    speler = new Audio(); speler.preload = 'auto';
    bg = ctx.createGain(); bg.gain.value = 1.6; ctx.createMediaElementSource(speler).connect(bg); bg.connect(uit);
    speler.addEventListener('ended', () => { if (aan && !verborgen) bestandModus() ? speelNummer() : maat(); });
    speler.addEventListener('error', () => { NUMMERS.dag = NUMMERS.dag.filter(x => x !== nummer); NUMMERS.nacht = NUMMERS.nacht.filter(x => x !== nummer); if (aan && !verborgen) bestandModus() ? speelNummer() : maat(); });
  }
  function speelNummer(hervat) {
    if (!speler) maakSpeler();
    const l = lijst(); if (!l.length) return;
    bg.gain.cancelScheduledValues(ctx.currentTime); bg.gain.setValueAtTime(1.6, ctx.currentTime);
    if (!(hervat && l.includes(nummer) && speler.src)) {
      let n; do n = kies(l); while (l.length > 1 && n === nummer);
      nummer = n; speler.src = n;
    }
    speler.play().catch(() => {});
  }
  // Bij de overgang naar dag of nacht: zacht wegfaden en overstappen op wat bij het uur hoort.
  function wissel() {
    if (!aan || verborgen || !ctx || ctx.state !== 'running') return;
    const spelend = speler && !speler.paused;
    if (!spelend && !bestandModus()) { if (stuk) lengte = Math.min(lengte, stap + 2); return; }
    stopLussen();
    if (spelend) bg.gain.setTargetAtTime(0, ctx.currentTime, 1);
    later(() => { if (speler) speler.pause(); bestandModus() ? speelNummer() : (stuk && (stap = lengte), maat()); }, spelend ? 4000 : 0);
  }

  // Speelstand van het huidige stuk
  let stuk = null, vorigStuk = null, stap = 0, lengte = 0, trans = 0, motief = null;
  const noot = (d, oct = 0) => stuk.grond + trans + stuk.sch[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);

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
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1400; filt.Q.value = 0.3;
    galm = ctx.createConvolver(); galm.buffer = galmImpuls(5);
    const nat = ctx.createGain(); nat.gain.value = 0.55;
    filt.connect(uit); galm.connect(nat); nat.connect(uit); uit.connect(comp); comp.connect(ctx.destination);
    return true;
  }
  const doelVol = () => aan && !verborgen ? vol * vol * 0.6 : 0;
  const naar = (node, galmDeel) => { const g = ctx.createGain(); g.connect(filt); const gg = ctx.createGain(); gg.gain.value = galmDeel; g.connect(gg); gg.connect(galm); return g; };

  // ---------- klanken ----------
  function veld(midi, t, duur, sterk) {
    const g = naar(null, 0.35);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(sterk, t + duur * 0.3); g.gain.linearRampToValueAtTime(sterk * 0.75, t + duur * 0.65); g.gain.linearRampToValueAtTime(0, t + duur);
    const k = stuk.klank, f = hz(midi), eind = t + duur + 0.1;
    if (k === 'koor') {
      // zachte stem: zaagtand door twee klinkerfilters, met lichte vibrato
      [500, 1100].forEach((fq, i) => {
        const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), a = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = i ? 6 : -6; bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 4; a.gain.value = i ? 0.5 : 0.8;
        lfo.frequency.value = 4 + Math.random(); lg.gain.value = 4; lfo.connect(lg); lg.connect(o.detune);
        o.connect(bp); bp.connect(a); a.connect(g); o.start(t); lfo.start(t); o.stop(eind); lfo.stop(eind);
      });
    } else if (k === 'glas') {
      // glazige toon: grondtoon plus octaaf, langzaam trillend
      const trem = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      trem.gain.value = 0.8; lfo.frequency.value = 0.3 + Math.random() * 0.4; lg.gain.value = 0.2; lfo.connect(lg); lg.connect(trem.gain); trem.connect(g);
      [[1, 1], [2, 0.3], [3, 0.08]].forEach(([r, a]) => { const o = ctx.createOscillator(), ga = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r; o.detune.value = Math.random() * 6 - 3; ga.gain.value = a; o.connect(ga); ga.connect(trem); o.start(t); o.stop(eind); });
      lfo.start(t); lfo.stop(eind);
    } else {
      [-5, 5].forEach(det => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det + Math.random() * 4 - 2; o.connect(g); o.start(t); o.stop(eind); });
    }
  }
  function bas(midi, t, duur) {
    const g = naar(null, 0.15), o = ctx.createOscillator();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.13, t + 1.5); g.gain.linearRampToValueAtTime(0, t + duur);
    o.type = 'sine'; o.frequency.value = hz(midi); o.connect(g); o.start(t); o.stop(t + duur + 0.1);
  }
  function harp(midi, t, sterk) {
    const g = naar(null, 0.6), o = ctx.createOscillator(), o2 = ctx.createOscillator(), a2 = ctx.createGain(), lp = ctx.createBiquadFilter();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(sterk, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(3500, t); lp.frequency.exponentialRampToValueAtTime(600, t + 1.5);
    o.type = 'triangle'; o.frequency.value = hz(midi); o2.type = 'sine'; o2.frequency.value = hz(midi) * 2; a2.gain.value = 0.25;
    o.connect(lp); o2.connect(a2); a2.connect(lp); lp.connect(g); o.start(t); o2.start(t); o.stop(t + 3.1); o2.stop(t + 3.1);
  }
  function bel(midi, t) {
    const g = ctx.createGain(); g.connect(galm); const d = ctx.createGain(); d.gain.value = 0.3; g.connect(d); d.connect(filt);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
    [[1, 1], [2.76, 0.25], [5.4, 0.08]].forEach(([r, a]) => { const o = ctx.createOscillator(), ga = ctx.createGain(); o.type = 'sine'; o.frequency.value = hz(midi) * r; ga.gain.value = a; o.connect(ga); ga.connect(g); o.start(t); o.stop(t + 4.1); });
  }

  // ---------- melodie: motieven die terugkomen en veranderen ----------
  function nieuwMotief() {
    const n = 3 + Math.floor(Math.random() * 4), m = []; let d = kies([0, 2, 4]), tel = 0;
    for (let i = 0; i < n; i++) { m.push({ d, tel }); d += kies([-2, -1, -1, 1, 1, 2, 3]); tel += kies([1, 1, 2, 2, 3, 0.5]); }
    return m;
  }
  function speelMotief(akk, t0, tel) {
    if (!motief || kans(0.3)) motief = nieuwMotief();
    else if (kans(0.5)) motief = motief.map((x, i) => i === motief.length - 1 ? { ...x, d: x.d + kies([-1, 1, 2]) } : x); // kleine variatie op het slot
    const hoog = nacht ? 7 : kies([7, 7, 14]);
    motief.forEach(x => { if (t0 + x.tel * tel < ctx.currentTime + stuk.sec) harp(noot(akk + x.d + hoog), t0 + x.tel * tel, nacht ? 0.05 : 0.07); });
  }

  // ---------- het stuk: opbouw, hoogtepunt, afbouw ----------
  function nieuwStuk() {
    const pool = nacht ? NACHT : DAG;
    do stuk = kies(pool); while (pool.length > 1 && stuk === vorigStuk);
    vorigStuk = stuk; stap = 0; lengte = 12 + Math.floor(Math.random() * 9); trans = kies([0, 0, -2, 2, -5]); motief = null;
    if (filt) filt.frequency.setTargetAtTime(stuk.kleur, ctx.currentTime, 4);
  }
  function maat() {
    if (!aan || !ctx || ctx.state !== 'running') return;
    if (!stuk || stap >= lengte) {
      const eerst = !stuk; nieuwStuk();
      if (!eerst) { later(maat, (4 + Math.random() * 6) * 1000); stap = 0; return; } // korte stilte tussen stukken
    }
    const t = ctx.currentTime + 0.05, sec = stuk.sec * (0.92 + Math.random() * 0.16), akk = stuk.prog[stap % stuk.prog.length];
    const boog = Math.sin(Math.PI * (stap + 0.5) / lengte); // 0 aan begin en eind, 1 in het midden
    const sterk = (nacht ? 0.06 : 0.075) * (0.7 + 0.3 * boog);
    // akkoord: grondtoon, terts, kwint, soms septiem of none, in een wisselende ligging
    const tonen = [0, 2, 4].concat(kans(0.4) ? [6] : kans(0.3) ? [8] : []);
    const lig = kies([0, 0, 7]);
    tonen.forEach((x, i) => veld(noot(akk + (i && lig && x < 4 ? x + 7 : x)), t, sec * 1.8, sterk * (i ? 0.8 : 1)));
    if (stap >= 2 || kans(0.3)) bas(noot(akk, -1), t, sec * 1.6);
    const tel = sec / 8;
    if (stap >= 3 && stap < lengte - 1 && kans(stuk.mel * (0.4 + 0.6 * boog))) speelMotief(akk, t + kies([0, 2, 4]) * tel, tel);
    if (boog > 0.6 && kans(0.5)) bel(noot(akk + kies([0, 2, 4]), 2), t + kies([3, 5, 6]) * tel);
    stap++;
    later(maat, sec * 1000);
  }

  function stopLussen() { timers.forEach(clearTimeout); timers = []; }
  function zetVolume(snel) { if (uit) uit.gain.setTargetAtTime(doelVol(), ctx.currentTime, snel ? 0.1 : 1.2); }

  function speel() {
    if (!aan || verborgen) return;
    if (!ctx && !maak()) return;
    const go = () => { zetVolume(); if (bestandModus()) { if (!speler || speler.paused) { stopLussen(); speelNummer(true); } } else if (!timers.length) maat(); };
    ctx.state === 'running' ? go() : ctx.resume().then(go).catch(() => {});
  }
  function pauze() { stopLussen(); if (speler) setTimeout(() => { if (!aan || verborgen) speler.pause(); }, 400); if (ctx) { zetVolume(true); setTimeout(() => { if (!aan || verborgen) ctx.suspend().catch(() => {}); }, 400); } }

  // Browsers en Android laten pas geluid toe na een tik.
  const ontgrendel = () => { if (aan) speel(); };
  ['pointerdown', 'keydown', 'touchend'].forEach(e => document.addEventListener(e, ontgrendel, { passive: true }));
  document.addEventListener('visibilitychange', () => { verborgen = document.hidden; verborgen ? pauze() : speel(); });

  return {
    staat: () => ctx ? ctx.state : 'geen',
    stuk: () => speler && !speler.paused ? nummer : stuk ? stuk.naam : '',
    instel(a, v) { aan = !!a; vol = Math.max(0, Math.min(1, v)); aan ? speel() : pauze(); zetVolume(); },
    // Bij de overgang naar dag of nacht rondt het huidige stuk binnen twee akkoorden af; daarna volgt een stuk dat bij het uur past.
    nacht(n) { n = !!n; if (n === nacht) return; nacht = n; wissel(); }
  };
})();
