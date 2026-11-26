/* Lomari: Idle Village — rekenmotor. Puur rekenwerk op een state-object S, geen DOM.
   Dezelfde functies draaien het spel én de balanstest. */
window.ENGINE = (() => {
  const D = window.DATA, LM = window.LOM, { RES, BAL, B } = D, C = LM.CFG;
  const RK = Object.keys(RES), BK = Object.keys(B);
  const novaW = k => RES[k].nova ?? RES[k].waarde;   // wat een grondstof meetelt voor Nova
  const fx = id => (D.U.find(u => u.id === id) || D.STAR.find(n => n.id === id)).fx;

  function nieuw(prev) {
    const S = {
      v: 1, r: {}, n: {}, fase: {}, open: [...D.START_OPEN], up: {}, magie: 0, amb: {},
      nova: prev ? prev.nova : 0, novaUit: prev ? prev.novaUit : 0, star: prev ? prev.star : {},
      ach: prev ? prev.ach : {}, runs: prev ? prev.runs : 0,
      earned: 0, earnedPer: {}, energieTot: 0, houtTot: 0, t: Date.now(), start: prev ? prev.start : Date.now(),
      rondeStart: Date.now(), verzamelT: 0, instel: prev ? prev.instel : { offlineMelding: true },
      lom: prev ? prev.lom || {} : {}, ooit: prev ? prev.ooit || {} : {}, vondsten: [], vondstTot: prev ? prev.vondstTot || 0 : 0,
      vondstBonus: prev ? prev.vondstBonus || {} : {}, vondstT: 0, lichtT: 0, bol: null, gebeurtenissen: prev ? prev.gebeurtenissen || 0 : 0, tikken: prev ? prev.tikken || 0 : 0,
      klok: prev ? prev.klok || 0 : 0, geb: [], gebT: 0, bouw: [], bouwKlaar: [], rune: {}, act: {},
      reliek: prev ? prev.reliek || {} : {}, jaar: prev ? prev.jaar || 0 : 0, beproef: prev?.beproefVolgende || null, beproefKlaar: prev ? prev.beproefKlaar || {} : {}, bronwerk: prev?.bronwerk ? { t: prev.bronwerk.t || 0, in: { ...(prev.bronwerk.in || {}) } } : { t: 0, in: {} }, tel: prev ? prev.tel || {} : {}, dag: prev ? prev.dag || null : null, gave: prev ? prev.gave || {} : { ...D.GAVE_START }, gaveAan: prev ? prev.gaveAan || null : null, gaveNieuw: [], gaveKocht: {},
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
  const plek = (S, id) => { const l = S.lom[id]; if (!l) return null; if (l.reis > 0 || l.tocht) return null; return l.d; };
  const verbandPlek = (S, id) => { const l = S.lom[id]; if (!l || l.reis > 0 || l.tocht) return null; return l.d || lomDef(id).d; };
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
      magieE: 1, offlineEnergie: 1, veyra: false, verbanden: [], tikX: 1, tocht: 0, tikRes: [], ritme: false, tikLomari: 0, tikSec: BAL.verzamelSec, mandSec: 10,
      herstel: 1, gebKans: 1, gebKansT: {}, geenGeb: {}, nacht: 0, nachtTev: 0, tevHerstel: 1, schild: false, voorhoede: false, geenNacht: false, bouwX: 1, bouwD: {}, runeKost: 1, openWegen: false, ketenPlant: 1, tevAlle: 0 };
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
      else if (e.t === 'herstel') m.herstel *= sx(e.x);
      else if (e.t === 'gebKans') m.gebKans *= sx(e.x);
      else if (e.t === 'gebKansT') m.gebKansT[e.id] = (m.gebKansT[e.id] || 1) * sx(e.x);
      else if (e.t === 'geenGeb') m.geenGeb[e.id] = true;
      else if (e.t === 'nacht') m.nacht += e.plus * s;
      else if (e.t === 'nachtTev') m.nachtTev += e.plus * s;
      else if (e.t === 'tevHerstel') m.tevHerstel *= sx(e.x);
      else if (e.t === 'schild') m.schild = true;
      else if (e.t === 'voorhoede') m.voorhoede = true;
      else if (e.t === 'bouwX') m.bouwX *= sx(e.x);
      else if (e.t === 'tevAlle') m.tevAlle += e.plus * s;
      else if (e.t === 'runeKost') m.runeKost *= sx(e.x);
      else if (e.t === 'openWegen') m.openWegen = true;
      else if (e.t === 'ketenPlant') m.ketenPlant *= sx(e.x);
      else if (e.t === 'tocht') m.tocht += e.plus;
      else if (e.t === 'bouwD') m.bouwD[e.d] = (m.bouwD[e.d] || 1) * sx(e.x);
    };
    const ids = [...Object.keys(S.up).filter(k => S.up[k]), ...(S.beproef === 'stam' ? [] : Object.keys(S.star).filter(k => S.star[k]))];
    for (const id in S.beproefKlaar || {}) for (const e of D.BEPROEF[id].fx) zet(e);   // Beloningen van Beproevingen
    const geenGaven = S.beproef === 'lomari';
    for (const id of ids) for (const e of fx(id)) zet(e);
    for (const [k, v] of Object.entries(S.vondstBonus || {})) m.res[k] = (m.res[k] || 1) * (1 + v);
    // Lomari: passief alleen als ingezet (niet onderweg); 100% in eigen district, anders 40% (Koro: overal 100%)
    for (const def of LM.L) {
      const l = S.lom?.[def.id], d = plek(S, def.id); if (!l || !d || geenGaven) continue;
      const s = def.overal || d === def.d ? 1 : C.buiten;
      for (const e of def.pas(l.band, d)) zet(e, s);
    }
    // Relieken van tochten: elke trede telt als één keer het effect
    for (const [id, n] of Object.entries(S.reliek || {})) for (let i = 0; i < n; i++) for (const e of D.RELIEK[id][2]) zet(e);
    m.novaX *= 1 + D.JAAR.nova * (S.jaar || 0);   // Jaarringen
    // Bronwerk: elke 5e trede +5% Nova
    m.novaX *= (1 + D.BRONWERK.nova) ** Math.floor((S.bronwerk?.t || 0) / D.BRONWERK.novaElk);
    // Upgradebomen: gekochte knopen gelden altijd
    if (!geenGaven) for (const id in S.lom || {}) for (const i of S.lom[id].boom || []) for (const e of LM.BOOM[id][i][2]) zet(e);
    // Actieve en ultieme vaardigheden die nu lopen
    if (!geenGaven) for (const [id, a] of Object.entries(S.act || {})) if (a.over > 0) { const A = LM.ACT[id], lijstFx = a.ult && A.ultFx ? A.ultFx : A.fx; if (lijstFx) for (const e of lijstFx) zet(e, a.ult && !A.ultFx ? C.ultSterk : 1); }
    // Gebieden: bonus als hun Lomari er staan
    if (plek(S, 'nira') === 'Valunari') m.dist.Valunari = (m.dist.Valunari || 1) * 2;
    m.kroveliAlles = ['piko', 'kavo'].some(id => plek(S, id) === 'Kroveli');
    const wortel = ['veyra', 'varo', 'elomi'].filter(id => plek(S, id) === 'Lomaruun').length;
    if (wortel) m.dist.Lomaruun = (m.dist.Lomaruun || 1) * (1 + .25 * wortel);
    // Verbanden
    const lijst = verbindingen(S);
    m.rivier = S.beproef !== 'verband' && LM.V.some(v => v.id === 'rivier' && !v.b && verbandActief(S, v, false, lijst));
    for (const v of LM.V) if (S.beproef !== 'verband' && verbandActief(S, v, m.rivier, lijst)) {
      m.verbanden.push(v.id);
      if (!v.b && v.fx) for (const e of v.fx) zet(e, 1 + m.verbandPlus);
    }
    for (const k in S.amb || {}) m.res[k] = (m.res[k] || 1) * D.AMB.stap ** S.amb[k];   // Ambachten
    return m;
  }

  // Tevredenheid en verbindingen per district
  function tevredenheid(S, d, m = mods(S)) {
    const over = Math.max(0, inDistrict(S, d).length - (C.drukteGrens + m.drukte));
    const dip = (S.geb || []).filter(g => g.tev && g.d === d).length * BAL.gebTev * (m.schild ? .5 : 1);
    return 100 + (m.tev[d] || 0) + m.tevAlle + Math.min(C.zangTevMax, C.zangTev * S.n.zangplek) - over * C.druktePerLomari
      + (isNacht(S) ? m.nachtTev : 0) - dip;
  }
  // Dag en nacht: S.klok loopt alleen als je speelt (en offline door, zonder nacht-effect)
  const isNacht = S => S.beproef === 'nacht' || ((S.klok || 0) % BAL.dagSec) >= BAL.dagSec * (1 - BAL.nachtDeel);
  const nachtF = (S, m) => !m.geenNacht && isNacht(S) ? Math.min(1, BAL.nachtProd + m.nacht) : 1;
  const stilF = (S, b, m) => (S.geb || []).some(g => g.b === b) ? (m.schild ? .5 : 0) : 1;
  function dagInfo(S) {
    const t = (S.klok || 0) % BAL.dagSec, grens = BAL.dagSec * (1 - BAL.nachtDeel), nacht = t >= grens;
    return { nacht, rest: nacht ? BAL.dagSec - t : grens - t };
  }
  const tevFactor = (S, d, m) => Math.min(C.tevMax, Math.max(C.tevMin, tevredenheid(S, d, m))) / 100;
  function verbindFactor(S, d, m, lijst) {
    let n = lijst.filter(([a, b]) => a === d || b === d).length;
    if (m.openWegen) n += D.GEBIEDEN[d] ? echteOpen(S) : S.open.filter(x => D.GEBIEDEN[x]).length;
    if (m.rivier) n = d === 'Lomavii' ? S.open.length - 1 : Math.max(n, lijst.some(([a, b]) => (a === d && b === 'Lomavii') || (b === d && a === 'Lomavii')) ? n : n + (S.open.includes('Lomavii') ? 1 : 0));
    return 1 + n * (C.verbindPct + m.verbind);
  }

  const achAantal = S => Object.values(S.ach).filter(Boolean).length;
  function globaal(S, m) {
    return (1 + m.brug * S.n.brug) * (S.n.oudebron ? 1 + .05 * S.fase.oudebron : 1) * (1 + D.BRONWERK.prod * (S.bronwerk?.t || 0)) * (1 + D.JAAR.prod * (S.jaar || 0)) * 1.25 ** S.magie * (1 + BAL.novaPct * S.nova)
      * (1 + .01 * achAantal(S)) * (1 + m.perDistrict * S.open.length) * (m.geenNacht ? 1 : gaveX(S));
  }
  // Dezelfde factoren als globaal(), los, voor het overzicht "Je bonussen". Alleen wat iets doet.
  function bonusLijst(S, m = mods(S)) {
    const l = [
      ['Nova', `${S.nova} × +${Math.round(BAL.novaPct * 100)}%`, 1 + BAL.novaPct * S.nova],
      ['Flohara-resonantie', `${S.magie} × ×1,25`, 1.25 ** S.magie],
      ['Prestaties', `${achAantal(S)} × +1%`, 1 + .01 * achAantal(S)],
      ['Touwbruggen', `${S.n.brug} × +${Math.round(m.brug * 100)}%`, 1 + m.brug * S.n.brug],
      ['Werkliederen', `${S.open.length} districten × +${Math.round(m.perDistrict * 100)}%`, 1 + m.perDistrict * S.open.length],
      ['De oude bron', `fase ${S.fase.oudebron}`, S.n.oudebron ? 1 + .05 * S.fase.oudebron : 1],
      ['Bronwerk', `trede ${S.bronwerk?.t || 0}`, 1 + D.BRONWERK.prod * (S.bronwerk?.t || 0)],
      ['Jaarringen', `${S.jaar || 0}`, 1 + D.JAAR.prod * (S.jaar || 0)],
      ['Gave van het woud', 'loopt nu', gaveX(S)],
    ].filter(x => x[2] > 1.0001);
    return { lijst: l, totaal: l.reduce((a, x) => a * x[2], 1) };
  }
  const bedden = (S, m) => BAL.startBedden + BK.reduce((a, b) => a + S.n[b] * ((B[b].bed || 0) + (B[b].bed ? (m.bed[b] || 0) : 0)), 0);
  const banen = S => BK.reduce((a, b) => a + S.n[b] * (B[b].w || 0), 0);
  // Opslag = basis + opslaggebouwen + een buffer van BAL.opslagUren productie, alles × opslagbonussen
  const cap = (S, k, m, R = rates(S, m)) => (RES[k].cap + BK.reduce((a, b) => a + (B[b].o?.[k] || 0) * (BAL.opslagGroei ** S.n[b] - 1) / (BAL.opslagGroei - 1), 0)
    + R.prod[k] * 3600 * BAL.opslagUren) * m.opslag * (m.capD[k] || 1) * (m.capRes[k] || 1);
  // Grondstof erbij: tot de opslaggrens; offline (m.geenCap) zonder grens. Wat al boven de grens zit, blijft staan.
  function vul(S, k, v, m, R) {
    const voor = S.r[k], na = Math.max(0, voor + v);
    S.r[k] = m.geenCap || v <= 0 ? na : Math.max(Math.min(voor, na), Math.min(cap(S, k, m, R), na));
    return S.r[k] - voor;
  }

  // Productie en verbruik per seconde. Ketens kunnen stilvallen zonder input.
  function rates(S, m = mods(S), dt = 1) {
    const g = globaal(S, m) * nachtF(S, m), bed = bedden(S, m), job = banen(S), lijst = verbindingen(S);
    const staff = job ? Math.min(1, bed / job) : 1;
    const prod = {}, use = {}; RK.forEach(k => { prod[k] = 0; use[k] = 0; });
    const dF = {}; for (const d of [...Object.keys(D.DISTRICTS), ...Object.keys(D.GEBIEDEN)]) dF[d] = (m.dist[d] || 1) * tevFactor(S, d, m) * verbindFactor(S, d, m, lijst);
    const keten = [];
    for (const b of BK) {
      const x = B[b]; if (!x.p || !S.n[b]) continue;
      const f = S.n[b] * 2 ** (S.fase[b] - 1) * staff * g * BAL.productieSchaal * dF[x.d] * stilF(S, b, m) * (S.rune?.[b] === 'groei' ? 1.5 : 1);
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
      const plant = m.ketenPlant !== 1 && Object.keys(x.c).some(k => ['hout', 'bladeren', 'lianen', 'voedsel'].includes(k)) ? m.ketenPlant : 1;
      for (const [k, v] of Object.entries(x.p)) prod[k] += v * f * ratio * plant * (m.res[k] || 1);
    }
    const honger = S.r.voedsel <= 0 && prod.voedsel < use.voedsel;
    if (honger) RK.forEach(k => { if (k !== 'voedsel') prod[k] *= .5; });
    return { prod, use, staff, bed, job, honger, g };
  }

  function tick(S, dt, rendement = 1, m = mods(S)) {
    const R = rates(S, m, dt);
    bouwTick(S, dt); actTick(S, dt); if (!m.geenNacht) gaveTick(S, dt);
    for (const k of RK) {
      const eff = rendement * (m.geenNacht && k === 'energie' ? m.offlineEnergie : 1);
      const net = (R.prod[k] - R.use[k]) * eff;
      vul(S, k, net * dt, m, R);
      if (R.prod[k] > 0) {
        const gemaakt = R.prod[k] * eff * dt;
        S.earned += novaW(k) * gemaakt; (S.earnedPer = S.earnedPer || {})[k] = (S.earnedPer[k] || 0) + gemaakt;
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
  const faseKlaar = (S, b, m = mods(S)) => !!B[b].p && S.fase[b] < 5 && S.n[b] >= faseDrempel(S, b, m) && !bouwBezig(S, B[b].d);
  // Bouwtijd: een upgrade naar een hogere fase is pas klaar na de bouwtijd. Tot dan produceert het gebouw op de oude fase.
  const bouwBezig = (S, d) => (S.bouw || []).find(x => B[x.b].d === d) || null;
  const bouwTijd = (S, b, m = mods(S)) => Math.round(BAL.bouwSec[S.fase[b] - 1] * m.bouwX * (m.bouwD[B[b].d] || 1) * (S.rune?.[b] === 'vlot' ? .5 : 1));
  // Runen
  const runeKost = (S, r, m = mods(S)) => { const f = D.runeGroei ** Object.keys(S.rune || {}).length;
    return Object.fromEntries(Object.entries(D.RUNE[r].kost).map(([k, v]) => [k, v * f * (k === 'kristal' ? m.runeKost : 1)])); };
  function zetRune(S, b, r) {
    if (!B[b].p || S.fase[b] < D.runeFase || S.rune?.[b] === r) return false;
    S.rune = S.rune || {}; const oud = S.rune[b]; delete S.rune[b];
    const c = runeKost(S, r); if (!kan(S, c)) { if (oud) S.rune[b] = oud; return false; }
    betaal(S, c); S.rune[b] = r; return true;
  }
  // Upgradebomen
  const punten = (S, id) => { const l = S.lom[id]; return l ? l.band - (l.boom || []).reduce((a, i) => a + LM.BOOM_KOST[i], 0) : 0; };
  function boomKan(S, id, i) {
    const l = S.lom[id]; if (!l || (l.boom || []).includes(i)) return false;
    if (i > 0 && !(l.boom || []).includes(i - 1)) return false;
    if (punten(S, id) < LM.BOOM_KOST[i]) return false;
    return i !== LM.SLEUTEL || S.r.nevelparel >= LM.SLEUTEL_PAREL;
  }
  function koopKnoop(S, id, i) {
    if (!boomKan(S, id, i)) return false;
    if (i === LM.SLEUTEL) S.r.nevelparel -= LM.SLEUTEL_PAREL;
    (S.lom[id].boom = S.lom[id].boom || []).push(i); return true;
  }
  // ---------- Gaven van het woud ----------
  const gaveX = S => S.gaveAan?.over > 0 ? D.GAVE[S.gaveAan.id].x : 1;
  function geefGave(S, id) {
    S.gave = S.gave || {}; if ((S.gave[id] || 0) >= D.GAVE_MAX) return false;
    S.gave[id] = (S.gave[id] || 0) + 1; (S.gaveNieuw = S.gaveNieuw || []).push(id); return true;
  }
  const gaveKan = (S, id) => (S.gave?.[id] || 0) > 0 && (!(S.gaveAan?.over > 0) || S.gaveAan.id === id);
  function zetGave(S, id) {
    if (!gaveKan(S, id)) return false;
    S.gave[id]--; S.gaveAan = { id, over: (S.gaveAan?.over > 0 ? S.gaveAan.over : 0) + D.GAVE[id].sec }; return true;
  }
  const gavePrijs = (S, id) => { const [k, v] = D.GAVE[id].koop; return [k, Math.ceil(v * D.GAVE_KOOPGROEI ** (S.gaveKocht?.[id] || 0))]; };
  const gaveHeb = (S, k) => k === 'nova' ? S.nova - S.novaUit : S.r[k];
  const gaveKoopKan = (S, id) => { const [k, v] = gavePrijs(S, id); return (S.gave?.[id] || 0) < D.GAVE_MAX && gaveHeb(S, k) >= v; };
  function koopGave(S, id) {
    if (!gaveKoopKan(S, id)) return false; const [k, v] = gavePrijs(S, id);
    if (k === 'nova') S.novaUit += v; else S.r[k] -= v;
    S.gaveKocht = S.gaveKocht || {}; S.gaveKocht[id] = (S.gaveKocht[id] || 0) + 1;
    S.gave[id] = (S.gave[id] || 0) + 1; return true;
  }
  function gaveTick(S, dt) { if (S.gaveAan) { S.gaveAan.over -= dt; if (S.gaveAan.over <= 0) S.gaveAan = null; } }

  function bouwTick(S, dt) {
    if (!S.bouw?.length) return;
    for (const x of S.bouw) x.over -= dt;
    for (const x of S.bouw.filter(x => x.over <= 0)) { S.fase[x.b]++; (S.bouwKlaar = S.bouwKlaar || []).push(x.b); geefGave(S, 'groei'); }
    S.bouw = S.bouw.filter(x => x.over > 0);
  }
  function actTick(S, dt) {
    for (const [id, a] of Object.entries(S.act || {})) { a.over = Math.max(0, a.over - dt); a.cd = Math.max(0, a.cd - dt); a.ucd = Math.max(0, (a.ucd || 0) - dt); if (!a.over && !a.cd && !a.ucd) delete S.act[id]; }
  }
  // Een vaardigheid gebruiken. ult = ultieme versie (Band 20+, kost Wortelgloed, eigen afkoeltijd).
  function actKan(S, id, ult) {
    const l = S.lom[id], a = S.act?.[id] || {}; if (!l || !plek(S, id)) return false;
    if (ult) return l.band >= C.ultBand && !(a.ucd > 0) && !(a.over > 0) && S.r.wortelgloed >= C.ultKost;
    return !(a.cd > 0) && !(a.over > 0);
  }
  function gebruik(S, id, ult = false) {
    if (!actKan(S, id, ult)) return null;
    const A = LM.ACT[id], a = (S.act = S.act || {})[id] = S.act[id] || { over: 0, cd: 0, ucd: 0 }, m = mods(S), uit = {};
    if (ult) { S.r.wortelgloed -= C.ultKost; a.ucd = C.ultCd; } else a.cd = C.actCd;
    a.ult = ult;
    if (A.fx || (ult && A.ultFx)) a.over = (A.duur || C.actDuur) * (ult ? C.ultDuur : 1);
    if (A.direct === 'vondst') { const opties = RK.filter(k => !RES[k].zeldzaam && (k !== 'energie' || S.open.includes('Voelari')));
      for (let i = 0; i < (ult ? 3 : 1); i++) { S.vondsten.push({ res: opties[Math.floor(Math.random() * opties.length)] }); S.vondstTot++; } uit.vondsten = ult ? 3 : 1; }
    else if (A.direct === 'bol') { const R = rates(S, m), opt = RK.filter(k => R.prod[k] > 0); if (opt.length) { const k = opt[Math.floor(Math.random() * opt.length)], voor = S.r[k];
      uit.res = k; uit.v = vul(S, k, R.prod[k] * C.lichtBuitSec * m.lichtX * (ult ? 3 : 1), m, R); } }
    else if (A.direct === 'bouw') { for (const x of S.bouw || []) x.over *= ult ? .25 : .75; uit.bouw = (S.bouw || []).length; }
    else if (A.direct === 'herstel') { uit.geb = (S.geb || []).length; S.geb = []; }
    else if (A.direct === 'reis') { uit.reis = Object.values(S.lom).filter(l => l.reis > 0).length; for (const l of Object.values(S.lom)) l.reis = 0; }
    return uit;
  }
  // Band boven de 30: de XP loopt door, en elke volgende Band kost Wortelgloed
  const doorbreekKan = (S, id) => { const l = S.lom[id]; return !!l && l.band >= C.bandMax && l.band < C.bandTop && l.xp >= xpNodig(l.band) && S.r.wortelgloed >= C.bandWortel; };
  function doorbreek(S, id) { if (!doorbreekKan(S, id)) return false; const l = S.lom[id]; S.r.wortelgloed -= C.bandWortel; l.xp -= xpNodig(l.band); l.band++; return true; }
  function helpBouw(S, b) {   // tikken helpt bouwen: elke tik 1% van de bouwtijd (minstens 2 seconden)
    const x = (S.bouw || []).find(x => x.b === b); if (!x) return false;
    x.over -= Math.max(BAL.bouwTikMin, x.duur * BAL.bouwTik); if (x.over <= 0) bouwTick(S, 0); return true;
  }
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
    betaal(S, c); const t = bouwTijd(S, b, m); S.bouw = S.bouw || [];
    if (t <= 0) { S.fase[b]++; geefGave(S, 'groei'); } else S.bouw.push({ b, over: t, duur: t });
    return true;
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
  // Ambachten
  const ambMax = k => RES[k].zeldzaam ? D.AMB.zeldzaamMax : D.AMB.max;
  const ambTrede = (S, k) => S.amb?.[k] || 0;
  const ambOpen = (S, k) => S.n[D.AMBACHT[k].b] >= D.AMBACHT[k].open;
  const ambKost = (S, k, m = mods(S)) => Object.fromEntries(Object.entries(D.ambKost(k, ambTrede(S, k))).map(([r, v]) => [r, v * m.upKost]));
  function koopAmb(S, k) {
    if (!ambOpen(S, k) || ambTrede(S, k) >= ambMax(k)) return false; const c = ambKost(S, k);
    if (!kan(S, c)) return false; betaal(S, c); (S.amb = S.amb || {})[k] = ambTrede(S, k) + 1; return true;
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
    const f = m.verzamel * m.tikX * (1 + m.tikLomari * ingezet) * x * (isNacht(S) ? BAL.nachtTik : 1);
    for (const k of ['hout', 'bladeren', ...m.tikRes]) uit[k] = Math.max(1, R.prod[k] * m.tikSec) * f;
    return uit;
  }
  function verzamel(S, keer = 1, x = 1, geenCap = false) {
    if (S.beproef === 'tik') return {};
    const m = mods(S); m.geenCap = geenCap; const w = tikWaarde(S, m, x), uit = {};
    for (const [k, v0] of Object.entries(w)) {
      uit[k] = vul(S, k, v0 * keer, m);
      S.earned += uit[k] * novaW(k); (S.earnedPer = S.earnedPer || {})[k] = (S.earnedPer[k] || 0) + uit[k]; if (k === 'hout') S.houtTot += uit[k];
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
    if (e.gebeurtenissen) return `${e.gebeurtenissen === 1 ? 'Eerste bosgebeurtenis' : e.gebeurtenissen + ' bosgebeurtenissen'} `;
    if (e.gebouw) return `Eerste ${B[e.gebouw[0]].naam}`;
    if (e.upgrades) return `${e.upgrades} upgrades gekocht`;
    if (e.ooit) return `${e.ooit[1].toLocaleString('nl-NL')} ${RES[e.ooit[0]].naam.toLowerCase()} gemaakt`;
    if (e.vondsten) return `${e.vondsten} verborgen plekken gevonden`;
    if (e.districten) return 'Alle zeven districten open';
    if (e.energie) return `${e.energie.toLocaleString('nl-NL')} Flohara-energie in één ronde`;
    return '';
  }
  function wijs(S, id, d) {
    const l = S.lom[id]; if (!l || l.d === d || l.tocht) return false;
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
      if (l.tocht) {   // op tocht: groeit gewoon in Band, zonder bonus voor gebouwen
        l.tocht.over -= dt;
        if (l.band < C.bandTop) l.xp += dt / 3600 * C.xpPerUur;
        if (l.tocht.over <= 0) ev.push(terug(S, id, m));
      } else {
        if (l.reis > 0) { l.reis = Math.max(0, l.reis - dt); continue; }
        if (!l.d || l.band >= C.bandTop) continue;
        const nGeb = BK.filter(b => B[b].d === l.d).reduce((a, b) => a + S.n[b], 0);
        l.xp += dt / 3600 * C.xpPerUur * (1 + C.xpPerGebouw * nGeb);
      }
      while (l.band < C.bandMax && l.xp >= xpNodig(l.band)) { l.xp -= xpNodig(l.band); l.band++; ev.push({ t: 'band', id, band: l.band }); }
      if (l.band >= C.bandMax) l.xp = Math.min(l.xp, xpNodig(l.band));
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
  // Tochten: een Lomari gaat op pad en komt terug met buit en soms een reliek
  const opTocht = S => Object.keys(S.lom || {}).filter(id => S.lom[id].tocht);
  const tochtKan = (S, id, m = mods(S)) => { const l = S.lom[id]; return !!l && !l.tocht && opTocht(S).length < m.tocht; };
  function stuur(S, id, soort) {
    if (!D.TOCHT[soort] || !tochtKan(S, id)) return false;
    const l = S.lom[id]; l.reis = 0; l.tocht = { soort, over: D.TOCHT[soort].sec }; return true;
  }
  function terug(S, id, m) {
    const l = S.lom[id], T = D.TOCHT[l.tocht.soort], R = rates(S, m), buit = {};
    tel(S, 'tochtTot'); if (l.tocht.soort === 'ver') tel(S, 'verTot');
    l.tocht = null;
    const thuis = LM.OPSLAG_D[lomDef(id).d] || [], soorten = thuis.length ? thuis : ['hout'];
    for (const k of soorten) if (R.prod[k] > 0) buit[k] = vul(S, k, R.prod[k] * T.sec * T.buit, m, R);
    const n = S.reliek[id] || 0; let reliek = false;
    if (n < D.RELIEK_MAX && Math.random() < T.reliek) { S.reliek[id] = n + 1; reliek = true; }
    return { t: 'tocht', id, soort: T.naam, buit, reliek, trede: S.reliek[id] || 0 };
  }
  // Bronwerk: zeldzame grondstoffen inleggen in De oude bron (fase 5). Ingelegd blijft bewaard, ook na Hergroei.
  const bronwerkOpen = S => !!S.n.oudebron && S.fase.oudebron >= 5 && (S.bronwerk?.t || 0) < D.BRONWERK.max;
  function leg(S, k) {
    if (!bronwerkOpen(S)) return 0;
    const bw = S.bronwerk, kost = D.bronwerkKost(bw.t), v = Math.min(Math.floor(S.r[k]), kost[k] - (bw.in[k] || 0));
    if (!(v > 0)) return 0;
    S.r[k] -= v; bw.in[k] = (bw.in[k] || 0) + v;
    if (Object.entries(kost).every(([r, n]) => (bw.in[r] || 0) >= n)) { bw.t++; bw.in = {}; }
    return v;
  }
  function kiesVondst(S, i, keuze) {
    const v = S.vondsten[i]; if (!v) return null;
    S.vondsten.splice(i, 1);
    if (keuze === 'bonus') { S.vondstBonus[v.res] = (S.vondstBonus[v.res] || 0) + C.vondstBonus; return { bonus: v.res }; }
    const m = mods(S), R = rates(S, m), uit = {};
    for (const k of RK) if (R.prod[k] > 0) uit[k] = vul(S, k, R.prod[k] * C.vondstBuitSec, m, R);
    return { buit: uit };
  }
  function vangBol(S) {
    if (!S.bol) return null; S.bol = null; tel(S, 'bolTot'); if (isNacht(S)) tel(S, 'nachtBol');
    const m = mods(S), R = rates(S, m), opt = RK.filter(k => R.prod[k] > 0); if (!opt.length) return null;
    const k = opt[Math.floor(Math.random() * opt.length)], v = R.prod[k] * C.lichtBuitSec * m.lichtX;
    return { res: k, v: vul(S, k, v, m, R) };
  }

  // ---------- dag, nacht en bosgebeurtenissen (alleen als je speelt) ----------
  function startGeb(S, m) {
    const opties = [];
    for (const [id, x] of Object.entries(D.GEB)) {
      if (m.geenGeb[id] || (x.nacht && !isNacht(S))) continue;
      const doelen = x.tev ? S.open.filter(d => D.DISTRICTS[d] && !S.geb.some(g => g.tev && g.d === d))
        : x.doel.filter(b => S.n[b] > 0 && S.open.includes(B[b].d) && !S.geb.some(g => g.b === b) && S.rune?.[b] !== 'rust');
      if (doelen.length) opties.push([id, x, doelen, m.gebKansT[id] || 1]);
    }
    let r = Math.random() * opties.reduce((a, o) => a + o[3], 0);
    const o = opties.find(o => (r -= o[3]) < 0); if (!o) return null;
    const [id, x, doelen] = o, doel = doelen[Math.floor(Math.random() * doelen.length)];
    const duur = Math.round(BAL.gebDuur * m.herstel / (x.tev ? m.tevHerstel : 1));
    S.gebeurtenissen = (S.gebeurtenissen || 0) + 1;
    const g = { k: S.gebeurtenissen, id, over: duur, duur, ...(x.tev ? { tev: true, d: doel } : { b: doel, d: B[doel].d }) };
    if (id === 'storm' && m.voorhoede) { const R = rates(S, m); g.buit = vul(S, 'hout', R.prod.hout * 3600, m, R); }
    S.geb.push(g); return g;
  }
  function wereld(S, dt, m = mods(S)) {
    const ev = [], wasNacht = isNacht(S);
    S.klok = (S.klok || 0) + dt; S.geb = S.geb || [];
    if (isNacht(S) !== wasNacht) { ev.push({ t: isNacht(S) ? 'nacht' : 'dag' }); if (isNacht(S)) { tel(S, 'nachtTot'); S.nachtTik = 0; } }
    for (const g of S.geb) g.over -= dt;
    for (const g of S.geb.filter(g => g.over <= 0)) { ev.push({ t: 'gebKlaar', g }); tel(S, 'gebTot'); if (Math.random() < D.GAVE_GEBKANS) geefGave(S, 'bloei'); }
    S.geb = S.geb.filter(g => g.over > 0);
    S.gebT = (S.gebT || 0) + dt;
    while (S.gebT >= BAL.gebSec) {
      S.gebT -= BAL.gebSec;
      if (totaal(S) >= BAL.gebVanaf && S.geb.length < BAL.gebMax && Math.random() < BAL.gebKans * m.gebKans) { const g = startGeb(S, m); if (g) ev.push({ t: 'geb', g }); }
    }
    return ev;
  }
  function help(S, k) {   // tikken op een gebeurtenis helpt: elke tik haalt een paar seconden van de duur af
    const g = (S.geb || []).find(g => g.k === k); if (!g) return null;
    g.over -= BAL.helpSec; if (g.over <= 0) { S.geb = S.geb.filter(x => x !== g); tel(S, 'gebTot'); if (Math.random() < D.GAVE_GEBKANS) geefGave(S, 'bloei'); return { klaar: true, g }; }
    return { klaar: false, g };
  }

  function stats(S) {
    const m = mods(S);
    return { tot: totaal(S), bedden: bedden(S, m), open: echteOpen(S), gebieden: S.open.length - echteOpen(S), maxFase: Math.max(...BK.map(b => S.fase[b])),
      hout: S.houtTot, magie: S.magie, runs: S.runs, nova: S.nova, lomari: Object.keys(S.lom).length, tikken: S.tikken || 0,
      t: S.tel || {}, jaar: S.jaar || 0, bron: S.bronwerk?.t || 0, beproef: Object.keys(S.beproefKlaar || {}).length,
      f5d: Object.keys(D.DISTRICTS).filter(d => BK.some(b => B[b].d === d && S.n[b] > 0 && S.fase[b] >= 5)).length,
      band: Math.max(0, ...Object.values(S.lom).map(l => l.band || 0)), reliek: Math.max(0, ...Object.values(S.reliek || {})),
      verbandAlle: m.verbanden.length >= LM.V.length, stamVol: (S.jaar || 0) > 0 || D.STAR.every(x => S.star[x.id]) };
  }
  // ---------- Dagelijkse doelen ----------
  const tel = (S, k, n = 1) => { S.tel = S.tel || {}; S.tel[k] = (S.tel[k] || 0) + n; };
  function dagDoelen(S, datum) {   // nieuwe dag: drie nieuwe doelen; de tellers lopen gewoon door, elk doel onthoudt de beginstand
    if (S.dag?.datum === datum) return S.dag;
    S.tel = S.tel || {};
    const pot = Object.keys(D.DOEL).filter(k => !D.DOEL[k].kan || D.DOEL[k].kan(S)), keuze = [];
    while (keuze.length < D.DOEL_AANTAL && pot.length) keuze.push(pot.splice(Math.floor(Math.random() * pot.length), 1)[0]);
    S.dag = { datum, doelen: keuze.map(k => ({ k, n: D.DOEL[k].n, van: S.tel[k] || 0, op: false, gemeld: false })), bonus: false };
    return S.dag;
  }
  const doelStand = (S, d) => Math.min(d.n, (S.tel?.[d.k] || 0) - d.van);
  const doelKlaar = (S, d) => doelStand(S, d) >= d.n;
  // Een doelbeloning mag boven het maximum van 5 uitkomen: wat je verdiend hebt, raak je niet kwijt.
  const geefVrij = (S, id) => { S.gave = S.gave || {}; S.gave[id] = (S.gave[id] || 0) + 1; (S.gaveNieuw = S.gaveNieuw || []).push(id); };
  function haalDoel(S, i) {   // beloning ophalen: Groeigave, en bij het laatste van de drie ook een Bloeigave
    const d = S.dag?.doelen[i]; if (!d || d.op || !doelKlaar(S, d)) return false;
    d.op = true; geefVrij(S, 'groei');
    if (!S.dag.bonus && S.dag.doelen.every(x => x.op)) { S.dag.bonus = true; geefVrij(S, 'bloei'); }
    return true;
  }
  function doelMeld(S) {   // net voltooide doelen, één keer
    const uit = []; for (const d of S.dag?.doelen || []) if (!d.gemeld && doelKlaar(S, d)) { d.gemeld = true; uit.push(d); } return uit;
  }
  function checkAch(S) {
    const st = stats(S), nieuw = [];
    for (const a of D.ACH) if (!S.ach[a.id] && a.test(st)) { S.ach[a.id] = true; nieuw.push(a); geefGave(S, 'groei'); }
    return nieuw;
  }

  // ---------- Hergroei ----------
  const hergroeiKlaar = S => S.energieTot >= BAL.hergroeiEnergie;
  const novaWacht = S => hergroeiKlaar(S) ? Math.floor(D.novaFormule(S.earned) * mods(S).novaX) : 0;
  const beproefOpen = S => S.runs >= D.BEPROEF_VANAF;
  // Jaarring: kan als de hele Sterrenstam gegroeid is. Nova en Sterrenstam terug naar nul; ringen blijven.
  const jaarKlaar = S => D.STAR.every(s => S.star[s.id]);
  const jaarWacht = S => jaarKlaar(S) ? D.jaarFormule(S.nova) : 0;
  function jaarring(S) {
    const n = jaarWacht(S); if (n < 1) return null;
    const T = nieuw({ ...S, nova: 0, novaUit: 0, star: {}, jaar: (S.jaar || 0) + n, runs: S.runs + 1, beproefVolgende: null });
    for (let i = 0; i < 2; i++) geefGave(T, 'woud'); T.gaveNieuw = []; return T;
  }
  function hergroei(S, beproef = null) {
    const n = novaWacht(S); if (n < 1) return null;
    if (Date.now() - (S.rondeStart || Date.now()) < 864e5) tel(S, 'snel');
    const klaar = S.beproef ? { ...S.beproefKlaar, [S.beproef]: true } : S.beproefKlaar;   // ronde gehaald: beloning voor altijd
    const volgende = beproef && D.BEPROEF[beproef] && beproefOpen(S) ? beproef : null;
    const T = nieuw({ ...S, nova: S.nova + n, runs: S.runs + 1, beproefKlaar: klaar, beproefVolgende: volgende }); for (let i = 0; i < 2; i++) geefGave(T, 'woud'); T.gaveNieuw = []; return T;
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
    const m = mods(S), limiet = Math.min(24, m.offline), eff = Math.min(sec, limiet * 3600), voor = { ...S.r }, rend = Math.min(BAL.offlineMax, BAL.offlineRendement + m.offlineEff);
    const stappen = Math.max(1, Math.min(60, Math.ceil(eff / 60))), vondstVoor = S.vondstTot, ev = [];
    S.geb = []; S.gebT = 0;   // gebeurtenissen lossen zich op terwijl je weg bent; er komen geen nieuwe
    for (let i = 0; i < stappen; i++) { const mm = mods(S); mm.geenNacht = true; mm.geenCap = true; tick(S, eff / stappen, rend, mm); ev.push(...lomTick(S, eff / stappen, mm, true)); }
    S.klok = (S.klok || 0) + sec;
    if (m.nachtmanden && m.auto.verzamel) verzamel(S, Math.floor(eff / m.mandSec) * rend, 1, true);
    const winst = {}; RK.forEach(k => winst[k] = S.r[k] - voor[k]);
    return { sec, eff, winst, limiet, rend, vondsten: S.vondstTot - vondstVoor, ev };
  }

  // Productie per stuk van een gebouw, met alle bonussen (voor de uitleg in het spel)
  function perStuk(S, b, m = mods(S)) {
    const x = B[b]; if (!x.p) return {};
    const lijst = verbindingen(S), bed = bedden(S, m), job = banen(S), staff = job ? Math.min(1, bed / job) : 1;
    const f = 2 ** (S.fase[b] - 1) * staff * globaal(S, m) * nachtF(S, m) * stilF(S, b, m) * (S.rune?.[b] === 'groei' ? 1.5 : 1) * BAL.productieSchaal * (m.dist[x.d] || 1) * tevFactor(S, x.d, m) * verbindFactor(S, x.d, m, lijst);
    return Object.fromEntries(Object.entries(x.p).map(([k, v]) => [k, v * f * (m.res[k] || 1)]));
  }
  function waardeRate(S, m = mods(S)) { const R = rates(S, m); return RK.reduce((a, k) => a + RES[k].waarde * (R.prod[k] - R.use[k]), 0); }

  return { RK, BK, nieuw, mods, rates, tick, cap: (S, k, R) => { const m = mods(S); return cap(S, k, m, R || rates(S, m)); }, kostVan, kostVanN, maxN, faseKost, faseKlaar,
    faseDrempel: (S, b) => faseDrempel(S, b, mods(S)), kan, past, koop, groei, openDistrict, eisOk, eisTekst, koopUpgrade, upKost, magieKost,
    tel, dagDoelen, doelStand, doelKlaar, haalDoel, doelMeld, gaveX, gaveKan, zetGave, geefGave, gavePrijs, gaveKoopKan, koopGave,
    novaW, bonusLijst: S => bonusLijst(S), magieOpen, koopMagie, ambMax, ambTrede, ambOpen, ambKost, koopAmb, verzamel, automatiseer, stats, checkAch, hergroeiKlaar, novaWacht, hergroei, koopStar, offline,
    waardeRate, perStuk, tikWaarde, offlineInfo: S => { const m = mods(S); return { rend: Math.min(BAL.offlineMax, BAL.offlineRendement + m.offlineEff), limiet: Math.min(24, m.offline), manden: !!(m.nachtmanden && m.auto.verzamel) }; }, globaal: S => globaal(S, mods(S)), bedden: S => bedden(S, mods(S)), banen, totaal, achAantal,
    lomDef, plek, wijs, lomTick, kiesVondst, vangBol, xpNodig, eisLomOk: (S, e) => eisLomOk(S, e, mods(S)), eisLomTekst,
    jaarKlaar, jaarWacht, jaarring, beproefOpen, bronwerkOpen, leg, actKan, gebruik, doorbreekKan, doorbreek, opTocht, tochtKan: (S, id) => tochtKan(S, id), stuur,
    runeKost: (S, r) => runeKost(S, r, mods(S)), zetRune, punten, boomKan, koopKnoop,
    wereld, help, dagInfo, isNacht, bouwBezig, bouwTijd: (S, b) => bouwTijd(S, b, mods(S)), helpBouw,
    tevredenheid: (S, d) => tevredenheid(S, d, mods(S)), verbindingen, verbandActief: (S, v) => { const m = mods(S); return m.verbanden.includes(v.id); }, inDistrict };
})();
