/* Lomari: Idle Village — tekeningen: gebouwen (per fase), districtsemblemen en grondstofpictogrammen.
   Alles is inline SVG, zodat het overal scherp is en offline werkt. */
window.ART = (() => {
  const H = '#6b4a2a', H2 = '#8a6238', H3 = '#a77a48', BL = '#5f9a3e', BL2 = '#7fb85a', ST = '#8f8a80', ST2 = '#b3ada2', GOUD = '#f2c46a', VIOL = '#b98ae0', NEVEL = '#cfe6ef';
  const lantaarn = (x, y) => `<g><line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y - 2}" stroke="${H}" stroke-width="1"/><rect x="${x - 2.5}" y="${y - 2}" width="5" height="6" rx="1.5" fill="${GOUD}"/><circle cx="${x}" cy="${y + 1}" r="5" fill="${GOUD}" opacity=".25"/></g>`;
  const bloem = (x, y, c = VIOL) => `<g>${[0, 72, 144, 216, 288].map(a => `<circle cx="${x + 2.2 * Math.cos(a * Math.PI / 180)}" cy="${y + 2.2 * Math.sin(a * Math.PI / 180)}" r="1.6" fill="${c}"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.1" fill="${GOUD}"/></g>`;
  const schaduw = `<ellipse cx="32" cy="59" rx="22" ry="3.5" fill="#000" opacity=".22"/>`;
  const glans = id => `<defs><radialGradient id="g${id}"><stop offset="0" stop-color="${GOUD}" stop-opacity=".55"/><stop offset="1" stop-color="${GOUD}" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g${id})"/>`;
  let uid = 0;

  // Elk gebouw: f(fase) → SVG-inhoud in een 64×64 vak, grond op y≈58
  const G = {
    hakplek: f => `<rect x="20" y="44" width="16" height="12" rx="2" fill="${H2}"/><ellipse cx="28" cy="44" rx="8" ry="3" fill="${H3}"/><ellipse cx="28" cy="44" rx="4" ry="1.4" fill="none" stroke="${H}" stroke-width=".8"/>
      <line x1="30" y1="43" x2="40" y2="30" stroke="${H}" stroke-width="2.5" stroke-linecap="round"/><path d="M37 28l7 3-3 5z" fill="${ST2}"/>
      ${Array.from({ length: Math.min(4, f) }, (_, i) => `<rect x="${38 + (i % 2) * 6}" y="${52 - Math.floor(i / 2) * 5}" width="9" height="4.5" rx="2" fill="${i % 2 ? H3 : H2}"/>`).join('')}
      ${f >= 3 ? `<path d="M12 40l20-12 20 12" fill="none" stroke="${H}" stroke-width="2.5"/><line x1="14" y1="40" x2="14" y2="57" stroke="${H}" stroke-width="2"/><line x1="50" y1="40" x2="50" y2="57" stroke="${H}" stroke-width="2"/>` : ''}`,
    zaag: f => `${Array.from({ length: Math.min(3, Math.ceil(f / 2)) }, (_, i) => { const y = 46 - i * 12; return `<rect x="12" y="${y}" width="40" height="3.5" rx="1" fill="${H3}"/><line x1="15" y1="${y + 3}" x2="15" y2="${y + 12}" stroke="${H}" stroke-width="2.5"/><line x1="49" y1="${y + 3}" x2="49" y2="${y + 12}" stroke="${H}" stroke-width="2.5"/>`; }).join('')}
      <circle cx="32" cy="${40 - Math.min(3, Math.ceil(f / 2)) * 12 + 18}" r="7" fill="${ST2}" stroke="${ST}" stroke-width="1.5" stroke-dasharray="2 1.2"/><rect x="18" y="${44 - Math.min(3, Math.ceil(f / 2)) * 12 + 14}" width="28" height="3" fill="${H2}"/>`,
    kroon: f => `<path d="M28 58 C27 40 26 26 30 12 L34 12 C38 26 37 40 36 58z" fill="${H}"/>
      ${Array.from({ length: f }, (_, i) => { const y = 50 - i * 8, w = 10 + i * 2.5; return `<rect x="${32 - w}" y="${y}" width="${w * 2}" height="3" rx="1.5" fill="${H3}"/><rect x="${32 - w + 2}" y="${y - 5}" width="7" height="5" rx="1" fill="#c9a46a"/><path d="M${32 - w + 1} ${y - 5}l4.5-3 4.5 3z" fill="#b5483a"/>`; }).join('')}
      <circle cx="22" cy="${14 - f}" r="9" fill="${BL}"/><circle cx="42" cy="${14 - f}" r="9" fill="${BL}"/><circle cx="32" cy="${8 - f}" r="10" fill="${BL2}"/>`,
    pluk: f => `<circle cx="24" cy="44" r="${10 + f}" fill="${BL}"/><circle cx="36" cy="42" r="${11 + f}" fill="${BL2}"/>${Array.from({ length: f + 2 }, (_, i) => `<path d="M${18 + i * 6} ${36 - (i % 2) * 6}q3-4 6 0q-3 4-6 0z" fill="#9fd07a"/>`).join('')}
      <path d="M38 50h14l-2 8H40z" fill="#c9a46a" stroke="${H}" stroke-width="1"/><path d="M40 50q5-6 10 0" fill="none" stroke="${H}" stroke-width="1.2"/>`,
    liaan: f => `<path d="M4 10 Q32 4 60 10" stroke="${H}" stroke-width="4" fill="none"/>${Array.from({ length: f + 2 }, (_, i) => { const x = 10 + i * (44 / (f + 1)); return `<path d="M${x} 10 q4 12 0 22 q-4 10 0 ${18 + (i % 2) * 6}" stroke="#3f8a6a" stroke-width="2" fill="none"/><path d="M${x} ${24 + (i % 3) * 6}q4-3 7 0q-4 3-7 0z" fill="${BL2}"/>`; }).join('')}`,
    hangtuin: f => `<path d="M6 8 Q32 2 58 8" stroke="${H}" stroke-width="3.5" fill="none"/>${Array.from({ length: Math.min(5, f + 1) }, (_, i) => { const x = 12 + i * 10, y = 26 + (i % 2) * 12; return `<line x1="${x - 4}" y1="7" x2="${x - 5}" y2="${y}" stroke="#c9a46a"/><line x1="${x + 4}" y1="7" x2="${x + 5}" y2="${y}" stroke="#c9a46a"/><path d="M${x - 6} ${y}h12l-2 6h-8z" fill="#a0703c"/><circle cx="${x - 2}" cy="${y - 2}" r="3" fill="${BL}"/><circle cx="${x + 3}" cy="${y - 2}" r="2.5" fill="${BL2}"/>${bloem(x, y - 4)}`; }).join('')}`,
    nest: f => `<ellipse cx="32" cy="48" rx="22" ry="10" fill="${H2}"/><ellipse cx="32" cy="44" rx="16" ry="5" fill="#d9b98a"/><path d="M12 46q20 10 40 0M14 50q18 8 36 0" stroke="${H}" stroke-width="1.5" fill="none"/>${bloem(48, 40)}`,
    familie: f => `<path d="M10 56 Q10 24 32 22 Q54 24 54 56z" fill="${H2}"/><path d="M14 30 Q32 14 50 30" stroke="${BL}" stroke-width="6" fill="none"/><path d="M26 56v-12a6 6 0 0 1 12 0v12z" fill="#3a2614"/><circle cx="20" cy="40" r="3.5" fill="${GOUD}"/><circle cx="44" cy="40" r="3.5" fill="${GOUD}"/>${bloem(14, 28)}${bloem(50, 30, '#e48ab0')}`,
    bessen: f => `<circle cx="22" cy="44" r="11" fill="${BL}"/><circle cx="38" cy="42" r="13" fill="${BL2}"/>${Array.from({ length: 4 + f * 2 }, (_, i) => `<circle cx="${16 + (i * 7) % 30}" cy="${36 + (i * 5) % 14}" r="2" fill="#d23d4a"/>`).join('')}`,
    groeve: f => `<path d="M8 58 L18 38 L30 44 L40 30 L56 58z" fill="${ST}"/><path d="M18 38 L30 44 L26 58 M40 30 L44 58" stroke="${ST2}" stroke-width="1.5" fill="none"/>${Array.from({ length: f }, (_, i) => `<path d="M${10 + i * 6} 58l3-5 4 5z" fill="${ST2}"/>`).join('')}<line x1="44" y1="52" x2="54" y2="40" stroke="${H}" stroke-width="2"/><path d="M50 37q6 1 8 6" stroke="${ST2}" stroke-width="2.5" fill="none"/>`,
    tunnel: f => `<path d="M4 58 Q4 18 32 16 Q60 18 60 58z" fill="#6e5a44"/>${Array.from({ length: Math.min(3, Math.ceil(f / 2)) }, (_, i) => `<path d="M${16 + i * 3} 58v-16a${16 - i * 3} ${16 - i * 3} 0 0 1 ${32 - i * 6} 0v16" fill="${i === 0 ? '#3a2a1a' : 'none'}" stroke="${ST2}" stroke-width="2"/>`).join('')}<path d="M16 58h32" stroke="${H}" stroke-width="2"/>`,
    kristgrot: f => `<path d="M6 58 Q8 22 32 20 Q56 22 58 58z" fill="#5a4a3c"/><path d="M18 58 Q20 36 32 34 Q44 36 46 58z" fill="#241a12"/>${Array.from({ length: f + 1 }, (_, i) => { const x = 22 + i * (20 / Math.max(1, f)), h = 8 + (i % 2) * 6; return `<path d="M${x} 58 l3 -${h} 3 ${h}z" fill="#8fd3e8"/><path d="M${x + 3} ${58 - h} l1.5 ${h} -1.5 0z" fill="#e6fbff"/>`; }).join('')}<circle cx="32" cy="50" r="12" fill="#8fd3e8" opacity=".18"/>`,
    werkbank: f => `<rect x="10" y="38" width="44" height="5" rx="1" fill="${H3}"/><line x1="14" y1="43" x2="14" y2="58" stroke="${H}" stroke-width="3"/><line x1="50" y1="43" x2="50" y2="58" stroke="${H}" stroke-width="3"/>
      <line x1="18" y1="36" x2="28" y2="28" stroke="${H}" stroke-width="2"/><rect x="25" y="24" width="8" height="5" rx="1" fill="${ST}" transform="rotate(-40 29 26)"/><path d="M38 36v-10h3v10" fill="${ST2}"/><circle cx="46" cy="33" r="3" fill="none" stroke="${ST}" stroke-width="1.5"/>${f >= 2 ? `<rect x="10" y="48" width="44" height="3" fill="${H2}"/>` : ''}`,
    smidse: f => `<rect x="10" y="30" width="44" height="28" fill="${H2}"/><path d="M6 32 L32 12 L58 32z" fill="#45478a"/><rect x="44" y="10" width="6" height="14" fill="${ST}"/><circle cx="47" cy="6" r="3" fill="#ccc" opacity=".5"/>
      <rect x="18" y="40" width="12" height="18" fill="#2a1a0e"/><circle cx="24" cy="48" r="4" fill="#f08a3a" opacity=".8"/><g transform="translate(42 44)"><circle r="6" fill="none" stroke="${GOUD}" stroke-width="2.5" stroke-dasharray="2.5 1.5"/><circle r="2" fill="${GOUD}"/></g>`,
    zangplek: f => `<ellipse cx="32" cy="50" rx="24" ry="8" fill="#7b4f9e"/><ellipse cx="32" cy="48" rx="20" ry="6" fill="#a47cc4"/><circle cx="32" cy="46" r="${4 + f}" fill="${VIOL}" opacity=".6"/>
      <path d="M38 18v18" stroke="#f3e6c8" stroke-width="2.5"/><ellipse cx="34.5" cy="36" rx="4" ry="3" fill="#f3e6c8"/><path d="M38 18q8 2 6 10" stroke="#f3e6c8" stroke-width="2.5" fill="none"/>`,
    ontmoet: f => `<path d="M28 58 C27 42 26 30 30 18 L34 18 C38 30 37 42 36 58z" fill="${H}"/><circle cx="32" cy="16" r="14" fill="${BL}"/><circle cx="22" cy="20" r="8" fill="${BL2}"/><circle cx="42" cy="20" r="8" fill="${BL2}"/>
      <path d="M16 28v12l3-2 3 2V28z" fill="#7b4f9e"/><path d="M42 28v12l3-2 3 2V28z" fill="#b5483a"/><ellipse cx="32" cy="57" rx="18" ry="3" fill="none" stroke="${VIOL}" stroke-width="2"/>`,
    brug: f => `<line x1="6" y1="20" x2="6" y2="58" stroke="${H}" stroke-width="3"/><line x1="58" y1="20" x2="58" y2="58" stroke="${H}" stroke-width="3"/><path d="M6 32 Q32 52 58 32" stroke="${H3}" stroke-width="3" fill="none"/><path d="M6 22 Q32 40 58 22" stroke="#c9a46a" stroke-width="1.5" fill="none"/>
      ${[14, 22, 32, 42, 50].map(x => `<line x1="${x}" y1="${23 + (16 - Math.abs(32 - x)) * .9}" x2="${x}" y2="${33 + (16 - Math.abs(32 - x)) * 1.1}" stroke="#c9a46a" stroke-width="1"/>`).join('')}`,
    valrad: f => `<path d="M4 8h18v12H4z" fill="#3f8aa0"/><path d="M20 12 Q28 14 28 30" stroke="${NEVEL}" stroke-width="4" fill="none"/><g transform="translate(36 38)"><circle r="16" fill="none" stroke="${H2}" stroke-width="3"/>${[0, 45, 90, 135].map(a => `<line x1="${-16 * Math.cos(a * Math.PI / 180)}" y1="${-16 * Math.sin(a * Math.PI / 180)}" x2="${16 * Math.cos(a * Math.PI / 180)}" y2="${16 * Math.sin(a * Math.PI / 180)}" stroke="${H3}" stroke-width="2"/>`).join('')}<circle r="3" fill="${H}"/></g><path d="M8 58q12-4 24 0t24 0" stroke="#3f8aa0" stroke-width="3" fill="none"/>`,
    nevel: f => `${[14, 32, 50].map((x, i) => `<line x1="${x}" y1="58" x2="${x}" y2="${20 + i * 4}" stroke="${H}" stroke-width="2"/><path d="M${x} ${22 + i * 4}q8 4 0 14q-6-6 0-14z" fill="${NEVEL}" opacity=".8"/>`).join('')}<circle cx="32" cy="50" r="5" fill="#f4fbff"/><circle cx="30.5" cy="48.5" r="1.5" fill="#fff"/>`,
    harst: f => `<path d="M22 58 C21 36 22 20 26 6 L38 6 C42 20 43 36 42 58z" fill="${H}"/><path d="M28 12v40M34 8v46" stroke="${H2}" stroke-width="1.5"/>${Array.from({ length: f + 1 }, (_, i) => `<path d="M${30 + (i % 2) * 6} ${20 + i * 7}q2 4 0 6q-2-2 0-6z" fill="#f0b04a"/>`).join('')}<path d="M40 44h8v8h-8z" fill="#c9a46a"/>`,
    lichtv: f => `<line x1="32" y1="58" x2="32" y2="10" stroke="${H}" stroke-width="3"/>${[18, 30, 42].slice(0, Math.min(3, Math.ceil(f / 2) + 1)).map((y, i) => `<path d="M${i % 2 ? 32 : 18} ${y}h14" stroke="${H3}" stroke-width="2"/><circle cx="${i % 2 ? 46 : 18}" cy="${y - 4}" r="5" fill="${GOUD}"/><circle cx="${i % 2 ? 46 : 18}" cy="${y - 4}" r="10" fill="${GOUD}" opacity=".2"/>`).join('')}`,
    wortelk: f => `<path d="M4 20 Q20 26 22 40 M60 18 Q44 26 42 40 M14 6 Q26 16 28 34 M50 6 Q38 16 36 34" stroke="${H}" stroke-width="4" fill="none"/><ellipse cx="32" cy="48" rx="16" ry="10" fill="#3a1e12"/><ellipse cx="32" cy="48" rx="${6 + f}" ry="${4 + f / 2}" fill="#e2643a" opacity=".8"/><circle cx="32" cy="48" r="16" fill="#e2643a" opacity=".15"/>`,
    oudebron: f => `<ellipse cx="32" cy="52" rx="22" ry="7" fill="${ST}"/><ellipse cx="32" cy="50" rx="17" ry="5" fill="#3f8aa0"/><ellipse cx="32" cy="50" rx="${6 + f * 2}" ry="${2 + f * .6}" fill="#8fe0f0"/>
      ${Array.from({ length: f }, (_, i) => `<circle cx="${24 + i * 4}" cy="${40 - (i % 2) * 8 - f}" r="1.6" fill="#c9f4ff"/>`).join('')}<path d="M32 50 Q30 34 32 ${24 - f * 2}" stroke="#c9f4ff" stroke-width="2" fill="none" opacity=".8"/>`,
    // opslag (geen fase)
    stamrek: () => `<line x1="12" y1="58" x2="12" y2="26" stroke="${H}" stroke-width="3"/><line x1="52" y1="58" x2="52" y2="26" stroke="${H}" stroke-width="3"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<circle cx="${18 + (i % 3) * 14}" cy="${52 - Math.floor(i / 3) * 10}" r="5" fill="${H3}" stroke="${H}" stroke-width="1"/><circle cx="${18 + (i % 3) * 14}" cy="${52 - Math.floor(i / 3) * 10}" r="2" fill="none" stroke="${H}" stroke-width=".7"/>`).join('')}`,
    netrek: () => `<line x1="8" y1="14" x2="56" y2="14" stroke="${H}" stroke-width="3"/><path d="M12 14 Q32 66 52 14" fill="#3f8a6a" opacity=".35" stroke="#3f8a6a" stroke-width="1.5"/>${[18, 26, 34, 42].map(x => `<path d="M${x} 14 Q32 ${50 - Math.abs(32 - x)} ${64 - x} 14" stroke="#3f8a6a" fill="none"/>`).join('')}<circle cx="28" cy="34" r="4" fill="${BL2}"/><circle cx="36" cy="30" r="3.5" fill="${BL}"/>`,
    voorraad: () => `<path d="M8 58 Q8 26 32 24 Q56 26 56 58z" fill="${H2}"/><path d="M20 58v-14a12 12 0 0 1 24 0v14z" fill="#3a2614"/>${[24, 32, 40].map(x => `<rect x="${x - 3}" y="48" width="6" height="10" rx="2" fill="#d86a5a"/>`).join('')}`,
    kelder: () => `<path d="M6 58 Q6 22 32 20 Q58 22 58 58z" fill="${ST}"/><path d="M18 58v-14a14 14 0 0 1 28 0v14z" fill="#2a1e14"/><path d="M18 44a14 14 0 0 1 28 0" stroke="${ST2}" stroke-width="3" fill="none"/><path d="M28 56l2-6 2 6z" fill="#8fd3e8"/>`,
    gerkist: () => `<rect x="10" y="34" width="44" height="24" rx="2" fill="${H2}"/><rect x="10" y="30" width="44" height="7" rx="2" fill="#45478a"/><rect x="29" y="38" width="6" height="6" fill="${GOUD}"/><path d="M16 30l6-12M46 30l-4-14" stroke="${ST}" stroke-width="3"/>`,
    lichtkr: () => `<ellipse cx="32" cy="50" rx="22" ry="7" fill="none" stroke="${VIOL}" stroke-width="3"/>${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${32 + 22 * Math.cos(a * Math.PI / 180)}" cy="${50 + 7 * Math.sin(a * Math.PI / 180)}" r="3" fill="${VIOL}"/>`).join('')}<circle cx="32" cy="36" r="8" fill="${VIOL}" opacity=".5"/><circle cx="32" cy="36" r="4" fill="#fff" opacity=".8"/>`,
  };

  function gebouw(b, fase = 1, opslag = false) {
    const f = G[b]; if (!f) return '';
    const id = ++uid, s = opslag ? 1 : .78 + .055 * (fase - 1);
    let extra = '';
    if (!opslag) {
      if (fase >= 3) extra += lantaarn(10, 30) + lantaarn(54, 26);
      if (fase >= 5) extra += bloem(14, 12) + bloem(50, 10, '#e48ab0') + `<path d="M32 2l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="${VIOL}"/>`;
    }
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${!opslag && fase >= 4 ? glans(id) : ''}${schaduw}<g transform="translate(32 58) scale(${s}) translate(-32 -58)">${f(fase)}</g>${extra}</svg>`;
  }

  // Districtsemblemen (wit op de districtskleur, zoals de banieren op de dorpsplaat)
  const E = {
    Takelom: '<path d="M6 18L16 8M18 18L8 8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M3 9l5-5 3 3-5 5zM21 9l-5-5-3 3 5 5z" fill="#fff"/>',
    Rikilari: '<path d="M3 16 Q12 6 21 16" stroke="#fff" stroke-width="2" fill="none"/><path d="M3 17h18M6 13v4M9 11v6M12 10.5v6.5M15 11v6M18 13v4" stroke="#fff" stroke-width="1.3"/>',
    Lomavii: '<path d="M5 4h14v10l-7 6-7-6z" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M5 8h14M5 12h14M9 4v14M12 4v16M15 4v14" stroke="#fff" stroke-width="1"/>',
    Dorukha: '<path d="M4 20V11a8 8 0 0 1 16 0v9" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M8 20v-8a4 4 0 0 1 8 0v8" fill="none" stroke="#fff" stroke-width="1.5"/>',
    Moloro: '<ellipse cx="12" cy="13" rx="9" ry="6" fill="none" stroke="#fff" stroke-width="2"/><ellipse cx="12" cy="13" rx="5" ry="3" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M3 13q9 6 18 0" stroke="#fff" stroke-width="1" fill="none"/>',
    Frikto: '<circle cx="12" cy="12" r="5" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="12" cy="12" r="1.6" fill="#fff"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="11" y="2.5" width="2" height="4" fill="#fff" transform="rotate(${a} 12 12)"/>`).join(''),
    Voelari: '<path d="M14 4v12" stroke="#fff" stroke-width="2"/><ellipse cx="11.5" cy="16.5" rx="3.5" ry="2.6" fill="#fff"/><path d="M14 4q6 1 5 7" stroke="#fff" stroke-width="2" fill="none"/>',
    Valunari: '<path d="M12 3 Q19 12 19 15 a7 7 0 0 1 -14 0 Q5 12 12 3z" fill="none" stroke="#fff" stroke-width="2"/><path d="M9 15a3 3 0 0 0 3 3" stroke="#fff" stroke-width="1.4" fill="none"/>',
    Kroveli: '<path d="M4 17l2-9 4 4 2-7 2 7 4-4 2 9z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 20h16" stroke="#fff" stroke-width="2"/>',
    Lomaruun: '<path d="M12 3v8M12 11 Q6 14 4 21M12 11 Q18 14 20 21M12 11v10M12 15 Q8 17 8 21M12 15 Q16 17 16 21" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="12" cy="11" r="2.2" fill="#fff"/>',
  };
  const embleem = (d, kleur) => `<svg viewBox="0 0 32 40" class="banier" aria-hidden="true"><path d="M2 0h28v32l-14 8-14-8z" fill="${kleur}"/><path d="M2 0h28v3H2z" fill="#000" opacity=".2"/><path d="M5 3h22v27l-11 6-11-6z" fill="none" stroke="#f2e4c4" stroke-opacity=".5"/><g transform="translate(4 6)">${E[d] || ''}</g></svg>`;

  // Grondstofpictogrammen 16×16
  const R = {
    hout: '<circle cx="8" cy="8" r="6.5" fill="#b07a3e"/><circle cx="8" cy="8" r="4" fill="none" stroke="#7a5228" stroke-width=".9"/><circle cx="8" cy="8" r="1.6" fill="none" stroke="#7a5228" stroke-width=".9"/>',
    bladeren: '<path d="M3 13 Q2 4 13 3 Q14 12 3 13z" fill="#6fa24a"/><path d="M3.5 12.5 L11 5" stroke="#3e6a26" stroke-width="1"/>',
    lianen: '<path d="M3 2 q6 3 2 6 t3 6" stroke="#3f8a6a" stroke-width="2" fill="none"/><path d="M8 6q4-2 5 1q-3 2-5-1z" fill="#7fb85a"/>',
    voedsel: '<circle cx="5.5" cy="10" r="3.2" fill="#d23d4a"/><circle cx="10.5" cy="10.5" r="3.2" fill="#e05a5a"/><circle cx="8" cy="6" r="3" fill="#c22f40"/><path d="M8 3q2-3 4-1" stroke="#5f9a3e" stroke-width="1.3" fill="none"/>',
    steen: '<path d="M2 12 L5 5 L10 3 L14 8 L12 13z" fill="#9a948a"/><path d="M5 5l3 4 6-1M8 9l-1 4" stroke="#c9c4ba" stroke-width=".9" fill="none"/>',
    gereedschap: '<path d="M4 13l6-6" stroke="#8a6238" stroke-width="2.2" stroke-linecap="round"/><path d="M8 3h6v4h-2l-3 -1z" fill="#b3ada2"/>',
    kristal: '<path d="M8 1 L13 6 L8 15 L3 6z" fill="#8fd3e8"/><path d="M3 6h10M8 1v14" stroke="#e6fbff" stroke-width=".8"/>',
    energie: '<circle cx="8" cy="8" r="7" fill="#c48ae8" opacity=".3"/><path d="M8 8 m0 -1 a1 1 0 1 1 -1 1 a2 2 0 1 1 2 2 a3 3 0 1 1 -3 -3 a4.5 4.5 0 1 1 4.5 4.5" stroke="#c48ae8" stroke-width="1.5" fill="none"/>',
    nevelparel: '<circle cx="8" cy="9" r="5" fill="#eef8fc"/><circle cx="6.5" cy="7.5" r="1.5" fill="#fff"/><path d="M2 4q3-2 6 0t6 0" stroke="#cfe6ef" stroke-width="1.2" fill="none"/>',
    kroonhars: '<path d="M8 2 Q13 9 13 11 a5 5 0 0 1 -10 0 Q3 9 8 2z" fill="#f0b04a"/><circle cx="6.5" cy="10" r="1.3" fill="#ffe2a0"/>',
    wortelgloed: '<circle cx="8" cy="8" r="7" fill="#e2643a" opacity=".25"/><path d="M8 2v6M8 8 Q4 10 3 14M8 8 Q12 10 13 14M8 8v6" stroke="#e2643a" stroke-width="1.6" fill="none"/><circle cx="8" cy="8" r="2" fill="#ffb27a"/>',
  };
  const res = k => `<svg viewBox="0 0 16 16" class="ri" aria-hidden="true">${R[k] || ''}</svg>`;

  return { gebouw, embleem, res, heeft: b => !!G[b] };
})();
