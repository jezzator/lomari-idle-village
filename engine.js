/* Lomari: Idle Village — rekenmotor. Puur rekenwerk op een state-object S, geen DOM.
   Dezelfde functies draaien het spel én de balanstest. */
window.ENGINE = (() => {
  const D = window.DATA, LM = window.LOM, { RES, BAL, B } = D, C = LM.CFG;
  const RK = Object.keys(RES), BK = Object.keys(B);
  const fx = id => (D.U.find(u => u.id === id) || D.STAR.find(n => n.id === id)).fx;

  function nieuw(prev) {
    const S = {
      v: 1, r: {}, n: {}, fase: {}, open: [...D.START_OPEN], up: {}, magie: 0,
      nova: prev ? prev.nova : 0, novaUit: prev ? prev.novaUit : 0, star: prev ? prev.star : {},
      ach: prev ? prev.ach : {}, runs: prev ? prev.runs : 0,
      earned: 0, energieTot: 0, houtTot: 0, t: Date.now(), start: prev ? prev.start : Date.now(),
      rondeStart: Date.now(), verzamelT: 0, instel: prev ? prev.instel : { offlineMelding: true },
      lom: prev ? prev.lom || {} : {}, ooit: prev ? prev.ooit || {} : {}, vondsten: [], vondstTot: prev ? prev.vondstTot || 0 : 0,
      vondstBonus: prev ? prev.vondstBonus || {} : {}, vondstT: 0, lichtT: 0, bol: null, gebeurtenissen: prev ? prev.gebeurtenissen || 0 : 0, tikken: prev ? prev.tikken || 0 : 0,
    };
    RK.forEach(k => S.r[k] = 0); BK.forEach(b => { S.n[b] = 0; S.fase[b] = 1; });
    S.r.hout = 30; S.r.voedsel = 150; S.n.bessen = 1;
    const m = mods(S);
    for (const [k, v] of Object.entries(m.start)) S.r[k] += v;
    m.startOpen.forEach(d => S.open.includes(d) || S.open.push(d));
    for (const id in S.lom) { const l = S.lom[id]; l.reis = 0; if (l.d && !S.open.includes(l.d)) l.d = null; }
    if (prev?.n?.oudebron) { S.n.oudebron = 1; S.fase.oudebron = Math.min(5, (prev.fase.oudebron || 1) + 1); }   // De oude bron blijft en groeit
    return S;
  }

  // ---------- Lomari: waar staan ze, welke verbindingen, welke Verbanden ----------
  const lomDef = id => LM.L.find(l => l.id === id);
  const plek = (S, id) => { const l = S.lom[id]; if (!l) return null; if (l.reis > 0) return null; return l.d; };
  const verbandPlek = (S, id) => { const l = S.lom[id]; if (!l || l.reis > 0) return null; return l.d || lomDef(id).d; };
  function verbindingen(S) {
    return LM.VERB.slice(0, LM.VERB_GRATIS + S.n.brug).filter(([a, b]) => S.open.includes(a) && S.open.includes(b));
  }
  function verbonden(S, a, b, rivier, lijst = verbindingen(S)) {
    if (a === b) return true;
    if ((a === 'Kroveli' || b === 'Kroveli') && ['piko', 'kavo'].some(id => plek(S, id) === 'Kroveli')) return true;
    if (rivier && (a === 'Lomavii' || b === 'Lomavii') && S.open.includes(a) && S.open.includes(b)) return true;
    return lijst.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  }
  function verbandActief(S, v, rivier, lijst) {
    const p = v.leden.map(id => verbandPlek(S, id));
    if (p.some(x => !x)) return false;
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (!verbonden(S, p[i], p[j], rivier, lijst)) return false;
    return true;
  }
  const xpNodig = band => C.xpBasis * C.xpGroei ** band;
  const echteOpen = S => S.open.filter(d => D.DISTRICTS[d]).length;
  const inDistrict = (S, d) => Object.keys(S.lom).filter(id => plek(S, id) === d);

  // Alle effecten samengevoegd: upgrades, Sterrenstam, prestaties, vondsten, Lomari, Verbanden
  function mods(S) {
    const m = { res: {}, dist: {}, kost: 1, opslag: 1, onderhoud: 1, bed: {}, brug: .04, perDistrict: 0,
      faseKost: 1, auto: {}, offline: BAL.offlineUren, magieMax: BAL.magieMax, start: {}, startOpen: [], faseMin: 0,
      verzamel: 1, capD: {}, capRes: {}, kostRes: {}, faseHoog: 1, ketenIn: 1, upKost: 1, offlineEff: 0, tev: {}, drukte: 0,
      verbandPlus: 0, verbind: 0, vondst: 0, vondstX: 1, licht: 0, lichtDuur: 1, lichtX: 1, reis: 1, rivier: false, novaX: 1,
      magieE: 1, offlineEnergie: 1, veyra: false, verbanden: [], tikX: 1, tikRes: [], ritme: false, tikLomari: 0, tikSec: BAL.verzamelSec, mandSec: 10 };
    const zet = (e, s = 1) => {               // s = sterkte (1 of 0,4); vermenigvuldigers schalen als 1 + (x−1)·s
      const sx = x => 1 + (x - 1) * s;
      if (e.t === 'prod') { if (e.res) m.res[e.res] = (m.res[e.res] || 1) * sx(e.x); else m.dist[e.d] = (m.dist[e.d] || 1) * sx(e.x); }
      else if (e.t === 'kost') m.kost *= e.x;
      else if (e.t === 'opslag') m.opslag *= e.x;
      else if (e.t === 'onderhoud') m.onderhoud *= sx(e.x);
      else if (e.t === 'bed') m.bed[e.b] = (m.bed[e.b] || 0) + e.plus;
      else if (e.t === 'brug') m.brug += e.plus;
      else if (e.t === 'perDistrict') m.perDistrict += e.plus;
      else if (e.t === 'faseKost') m.faseKost *= e.x;
      else if (e.t === 'auto') m.auto[e.id] = true;
      else if (e.t === 'offline') m.offline += e.uren;
      else if (e.t === 'magieMax') m.magieMax += e.plus;
      else if (e.t === 'start') for (const [k, v] of Object.entries(e.r)) m.start[k] = (m.start[k] || 0) + v;
      else if (e.t === 'startOpen') m.startOpen.push(e.d);
      else if (e.t === 'faseBij') m.faseMin += e.min;
      else if (e.t === 'verzamel') m.verzamel *= sx(e.x);
      else if (e.t === 'capD') for (const k of LM.OPSLAG_D[e.d] || []) m.capD[k] = (m.capD[k] || 1) * sx(e.x);
      else if (e.t === 'capRes') m.capRes[e.res] = (m.capRes[e.res] || 1) * sx(e.x);
      else if (e.t === 'kostRes') for (const k of e.res) m.kostRes[k] = (m.kostRes[k] || 1) * sx(e.x);
      else if (e.t === 'faseHoog') m.faseHoog *= sx(e.x);
      else if (e.t === 'ketenIn') m.ketenIn *= sx(e.x);
      else if (e.t === 'upKost') m.upKost *= sx(e.x);
      else if (e.t === 'offlineEff') m.offlineEff += e.plus * s;
      else if (e.t === 'tev') m.tev[e.d] = (m.tev[e.d] || 0) + e.plus * s;
      else if (e.t === 'drukte') m.drukte += Math.floor(e.plus * s);
      else if (e.t === 'verband') m.verbandPlus += e.plus * s;
      else if (e.t === 'verbind') m.verbind += e.plus * s;
      else if (e.t === 'vondst') m.vondst += e.plus * s;
      else if (e.t === 'vondstX') m.vondstX *= sx(e.x);
      else if (e.t === 'licht') m.licht = e.sec / s;
      else if (e.t === 'lichtX') { m.lichtDuur *= sx(e.duur); m.lichtX *= sx(e.x); }
      else if (e.t === 'reis') m.reis *= sx(e.x);
      else if (e.t === 'rivier') m.rivier = true;
      else if (e.t === 'nova') m.novaX *= sx(e.x);
      else if (e.t === 'magieE') m.magieE *= sx(e.x);
      else if (e.t === 'offlineEnergie') m.offlineEnergie *= sx(e.x);
      else if (e.t === 'veyra') m.veyra = true;
      else if (e.t === 'tikX') m.tikX *= e.x;
      else if (e.t === 'tikRes') m.tikRes.push(...e.res);
      else if (e.t === 'ritme') m.ritme = true;
      else if (e.t === 'nachtmanden') m.nachtmanden = true;
      else if (e.t === 'tikLomari') m.tikLomari += e.plus;
      else if (e.t === 'tikSec') m.tikSec = Math.max(m.tikSec, e.sec);
      else if (e.t === 'mandSec') m.mandSec = Math.min(m.mandSec, e.sec);
    };
    const ids = [...Object.keys(S.up).filter(k => S.up[k]), ...Object.keys(S.star).filter(k => S.star[k])];
    for (const id of ids) for (const e of fx(id)) zet(e);
    for (const [k, v] of Object.entries(S.vondstBonus || {})) m.res[k] = (m.res[k] || 1) * (1 + v);
    // Lomari: passief alleen als ingezet (niet onderweg); 100% in eigen district, anders 40% (Koro: overal 100%)
    for (const def of LM.L) {
      const l = S.lom?.[def.id], d = plek(S, def.id); if (!l || !d) continue;
      const s = def.overal || d === def.d ? 1 : C.buiten;
      for (const e of def.pas(l.band, d)) zet(e, s);
    }
    // Gebieden: bonus als hun Lomari er staan
    if (plek(S, 'nira') === 'Valunari') m.dist.Valunari = (m.dist.Valunari || 1) * 2;
    m.kroveliAlles = ['piko', 'kavo'].some(id => plek(S, id) === 'Kroveli');
    const wortel = ['veyra', 'varo', 'elomi'].filter(id => plek(S, id) === 'Lomaruun').length;
    if (wortel) m.dist.Lomaruun = (m.dist.Lomaruun || 1) * (1 + .25 * wortel);
    // Verbanden
    const lijst = verbindingen(S);
    m.rivier = LM.V.some(v => v.id === 'rivier' && !v.b && verbandActief(S, v, false, lijst));
    for (const v of LM.V) if (verbandActief(S, v, m.rivier, lijst)) {
      m.verbanden.push(v.id);
      if (!v.b && v.fx) for (const e of v.fx) zet(e, 1 + m.verbandPlus);
    }
    return m;
  }

  // Tevredenheid en verbindingen per district
  function tevredenheid(S, d, m = mods(S)) {
    const over = Math.max(0, inDistrict(S, d).length - (C.drukteGrens + m.drukte));
    return 100 + (m.tev[d] || 0) + Math.min(C.zangTevMax, C.zangTev * S.n.zangplek) - over * C.druktePerLomari;
  }
  const tevFactor = (S, d, m) => Math.min(C.tevMax, Math.max(C.tevMin, tevredenheid(S, d, m))) / 100;
  function verbindFactor(S, d, m, lijst) {
    let n = lijst.filter(([a, b]) => a === d || b === d).length;
    if (m.rivier) n = d === 'Lomavii' ? S.open.length - 1 : Math.max(n, lijst.some(([a, b]) => (a === d && b === 'Lomavii') || (b === d && a === 'Lomavii')) ? n : n + (S.open.includes('Lomavii') ? 1 : 0));
    return 1 + n * (C.verbindPct + m.verbind);
  }

  const achAantal = S => Object.values(S.ach).filter(Boolean).length;
  function globaal(S, m) {
    return (1 + m.brug * S.n.brug) * (S.n.oudebron ? 1 + .05 * S.fase.oudebron : 1) * 1.25 ** S.magie * (1 + BAL.novaPct * S.nova)
      * (1 + .01 * achAantal(S)) * (1 + m.perDistrict * S.open.length);
  }
  const bedden = (S, m) => BAL.startBedden + BK.reduce((a, b) => a + S.n[b] * ((B[b].bed || 0) + (B[b].bed ? (m.bed[b] || 0) : 0)), 0);
  const banen = S => BK.reduce((a, b) => a + S.n[b] * (B[b].w || 0), 0);
  const cap = (S, k, m) => (RES[k].cap + BK.reduce((a, b) => a + (B[b].o?.[k] || 0) * (BAL.opslagGroei ** S.n[b] - 1) / (BAL.opslagGroei - 1), 0))
    * m.opslag * (m.capD[k] || 1) * (m.capRes[k] || 1);

  // Productie en verbruik per seconde. Ketens kunnen stilvallen zonder input.
  function rates(S, m = mods(S), dt = 1) {
    const g = globaal(S, m), bed = bedden(S, m), job = banen(S), lijst = verbindingen(S);
    const staff = job ? Math.min(1, bed / job) : 1;
    const prod = {}, use = {}; RK.forEach(k => { prod[k] = 0; use[k] = 0; });
    const dF = {}; for (const d of [...Object.keys(D.DISTRICTS), ...Object.keys(D.GEBIEDEN)]) dF[d] = (m.dist[d] || 1) * tevFactor(S, d, m) * verbindFactor(S, d, m, lijst);
    const keten = [];
    for (const b of BK) {
      const x = B[b]; if (!x.p || !S.n[b]) continue;
      const f = S.n[b] * 2 ** (S.fase[b] - 1) * staff * g * BAL.productieSchaal * dF[x.d];
      if (x.c) { keten.push([b, f]); continue; }
      for (const [k, v] of Object.entries(x.p)) prod[k] += v * f * (m.res[k] || 1);
    }
    use.voedsel += BAL.onderhoud * Math.min(bed, job + BAL.startBedden) * m.onderhoud;
    for (const [b, f] of keten) {
      const x = B[b]; let ratio = 1;
      for (const [k, v] of Object.entries(x.c)) {
        const need = v * f * m.ketenIn * dt, have = S.r[k] + (prod[k] - use[k]) * dt;
        ratio = Math.min(ratio, need > 0 ? Math.max(0, have / need) : 1);
      }
      for (const [k, v] of Object.entries(x.c)) use[k] += v * f * m.ketenIn * ratio;
      for (const [k, v] of Object.entries(x.p)) prod[k] += v * f * ratio * (m.res[k] || 1);
    }
    const honger = S.r.voedsel <= 0 && prod.voedsel < use.voedsel;
    if (honger) RK.forEach(k => { if (k !== 'voedsel') prod[k] *= .5; });
    return { prod, use, staff, bed, job, honger, g };
  }

  function tick(S, dt, rendement = 1, m = mods(S)) {
    const R = rates(S, m, dt);
    for (const k of RK) {
      const eff = rendement * (rendement < 1 && k === 'energie' ? m.offlineEnergie : 1);
      const net = (R.prod[k] - R.use[k]) * eff;
      S.r[k] = Math.max(0, Math.min(cap(S, k, m), S.r[k] + net * dt));
      if (R.prod[k] > 0) {
        const gemaakt = R.prod[k] * eff * dt;
        S.earned += RES[k].waarde * gemaakt;
        S.ooit[k] = (S.ooit[k] || 0) + gemaakt;
        if (k === 'energie') S.energieTot += gemaakt;
        if (k === 'hout') S.houtTot += gemaakt;
      }
    }
    return { m, R };
  }

  // ---------- prijzen ----------
  const rk = (m, k) => m.kost * (m.kostRes[k] || 1);
  const kostVan = (S, b, m = mods(S)) => Object.fromEntries(Object.entries(B[b].k).map(([k, v]) => [k, v * BAL.kostGroei ** S.n[b] * rk(m, k)]));
  function kostVanN(S, b, n, m = mods(S)) {
    const f = BAL.kostGroei ** S.n[b] * (BAL.kostGroei ** n - 1) / (BAL.kostGroei - 1);
    return Object.fromEntries(Object.entries(B[b].k).map(([k, v]) => [k, v * f * rk(m, k)]));
  }
  function maxN(S, b, m = mods(S)) {
    let n = 0; if (B[b].max) return Math.max(0, Math.min(B[b].max - S.n[b], kan(S, kostVanN(S, b, 1, m)) ? 1 : 0));
    while (n < 1000 && kan(S, kostVanN(S, b, n + 1, m)) && past(S, kostVanN(S, b, n + 1, m), m)) n++;
    return n;
  }
  const faseDrempel = (S, b, m) => BAL.faseBij[S.fase[b] - 1] - (S.fase[b] === 1 ? m.faseMin : 0);
  function faseKost(S, b, m = mods(S)) {
    const i = S.fase[b] - 1, base = B[b].k, waarde = Object.entries(base).reduce((a, [k, v]) => a + RES[k].waarde * v, 0);
    const c = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * BAL.faseKostMult[i]]));
    for (const [k, f] of Object.entries(BAL.faseExtra[i])) c[k] = (c[k] || 0) + waarde * BAL.faseKostMult[i] * f / RES[k].waarde;
    for (const k in c) c[k] *= m.faseKost * (i >= 1 ? m.faseHoog : 1) * (m.kostRes[k] || 1);
    if (i === 3) c.kroonhars = 20;   // naar fase 5 (Meesterwerk) is Kroonhars nodig
    return c;
  }
  const faseKlaar = (S, b, m = mods(S)) => !!B[b].p && S.fase[b] < 5 && S.n[b] >= faseDrempel(S, b, m);
  const kan = (S, c) => Object.entries(c).every(([k, v]) => S.r[k] >= v - 1e-9);
  const past = (S, c, m = mods(S)) => Object.entries(c).every(([k, v]) => cap(S, k, m) >= v);
  const betaal = (S, c) => { for (const [k, v] of Object.entries(c)) S.r[k] = Math.max(0, S.r[k] - v); };
  const upKost = (S, u, m = mods(S)) => Object.fromEntries(Object.entries(u.k).map(([k, v]) => [k, v * m.upKost]));
  const magieKost = (S, m = mods(S)) => { const c = D.magieKost(S.magie); return { kristal: c.kristal * m.upKost, energie: c.energie * m.upKost * m.magieE }; };

  function koop(S, b, n = 1) {
    const m = mods(S); if (!S.open.includes(B[b].d)) return false;
    if (B[b].max && S.n[b] + n > B[b].max) return false;
    const c = kostVanN(S, b, n, m); if (!kan(S, c)) return false;
    betaal(S, c); S.n[b] += n; return true;
  }
  function groei(S, b) {
    const m = mods(S); if (!faseKlaar(S, b, m)) return false;
    const c = faseKost(S, b, m); if (!kan(S, c)) return false;
    betaal(S, c); S.fase[b]++; return true;
  }
  function openDistrict(S, d) {
    if (S.open.includes(d) || !D.DISTRICTS[d]) return false; const c = D.DISTRICTS[d].open;
    if (!kan(S, c)) return false; betaal(S, c); S.open.push(d); return true;
  }

  // ---------- upgrades ----------
  const totaal = S => BK.reduce((a, b) => a + S.n[b], 0);
  function eisOk(S, e) {
    if (!e) return true;
    if (e.u && !e.u.every(u => S.up[u])) return false;
    if (e.b && S.n[e.b[0]] < e.b[1]) return false;
    if (e.d && !S.open.includes(e.d)) return false;
    if (e.tot && totaal(S) < e.tot) return false;
    if (e.tik && (S.tikken || 0) < e.tik) return false;
    if (e.lom && Object.keys(S.lom || {}).length < e.lom) return false;
    return true;
  }
  function eisTekst(e) {
    const t = [];
    if (e?.u) t.push(e.u.map(u => D.U.find(x => x.id === u).naam).join(' + '));
    if (e?.b) t.push(`${e.b[1]}× ${B[e.b[0]].naam}`);
    if (e?.d) t.push(`${e.d} open`);
    if (e?.tot) t.push(`${e.tot} gebouwen`);
    if (e?.tik) t.push(`${e.tik} keer getikt`);
    if (e?.lom) t.push(`${e.lom} Lomari ontmoet`);
    return t.join(', ');
  }
  function koopUpgrade(S, id) {
    const u = D.U.find(x => x.id === id), c = upKost(S, u);
    if (S.up[id] || !eisOk(S, u.eis) || !kan(S, c)) return false;
    betaal(S, c); S.up[id] = true; return true;
  }
  const magieOpen = S => S.open.includes('Voelari') && S.magie < mods(S).magieMax;
  function koopMagie(S) {
    if (!magieOpen(S)) return false; const c = magieKost(S);
    if (!kan(S, c)) return false; betaal(S, c); S.magie++; return true;
  }

  // ---------- verzamelen en automatisering ----------
  // Wat één tik oplevert (zonder het toe te passen)
  function tikWaarde(S, m = mods(S), x = 1) {
    const R = rates(S, m), ingezet = Object.keys(S.lom || {}).filter(id => plek(S, id)).length, uit = {};
    const f = m.verzamel * m.tikX * (1 + m.tikLomari * ingezet) * x;
    for (const k of ['hout', 'bladeren', ...m.tikRes]) uit[k] = Math.max(1, R.prod[k] * m.tikSec) * f;
    return uit;
  }
  function verzamel(S, keer = 1, x = 1) {
    const m = mods(S), w = tikWaarde(S, m, x), uit = {};
    for (const [k, v0] of Object.entries(w)) {
      const voor = S.r[k]; S.r[k] = Math.min(cap(S, k, m), S.r[k] + v0 * keer); uit[k] = S.r[k] - voor;
      S.earned += uit[k] * RES[k].waarde; if (k === 'hout') S.houtTot += uit[k];
    }
    return uit;
  }
  function automatiseer(S, dt) {
    const m = mods(S), gedaan = [];
    if (m.auto.verzamel) { S.verzamelT += dt; while (S.verzamelT >= m.mandSec) { S.verzamelT -= m.mandSec; verzamel(S); } }
    if (m.auto.wonen && bedden(S, m) < banen(S) + 1) {
      for (const b of ['familie', 'nest']) if (S.open.includes(B[b].d) && koop(S, b)) { gedaan.push(b); break; }
    }
    if (m.auto.voedsel) { const R = rates(S, m); if (R.prod.voedsel < R.use.voedsel * 1.05 && koop(S, 'bessen')) gedaan.push('bessen'); }
    if (m.auto.fase) for (const b of BK) if (faseKlaar(S, b, m) && groei(S, b)) gedaan.push('fase ' + b);
    return gedaan;
  }

  // ---------- Lomari: vrijspelen, inzet, Band, vondsten, lichtbollen ----------
  function eisLomOk(S, e, m) {
    if (e.start) return true;
    if (e.gebouwen) return totaal(S) >= e.gebouwen;
    if (e.district) return S.open.includes(e.district);
    if (e.fase3) return BK.some(b => B[b].d === e.fase3 && S.fase[b] >= 3);
    if (e.bewoners) return bedden(S, m) >= e.bewoners;
    if (e.gebeurtenissen) return S.gebeurtenissen >= e.gebeurtenissen;
    if (e.gebouw) return S.n[e.gebouw[0]] >= e.gebouw[1];
    if (e.upgrades) return Object.values(S.up).filter(Boolean).length + S.magie >= e.upgrades;
    if (e.ooit) return (S.ooit[e.ooit[0]] || 0) >= e.ooit[1];
    if (e.vondsten) return S.vondstTot >= e.vondsten;
    if (e.districten) return echteOpen(S) >= e.districten;
    if (e.energie) return S.energieTot >= e.energie;
    return false;
  }
  function eisLomTekst(e) {
    if (e.start) return 'Vanaf het begin';
    if (e.gebouwen) return `${e.gebouwen} gebouwen`;
    if (e.district) return `${e.district} open`;
    if (e.fase3) return `Een gebouw in ${e.fase3} in groeifase 3`;
    if (e.bewoners) return `${e.bewoners} bewoners`;
    if (e.gebeurtenissen) return `${e.gebeurtenissen === 1 ? 'Eerste bosgebeurtenis' : e.gebeurtenissen + ' bosgebeurtenissen'} (volgt in deel B)`;
    if (e.gebouw) return `Eerste ${B[e.gebouw[0]].naam}`;
    if (e.upgrades) return `${e.upgrades} upgrades gekocht`;
    if (e.ooit) return `${e.ooit[1].toLocaleString('nl-NL')} ${RES[e.ooit[0]].naam.toLowerCase()} gemaakt`;
    if (e.vondsten) return `${e.vondsten} verborgen plekken gevonden`;
    if (e.districten) return 'Alle zeven districten open';
    if (e.energie) return `${e.energie.toLocaleString('nl-NL')} Flohara-energie in één ronde`;
    return '';
  }
  function wijs(S, id, d) {
    const l = S.lom[id]; if (!l || l.d === d) return false;
    if (d && !S.open.includes(d)) return false;
    const m = mods(S);
    l.reis = l.d && d ? C.reisSec * m.reis : 0;   // van vrij naar een district of terug: direct; tussen districten: reistijd
    l.d = d || null; return true;
  }
  function lomTick(S, dt, m = mods(S), offline = false) {
    const ev = [];
    for (const def of LM.L) if (!S.lom[def.id] && eisLomOk(S, def.eis, m)) { S.lom[def.id] = { d: S.open.includes(def.d) ? def.d : null, xp: 0, band: 1, reis: 0 }; ev.push({ t: 'nieuw', id: def.id }); }
    for (const id in S.lom) {
      const l = S.lom[id];
      if (l.reis > 0) { l.reis = Math.max(0, l.reis - dt); continue; }
      if (!l.d || l.band >= C.bandMax) continue;
      const nGeb = BK.filter(b => B[b].d === l.d).reduce((a, b) => a + S.n[b], 0);
      l.xp += dt / 3600 * C.xpPerUur * (1 + C.xpPerGebouw * nGeb);
      while (l.band < C.bandMax && l.xp >= xpNodig(l.band)) { l.xp -= xpNodig(l.band); l.band++; ev.push({ t: 'band', id, band: l.band }); }
    }
    if (m.vondst > 0) {
      S.vondstT += dt;
      while (S.vondstT >= C.vondstSec) {
        S.vondstT -= C.vondstSec;
        if (S.vondsten.length < C.vondstMax && Math.random() < m.vondst * m.vondstX) {
          const opties = RK.filter(k => !RES[k].zeldzaam && (k !== 'energie' || S.open.includes('Voelari')));
          S.vondsten.push({ res: opties[Math.floor(Math.random() * opties.length)] }); S.vondstTot++; ev.push({ t: 'vondst' });
        }
      }
    }
    if (!offline && m.licht > 0) {
      if (S.bol) { S.bol.over -= dt; if (S.bol.over <= 0) S.bol = null; }
      else { S.lichtT += dt; if (S.lichtT >= m.licht) { S.lichtT = 0; S.bol = { x: 8 + Math.random() * 84, y: 10 + Math.random() * 78, over: C.lichtDuur * m.lichtDuur }; } }
    }
    return ev;
  }
  function kiesVondst(S, i, keuze) {
    const v = S.vondsten[i]; if (!v) return null;
    S.vondsten.splice(i, 1);
    if (keuze === 'bonus') { S.vondstBonus[v.res] = (S.vondstBonus[v.res] || 0) + C.vondstBonus; return { bonus: v.res }; }
    const m = mods(S), R = rates(S, m), uit = {};
    for (const k of RK) if (R.prod[k] > 0) { const voor = S.r[k]; S.r[k] = Math.min(cap(S, k, m), S.r[k] + R.prod[k] * C.vondstBuitSec); uit[k] = S.r[k] - voor; }
    return { buit: uit };
  }
  function vangBol(S) {
    if (!S.bol) return null; S.bol = null;
    const m = mods(S), R = rates(S, m), opt = RK.filter(k => R.prod[k] > 0); if (!opt.length) return null;
    const k = opt[Math.floor(Math.random() * opt.length)], v = R.prod[k] * C.lichtBuitSec * m.lichtX;
    const voor = S.r[k]; S.r[k] = Math.min(cap(S, k, m), S.r[k] + v); return { res: k, v: S.r[k] - voor };
  }

  function stats(S) {
    const m = mods(S);
    return { tot: totaal(S), bedden: bedden(S, m), open: echteOpen(S), gebieden: S.open.length - echteOpen(S), maxFase: Math.max(...BK.map(b => S.fase[b])),
      hout: S.houtTot, magie: S.magie, runs: S.runs, nova: S.nova, lomari: Object.keys(S.lom).length, tikken: S.tikken || 0 };
  }
  function checkAch(S) {
    const st = stats(S), nieuw = [];
    for (const a of D.ACH) if (!S.ach[a.id] && a.test(st)) { S.ach[a.id] = true; nieuw.push(a); }
    return nieuw;
  }

  // ---------- Hergroei ----------
  const hergroeiKlaar = S => S.energieTot >= BAL.hergroeiEnergie;
  const novaWacht = S => hergroeiKlaar(S) ? Math.floor(D.novaFormule(S.earned) * mods(S).novaX) : 0;
  function hergroei(S) {
    const n = novaWacht(S); if (n < 1) return null;
    return nieuw({ ...S, nova: S.nova + n, runs: S.runs + 1 });
  }
  function koopStar(S, id) {
    const s = D.STAR.find(x => x.id === id);
    if (S.star[id] || (s.eis && !S.star[s.eis]) || S.nova - S.novaUit < s.k) return false;
    S.novaUit += s.k; S.star[id] = true;
    for (const e of s.fx) if (e.t === 'startOpen' && !S.open.includes(e.d)) S.open.push(e.d);   // gebied direct open
    return true;
  }

  // Offline: in stappen doorrekenen, met rendement en limiet. Band en vondsten lopen door.
  function offline(S, sec) {
    const m = mods(S), limiet = Math.min(24, m.offline), eff = Math.min(sec, limiet * 3600), voor = { ...S.r }, rend = Math.min(.85, BAL.offlineRendement + m.offlineEff);
    const stappen = Math.max(1, Math.min(60, Math.ceil(eff / 60))), vondstVoor = S.vondstTot, ev = [];
    for (let i = 0; i < stappen; i++) { const mm = mods(S); tick(S, eff / stappen, rend, mm); ev.push(...lomTick(S, eff / stappen, mm, true)); }
    if (m.nachtmanden && m.auto.verzamel) verzamel(S, Math.floor(eff / m.mandSec) * rend);
    const winst = {}; RK.forEach(k => winst[k] = S.r[k] - voor[k]);
    return { sec, eff, winst, limiet, rend, vondsten: S.vondstTot - vondstVoor, ev };
  }

  // Productie per stuk van een gebouw, met alle bonussen (voor de uitleg in het spel)
  function perStuk(S, b, m = mods(S)) {
    const x = B[b]; if (!x.p) return {};
    const lijst = verbindingen(S), bed = bedden(S, m), job = banen(S), staff = job ? Math.min(1, bed / job) : 1;
    const f = 2 ** (S.fase[b] - 1) * staff * globaal(S, m) * BAL.productieSchaal * (m.dist[x.d] || 1) * tevFactor(S, x.d, m) * verbindFactor(S, x.d, m, lijst);
    return Object.fromEntries(Object.entries(x.p).map(([k, v]) => [k, v * f * (m.res[k] || 1)]));
  }
  function waardeRate(S, m = mods(S)) { const R = rates(S, m); return RK.reduce((a, k) => a + RES[k].waarde * (R.prod[k] - R.use[k]), 0); }

  return { RK, BK, nieuw, mods, rates, tick, cap: (S, k) => cap(S, k, mods(S)), kostVan, kostVanN, maxN, faseKost, faseKlaar,
    faseDrempel: (S, b) => faseDrempel(S, b, mods(S)), kan, past, koop, groei, openDistrict, eisOk, eisTekst, koopUpgrade, upKost, magieKost,
    magieOpen, koopMagie, verzamel, automatiseer, stats, checkAch, hergroeiKlaar, novaWacht, hergroei, koopStar, offline,
    waardeRate, perStuk, tikWaarde, offlineInfo: S => { const m = mods(S); return { rend: Math.min(.85, BAL.offlineRendement + m.offlineEff), limiet: Math.min(24, m.offline), manden: !!(m.nachtmanden && m.auto.verzamel) }; }, globaal: S => globaal(S, mods(S)), bedden: S => bedden(S, mods(S)), banen, totaal, achAantal,
    lomDef, plek, wijs, lomTick, kiesVondst, vangBol, xpNodig, eisLomOk: (S, e) => eisLomOk(S, e, mods(S)), eisLomTekst,
    tevredenheid: (S, d) => tevredenheid(S, d, mods(S)), verbindingen, verbandActief: (S, v) => { const m = mods(S); return m.verbanden.includes(v.id); }, inDistrict };
})();
