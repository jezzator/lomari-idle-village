/* Lomari: Idle Village — interface. Leest DATA, rekent via ENGINE. */
{
const D = window.DATA, E = window.ENGINE, LM = window.LOM, { RES, B, BAL } = D;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SLEUTEL = 'lomari-idle-v1';
const DKLEUR = { Takelom: '#b5483a', Rikilari: '#3d5f9a', Lomavii: '#4f7d3a', Dorukha: '#7a5a3a', Moloro: '#2f7a76', Frikto: '#45478a', Voelari: '#7b4f9e', Valunari: '#3f8aa0', Kroveli: '#c8902e', Lomaruun: '#a8432a' };

// ---------- getallen ----------
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
function fmt(x) {
  if (!isFinite(x)) return '∞';
  const a = Math.abs(x);
  if (a < 10000) return Math.floor(x).toLocaleString('nl-NL');
  const e = Math.min(SUF.length - 1, Math.floor(Math.log10(a) / 3));
  if (e >= SUF.length - 1 && a >= 1e24) return x.toExponential(2).replace('.', ',');
  return (x / 10 ** (e * 3)).toFixed(1).replace('.', ',') + SUF[e];
}
function fmtR(x) {
  const a = Math.abs(x);
  if (a === 0) return '0';
  if (a < .01) return x.toPrecision(2).replace('.', ',');
  if (a < 1) return x.toFixed(2).replace('.', ',');
  if (a < 100) return x.toFixed(1).replace('.', ',');
  return fmt(x);
}
function duur(s) {
  s = Math.floor(s); const d = Math.floor(s / 86400), u = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return d ? `${d} d ${u} u` : u ? `${u} u ${m} m` : m ? `${m} m ${s % 60} s` : `${s} s`;
}
const ico = k => window.ART ? ART.res(k) : `<i style="background:${RES[k].kleur}"></i>`;
const kost = c => Object.entries(c).map(([k, v]) => `<span class="kc" data-r="${k}" data-v="${v}">${ico(k)}${fmt(v)} ${RES[k].naam.toLowerCase()}</span>`).join('');

// ---------- state ----------
let flits = null, faseMoment = null, testUit = '', testBezig = false, S, tab = 'dorp', sel = 'Takelom', modus = 1, sig = '', melding = [];
function laad() {
  try { const x = JSON.parse(localStorage.getItem(SLEUTEL)); if (x && x.v === 1) return herstel(x); } catch (e) {}
  return E.nieuw();
}
function herstel(x) {
  const S0 = E.nieuw(); const S1 = Object.assign(S0, x);
  for (const k of ['lom', 'ooit', 'vondstBonus']) S1[k] = S1[k] || {}; S1.vondsten = S1.vondsten || []; S1.vondstTot = S1.vondstTot || 0; S1.vondstT = S1.vondstT || 0; S1.lichtT = S1.lichtT || 0; S1.gebeurtenissen = S1.gebeurtenissen || 0;
  E.RK.forEach(k => S1.r[k] = S1.r[k] || 0); E.BK.forEach(b => { S1.n[b] = S1.n[b] || 0; S1.fase[b] = S1.fase[b] || 1; });
  return S1;
}
function bewaar() { S.t = Date.now(); try { localStorage.setItem(SLEUTEL, JSON.stringify(S)); } catch (e) {} }

// ---------- tekeningen ----------
function gebouwSvg(b, fase) {
  if (window.ART && ART.heeft(b)) return ART.gebouw(b, fase, !!B[b].o);
  const x = B[b], kl = DKLEUR[x.d];
  if (x.brug) return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 22q20 18 40 0" fill="none" stroke="#6b4a2a" stroke-width="3"/><path d="M4 22v10M44 22v10M12 28v6M20 31v5M28 31v5M36 28v6" stroke="#8a6a44" stroke-width="2"/><path d="M4 18q20 14 40 0" fill="none" stroke="#c9a46a" stroke-width="1.5"/></svg>`;
  if (x.o) return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="16" width="32" height="24" rx="3" fill="#7a5532"/><path d="M8 24h32M8 32h32" stroke="#4e3420" stroke-width="2"/><rect x="8" y="12" width="32" height="5" rx="2" fill="${kl}"/></svg>`;
  if (x.bed) return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="32" rx="18" ry="9" fill="#8a6238"/><ellipse cx="24" cy="29" rx="13" ry="5" fill="#d9b98a"/><path d="M10 30q14 8 28 0" stroke="#5c3d22" stroke-width="2" fill="none"/><circle cx="34" cy="14" r="3" fill="#f2c46a" opacity=".9"/></svg>`;
  let s = `<rect x="21" y="8" width="6" height="36" rx="2" fill="#6b4a2a"/>`;
  for (let i = 0; i < fase; i++) { const y = 38 - i * 7, w = 14 + i * 2; s += `<rect x="${24 - w}" y="${y}" width="${w * 2}" height="3" rx="1.5" fill="#a77a48"/><rect x="${24 - w + 2}" y="${y - 4}" width="5" height="4" fill="${kl}"/>`; }
  s += `<path d="M14 ${38 - fase * 7}l10-7 10 7z" fill="${kl}"/>`;
  if (fase >= 4) s += `<circle cx="36" cy="${30 - fase * 3}" r="2.5" fill="#f2c46a"/><circle cx="12" cy="${34 - fase * 3}" r="2" fill="#f2c46a"/>`;
  if (fase >= 5) s += `<circle cx="24" cy="4" r="3" fill="#c48ae8"/>`;
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${s}</svg>`;
}

// ---------- weergave ----------
function balk() {
  const m = E.mods(S), R = E.rates(S, m);
  if (!$('#res').children.length) $('#res').innerHTML = E.RK.map(k => `<button class="rs" data-res="${k}" aria-label="${RES[k].naam}: waar komt het vandaan?"><span class="rn">${ico(k)}${RES[k].naam}</span>
      <b></b><small></small><em></em><span class="vul"><i></i></span><span class="tijd"></span></button>`).join('');
  for (const k of E.RK) {
    const el = $(`[data-res="${k}"]`), c = E.cap(S, k), net = R.prod[k] - R.use[k];
    el.hidden = !!RES[k].zeldzaam && !S.open.includes(RES[k].zeldzaam) && S.r[k] <= 0;
    el.classList.toggle('vol', S.r[k] >= c * .999); el.classList.toggle('bijna', S.r[k] >= c * .9);
    el.querySelector('.vul i').style.width = Math.min(100, S.r[k] / c * 100) + '%';
    el.querySelector('.tijd').textContent = volTekst(S.r[k], c, net);
    el.querySelector('b').textContent = fmt(S.r[k]); el.querySelector('small').textContent = '/ ' + (innerWidth < 600 && c >= 1000 ? (c >= 1e6 ? fmt(c) : (c / 1000).toFixed(1).replace('.', ',') + 'K') : fmt(c));
    const em = el.querySelector('em'); em.textContent = `${net >= 0 ? '+' : ''}${fmtR(net)}/s`; em.className = net < 0 ? 'neg' : '';
  }
  const st = `${fmt(R.bed)} bewoners voor ${fmt(R.job)} werkplekken · bemanning ${Math.round(R.staff * 100)}%`;
  $('#bew').textContent = st;
  $('#hon').hidden = !R.honger;
  $('#nova').textContent = S.nova ? `${S.nova} Nova · +${Math.round(S.nova * BAL.novaPct * 100)}%` : '';
}

function gebiedKnoppen() {
  const g = Object.keys(D.GEBIEDEN).filter(d => S.open.includes(d));
  $('#gebieden').innerHTML = g.length ? '<span>Gebieden:</span>' + g.map(d => `<button class="${sel === d ? 'sel' : ''}" data-sel="${d}" style="--dk:${DKLEUR[d]}">${d}${E.inDistrict(S, d).length ? ` · ${E.inDistrict(S, d).map(id => E.lomDef(id).naam).join(', ')}` : ''}</button>`).join('') : '';
}
function dorpGebouwen() {
  let h = '';
  for (const [d, x] of Object.entries(D.DISTRICTS)) {
    if (!S.open.includes(d)) continue;
    const [l, t, w, hh] = x.vak;
    const lijst = E.BK.filter(b => B[b].d === d && S.n[b] > 0).sort((a, b) => (S.fase[b] - S.fase[a]) || (S.n[b] - S.n[a])).slice(0, 6);
    lijst.forEach((b, i) => {
      const rij = i < 3 ? 0 : 1, kol = i % 3, f = S.fase[b];
      const cx = l + w * (.3 + kol * .2 + rij * .1), cy = t + hh * (rij ? .86 : .64);
      const size = 6 + f * .8 + Math.min(2, Math.log10(S.n[b] + 1));
      h += `<span style="left:${cx}%;top:${cy}%;width:${size}%;position:absolute;display:block;transform:translate(-50%,-100%)">${gebouwSvg(b, f).replace('<svg ', '<svg style="width:100%;height:auto;position:static;transform:none" ')}</span>`;
    });
  }
  $('#bouw').innerHTML = h;
}
function hotspots() {
  gebiedKnoppen(); dorpGebouwen(); setTimeout(gloed, 0);
  $('#spots').innerHTML = Object.entries(D.DISTRICTS).map(([d, x]) => {
    const [l, t, w, h] = x.vak, open = S.open.includes(d);
    const n = E.BK.filter(b => B[b].d === d).reduce((a, b) => a + S.n[b], 0);
    return `<button class="spot${open ? '' : ' dicht'}${sel === d ? ' sel' : ''}" data-sel="${d}" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%" aria-label="${d}${open ? `, ${n} gebouwen` : ', gesloten'}">
      <span class="lmk">${E.inDistrict(S, d).map(id => `<img src="portret/${id}.jpg" alt="">`).join('')}</span><span class="tag">${open ? n : 'Gesloten'}</span></button>`;
  }).join('');
}

const GIDS = [
  { tekst: 'Tik een paar keer op Verzamelen onder de plaat. Zo krijg je je eerste hout.', klaar: () => S.tikken >= 3 || S.n.hakplek >= 1 },
  { tekst: 'Bouw een Houthakkersplek in Takelom. Die maakt vanaf nu elke seconde hout.', d: 'Takelom', klaar: () => S.n.hakplek >= 1 },
  { tekst: 'Bouw Bladplukkers in Lomavii. Bladeren heb je nodig voor woningen.', d: 'Lomavii', klaar: () => S.n.pluk >= 1 },
  { tekst: 'Bouw een Slaapnest in Moloro. Elk gebouw heeft werkers nodig, en die wonen hier.', d: 'Moloro', klaar: () => S.n.nest >= 1 },
  { tekst: 'Bouw 5 Houthakkersplekken. Elk nieuw exemplaar is iets duurder, maar maakt evenveel.', d: 'Takelom', klaar: () => S.n.hakplek >= 5 },
  { tekst: 'Bouw een Stammenrek. Is je opslag vol, dan gaat nieuwe productie verloren.', d: 'Takelom', klaar: () => S.n.stamrek >= 1 },
  { tekst: 'Open Dorukha. Daar maak je steen, nodig voor grotere gebouwen.', d: 'Dorukha', klaar: () => S.open.includes('Dorukha') },
  { tekst: 'Koop je eerste upgrade bij Upgrades.', tab: 'upgrades', klaar: () => Object.values(S.up).some(Boolean) },
];
function gids() {
  if (S.instel.gidsUit) return '';
  const i = GIDS.findIndex(g => !g.klaar()); if (i < 0) return '';
  const g = GIDS[i], ga = g.d ? (sel === g.d ? '' : `<button class="knop klein" data-ga="${g.d}">Ga naar ${g.d}</button>`) : g.tab ? `<button class="knop klein" data-tab-ga="${g.tab}">Naar Upgrades</button>` : '';
  return `<div class="gids"><small>Eerste stappen · ${i + 1} van ${GIDS.length}</small><p>${g.tekst}</p><div class="rij">${ga}<button class="knop klein licht" id="gidsuit">Verberg</button></div>
    <p class="nb">Tip: tik bovenin op een grondstof om te zien waar hij vandaan komt.</p></div>`;
}
function paneelDorp() {
  const d = sel, x = D.DISTRICTS[d] || D.GEBIEDEN[d], open = S.open.includes(d), m = E.mods(S);
  let h = gids() + `<div class="dkop" style="--dk:${DKLEUR[d]}">${window.ART ? ART.embleem(d, DKLEUR[d]) : ''}<div><h2>${d}</h2><p>${x.functie}</p></div></div>`;
  if (open) {
    const vb = E.verbindingen(S).filter(([a, b]) => a === d || b === d).map(([a, b]) => a === d ? b : a);
    const hier = E.inDistrict(S, d), thuis = LM.L.filter(l => l.d === d && S.lom[l.id]).map(l => l.naam);
    if (D.GEBIEDEN[d]) h += `<p class="uitleg"><b>Gebied:</b> blijft open na elke Hergroei. ${D.GEBIEDEN[d].bonus}</p>`;
    h += `<div class="dinfo">${S.lom.sora ? `<span>Tevredenheid <b>${Math.round(E.tevredenheid(S, d))}%</b></span>` : ''}
      ${hier.length > 2 ? `<span>Drukte: ${hier.length} Lomari in één district kan de tevredenheid verlagen</span>` : ''}
      ${(() => { const t = districtOpbrengst(d); const r = Object.entries(t).filter(([, v]) => v > 0); return r.length ? `<span><b>Maakt nu:</b> ${r.map(([k, v]) => `${ico(k)}${fmtR(v)} ${RES[k].naam.toLowerCase()}/s`).join(' · ')}</span>` : ''; })()}
      <span>Verbonden met: ${vb.length ? vb.join(', ') : 'nog niets'}</span>
      <span>Lomari hier: ${hier.length ? hier.map(id => E.lomDef(id).naam).join(', ') : 'geen'}${thuis.length ? ` · thuis: ${thuis.join(', ')}` : ''}</span></div>`;
  }
  if (!open) return h + `<div class="kaart"><h3>${d} openen</h3><p class="kost">${kost(x.open)}</p><button class="knop" data-open="${d}">Open ${d}</button></div>`;
  h += `<p class="uitleg">Een gebouw wordt op twee manieren sterker. <b>Bouw</b> geeft je een extra exemplaar. <b>Upgrade</b> brengt het gebouw naar een hogere fase (1 tot 5): dat kan bij 10, 25, 50 en 100 exemplaren, en verdubbelt dan de productie van al je exemplaren.</p>`;
  h += `<div class="modi" role="group" aria-label="Aantal kopen">${[1, 10, 'max'].map(v => `<button data-modus="${v}" class="${modus === v ? 'aan' : ''}">${v === 'max' ? 'Max' : '×' + v}</button>`).join('')}</div>`;
  for (const b of E.BK.filter(b => B[b].d === d)) {
    const y = B[b], f = S.fase[b], n = S.n[b], ps = E.perStuk(S, b, m);
    const rs = (obj, x = 1) => Object.entries(obj).map(([k, v]) => `${fmtR(v * x)} ${RES[k].naam.toLowerCase()}`).join(' + ');
    let wat = '';
    if (y.p) {
      wat = n ? `<b>Nu:</b> ${n} ${n > 1 ? 'stuks maken' : 'stuk maakt'} samen ${rs(ps, n)}/s · <b>+1 stuk:</b> +${rs(ps)}/s`
              : `<b>Eén stuk maakt</b> ${rs(ps)}/s`;
      if (y.c) wat += ` · verbruikt ${Object.entries(y.c).map(([k, v]) => `${fmtR(v * BAL.productieSchaal * 2 ** (f - 1) * m.ketenIn)} ${RES[k].naam.toLowerCase()}`).join(' + ')} per stuk`;
    }
    else if (y.o) {
      const nu = Object.keys(y.o).map(k => [k, E.cap(S, k)]); S.n[b]++; const na = Object.keys(y.o).map(k => E.cap(S, k)); S.n[b]--;
      wat = `<b>Opslag nu:</b> ${nu.map(([k, c]) => `${fmt(c)} ${RES[k].naam.toLowerCase()} (${Math.round(S.r[k] / c * 100)}% vol)`).join(' · ')} · <b>+1 stuk:</b> ${nu.map(([k, c], i) => `+${fmt(na[i] - c)} ${RES[k].naam.toLowerCase()}`).join(' · ')}`;
    }
    else if (y.bed) wat = `<b>+${y.bed + (m.bed[b] || 0)} bewoners</b> per stuk. Elk gebouw dat iets maakt heeft werkers nodig.`;
    else if (y.brug) wat = `<b>+${Math.round(m.brug * 100)}% op alle productie</b> per brug, en elke brug verbindt twee districten.`;
    else if (y.bron) wat = n ? `<b>Fase ${f} van 5:</b> +${5 * f}% op alle productie. Na elke Hergroei blijft de bron staan en groeit hij een fase.` : '<b>+5% op alle productie per fase.</b> Je bouwt er maar één. Hij blijft na elke Hergroei staan en groeit dan een fase.';
    if (y.w) wat += ` · ${y.w} ${y.w > 1 ? 'werkers' : 'werker'} per stuk`;
    let fz = '';
    if (y.p && f < 5) {
      const dr = E.faseDrempel(S, b), naar = `<span class="fz">${gebouwSvg(b, f)}<span>→</span>${gebouwSvg(b, f + 1)}</span>`;
      const effect = n ? `Alle ${n} ${y.naam.toLowerCase()} maken dan ×2: van ${rs(ps, n)} naar ${rs(ps, 2 * n)} per seconde.` : 'De productie van dit gebouw verdubbelt.';
      fz = E.faseKlaar(S, b)
        ? `<div class="fase">${naar}<div><b>Upgrade naar fase ${f + 1}: ${D.FASE_NAAM[f]}</b><br>${effect} Het gebouw groeit zichtbaar.</div><span class="kost">${kost(E.faseKost(S, b))}</span><button class="knop klein" data-fase="${b}">Upgrade naar fase ${f + 1}</button></div>`
        : `<div class="bar" title="Naar groeifase ${f + 1}"><i style="width:${Math.min(100, n / dr * 100)}%"></i></div><small class="nb">Upgrade naar fase ${f + 1} (${D.FASE_NAAM[f]}, productie ×2) kan bij ${dr} stuks. Je hebt er ${n}, nog ${dr - n} bouwen.</small>`;
    } else if (y.p) fz = '<small class="nb">Hoogste fase bereikt: Meesterwerk.</small>';
    const ups = D.U.filter(u => u.fx.some(e => (e.t === 'prod' && (y.p?.[e.res] || e.d === d)) || (e.t === 'bed' && e.b === b) || (e.t === 'brug' && y.brug) || (e.t === 'opslag' && y.o)));
    const upl = ups.length ? `<p class="ups">Upgrades uit de winkel: ${ups.map(u => { const st = S.up[u.id] ? 'heb' : E.eisOk(S, u.eis) ? 'kan' : 'nog';
      return `<button class="upl ${st}" data-tab-ga="upgrades" title="${st === 'heb' ? 'Gekocht' : st === 'kan' ? 'Te koop bij Upgrades' : 'Vereist: ' + esc(E.eisTekst(u.eis))}">${st === 'heb' ? '✓ ' : ''}${u.naam} <span>(${u.tekst})</span></button>`; }).join('')}</p>` : '';
    h += `<div class="gb${flits === b ? ' flits' : ''}${faseMoment === b ? ' groei' : ''}" data-gb="${b}"><div class="ico">${gebouwSvg(b, f)}</div><div class="gi">
      <h3>${y.naam} <span class="n">${n}</span>${y.p ? `<span class="fn">fase ${f} van 5: ${D.FASE_NAAM[f - 1]}</span>` : ''}</h3><p>${wat}</p>
      <p class="kost" data-kost="${b}"></p>${fz}${upl}</div>
      <button class="knop" data-buy="${b}"></button></div>`;
  }
  return h;
}

const CAT_UITLEG = { A: 'Meer productie van één grondstof of één district.', B: 'Goedkoper bouwen, meer opslag of minder voedselverbruik.',
  C: 'Dingen die het dorp vanzelf gaat doen, ook als jij niet kijkt.', F: 'Meer uit elke tik op Verzamelen. Vooral sterk aan het begin en voor wie actief speelt.', D: 'Magie uit Voelari: versterkt alles tegelijk.', E: 'Meer bewoners en sterkere samenwerking tussen districten.' };
// Wat verandert er als je deze upgrade koopt? Rekent het verschil echt uit.
function effectNu(u) {
  const m0 = E.mods(S), R0 = E.rates(S, m0), cap0 = Object.fromEntries(E.RK.map(k => [k, E.cap(S, k)])), bed0 = E.bedden(S);
  S.up[u.id] = true; const m1 = E.mods(S), R1 = E.rates(S, m1), cap1 = Object.fromEntries(E.RK.map(k => [k, E.cap(S, k)])), bed1 = E.bedden(S); delete S.up[u.id];
  const t = [];
  for (const k of E.RK) if (R1.prod[k] - R0.prod[k] > 1e-6 && R0.prod[k] > 0) t.push(`${RES[k].naam.toLowerCase()} van ${fmtR(R0.prod[k])} naar ${fmtR(R1.prod[k])} per seconde`);
  for (const k of E.RK) if (cap1[k] > cap0[k] + .5) t.push(`opslag ${RES[k].naam.toLowerCase()} van ${fmt(cap0[k])} naar ${fmt(cap1[k])}`);
  if (bed1 > bed0) t.push(`bewoners van ${fmt(bed0)} naar ${fmt(bed1)}`);
  if (R1.use.voedsel < R0.use.voedsel - 1e-6) t.push(`voedselverbruik van ${fmtR(R0.use.voedsel)} naar ${fmtR(R1.use.voedsel)} per seconde`);
  if (u.fx.some(e => e.t === 'kost')) { const b = E.BK.filter(b => S.open.includes(B[b].d) && B[b].p).sort((a, c) => S.n[c] - S.n[a])[0];
    if (b) { const k = Object.keys(B[b].k)[0]; t.push(`volgende ${B[b].naam} van ${fmt(E.kostVan(S, b, m0)[k])} naar ${fmt(E.kostVan(S, b, m1)[k])} ${RES[k].naam.toLowerCase()}`); } }
  if (u.cat === 'F') {
    const w0 = E.tikWaarde(S, m0); S.up[u.id] = true; const w1 = E.tikWaarde(S); delete S.up[u.id];
    const tx = w => Object.entries(w).map(([k, v]) => `${fmtR(v)} ${RES[k].naam.toLowerCase()}`).join(' + ');
    if (tx(w0) !== tx(w1)) t.push(`een tik geeft nu ${tx(w0)}, daarna ${tx(w1)}`);
    if (u.fx.some(e => e.t === 'ritme')) t.push('tik 10 keer binnen 3 seconden en de tiende tik geeft ×3');
    if (u.fx.some(e => e.t === 'mandSec')) t.push('de manden tikken twee keer zo vaak');
  }
  if (u.fx.some(e => e.t === 'faseKost')) t.push('elke fase-upgrade kost 20% minder');
  if (u.fx.some(e => e.t === 'auto')) t.push('gaat vanzelf, je hoeft er niets voor te doen');
  if (!t.length && u.fx.some(e => e.t === 'prod')) t.push('werkt zodra je het bijbehorende gebouw hebt');
  return t;
}
function eisVoortgang(e) {
  const r = [];
  if (e?.b) r.push([`${e.b[1]}× ${B[e.b[0]].naam} (in ${B[e.b[0]].d})`, S.n[e.b[0]], e.b[1]]);
  if (e?.tot) r.push([`${e.tot} gebouwen in totaal`, E.totaal(S), e.tot]);
  if (e?.d) r.push([`${e.d} open`, S.open.includes(e.d) ? 1 : 0, 1]);
  if (e?.tik) r.push([`${e.tik} keer getikt op Verzamelen`, S.tikken || 0, e.tik]);
  if (e?.lom) r.push([`${e.lom} Lomari ontmoet`, Object.keys(S.lom).length, e.lom]);
  if (e?.u) for (const id of e.u) r.push([`eerst: ${D.U.find(x => x.id === id).naam}`, S.up[id] ? 1 : 0, 1]);
  return r.map(([t, nu, nodig]) => `<li class="${nu >= nodig ? 'ok' : ''}">${nu >= nodig ? '✓' : '○'} ${t}${nodig > 1 && nu < nodig ? ` · nu ${fmt(nu)}` : ''}</li>`).join('');
}
function upgradeKaart(u) {
  const ok = E.eisOk(S, u.eis), c = E.upKost(S, u), nu = ok ? effectNu(u) : [];
  return `<div class="up${ok ? '' : ' slot'}"><div><h3>${u.naam}</h3><p class="wat">${u.tekst}</p>
    ${ok ? (nu.length ? `<p class="nu">Voor jou nu: ${nu.join('; ')}.</p>` : '') + `<p class="kost">${kost(c)}</p>`
         : `<ul class="eisl">${eisVoortgang(u.eis)}</ul>`}</div>
    ${ok ? `<button class="knop" data-up="${u.id}">Koop</button>` : ''}</div>`;
}
function paneelUpgrades() {
  let h = '<p class="intro">Een upgrade koop je één keer en werkt daarna altijd, tot een Hergroei. Bij elke upgrade die je kunt kopen staat wat hij nu voor jou verandert. Grijze upgrades laten zien wat er nog nodig is.</p>';
  for (const [c, naam] of Object.entries(D.CAT)) {
    const lijst = D.U.filter(u => u.cat === c && !S.up[u.id]), klaar = D.U.filter(u => u.cat === c && S.up[u.id]).length;
    h += `<h2>${naam}</h2><p class="intro">${CAT_UITLEG[c]}</p>`;
    if (c === 'D') {
      const max = E.mods(S).magieMax;
      h += S.open.includes('Voelari')
        ? (S.magie < max ? `<div class="up"><div><h3>Flohara-resonantie ${D.ROMEIN[S.magie]}</h3><p class="wat">Alle productie ×1,25 (${S.magie} van ${max} gekocht). Elke volgende is duurder.</p><p class="kost">${kost(E.magieKost(S))}</p></div><button class="knop" data-magie="1">Koop</button></div>`
          : `<p class="intro">Alle ${max} resonanties gekocht.</p>`)
        : `<div class="up slot"><div><h3>Flohara-resonantie</h3><p>Alle productie ×1,25, ${max} niveaus</p><p class="eis">Vereist: Voelari open</p></div></div>`;
    }
    h += lijst.sort((a, b) => (E.eisOk(S, b.eis) - E.eisOk(S, a.eis)) || (E.kan(S, E.upKost(S, b)) - E.kan(S, E.upKost(S, a)))).map(upgradeKaart).join('');
    if (klaar) h += `<p class="gekocht">✓ Gekocht: ${D.U.filter(u => u.cat === c && S.up[u.id]).map(u => `${u.naam} (${u.tekst})`).join(' · ')}</p>`;
  }
  return h;
}
function paneelLomari() {
  const m = E.mods(S), n = Object.keys(S.lom).length;
  let h = `<p class="intro">${n} van ${LM.L.length} Lomari ontmoet. Zet een Lomari in een district: in het eigen district werkt de gave voor 100%, elders voor 40%. Vrije Lomari geven geen gave, maar tellen wel mee voor Verbanden vanuit hun eigen district. Wisselen tussen districten kost ${Math.round(LM.CFG.reisSec * m.reis / 60)} minuten reistijd.</p>`;
  if (S.vondsten.length) h += `<div class="kaart vd"><h2>Verborgen plekken</h2>` + S.vondsten.map((v, i) => `<div class="up"><div><h3>Melo vond een verborgen plek</h3><p>Kies: een buit van 2 uur productie, of blijvend +1% ${RES[v.res].naam.toLowerCase()} (blijft ook na Hergroei).</p></div>
    <div class="rij"><button class="knop klein" data-vondst="${i}" data-keuze="buit">Buit</button><button class="knop klein" data-vondst="${i}" data-keuze="bonus">+1% ${RES[v.res].naam.toLowerCase()}</button></div></div>`).join('') + '</div>';
  h += '<div class="lmgrid">' + LM.L.map(def => {
    const l = S.lom[def.id];
    if (!l) return `<div class="lm slot"><img src="portret/${def.id}.jpg" alt=""><div><h3>${def.naam}</h3><p class="spec">${def.spec} · thuis in ${def.d}</p><p class="eis">Ontmoet je bij: ${esc(E.eisLomTekst(def.eis))}</p></div></div>`;
    const p = E.plek(S, def.id), sterk = !p ? null : (def.overal || p === def.d ? 100 : 40);
    const status = l.reis > 0 ? `onderweg naar ${l.d}, nog <span data-reis="${def.id}">${duur(l.reis)}</span>` : !l.d ? 'vrij in het dorp: gave werkt niet' : `ingezet in ${l.d}: gave werkt voor ${sterk}%`;
    const opts = ['', ...S.open].map(d => `<option value="${d}" ${(l.d || '') === d ? 'selected' : ''}>${d || 'Vrij'}</option>`).join('');
    return `<div class="lm${l.d && !l.reis ? ' actief' : ''}"><img src="portret/${def.id}.jpg" alt="${def.naam}"><div>
      <h3>${def.naam} <span class="n">Band ${l.band}</span></h3><p class="spec">${def.spec} · thuis in ${def.d}</p>
      <p class="pers">${def.pers}. ${def.gave}</p>
      <p class="gave"><b>Gave:</b> ${def.pasTekst(l.band)}</p>
      <p class="st">${status}</p>
      <div class="bar" title="Band ${l.band + 1}"><i style="width:${l.band >= LM.CFG.bandMax ? 100 : Math.min(100, l.xp / E.xpNodig(l.band) * 100)}%"></i></div>
      <label class="wl">Inzet <select data-wijs="${def.id}">${opts}</select></label></div></div>`;
  }).join('') + '</div>';
  h += `<h2>Verbanden</h2><p class="intro">Een Verband werkt als alle leden in hetzelfde district staan, of in districten die verbonden zijn. Elke Touwbrug legt een nieuwe verbinding.</p>`;
  h += LM.V.map(v => {
    const act = m.verbanden.includes(v.id), heb = v.leden.every(id => S.lom[id]);
    return `<div class="vb${act ? ' aan' : ''}${v.b ? ' later' : ''}"><span class="vbl">${v.leden.map(id => `<img src="portret/${id}.jpg" alt="${E.lomDef(id).naam}" class="${S.lom[id] ? '' : 'grijs'}">`).join('')}</span>
      <div><h3>${v.naam}</h3><p>${v.tekst}${v.b ? ' · werkt vanaf deel B' : ''}</p><p class="eis">${act ? 'Actief' : heb ? 'Niet actief: zet de leden samen of verbind hun districten' : 'Nog niet alle leden ontmoet'}</p></div></div>`;
  }).join('');
  return h;
}
function paneelStam() {
  const vrij = S.nova - S.novaUit, wacht = E.novaWacht(S), klaar = E.hergroeiKlaar(S);
  let h = `<div class="kaart hg"><h2>Hergroei</h2>
    <p>Begin het dorp opnieuw. Je houdt je Nova, de Sterrenstam en je prestaties. Gebouwen, voorraad, upgrades en de districten na de eerste drie beginnen opnieuw.</p>
    ${klaar ? `<p class="groot">Hergroei levert nu <b id="wacht">${wacht}</b> Nova op</p>${E.mods(S).veyra ? `<p>Veyra: deze ronde ${(wacht / Math.max(.1, (Date.now() - S.rondeStart) / 3600)).toFixed(2).replace('.', ',')} Nova per uur. Zolang dit stijgt, loont doorspelen.</p>` : ''}<button class="knop" id="hergroei">Hergroei</button>`
      : `<p>Beschikbaar na ${fmt(BAL.hergroeiEnergie)} Flohara-energie in deze ronde.</p><div class="bar"><i id="ebar" style="width:${Math.min(100, S.energieTot / BAL.hergroeiEnergie * 100)}%"></i></div><small class="nb" id="etekst">${fmt(S.energieTot)} van ${fmt(BAL.hergroeiEnergie)}</small>`}
    </div><h2>De Sterrenstam</h2><p class="intro">Nova: ${S.nova} verdiend, ${vrij} vrij om uit te geven. Uitgeven verlaagt je bonus van +${Math.round(S.nova * BAL.novaPct * 100)}% niet.</p>`;
  const takken = [...new Set(D.STAR.map(s => s.tak))];
  for (const t of takken) {
    h += `<h3 class="tak">${t}</h3>` + D.STAR.filter(s => s.tak === t).map(s => {
      const heb = S.star[s.id], eis = s.eis && !S.star[s.eis];
      return `<div class="up${heb ? ' heb' : eis ? ' slot' : ''}"><div><h3>${s.naam}</h3><p>${s.tekst}</p>
        <p class="eis">${heb ? 'Gegroeid' : eis ? 'Vereist: ' + D.STAR.find(x => x.id === s.eis).naam : s.k + ' Nova'}</p></div>
        ${heb || eis ? '' : `<button class="knop" data-star="${s.id}" ${vrij < s.k ? 'disabled' : ''}>Laat groeien</button>`}</div>`;
    }).join('');
  }
  return h + '<p class="intro">Een gebied blijft open na elke Hergroei. Je vindt het onder de dorpsplaat.</p>';
}
function paneelPrest() {
  const n = E.achAantal(S);
  return `<p class="intro">${n} van ${D.ACH.length} behaald. Elke prestatie geeft +1% op alle productie.</p>` +
    D.ACH.map(a => `<div class="ach${S.ach[a.id] ? ' heb' : ''}"><span>${S.ach[a.id] ? '✓' : ''}</span>${a.naam}</div>`).join('');
}
function paneelInstel() {
  const m = E.mods(S);
  return `<div class="kaart"><h2>Offline</h2><p>Terwijl je weg bent produceert het dorp ${Math.round(BAL.offlineRendement * 100)}% van normaal, maximaal ${m.offline} uur, en nooit meer dan je opslag.</p>
    <label class="sw"><input type="checkbox" id="offm" ${S.instel.offlineMelding ? 'checked' : ''}> Overzicht tonen bij terugkomst</label></div>
    <div class="kaart"><h2>Opslaan</h2><p>Het spel slaat elke 10 seconden op in deze browser. Om op een ander apparaat verder te spelen: kopieer de code en plak hem daar.</p>
    <textarea id="code" rows="3" aria-label="Spelcode"></textarea>
    <div class="rij"><button class="knop" id="kopieer">Kopieer code</button><button class="knop" id="laadcode">Laad geplakte code</button></div></div>
    <div class="kaart"><h2>Balanstest</h2><p>Een computerspeler speelt met de huidige getallen een aantal dagen (4 keer per dag actief) en laat zien wanneer de belangrijke momenten komen.</p>
    <div class="rij"><select id="dagen" aria-label="Aantal dagen"><option value="3">3 dagen</option><option value="7" selected>7 dagen</option><option value="14">14 dagen</option></select><button class="knop" id="test" ${testBezig ? 'disabled' : ''}>Start test</button></div>
    <div id="testuit">${testUit}</div></div>
    <div class="kaart"><h2>Opnieuw beginnen</h2><p>Wist alles, ook Nova en prestaties.</p><button class="knop rood" id="wis">Wis spel</button></div>`;
}

function maakSig() {
  return JSON.stringify([tab, sel, modus, S.n, S.fase, S.open, Object.keys(S.up).length, S.magie, S.star, S.nova, S.novaUit,
    E.achAantal(S), E.hergroeiKlaar(S), GIDS.findIndex(g => !g.klaar()), S.instel.gidsUit, D.U.filter(u => E.eisOk(S, u.eis)).length,
    Object.entries(S.lom).map(([k, l]) => k + (l.d || '') + l.band + (l.reis > 0)).join(), S.vondsten.length, E.mods(S).verbanden.join()]);
}
function render() {
  sig = maakSig();
  $$('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  $('#ladetitel').textContent = tab === 'dorp' ? '' : TITEL[tab];
  hotspots();
  const scroll = $('#paneel').scrollTop;
  $('#paneel').innerHTML = { dorp: paneelDorp, lomari: paneelLomari, upgrades: paneelUpgrades, stam: paneelStam, prest: paneelPrest, instel: paneelInstel }[tab]();
  $('#paneel').scrollTop = scroll; flits = null; faseMoment = null;
  const beschikbaar = D.U.filter(u => !S.up[u.id] && E.eisOk(S, u.eis) && E.kan(S, E.upKost(S, u))).length + (E.magieOpen(S) && E.kan(S, E.magieKost(S)) ? 1 : 0);
  $('#lmn').textContent = S.vondsten.length || '';
  $('#upn').textContent = beschikbaar ? beschikbaar : '';
  ververs();
}
function ververs() {
  if (maakSig() !== sig) return render();
  balk();
  const m = E.mods(S);
  $$('[data-buy]').forEach(el => {
    const b = el.dataset.buy, n = modus === 'max' ? Math.max(1, E.maxN(S, b, m)) : modus, c = E.kostVanN(S, b, n, m);
    const pastNiet = !E.past(S, c, m); el.textContent = pastNiet ? 'Opslag te klein' : `Bouw ${n > 1 ? n + '×' : ''}`.trim(); el.disabled = pastNiet || !E.kan(S, c);
    const kp = document.querySelector(`[data-kost="${b}"]`); if (kp) kp.innerHTML = kost(c);
  });
  $$('[data-fase]').forEach(el => el.disabled = !E.kan(S, E.faseKost(S, el.dataset.fase, m)));
  $$('[data-up]').forEach(el => el.disabled = !E.kan(S, E.upKost(S, D.U.find(u => u.id === el.dataset.up))));
  $$('[data-magie]').forEach(el => el.disabled = !E.kan(S, E.magieKost(S)));
  $$('[data-open]').forEach(el => { const c = D.DISTRICTS[el.dataset.open].open, p = E.past(S, c, m); el.disabled = !p || !E.kan(S, c); el.textContent = p ? `Open ${el.dataset.open}` : 'Opslag te klein: bouw eerst meer opslag'; });
  $$('.kc').forEach(el => el.classList.toggle('mis', S.r[el.dataset.r] < +el.dataset.v - 1e-9));
  $$('[data-reis]').forEach(el => { const l = S.lom[el.dataset.reis]; if (l) el.textContent = duur(l.reis); });
  const bol = $('#bol'); if (S.bol) { bol.hidden = false; bol.style.left = S.bol.x + '%'; bol.style.top = S.bol.y + '%'; } else bol.hidden = true;
  const w = $('#wacht'); if (w) w.textContent = E.novaWacht(S);
  const eb = $('#ebar'); if (eb) { eb.style.width = Math.min(100, S.energieTot / BAL.hergroeiEnergie * 100) + '%'; $('#etekst').textContent = `${fmt(S.energieTot)} van ${fmt(BAL.hergroeiEnergie)}`; }
}

// ---------- dialoog en meldingen ----------
let terug = null;
function dialoog(titel, html, ja, nee) {
  $('#dt').textContent = titel; $('#db').innerHTML = html; $('#dja').textContent = ja || 'Verder';
  $('#dnee').hidden = !nee; terug = nee; $('#dlg').classList.add('open'); $('#dja').focus();
}
$('#dja').onclick = () => { $('#dlg').classList.remove('open'); const f = terug; terug = null; if (typeof f === 'function') f(); };
$('#dnee').onclick = () => { $('#dlg').classList.remove('open'); terug = null; };
function toast(t) {
  const box = $('#toasts'), max = innerWidth < 600 ? 1 : 3; while (box.children.length >= max) box.firstChild.remove();
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), innerWidth < 600 ? 2500 : 3500);
}

function kort(s) { s = Math.ceil(s); const d = Math.floor(s / 86400), u = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return d ? `${d}d ${u}u` : u ? `${u}u ${m}m` : m ? `${m}m` : `${s}s`; }
function volTekst(nu, c, net) {
  const smal = innerWidth < 600;
  if (nu >= c * .999) return 'vol';
  if (net > 1e-9) return (smal ? 'vol ' : 'vol over ') + kort((c - nu) / net);
  if (net < -1e-9) return (smal ? 'op ' : 'op over ') + kort(nu / -net);
  return '';
}
// ---------- grondstof-uitleg ----------
const HERKOMST = { nevelparel: 'Valunari', kroonhars: 'Kroveli', wortelgloed: 'Lomaruun', hout: 'Takelom', bladeren: 'Lomavii', lianen: 'Lomavii', voedsel: 'Moloro', steen: 'Dorukha', kristal: 'Dorukha', gereedschap: 'Frikto', energie: 'Voelari' };
const WAARVOOR = { nevelparel: 'Nevelvangers en later runen en sleutelknopen in de upgradebomen (deel B)', kroonhars: 'de upgrade naar fase 5 (Meesterwerk): 20 Kroonhars per gebouw',
  wortelgloed: 'De oude bron, en later ultieme vaardigheden en Band boven de 30 (deel B)', hout: 'bijna elk gebouw', bladeren: 'woningen, Voelari en upgrades', lianen: 'bruggen, Hangtuinen en het openen van districten',
  voedsel: 'je bewoners: elke bewoner eet een beetje. Is het op, dan halveert alle andere productie', steen: 'grotere gebouwen en groeifase 3 en hoger',
  gereedschap: 'groeifase 3 en hoger', kristal: 'magische upgrades en Voelari', energie: 'magische upgrades en de Hergroei' };
function uitleg(k) {
  const m = E.mods(S), R = E.rates(S, m);
  const makers = E.BK.filter(b => B[b].p?.[k]), opslag = E.BK.filter(b => B[b].o?.[k]), verbruik = E.BK.filter(b => B[b].c?.[k] && S.n[b]);
  const rij = b => `<li>${B[b].naam} in ${B[b].d}: ${S.n[b] ? S.n[b] + ' gebouwd' : S.open.includes(B[b].d) ? 'nog niet gebouwd' : `${B[b].d} is nog gesloten`}</li>`;
  let h = `<p>Je hebt <b>${fmt(S.r[k])}</b> van maximaal ${fmt(E.cap(S, k))}. Er komt ${fmtR(R.prod[k])} per seconde bij${R.use[k] ? ` en gaat ${fmtR(R.use[k])} per seconde af` : ''}.
    ${(() => { const net = R.prod[k] - R.use[k], c = E.cap(S, k); return S.r[k] >= c * .999 ? '<b>Je opslag is vol:</b> wat er nu bijkomt gaat verloren. Bouw meer opslag of geef het uit.' : net > 1e-9 ? `Je opslag is vol over <b>${duur((c - S.r[k]) / net)}</b>.` : net < -1e-9 ? `Bij dit verbruik is het op over <b>${duur(S.r[k] / -net)}</b>.` : ''; })()}</p>
    <p>Nodig voor ${WAARVOOR[k]}.</p>
    <h3>Gemaakt door</h3><ul>${makers.map(rij).join('')}</ul>
    ${k === 'hout' || k === 'bladeren' ? '<p class="nb">Ook de knop Verzamelen geeft hout en bladeren.</p>' : ''}
    ${k === 'gereedschap' ? '<p class="nb">Werkbanken maken gereedschap van hout en steen.</p>' : ''}
    <h3>Meer opslag</h3><ul>${opslag.length ? opslag.map(rij).join('') : '<li>Alleen via upgrades zoals Ruime kelders</li>'}</ul>
    ${verbruik.length ? `<h3>Verbruikt door</h3><ul>${verbruik.map(rij).join('')}</ul>` : ''}
    <div class="rij"><button class="knop klein" data-ga="${HERKOMST[k]}">Ga naar ${HERKOMST[k]}</button></div>`;
  dialoog(RES[k].naam, h, 'Sluiten'); $('#dt').insertAdjacentHTML('afterbegin', ico(k));
}
$('#res').onclick = e => { const b = e.target.closest('[data-res]'); if (b) uitleg(b.dataset.res); };
$('#db').onclick = e => { const b = e.target.closest('[data-ga]'); if (b) { $('#dlg').classList.remove('open'); naarDistrict(b.dataset.ga); } };

// ---------- lade ----------
let ladeOpen = false;
const TITEL = { dorp: 'Dorp', lomari: 'Lomari', upgrades: 'Upgrades', stam: 'Sterrenstam', prest: 'Prestaties', instel: 'Instellingen' };
function lade(open) {
  ladeOpen = open; $('#lade').classList.toggle('open', open); document.body.classList.toggle('lade-open', open);
  $('#ladetitel').textContent = tab === 'dorp' ? '' : TITEL[tab];
  if (open) $('#paneel').scrollTop = 0;
}
function maten() {
  document.documentElement.style.setProperty('--kop', $('.top').offsetHeight + 'px');
  document.documentElement.style.setProperty('--bar', $('#tabs').offsetHeight + 'px');
  const w = $('#plaatwrap');
  if (innerWidth < 900) w.style.height = Math.max(220, innerHeight - $('.top').offsetHeight - $('#tabs').offsetHeight - $('.dorpinfo').offsetHeight - 22) + 'px';
  else w.style.height = '';
}
addEventListener('resize', maten); new ResizeObserver(maten).observe(document.querySelector('.top'));
$('#dicht').onclick = () => lade(false);
addEventListener('keydown', e => { if (e.key === 'Escape' && ladeOpen && !$('#dlg').classList.contains('open')) lade(false); });
function naarDistrict(d) {
  sel = d; tab = 'dorp'; render(); lade(true);
  const w = $('#plaatwrap'), v = D.DISTRICTS[d]?.vak;
  if (v && w.scrollWidth > w.clientWidth) w.scrollTo({ left: (v[0] + v[2] / 2) / 100 * w.scrollWidth - w.clientWidth / 2, behavior: stil ? 'auto' : 'smooth' });
}

// ---------- invoer ----------
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (ladeOpen && tab === b.dataset.tab) return lade(false); tab = b.dataset.tab; render(); lade(true); };
$('#gebieden').onclick = e => { const b = e.target.closest('[data-sel]'); if (b) naarDistrict(b.dataset.sel); };
$('#spots').onclick = e => { const b = e.target.closest('[data-sel]'); if (b) naarDistrict(b.dataset.sel); };
let tikTijden = [];
$('#verzamel').onclick = () => {
  const nu = performance.now(); if (nu - (tikTijden.at(-1) || 0) < 200) return;   // max 5 tikken per seconde
  S.tikken = (S.tikken || 0) + 1; tikTijden = tikTijden.filter(t => nu - t < 3000); tikTijden.push(nu);
  const ritme = E.mods(S).ritme && tikTijden.length >= 10; if (ritme) tikTijden = [];
  const uit = E.verzamel(S, 1, ritme ? 3 : 1), f = document.createElement('span'); f.className = 'zweef' + (ritme ? ' ritme' : '');
  f.innerHTML = (ritme ? '<b>Ritme ×3</b> ' : '') + Object.entries(uit).filter(([, v]) => v > 0).map(([k, v]) => `${ico(k)}+${fmt(v)}`).join(' ');
  $('#verzamel').after(f); setTimeout(() => f.remove(), 900); ververs();
};
$('#paneel').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return; const d = b.dataset;
  if (d.ga) naarDistrict(d.ga);
  else if (d.tabGa) { tab = d.tabGa; render(); }
  else if (b.id === 'gidsuit') { S.instel.gidsUit = true; bewaar(); render(); }
  else if (d.modus) { modus = d.modus === 'max' ? 'max' : +d.modus; render(); }
  else if (d.buy) { const n = modus === 'max' ? Math.max(1, E.maxN(S, d.buy)) : modus; if (E.koop(S, d.buy, n)) { flits = d.buy; after(); } }
  else if (d.fase) { if (E.groei(S, d.fase)) { flits = d.fase; faseMoment = d.fase; toast(`${B[d.fase].naam} is geüpgraded naar fase ${S.fase[d.fase]}: productie ×2`); after(); } }
  else if (d.open) { if (E.openDistrict(S, d.open)) { toast(`${d.open} is open`); after(); } }
  else if (d.up) { if (E.koopUpgrade(S, d.up)) after(); }
  else if (d.magie) { if (E.koopMagie(S)) after(); }
  else if (d.star) { if (E.koopStar(S, d.star)) after(); }
  else if (d.vondst) { const r = E.kiesVondst(S, +d.vondst, d.keuze); if (r?.bonus) toast(`Blijvend +1% ${RES[r.bonus].naam.toLowerCase()}`); else if (r) toast('Buit binnengehaald'); after(); }
  else if (b.id === 'hergroei') {
    const n = E.novaWacht(S);
    dialoog('Hergroei', `<p>Het dorp begint opnieuw en jij krijgt <b>${n} Nova</b>. Daarmee kom je op ${S.nova + n} Nova: +${Math.round((S.nova + n) * BAL.novaPct * 100)}% op alle productie.</p><p>Gebouwen, voorraad, upgrades en de districten Dorukha, Rikilari, Frikto en Voelari beginnen opnieuw.</p>`,
      'Hergroei', () => { S = E.hergroei(S); sel = 'Takelom'; tab = 'stam'; after(); toast(`Hergroei: ${S.nova} Nova`); });
  }
  else if (b.id === 'kopieer') {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); const ta = $('#code'); ta.value = code; ta.select();
    try { navigator.clipboard.writeText(code).then(() => toast('Code gekopieerd'), () => toast('Code staat in het vak; kopieer hem zelf')); } catch (er) { toast('Code staat in het vak; kopieer hem zelf'); }
  }
  else if (b.id === 'laadcode') {
    try { const x = JSON.parse(decodeURIComponent(escape(atob($('#code').value.trim())))); if (x.v !== 1) throw 0; S = herstel(x); after(); toast('Spel geladen'); }
    catch (er) { toast('Deze code klopt niet'); }
  }
  else if (b.id === 'wis') dialoog('Spel wissen?', '<p>Alle voortgang verdwijnt, ook Nova en prestaties. Dit kan niet ongedaan worden.</p>', 'Wis alles', () => { S = E.nieuw(); sel = 'Takelom'; tab = 'dorp'; after(); });
  else if (b.id === 'test') {
    testBezig = true; testUit = '<div class="bar"><i id="tb" style="width:0"></i></div>'; render();
    window.BALANS.draai(+$('#dagen').value, f => { const t = $('#tb'); if (t) t.style.width = f * 100 + '%'; }, r => {
      const rij = r.ev.filter(([h]) => h >= 8).map(([h, n]) => `<tr><td>${esc(n)}</td><td>${duur((h - 8) * 3600)}</td></tr>`).join('');
      const hg = r.resets.map(([h, n, tot], i) => `<tr><td>Hergroei ${i + 1} (+${n}, totaal ${tot} Nova)</td><td>${duur((h - 8) * 3600)}</td></tr>`).join('');
      testUit = `<table><thead><tr><th>Moment</th><th>Na</th></tr></thead><tbody>${rij}${hg}</tbody></table>
        <p class="intro">Na een Hergroei beginnen de momenten opnieuw. Aan het eind: ${fmt(r.eind.gebouwen)} gebouwen, ${r.eind.open} districten open, ${r.eind.nova} Nova.</p>`;
      testBezig = false; if (tab === 'instel') render();
    });
  }
});
$('#paneel').addEventListener('change', e => {
  if (e.target.id === 'offm') { S.instel.offlineMelding = e.target.checked; bewaar(); }
  else if (e.target.dataset.wijs) { const id = e.target.dataset.wijs; if (E.wijs(S, id, e.target.value || null)) { const l = S.lom[id]; toast(l.reis > 0 ? `${E.lomDef(id).naam} gaat op weg naar ${l.d}` : l.d ? `${E.lomDef(id).naam} werkt nu in ${l.d}` : `${E.lomDef(id).naam} is vrij`); after(); } }
});
$('#bol').onclick = () => { const r = E.vangBol(S); if (r) toast(`Lichtbol: +${fmt(r.v)} ${RES[r.res].naam.toLowerCase()}`); ververs(); };
function lomEv(ev) {
  const nieuw = ev.filter(e => e.t === 'nieuw').map(e => E.lomDef(e.id).naam);
  if (nieuw.length) toast(nieuw.length === 1 ? `${nieuw[0]} sluit zich aan bij het dorp` : `${nieuw.slice(0, -1).join(', ')} en ${nieuw.at(-1)} sluiten zich aan bij het dorp`);
  for (const e of ev) {
    if (e.t === 'nieuw') continue;
    else if (e.t === 'band' && (e.band % 5 === 0)) toast(`${E.lomDef(e.id).naam} bereikt Band ${e.band}`);
    else if (e.t === 'vondst') toast('Melo heeft een verborgen plek gevonden');
  }
}
function prest(l) { if (l.length) toast(l.length === 1 ? `Prestatie: ${l[0].naam}` : l.length <= 3 ? `${l.length} prestaties: ${l.map(a => a.naam).join(', ')}` : `${l.length} nieuwe prestaties behaald`); }
function after() { prest(E.checkAch(S)); bewaar(); render(); }

// ---------- leven op de dorpsplaat: vuurvliegjes, gloed en opstijgende opbrengst ----------
const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MIDDEN = d => { const v = D.DISTRICTS[d].vak; return [v[0] + v[2] / 2, v[1] + v[3] / 2]; };
function districtOpbrengst(d) {
  const m = E.mods(S), tot = {};
  for (const b of E.BK) if (B[b].d === d && S.n[b]) for (const [k, v] of Object.entries(E.perStuk(S, b, m))) tot[k] = (tot[k] || 0) + v * S.n[b];
  return tot;
}
function gloed() {
  for (const el of $$('.spot')) { const d = el.dataset.sel; const op = S.open.includes(d) && Object.values(districtOpbrengst(d)).some(v => v > 0); el.classList.toggle('leeft', op); }
}
let fxT = 0;
function opbrengstFx(dt) {
  if (stil || document.hidden) return; fxT += dt; if (fxT < 2.2) return; fxT = 0;
  const kand = S.open.filter(d => D.DISTRICTS[d]).map(d => [d, districtOpbrengst(d)]).filter(([, t]) => Object.keys(t).length);
  if (!kand.length) return;
  const [d, t] = kand[Math.floor(Math.random() * kand.length)];
  const [k, v] = Object.entries(t).sort((a, b) => b[1] * RES[b[0]].waarde - a[1] * RES[a[0]].waarde)[0];
  const [x, y] = MIDDEN(d), el = document.createElement('div'); el.className = 'stijg';
  el.innerHTML = `${ico(k)}+${fmtR(v * 2.2)}`; el.style.left = (x + (Math.random() * 10 - 5)) + '%'; el.style.top = (y + 4) + '%';
  $('#fx').appendChild(el); setTimeout(() => el.remove(), 2200);
}
(function vliegjes() {
  const c = $('#vlieg'); if (!c || stil) return; const g = c.getContext('2d'); let W = 0, Hh = 0;
  const pas = () => { const r = c.getBoundingClientRect(); W = c.width = r.width * devicePixelRatio; Hh = c.height = r.height * devicePixelRatio; };
  new ResizeObserver(pas).observe(c); pas();
  const P = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .0006, vy: (Math.random() - .5) * .0004, f: Math.random() * 6.28, r: .6 + Math.random() * 1.2 }));
  (function teken() {
    if (!document.hidden) {
      g.clearRect(0, 0, W, Hh);
      for (const p of P) {
        p.x += p.vx + Math.sin(p.f) * .0003; p.y += p.vy + Math.cos(p.f * .7) * .0002; p.f += .02;
        if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1;
        const a = .35 + .35 * Math.sin(p.f * 1.7), x = p.x * W, y = p.y * Hh, r = p.r * devicePixelRatio;
        const gr = g.createRadialGradient(x, y, 0, x, y, r * 6); gr.addColorStop(0, `rgba(255,226,140,${a})`); gr.addColorStop(1, 'rgba(255,226,140,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 6, 0, 6.29); g.fill();
        g.fillStyle = `rgba(255,248,215,${a + .2})`; g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill();
      }
    }
    requestAnimationFrame(teken);
  })();
})();

// ---------- lus ----------
S = laad();
{
  const weg = (Date.now() - S.t) / 1000;
  if (weg > 60) {
    const o = E.offline(S, weg);
    const regels = E.RK.filter(k => Math.abs(o.winst[k]) >= 1).map(k => `<tr><td>${RES[k].naam}</td><td>${o.winst[k] > 0 ? '+' : ''}${fmt(o.winst[k])}</td></tr>`).join('');
    if (S.instel.offlineMelding && regels) dialoog('Welkom terug', `<p>Je was ${duur(o.sec)} weg. Het dorp werkte ${duur(o.eff)} door op ${Math.round(o.rend * 100)}%${o.sec > o.eff ? ` (de limiet is ${o.limiet} uur)` : ''}.</p><table><tbody>${regels}</tbody></table>${o.vondsten ? `<p>Melo vond ${o.vondsten} verborgen ${o.vondsten > 1 ? 'plekken' : 'plek'}. Kies je beloning bij Lomari.</p>` : ''}`);
  }
}
let vorige = performance.now(), sinds = 0, achT = 0, verborgen = false;
setInterval(() => {
  if (verborgen) return;
  const nu = performance.now(), dt = Math.min(5, (nu - vorige) / 1000); vorige = nu;
  E.tick(S, dt); lomEv(E.lomTick(S, dt)); const auto = E.automatiseer(S, dt);
  sinds += dt; achT += dt;
  if (achT > 1) { achT = 0; prest(E.checkAch(S)); }
  if (sinds > 10) { sinds = 0; bewaar(); }
  if (auto.length && maakSig() !== sig) render(); else ververs();
  opbrengstFx(dt);
}, 250);
addEventListener('pagehide', bewaar);
document.addEventListener('visibilitychange', () => { if (document.hidden) { verborgen = true; bewaar(); } else { verborgen = false; const weg = (Date.now() - S.t) / 1000; if (weg > 60) { const o = E.offline(S, weg); toast(`Terug na ${duur(o.sec)}: het dorp heeft ${duur(o.eff)} doorgewerkt`); } vorige = performance.now(); } });
render(); maten();
if (!S.instel.gidsUit && GIDS.some(g => !g.klaar())) lade(true);
}
