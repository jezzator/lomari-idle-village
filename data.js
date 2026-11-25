/* Lomari: Idle Village — speldata (v1).
   Alles wat de balans bepaalt staat hier. Nieuwe gebouwen, upgrades, prestaties of
   Sterrenstam-knopen toevoegen = een regel aan een lijst toevoegen. */
window.DATA = (() => {
  const RES = {
    hout:        { naam: 'Hout',            kleur: '#b07a3e', waarde: 1,   cap: 1000 },
    bladeren:    { naam: 'Bladeren',        kleur: '#6fa24a', waarde: 1,   cap: 1000 },
    lianen:      { naam: 'Lianen',          kleur: '#3f8a6a', waarde: 2,   cap: 600 },
    voedsel:     { naam: 'Voedsel',         kleur: '#d86a5a', waarde: 1.5, cap: 600 },
    steen:       { naam: 'Steen',           kleur: '#9a948a', waarde: 3,   cap: 600 },
    gereedschap: { naam: 'Gereedschap',     kleur: '#c99a4a', waarde: 8,   cap: 300 },
    kristal:     { naam: 'Kristallen',      kleur: '#8fd3e8', waarde: 25,  cap: 80 },
    energie:     { naam: 'Flohara-energie', kleur: '#c48ae8', waarde: 40,  cap: 150 },
    nevelparel:  { naam: 'Nevelparels',     kleur: '#cfe6ef', waarde: 200,  cap: 100, zeldzaam: 'Valunari' },
    kroonhars:   { naam: 'Kroonhars',       kleur: '#f0b04a', waarde: 300,  cap: 100, zeldzaam: 'Kroveli' },
    wortelgloed: { naam: 'Wortelgloed',     kleur: '#e2643a', waarde: 1000, cap: 50,  zeldzaam: 'Lomaruun' },
  };

  const BAL = {
    kostGroei: 1.17,            // prijs n-de exemplaar = basis × 1,17^n
    opslagGroei: 1.12,          // elk volgend opslaggebouw 12% groter
    productieSchaal: 0.3,
    onderhoud: 0.012,           // voedsel/s per bewoner
    startBedden: 4,
    faseBij: [10, 25, 50, 100], // aantallen voor fase 2..5
    faseKostMult: [8, 40, 200, 1000],
    faseExtra: [{}, { steen: 1, gereedschap: .2 }, { steen: 1, gereedschap: .5 }, { gereedschap: 1, kristal: .05 }],
    offlineRendement: 1,        // offline even snel als spelen; upgrades en Yomi tillen het tot offlineMax
    offlineMax: 1.5,
    offlineUren: 8,
    novaPct: 0.03,
    hergroeiEnergie: 100000,     // Hergroei beschikbaar na zoveel energie (moment dat Veyra verschijnt)
    verzamelSec: .2,            // één tik = 0,2 s productie hout + bladeren (minimaal 1 van elk)
    magieMax: 12,
    // Bouwtijd (deel B): een upgrade naar fase 2..5 duurt zo lang; één project tegelijk per district. Bouw blijft direct.
    bouwSec: [60, 600, 3600, 14400], bouwTik: .01, bouwTikMin: 2,
    // Dag en nacht (deel B): één etmaal duurt dagSec seconden, het laatste deel is nacht
    dagSec: 600, nachtDeel: .3, nachtProd: .8, nachtTik: 1.5,
    // Bosgebeurtenissen: elke gebSec een kans; alleen als je speelt, nooit offline
    gebSec: 240, gebKans: .5, gebVanaf: 15, gebMax: 2, gebDuur: 180, gebTev: 15, helpSec: 5,
  };
  // Bosgebeurtenissen. doel = gebouwen die stil kunnen vallen; tev = tevredenheid in een district daalt; nacht = alleen 's nachts.
  // Een gebeurtenis kost nooit gebouwen of voorraad: hooguit valt een gebouw een paar minuten stil.
  const GEB = {
    storm:      { naam: 'Storm',         doel: ['hakplek', 'zaag', 'kroon', 'liaan', 'hangtuin'], tekst: 'Een storm rukt aan de kronen' },
    plaag:      { naam: 'Plaag',         doel: ['pluk', 'liaan', 'hangtuin', 'bessen'], tekst: 'Een plaag tast de planten aan' },
    instorting: { naam: 'Instorting',    doel: ['groeve', 'tunnel', 'kristgrot'], tekst: 'Een gang stort in' },
    onweer:     { naam: 'Onweersnacht',  tev: true, nacht: true, tekst: 'Donder houdt de bewoners wakker' },
  };
  const novaFormule = earned => Math.floor(3 * Math.cbrt(earned / 1e10));
  const magieKost = k => ({ kristal: 40 * 4 ** k, energie: 25 * 4 ** k });

  const DISTRICTS = {
    Takelom:  { functie: 'Bouwplaatsen en grote boomconstructies', open: {},                                    vak: [0, 0, 40, 28] },
    Rikilari: { functie: 'Hoge bruggen en uitkijkplatforms',       open: { hout: 8000, lianen: 6000 },          vak: [60, 0, 40, 28] },
    Lomavii:  { functie: 'Lianen, netten en hangende verbindingen', open: {},                                   vak: [0, 28, 34, 32] },
    Voelari:  { functie: 'Zangplekken en de ontmoetingsplaats',    open: { bladeren: 500000, lianen: 160000, kristal: 1500 }, vak: [34, 28, 30, 40] },
    Dorukha:  { functie: 'Ondergrondse gangen en ontdekkingen',    open: { hout: 2500 },                        vak: [64, 28, 36, 32] },
    Moloro:   { functie: 'Familiekamers en slaapnesten',           open: {},                                    vak: [0, 60, 42, 40] },
    Frikto:   { functie: 'Werkplaatsen en gereedschap',            open: { hout: 80000, steen: 15000 },          vak: [58, 60, 42, 40] },
  };
  // Gebieden: buiten de dorpsplaat, vrij te spelen in de Sterrenstam. Blijven na elke Hergroei.
  const GEBIEDEN = {
    Valunari: { functie: 'De watervallen onder het dorp, vol nevel en stroming', star: 'n1', thuis: ['nira'], bonus: 'Staat Nira hier, dan verdubbelt alle productie in Valunari.' },
    Kroveli:  { functie: 'De kronen boven de oude boom, waar het meeste licht valt', star: 'n2', thuis: ['piko', 'kavo'], bonus: 'Staat Piko of Kavo hier, dan is Kroveli verbonden met alle districten.' },
    Lomaruun: { functie: 'Het wortelhart onder Dorukha, waar de Flohara-energie vandaan komt', star: 'n3', thuis: ['veyra', 'varo', 'elomi'], bonus: 'Elk van Veyra, Varo en Elomi die hier staat: +25% productie in Lomaruun.' },
  };
  const START_OPEN = ['Takelom', 'Lomavii', 'Moloro'];

  // p = productie/s, c = verbruik/s, k = prijs, o = opslag, bed = bewoners, w = werkers
  const B = {
    hakplek:   { naam: 'Houthakkersplek',   d: 'Takelom', p: { hout: .6 }, k: { hout: 10 }, w: 1 },
    zaag:      { naam: 'Zaagplatform',      d: 'Takelom', p: { hout: 5 }, k: { hout: 180, lianen: 20 }, w: 1 },
    kroon:     { naam: 'Boomkroonbouw',     d: 'Takelom', p: { hout: 40 }, k: { hout: 4000, steen: 300 }, w: 2 },
    stamrek:   { naam: 'Stammenrek',        d: 'Takelom', o: { hout: 600 }, k: { hout: 60 } },
    pluk:      { naam: 'Bladplukkers',      d: 'Lomavii', p: { bladeren: .7 }, k: { hout: 15 }, w: 1 },
    liaan:     { naam: 'Lianenkwekerij',    d: 'Lomavii', p: { lianen: .35 }, k: { hout: 40, bladeren: 15 }, w: 1 },
    hangtuin:  { naam: 'Hangtuin',          d: 'Lomavii', p: { bladeren: 4, lianen: 2 }, k: { hout: 900, lianen: 250 }, w: 2 },
    netrek:    { naam: 'Nettenrek',         d: 'Lomavii', o: { bladeren: 600, lianen: 300 }, k: { hout: 50, lianen: 10 } },
    nest:      { naam: 'Slaapnest',         d: 'Moloro', bed: 2, k: { hout: 25, bladeren: 25 } },
    familie:   { naam: 'Familiekamer',      d: 'Moloro', bed: 10, k: { hout: 700, bladeren: 500, steen: 60 } },
    bessen:    { naam: 'Bessentuin',        d: 'Moloro', p: { voedsel: .5 }, k: { hout: 20, bladeren: 10 }, w: 1 },
    voorraad:  { naam: 'Voorraadhol',       d: 'Moloro', o: { voedsel: 400 }, k: { hout: 60, bladeren: 30 } },
    groeve:    { naam: 'Steengroeve',       d: 'Dorukha', p: { steen: .4 }, k: { hout: 90 }, w: 1 },
    tunnel:    { naam: 'Tunnelgang',        d: 'Dorukha', p: { steen: 3.5 }, k: { hout: 1500, steen: 120 }, w: 2 },
    kristgrot: { naam: 'Kristalgrot',       d: 'Dorukha', p: { kristal: .05 }, k: { hout: 900, steen: 500 }, w: 2 },
    kelder:    { naam: 'Steenkelder',       d: 'Dorukha', o: { steen: 400, kristal: 40 }, k: { hout: 80, steen: 40 } },
    werkbank:  { naam: 'Werkbank',          d: 'Frikto', p: { gereedschap: .4 }, c: { hout: 1.2, steen: .3 }, k: { hout: 400, steen: 80 }, w: 1 },
    smidse:    { naam: 'Grote werkplaats',  d: 'Frikto', p: { gereedschap: 3.5 }, c: { hout: 8, steen: 2.5 }, k: { hout: 6000, steen: 1200, gereedschap: 100 }, w: 3 },
    gerkist:   { naam: 'Gereedschapsopslag', d: 'Frikto', o: { gereedschap: 200 }, k: { hout: 200, steen: 50 } },
    zangplek:  { naam: 'Zangplek',          d: 'Voelari', p: { energie: .02 }, k: { bladeren: 600, lianen: 250 }, w: 1 },
    ontmoet:   { naam: 'Ontmoetingsboom',   d: 'Voelari', p: { energie: .15 }, k: { hout: 5000, kristal: 60, lianen: 800 }, w: 3 },
    lichtkr:   { naam: 'Lichtkring',        d: 'Voelari', o: { energie: 150 }, k: { bladeren: 300, kristal: 5 } },
    brug:      { naam: 'Touwbrug',          d: 'Rikilari', brug: true, k: { lianen: 300, hout: 200 } },
    valrad:    { naam: 'Valwaterrad',       d: 'Valunari', p: { gereedschap: 2 }, k: { hout: 20000, steen: 5000 }, w: 2 },
    nevel:     { naam: 'Nevelvangers',      d: 'Valunari', p: { nevelparel: .006 }, k: { steen: 20000, gereedschap: 2000 }, w: 2 },
    harst:     { naam: 'Harstappers',       d: 'Kroveli', p: { kroonhars: .005 }, k: { hout: 80000, lianen: 20000 }, w: 2 },
    lichtv:    { naam: 'Lichtvangers',      d: 'Kroveli', p: { energie: .6 }, k: { bladeren: 60000, kristal: 400 }, w: 2 },
    wortelk:   { naam: 'Wortelkamer',       d: 'Lomaruun', p: { wortelgloed: .002 }, k: { steen: 100000, kristal: 2000 }, w: 3 },
    oudebron:  { naam: 'De oude bron',      d: 'Lomaruun', bron: true, max: 1, k: { wortelgloed: 10, steen: 50000 } },
  };
  const FASE_NAAM = ['Klein', 'Groeiend', 'Stevig', 'Groot', 'Meesterwerk'];

  // Effecten: {t:'prod', res|d, x} · {t:'kost', x} · {t:'opslag', x} · {t:'onderhoud', x} · {t:'bed', b, plus}
  // {t:'brug', plus} · {t:'perDistrict', plus} · {t:'faseKost', x} · {t:'auto', id} · {t:'offline', uren}
  // {t:'magieMax', plus} · {t:'start', r:{...}} · {t:'startOpen', d} · {t:'faseBij', min}
  const CAT = { A: 'Productie', B: 'Efficiëntie', C: 'Automatisering', G: 'Offline', F: 'Verzamelen', D: 'Magie', E: 'Gemeenschap' };
  const U = [
    { id: 'bijlen',   cat: 'A', naam: 'Scherpe stenen bijlen',  tekst: 'Hout ×1,5',                        k: { hout: 300 }, eis: { b: ['hakplek', 10] }, fx: [{ t: 'prod', res: 'hout', x: 1.5 }] },
    { id: 'pluk1',    cat: 'A', naam: 'Plukmanden',             tekst: 'Bladeren ×1,5',                    k: { hout: 300, bladeren: 100 }, eis: { b: ['pluk', 10] }, fx: [{ t: 'prod', res: 'bladeren', x: 1.5 }] },
    { id: 'bessen1',  cat: 'A', naam: 'Struiken snoeien',       tekst: 'Voedsel ×1,5',                     k: { hout: 400, bladeren: 200 }, eis: { b: ['bessen', 10] }, fx: [{ t: 'prod', res: 'voedsel', x: 1.5 }] },
    { id: 'ranken',   cat: 'A', naam: 'Gevlochten ranken',      tekst: 'Lianen ×1,5',                      k: { hout: 1500, bladeren: 500 }, eis: { b: ['liaan', 10] }, fx: [{ t: 'prod', res: 'lianen', x: 1.5 }] },
    { id: 'beitels',  cat: 'A', naam: 'Steenbeitels',           tekst: 'Steen ×1,5',                       k: { hout: 3000 }, eis: { b: ['groeve', 10] }, fx: [{ t: 'prod', res: 'steen', x: 1.5 }] },
    { id: 'zaagtand', cat: 'A', naam: 'Zaagtanden van steen',   tekst: 'Hout ×2',                          k: { hout: 20000, steen: 500 }, eis: { u: ['bijlen'], b: ['zaag', 25] }, fx: [{ t: 'prod', res: 'hout', x: 2 }] },
    { id: 'nerven',   cat: 'A', naam: 'Kristalnerven volgen',   tekst: 'Kristallen ×1,5',                  k: { steen: 3000, kristal: 50 }, eis: { b: ['kristgrot', 5] }, fx: [{ t: 'prod', res: 'kristal', x: 1.5 }] },
    { id: 'slijpen',  cat: 'A', naam: 'Gereedschap slijpen',    tekst: 'Gereedschap ×1,5',                 k: { hout: 8000, steen: 2000 }, eis: { b: ['werkbank', 10] }, fx: [{ t: 'prod', res: 'gereedschap', x: 1.5 }] },
    { id: 'bouwlied', cat: 'A', naam: 'Bouwlied van Takelom',   tekst: 'Alle productie in Takelom ×1,5',   k: { hout: 150000, steen: 10000, gereedschap: 500 }, eis: { u: ['zaagtand'], b: ['kroon', 10] }, fx: [{ t: 'prod', d: 'Takelom', x: 1.5 }] },
    { id: 'knopen',   cat: 'A', naam: 'Knopen van Lomavii',     tekst: 'Alle productie in Lomavii ×1,5',   k: { hout: 60000, lianen: 15000 }, eis: { u: ['pluk1', 'ranken'], b: ['hangtuin', 10] }, fx: [{ t: 'prod', d: 'Lomavii', x: 1.5 }] },
    { id: 'licht1',   cat: 'B', naam: 'Lichte constructie',     tekst: 'Alle bouwprijzen −10%',            k: { hout: 2000, lianen: 500 }, eis: { tot: 50 }, fx: [{ t: 'kost', x: .9 }] },
    { id: 'licht2',   cat: 'B', naam: 'Gedeelde mallen',        tekst: 'Alle bouwprijzen nog eens −10%',   k: { hout: 50000, steen: 5000, gereedschap: 500 }, eis: { u: ['licht1'], d: 'Frikto' }, fx: [{ t: 'kost', x: .9 }] },
    { id: 'kelders',  cat: 'B', naam: 'Ruime kelders',          tekst: 'Alle opslag ×1,25',                k: { hout: 5000, steen: 1000 }, eis: { d: 'Dorukha' }, fx: [{ t: 'opslag', x: 1.25 }] },
    { id: 'gewelf',   cat: 'B', naam: 'Gewelfde kamers',        tekst: 'Alle opslag nog eens ×1,25',       k: { hout: 80000, steen: 20000, gereedschap: 1000 }, eis: { u: ['kelders'] }, fx: [{ t: 'opslag', x: 1.25 }] },
    { id: 'zuinig',   cat: 'B', naam: 'Zuinig koken',           tekst: 'Onderhoud (voedsel) −25%',         k: { hout: 2000, bladeren: 1000 }, eis: { b: ['bessen', 15] }, fx: [{ t: 'onderhoud', x: .75 }] },
    { id: 'vakman',   cat: 'B', naam: 'Vakmanschap',            tekst: 'Groeifase-upgrades −20%',          k: { hout: 20000, steen: 3000, gereedschap: 300 }, eis: { d: 'Frikto' }, fx: [{ t: 'faseKost', x: .8 }] },
    { id: 'manden',   cat: 'C', naam: 'Verzamelmanden',         tekst: 'Verzamelt vanzelf, elke 10 seconden', k: { hout: 500, bladeren: 300 }, eis: { tot: 25 }, fx: [{ t: 'auto', id: 'verzamel' }] },
    { id: 'nestbouw', cat: 'C', naam: 'Nestenbouwers',          tekst: 'Bouwt vanzelf woningen als er te weinig bewoners zijn', k: { hout: 3000, bladeren: 2000 }, eis: { b: ['nest', 15] }, fx: [{ t: 'auto', id: 'wonen' }] },
    { id: 'voorraadw',cat: 'C', naam: 'Voorraadwacht',          tekst: 'Bouwt vanzelf een Bessentuin bij voedseltekort', k: { hout: 2000, bladeren: 1000 }, eis: { b: ['bessen', 15] }, fx: [{ t: 'auto', id: 'voedsel' }] },
    { id: 'groeiw',   cat: 'C', naam: 'Groeiwachters',          tekst: 'Voert groeifases vanzelf uit zodra ze betaalbaar zijn', k: { hout: 100000, steen: 20000, gereedschap: 3000 }, eis: { u: ['vakman'] }, fx: [{ t: 'auto', id: 'fase' }] },
    { id: 'langslaap',cat: 'G', naam: 'Lange slaap',            tekst: 'Offline-limiet +2 uur',              k: { hout: 1500, bladeren: 1000, steen: 100 }, eis: { b: ['familie', 1] }, fx: [{ t: 'offline', uren: 2 }] },
    { id: 'nachtwak', cat: 'G', naam: 'Nachtwakers',            tekst: 'Offline-opbrengst +20%',             k: { hout: 3000, bladeren: 1500 }, eis: { tot: 50 }, fx: [{ t: 'offlineEff', plus: .2 }] },
    { id: 'stilwerk', cat: 'G', naam: 'Stille werkplaatsen',    tekst: 'Offline-opbrengst nog eens +20%',    k: { hout: 40000, steen: 8000, gereedschap: 500 }, eis: { u: ['nachtwak'], d: 'Frikto' }, fx: [{ t: 'offlineEff', plus: .2 }] },
    { id: 'wachters', cat: 'G', naam: 'Wakkere wachters',       tekst: 'Offline-limiet +4 uur',              k: { hout: 60000, bladeren: 30000, steen: 10000 }, eis: { u: ['langslaap'], tot: 150 }, fx: [{ t: 'offline', uren: 4 }] },
    { id: 'nachtmand',cat: 'G', naam: 'Nachtmanden',            tekst: 'Verzamelmanden blijven tikken terwijl je weg bent', k: { hout: 25000, lianen: 8000 }, eis: { u: ['manden'] }, fx: [{ t: 'nachtmanden' }] },
    { id: 'handsch',  cat: 'F', naam: 'Stevige handschoenen',   tekst: 'Elke tik ×1,5',                    k: { hout: 200 }, eis: { tik: 25 }, fx: [{ t: 'tikX', x: 1.5 }] },
    { id: 'manden2',  cat: 'F', naam: 'Brede manden',           tekst: 'Een tik geeft ook lianen en voedsel', k: { hout: 1500, bladeren: 500 }, eis: { b: ['liaan', 5] }, fx: [{ t: 'tikRes', res: ['lianen', 'voedsel'] }] },
    { id: 'ritme',    cat: 'F', naam: 'Ritme van het werk',     tekst: 'Tik 10 keer binnen 3 seconden: de tiende tik geeft ×4', k: { bladeren: 3000, lianen: 500 }, eis: { tik: 100 }, fx: [{ t: 'ritme' }] },
    { id: 'steenh',   cat: 'F', naam: 'Steenhouwershand',       tekst: 'Een tik geeft ook steen',           k: { hout: 8000, steen: 1000 }, eis: { d: 'Dorukha' }, fx: [{ t: 'tikRes', res: ['steen'] }] },
    { id: 'gedeeld',  cat: 'F', naam: 'Gedeelde arbeid',        tekst: '+3% per tik voor elke ingezette Lomari', k: { hout: 20000, bladeren: 5000 }, eis: { lom: 5 }, fx: [{ t: 'tikLomari', plus: .03 }] },
    { id: 'oogst',    cat: 'F', naam: 'Langere oogst',          tekst: 'Een tik geeft twee keer zoveel productie', k: { hout: 50000, gereedschap: 2000 }, eis: { tik: 500 }, fx: [{ t: 'tikSec', sec: .4 }] },
    { id: 'snelmand', cat: 'F', naam: 'Snellere manden',        tekst: 'Verzamelmanden tikken elke 5 seconden in plaats van 10', k: { hout: 30000, lianen: 10000 }, eis: { u: ['manden'] }, fx: [{ t: 'mandSec', sec: 5 }] },
    { id: 'bron',     cat: 'D', naam: 'Zingende bron',          tekst: 'Flohara-energie ×1,5',             k: { bladeren: 2000, kristal: 100 }, eis: { b: ['zangplek', 10] }, fx: [{ t: 'prod', res: 'energie', x: 1.5 }] },
    { id: 'maaltijd', cat: 'E', naam: 'Gedeelde maaltijd',      tekst: 'Slaapnest: 3 bewoners in plaats van 2', k: { hout: 800, bladeren: 800 }, eis: { b: ['nest', 10] }, fx: [{ t: 'bed', b: 'nest', plus: 1 }] },
    { id: 'liederen', cat: 'E', naam: 'Werkliederen',           tekst: '+5% productie per open district',  k: { bladeren: 5000, lianen: 5000 }, eis: { d: 'Rikilari' }, fx: [{ t: 'perDistrict', plus: .05 }] },
    { id: 'bruggen',  cat: 'E', naam: 'Bruggenbouwers',         tekst: 'Touwbrug: +6% in plaats van +4%',  k: { lianen: 10000, hout: 5000 }, eis: { b: ['brug', 5] }, fx: [{ t: 'brug', plus: .02 }] },
    { id: 'familieb', cat: 'E', naam: 'Familiebanden',          tekst: 'Familiekamer: 15 bewoners in plaats van 10', k: { hout: 30000, bladeren: 20000, steen: 2000 }, eis: { b: ['familie', 5] }, fx: [{ t: 'bed', b: 'familie', plus: 5 }] },
  ];
  const ROMEIN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];

  // Prestaties: elke behaalde prestatie geeft +1% op alle productie
  const ACH = [
    { id: 'b1',    naam: 'Eerste gebouw',            test: s => s.tot >= 1 },
    { id: 'b10',   naam: '10 gebouwen',              test: s => s.tot >= 10 },
    { id: 'b100',  naam: 'Eerste 100 gebouwen',      test: s => s.tot >= 100 },
    { id: 'b500',  naam: '500 gebouwen',             test: s => s.tot >= 500 },
    { id: 'b1000', naam: '1.000 gebouwen',           test: s => s.tot >= 1000 },
    { id: 'bew10', naam: 'Eerste 10 bewoners',       test: s => s.bedden >= 10 },
    { id: 'bew100',naam: '100 bewoners',             test: s => s.bedden >= 100 },
    { id: 'd4',    naam: 'Vier districten open',     test: s => s.open >= 4 },
    { id: 'd7',    naam: 'Alle zeven districten open', test: s => s.open >= 7 },
    { id: 'geb1',  naam: 'Een nieuw gebied',          test: s => s.gebieden >= 1 },
    { id: 'geb3',  naam: 'Alle drie de gebieden',     test: s => s.gebieden >= 3 },
    { id: 'f2',    naam: 'Eerste groeifase',         test: s => s.maxFase >= 2 },
    { id: 'f3',    naam: 'Stevig gebouwd (fase 3)',  test: s => s.maxFase >= 3 },
    { id: 'f5',    naam: 'Een meesterwerk (fase 5)', test: s => s.maxFase >= 5 },
    { id: 'h1m',   naam: 'Een miljoen hout',         test: s => s.hout >= 1e6 },
    { id: 'm1',    naam: 'Eerste magische upgrade',  test: s => s.magie >= 1 },
    { id: 'm12',   naam: 'Twaalf keer resonantie',   test: s => s.magie >= 12 },
    { id: 't100',  naam: '100 tikken',               test: s => s.tikken >= 100 },
    { id: 't1000', naam: '1.000 tikken',             test: s => s.tikken >= 1000 },
    { id: 'l1',    naam: 'Eerste Lomari',            test: s => s.lomari >= 1 },
    { id: 'l10',   naam: 'Eerste 10 Lomari',         test: s => s.lomari >= 10 },
    { id: 'l18',   naam: 'Alle 18 Lomari verzameld', test: s => s.lomari >= 18 },
    { id: 'n1',    naam: 'Eerste Hergroei',          test: s => s.runs >= 1 },
    { id: 'n100',  naam: '100 Nova',                 test: s => s.nova >= 100 },
  ];

  // Sterrenstam (v1): Wortels, Gewoonte, Oude magie. Nieuwe gebieden volgen.
  const STAR = [
    { id: 'w1', tak: 'Wortels', naam: 'Snelle wortel',  tekst: 'Start elke ronde met 500 hout en 300 bladeren', k: 1, fx: [{ t: 'start', r: { hout: 500, bladeren: 300 } }] },
    { id: 'w2', tak: 'Wortels', naam: 'Oude paden',     tekst: 'Start met Dorukha open', k: 3, eis: 'w1', fx: [{ t: 'startOpen', d: 'Dorukha' }] },
    { id: 'w3', tak: 'Wortels', naam: 'Vroeg rijp',     tekst: 'Groeifase 2 al bij 8 exemplaren', k: 6, eis: 'w1', fx: [{ t: 'faseBij', min: 2 }] },
    { id: 'w4', tak: 'Wortels', naam: 'Diepe wortels',  tekst: 'Start ook met Rikilari open', k: 10, eis: 'w2', fx: [{ t: 'startOpen', d: 'Rikilari' }] },
    { id: 'g1', tak: 'Gewoonte', naam: 'Vaste handen',  tekst: 'Verzamelmanden vanaf de start', k: 5, fx: [{ t: 'auto', id: 'verzamel' }] },
    { id: 'g2', tak: 'Gewoonte', naam: 'Lange nacht',   tekst: 'Offline-limiet +4 uur', k: 15, eis: 'g1', fx: [{ t: 'offline', uren: 4 }] },
    { id: 'g3', tak: 'Gewoonte', naam: 'Vanzelf',       tekst: 'Nestenbouwers en Voorraadwacht vanaf de start', k: 25, eis: 'g1', fx: [{ t: 'auto', id: 'wonen' }, { t: 'auto', id: 'voedsel' }] },
    { id: 'g4', tak: 'Gewoonte', naam: 'Groeiritme',    tekst: 'Groeiwachters vanaf de start', k: 60, eis: 'g3', fx: [{ t: 'auto', id: 'fase' }] },
    { id: 'o1', tak: 'Oude magie', naam: 'Ouder lied',  tekst: '+2 magische upgrades (boven de 12)', k: 10, fx: [{ t: 'magieMax', plus: 2 }] },
    { id: 'o2', tak: 'Oude magie', naam: 'Bronnen',     tekst: 'Flohara-energie ×1,5', k: 25, eis: 'o1', fx: [{ t: 'prod', res: 'energie', x: 1.5 }] },
    { id: 'o3', tak: 'Oude magie', naam: 'Oudste lied', tekst: 'Nog eens +2 magische upgrades', k: 40, eis: 'o1', fx: [{ t: 'magieMax', plus: 2 }] },
    { id: 'n1', tak: 'Nieuwe gebieden', naam: 'Valunari', tekst: 'Opent de watervallen onder het dorp: Valwaterrad (gereedschap zonder verbruik) en Nevelvangers (Nevelparels)', k: 20, fx: [{ t: 'startOpen', d: 'Valunari' }] },
    { id: 'n2', tak: 'Nieuwe gebieden', naam: 'Kroveli', tekst: 'Opent de kronen boven de oude boom: Harstappers (Kroonhars, nodig voor fase 5) en Lichtvangers (energie)', k: 60, eis: 'n1', fx: [{ t: 'startOpen', d: 'Kroveli' }] },
    { id: 'n3', tak: 'Nieuwe gebieden', naam: 'Lomaruun', tekst: 'Opent het wortelhart: Wortelkamer (Wortelgloed) en De oude bron, die na elke Hergroei een fase groeit', k: 150, eis: 'n2', fx: [{ t: 'startOpen', d: 'Lomaruun' }] },
  ];

  return { GEB, RES, BAL, novaFormule, magieKost, DISTRICTS, GEBIEDEN, START_OPEN, B, FASE_NAAM, CAT, U, ROMEIN, ACH, STAR };
})();
