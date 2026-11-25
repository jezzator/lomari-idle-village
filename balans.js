/* Lomari: Idle Village — balanstest. Een computerspeler speelt N dagen met dezelfde motor als het spel.
   Hij is 4× per dag actief (2× 1 uur, 2× een half uur) en koopt steeds wat het snelst terugverdiend is,
   inclusief de wachttijd tot hij het kan betalen. Hergroei zodra die zijn Nova minstens verdubbelt. */
window.BALANS = (() => {
  const D = window.DATA, E = window.ENGINE, { RES, B } = D;
  const waarde = c => Object.entries(c).reduce((a, [k, v]) => a + RES[k].waarde * v, 0);

  function opties(S) {
    const o = [];
    for (const b of E.BK) if (S.open.includes(B[b].d)) {
      o.push({ t: 'bouw', id: b, c: E.kostVan(S, b) });
      if (E.faseKlaar(S, b)) o.push({ t: 'fase', id: b, c: E.faseKost(S, b) });
    }
    for (const d in D.DISTRICTS) if (!S.open.includes(d)) o.push({ t: 'district', id: d, c: D.DISTRICTS[d].open });
    for (const u of D.U) if (!S.up[u.id] && E.eisOk(S, u.eis)) o.push({ t: 'upgrade', id: u.id, c: E.upKost(S, u) });
    if (E.magieOpen(S)) o.push({ t: 'magie', c: E.magieKost(S) });
    return o;
  }
  function pas(S, o, terug) {
    const d = terug ? -1 : 1;
    if (o.t === 'bouw') S.n[o.id] += d;
    else if (o.t === 'fase') S.fase[o.id] += d;
    else if (o.t === 'district') { if (terug) S.open.pop(); else S.open.push(o.id); }
    else if (o.t === 'upgrade') S.up[o.id] = !terug;
    else S.magie += d;
  }
  function winst(S, o, voor) {
    pas(S, o); let g = E.waardeRate(S); pas(S, o, true); g -= voor;
    if (o.t === 'district') g = Math.max(g, voor * .15);
    if (o.t === 'upgrade' && g <= 0) g = voor * .02;        // automatisering e.d.: kleine waarde
    return g;
  }
  function beslis(S) {
    for (const id in S.lom) { const l = S.lom[id], d = E.lomDef(id).d; if (!l.d && S.open.includes(d)) E.wijs(S, id, d); }
    while (S.vondsten.length) E.kiesVondst(S, 0, 'buit');
    const m = E.mods(S), R = E.rates(S, m);
    if (E.bedden(S) < E.banen(S) + 1) for (const b of ['familie', 'nest']) if (S.open.includes(B[b].d) && E.koop(S, b)) return true;
    if (R.prod.voedsel < R.use.voedsel * 1.1 && E.koop(S, 'bessen')) return true;
    const voor = E.waardeRate(S, m), net = {}; E.RK.forEach(k => net[k] = R.prod[k] - R.use[k]);
    let best = null; const geblokt = [];
    for (const o of opties(S)) {
      const g = winst(S, o, voor); if (g <= 0) continue;
      let wacht = 0;
      for (const [k, v] of Object.entries(o.c)) {
        const tekort = v - S.r[k];
        if (tekort > 0) { if (net[k] <= 1e-9) { wacht = Infinity; break; } wacht = Math.max(wacht, tekort / net[k]); }
      }
      if (wacht === Infinity) continue;
      if (!E.past(S, o.c)) { geblokt.push(o); continue; }
      const score = wacht + waarde(o.c) / g;
      if (!best || score < best[0]) best = [score, o];
    }
    for (const o of geblokt) for (const [k, v] of Object.entries(o.c)) if (E.cap(S, k) < v)
      for (const b of E.BK) if (B[b].o?.[k] && S.open.includes(B[b].d) && E.koop(S, b)) return true;
    if (!best) return false;
    const o = best[1];
    if (!E.kan(S, o.c)) return false;
    if (o.t === 'bouw') return E.koop(S, o.id);
    if (o.t === 'fase') return E.groei(S, o.id);
    if (o.t === 'district') return E.openDistrict(S, o.id);
    if (o.t === 'upgrade') return E.koopUpgrade(S, o.id);
    return E.koopMagie(S);
  }

  // Draait asynchroon in stukjes zodat de pagina blijft reageren. voortgang(fractie), klaar(resultaat)
  function draai(dagen, voortgang, klaar) {
    const sessies = [[8, 1], [12.5, .5], [17, .5], [21, 1]];
    let S = E.nieuw(); S.r.hout = 30; let t = 0; const ev = [], gezien = new Set(), resets = [];
    const markeer = (naam) => { if (!gezien.has(naam)) { gezien.add(naam); ev.push([t / 3600, naam]); } };
    const plan = []; for (let d = 0; d < dagen; d++) for (const [h, dur] of sessies) plan.push([d * 24 + h, dur]);
    let i = 0;
    function stuk() {
      const tot = performance.now() + 40;
      while (i < plan.length && performance.now() < tot) {
        const [start, dur] = plan[i++];
        const gat = start * 3600 - t;
        if (gat > 0) { E.offline(S, gat); t = start * 3600; }
        const eind = t + dur * 3600;
        while (t < eind) {
          for (let j = 0; j < 20 && beslis(S); j++);
          E.tick(S, 15); E.lomTick(S, 15); E.automatiseer(S, 15); t += 15;
          const st = E.stats(S);
          S.open.forEach(d => D.START_OPEN.includes(d) || markeer(`${d} open`));
          if (st.maxFase >= 3) markeer('Eerste groeifase 3');
          for (const id in S.lom) markeer(E.lomDef(id).naam + ' sluit zich aan');
          if (st.magie >= 1) markeer('Eerste magische upgrade');
          for (const n of [100, 500]) if (st.tot >= n) markeer(`${n} gebouwen`);
          E.checkAch(S);
        }
        const wacht = E.novaWacht(S);
        if (wacht >= Math.max(10, S.nova)) {
          resets.push([t / 3600, wacht, S.nova + wacht]);
          S = E.hergroei(S); gezien.clear();
        }
      }
      voortgang(i / plan.length);
      if (i < plan.length) setTimeout(stuk, 0);
      else klaar({ ev, resets, eind: { gebouwen: E.totaal(S), nova: S.nova, open: S.open.length, waardePerSec: E.waardeRate(S) } });
    }
    stuk();
  }
  return { draai };
})();
