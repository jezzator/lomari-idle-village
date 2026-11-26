// Lomari: Idle Village — geluidseffecten: korte, zachte klanken van hout, blad en belletjes, ter plekke gemaakt met Web Audio.
// Geen bestanden. Alles in een pentatonische toonladder, zodat snel tikken als een melodietje klinkt en nooit schuurt.
window.GELUID = (() => {
  let ctx = null, uit = null, aan = true, vol = 0.5, laatst = {};
  const PENTA = [0, 2, 4, 7, 9];
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const toon = i => 62 + 12 * Math.floor(i / 5) + PENTA[((i % 5) + 5) % 5];
  function start() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); uit = ctx.createGain(); uit.gain.value = vol * 0.6; uit.connect(ctx.destination); return true;
  }
  // Eén klank: sinus of driehoek met snelle aanslag en zacht uitsterven.
  function noot(f, t, lang, sterk = 0.3, golf = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = golf; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(sterk, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + lang);
    o.connect(g); g.connect(uit); o.start(t); o.stop(t + lang + 0.05);
  }
  // Een tik op hout: kort ruisje door een bandfilter plus een lage toon.
  function hout(t, f = 600, sterk = 0.25) {
    const n = Math.floor(ctx.sampleRate * 0.05), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 4; g.gain.value = sterk;
    s.connect(bp); bp.connect(g); g.connect(uit); s.start(t);
  }
  let tikI = 0;
  const KLANK = {
    tik: t => { tikI = (tikI + 1 + Math.floor(Math.random() * 2)) % 10; hout(t, 500 + Math.random() * 300); noot(hz(toon(tikI)), t, 0.25, 0.12, 'triangle'); },
    ritme: t => { [0, 2, 4].forEach((s, i) => noot(hz(toon(5 + s)), t + i * 0.06, 0.4, 0.14, 'triangle')); },
    koop: t => { hout(t, 350, 0.3); noot(hz(57), t, 0.3, 0.16, 'triangle'); noot(hz(64), t + 0.07, 0.35, 0.12); },
    upgrade: t => { noot(hz(69), t, 0.5, 0.15); noot(hz(76), t + 0.09, 0.6, 0.13); },
    fase: t => { [0, 2, 4, 5, 7].forEach((s, i) => noot(hz(toon(3 + s)), t + i * 0.1, 1.2 - i * 0.1, 0.16)); noot(hz(50), t, 1.6, 0.12, 'triangle'); },
    bouw: t => { hout(t, 900, 0.22); hout(t + 0.12, 800, 0.18); },
    vaardig: t => { for (let i = 0; i < 6; i++) noot(hz(toon(4 + i * 2)), t + i * 0.04, 0.6, 0.08); },
    gave: t => { noot(hz(81), t, 1.4, 0.12); noot(hz(88), t + 0.15, 1.2, 0.09); noot(hz(93), t + 0.3, 1.4, 0.07); },
    prest: t => { noot(hz(72), t, 0.7, 0.14); noot(hz(79), t + 0.14, 0.9, 0.14); },
    doel: t => { noot(hz(74), t, 0.5, 0.13); noot(hz(78), t + 0.1, 0.5, 0.12); noot(hz(81), t + 0.2, 0.9, 0.13); },
    tocht: t => { noot(hz(55), t, 0.9, 0.14, 'triangle'); noot(hz(62), t + 0.2, 1.1, 0.12, 'triangle'); },
    bol: t => { noot(hz(88), t, 0.4, 0.1); noot(hz(93), t + 0.05, 0.5, 0.08); },
    help: t => hout(t, 1100, 0.2),
  };
  // Dezelfde klank niet vaker dan nodig: veel tegelijk wordt rommelig.
  const RUST = { tik: 0.05, help: 0.05, koop: 0.08, bouw: 0.1 };
  function speel(soort) {
    if (!aan || !KLANK[soort] || !start() || ctx.state === 'closed') return;
    const nu = ctx.currentTime; if (nu - (laatst[soort] || -9) < (RUST[soort] ?? 0.3)) return; laatst[soort] = nu;
    KLANK[soort](nu + 0.01);
  }
  function instel(a, v) { aan = a; vol = v; if (uit) uit.gain.value = vol * 0.6; }
  return { speel, instel };
})();
