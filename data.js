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
    energie:     { naam: 'Flohara-energie', kleur: '#c48ae8', waarde: 40,  cap: 150, nova: 1000 },   // nova = waarde voor Nova (anders gelijk aan waarde)
    nevelparel:  { naam: 'Nevelparels',     kleur: '#cfe6ef', waarde: 200,  cap: 100, zeldzaam: 'Valunari' },
    kroonhars:   { naam: 'Kroonhars',       kleur: '#f0b04a', waarde: 300,  cap: 100, zeldzaam: 'Kroveli' },
    wortelgloed: { naam: 'Wortelgloed',     kleur: '#e2643a', waarde: 1000, cap: 50,  zeldzaam: 'Lomaruun' },
  };

  const BAL = {
    kostGroei: 1.17,            // prijs n-de exemplaar = basis × 1,17^n
    opslagGroei: 1.12,          // elk volgend opslaggebouw 12% groter
    opslagUren: 1,              // opslag past altijd minstens zoveel uur van je eigen productie (offline geen grens)
    productieSchaal: 0.3,
    onderhoud: 0.012,           // voedsel/s per bewoner
    startBedden: 4,
    faseBij: [10, 25, 50, 100], // aantallen voor fase 2..5
    faseKostMult: [8, 40, 200, 1000],
    faseExtra: [{}, { steen: 1, gereedschap: .2 }, { steen: 1, gereedschap: .5 }, { gereedschap: 1, kristal: .05 }],
    offlineRendement: 1,        // offline even snel als spelen; upgrades en Yomi tillen het tot offlineMax
    offlineMax: 1.5,
    offlineUren: 8,
    novaPct: 0.05,
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
  // Gaven van het woud (boosters): je spaart ze op en zet ze zelf in. Eén tegelijk; dezelfde opnieuw verlengt.
  // De tijd loopt niet door als je weg bent, en offline tellen ze niet mee. Blijven bij Hergroei.
  const GAVE = {
    groei: { naam: 'Groeigave', x: 2, sec: 900,  koop: ['kristal', 30],  tekst: 'Een druppel sap uit de oude boom. Alle productie ×2, 15 minuten.' },
    bloei: { naam: 'Bloeigave', x: 3, sec: 600,  koop: ['wortelgloed', 15], tekst: 'Een bloesem die maar één nacht openstaat. Alle productie ×3, 10 minuten.' },
    woud:  { naam: 'Woudgave',  x: 2, sec: 3600, koop: ['nova', 3], tekst: 'Een zaad uit het diepe woud. Alle productie ×2, 1 uur.' },
  };
  // Tochten (deel C): een Lomari gaat buiten het dorp op pad. Onderweg geen gave en geen Verbanden, wel Band-groei.
  // Terug met buit (een deel van de duur aan productie van het eigen district) en soms een reliek. Tochten lopen ook offline door.
  const TOCHT = {
    kort: { naam: 'Korte tocht', sec: 3600,  reliek: .08, buit: .5 },
    lang: { naam: 'Lange tocht', sec: 10800, reliek: .3,  buit: .5 },
    ver:  { naam: 'Verre tocht', sec: 28800, reliek: 1,   buit: .5 },
  };
  // Relieken: één per Lomari, tot RELIEK_MAX treden. Blijven na Hergroei. fx geldt per trede.
  const RELIEK_MAX = 5;
  const RELIEK = {
    melo:   ['Oude kaart',        'Vondstkans +0,5%',                    [{ t: 'vondst', plus: .005 }]],
    tiku:   ['Windveer',          'Verzamelen +10%',                     [{ t: 'verzamel', x: 1.1 }]],
    beki:   ['Kiemzaad',          'Bladeren, lianen en voedsel +4%',     ['bladeren', 'lianen', 'voedsel'].map(res => ({ t: 'prod', res, x: 1.04 }))],
    koro:   ['Kernhout',          'Alle opslag +4%',                     [{ t: 'opslag', x: 1.04 }]],
    varo:   ['Trilsteen',         'Steen +5%',                           [{ t: 'prod', res: 'steen', x: 1.05 }]],
    piko:   ['Lichtschelp',       'Lichtbollen +10% buit',               [{ t: 'lichtX', duur: 1, x: 1.1 }]],
    brakka: ['Zware kei',         'Bouwtijd −4%',                        [{ t: 'bouwX', x: .96 }]],
    sora:   ['Droomveer',         'Tevredenheid +1 in alle districten',  [{ t: 'tevAlle', plus: 1 }]],
    liri:   ['Helend mos',        'Gebeurtenissen 5% korter',            [{ t: 'herstel', x: .95 }]],
    niko:   ['Schildblad',        'Kans op bosgebeurtenissen −4%',       [{ t: 'gebKans', x: .96 }]],
    nira:   ['Stroomsteen',       'Ketens verbruiken −3% input',         [{ t: 'ketenIn', x: .97 }]],
    ori:    ['Herinneringskraal', 'Upgrades −2%',                        [{ t: 'upKost', x: .98 }]],
    droki:  ['Zweefsteen',        'Gereedschap +5%',                     [{ t: 'prod', res: 'gereedschap', x: 1.05 }]],
    seli:   ['Bindkoord',         'Verband-bonussen +3%',                [{ t: 'verband', plus: .03 }]],
    elomi:  ['Symboolsteen',      'Kristallen +5%',                      [{ t: 'prod', res: 'kristal', x: 1.05 }]],
    yomi:   ['Nachtoog',          'Offline-opbrengst +2%',               [{ t: 'offlineEff', plus: .02 }]],
    kavo:   ['Doorgangssteen',    'Reistijd −8%',                        [{ t: 'reis', x: .92 }]],
    veyra:  ['Bronsteen',         'Hergroei +2% Nova',                   [{ t: 'nova', x: 1.02 }]],
  };
  // Bronwerk (deel C): staat De oude bron op fase 5, dan neemt hij zeldzame grondstoffen op. Wat je inlegt blijft bewaard,
  // ook na Hergroei, dus een trede mag over meerdere rondes lopen. Elke trede +8% op alle productie; elke 5e trede ook +5% Nova.
  // Beproevingen (deel C): vanaf de derde Hergroei kun je een ronde met een beperking beginnen. Haal je in die ronde de
  // Hergroei, dan krijg je de beloning voor altijd. Stoppen mag; dan vervalt de beperking zonder beloning. Offline geldt de beperking niet.
  // Jaarringen (deel C): de tweede laag. Staat de hele Sterrenstam, dan kun je een Jaarring zetten: Nova en de Sterrenstam
  // gaan terug naar nul, het dorp begint opnieuw. Elke ring geeft voor altijd meer Nova bij Hergroei en meer productie.
  // Je krijgt floor(√(Nova / per)) ringen. Blijft: ringen, prestaties, Lomari (Band en bomen), relieken, Bronwerk, De oude bron, Beproevingen, gaven.
  const JAAR = { per: 150, nova: .15, prod: .1 };   // balanstest: eerste Sterrenstam vol na ~11 dagen, na 2 ringen weer vol na ~6 dagen
  const jaarFormule = nova => Math.floor(Math.sqrt(nova / JAAR.per));
  // Dagelijkse doelen: elke dag (lokale datum) drie kleine opdrachten. Elk voltooid doel: een Groeigave; alle drie: ook een Bloeigave.
  // n = hoeveel; kan = alleen kiezen als het die dag haalbaar is.
  const DOEL_AANTAL = 3;
  const DOEL = {
    tik:   { n: 150, tekst: n => `Tik ${n} keer op Verzamelen` },
    koop:  { n: 30,  tekst: n => `Bouw ${n} gebouwen` },
    fase:  { n: 1,   tekst: () => 'Start een Upgrade naar een hogere fase', kan: S => S.runs > 0 || Object.values(S.fase || {}).some(f => f >= 2) },
    up:    { n: 3,   tekst: n => `Koop ${n} upgrades, ambachten of magische upgrades` },
    help:  { n: 20,  tekst: n => `Tik ${n} keer om te helpen bij een bosgebeurtenis of een bouwplaats`, kan: S => (S.gebeurtenissen || 0) > 0 },
    act:   { n: 3,   tekst: n => `Gebruik ${n} keer een vaardigheid van een Lomari`, kan: S => Object.keys(S.lom || {}).length > 0 },
    tocht: { n: 1,   tekst: () => 'Stuur een Lomari op tocht', kan: S => !!S.star?.t1 },
    gave:  { n: 1,   tekst: () => 'Zet een gave van het woud in' },
    bol:   { n: 1,   tekst: () => 'Vang een lichtbol', kan: S => (S.tel?.bolTot || 0) > 0 },
    leg:   { n: 1,   tekst: () => 'Leg iets in het Bronwerk', kan: S => !!S.n.oudebron && S.fase.oudebron >= 5 && (S.bronwerk?.t || 0) < BRONWERK.max },
    rune:  { n: 1,   tekst: () => 'Zet een rune in een gebouw', kan: S => Object.values(S.fase || {}).some(f => f >= 3) },
    doorbreek: { n: 1, tekst: () => 'Laat een Lomari door een Band breken', kan: S => Object.values(S.lom || {}).some(l => l.band >= 30) },
    open:  { n: 1,   tekst: () => 'Open een district', kan: S => Object.keys(DISTRICTS).some(d => !S.open.includes(d)) },
    nachttik: { n: 50, tekst: n => `Tik ${n} keer op Verzamelen terwijl het nacht is` },
  };
  // Weekdoel: één groter doel per week (vanaf maandag), beloning in Nova. Reeks: elke 7 dagen op rij alle drie dagdoelen = een Woudgave.
  const WEEKDOEL = {
    koop:  { n: 500,  tekst: n => `Bouw ${n} gebouwen` },
    tik:   { n: 1000, tekst: n => `Tik ${n} keer op Verzamelen` },
    fase:  { n: 5,    tekst: n => `Start ${n} keer een Upgrade naar een hogere fase` },
    help:  { n: 100,  tekst: n => `Tik ${n} keer om te helpen bij een bosgebeurtenis of een bouwplaats` },
    tocht: { n: 3,    tekst: n => `Stuur ${n} keer een Lomari op tocht`, kan: S => !!S.star?.t1 },
  };
  const WEEK_NOVA = 3, REEKS_DAGEN = 7;
  // Woudkennis: vier ladders zonder einde, betaald met Flohara-energie, terug naar nul bij Hergroei.
  const KENNIS_GROEI = 10;
  const KENNIS = {
    prod:   { naam: 'Kennis van groei',   tekst: 'Alle productie +5% per trede',   basis: 1000, fx: t => ({ t: 'alles', x: 1 + .05 * t }) },
    opslag: { naam: 'Kennis van ruimte',  tekst: 'Opslag +15% per trede',          basis: 500,  fx: t => ({ t: 'opslag', x: 1 + .15 * t }) },
    tik:    { naam: 'Kennis van handen',  tekst: 'Verzamelen +25% per trede',      basis: 300,  fx: t => ({ t: 'tikX', x: 1 + .25 * t }) },
    bouw:   { naam: 'Kennis van bouwen',  tekst: 'Bouwtijd −5% per trede',         basis: 800,  fx: t => ({ t: 'bouwX', x: .95 ** t }) },
  };
  const BEPROEF_VANAF = 3;
  const BEPROEF = {
    verband: { naam: 'Losse draden',   tekst: 'Verbanden werken niet', beloning: 'Verband-bonussen +15%', fx: [{ t: 'verband', plus: .15 }] },
    tik:     { naam: 'Stille handen',  tekst: 'Verzamelen levert niets op, ook niet via manden', beloning: 'Elke tik ×2', fx: [{ t: 'tikX', x: 2 }] },
    nacht:   { naam: 'Lange nacht',    tekst: 'De hele ronde is het nacht', beloning: "'s Nachts productie +10%", fx: [{ t: 'nacht', plus: .1 }] },
    lomari:  { naam: 'Zonder gaven',   tekst: 'Gaven, upgradebomen en vaardigheden van de Lomari werken niet', beloning: 'Alle productie +10%',
               fx: Object.keys(RES).map(res => ({ t: 'prod', res, x: 1.1 })) },
    stam:    { naam: 'Kale stam',      tekst: 'De Sterrenstam werkt niet, ook de gebieden blijven dicht', beloning: 'Hergroei +10% Nova', fx: [{ t: 'nova', x: 1.1 }] },
  };
  const BRONWERK = { max: 20, prod: .08, nova: .05, novaElk: 5, groei: 1.35, kost: { nevelparel: 40, kroonhars: 30, wortelgloed: 12 } };
  const bronwerkKost = t => Object.fromEntries(Object.entries(BRONWERK.kost).map(([k, v]) => [k, Math.ceil(v * BRONWERK.groei ** t)]));
  const GAVE_MAX = 5, GAVE_START = { groei: 2 }, GAVE_GEBKANS = .25, GAVE_KOOPGROEI = 1.5;   // elke aankoop ×1,5 duurder; terug naar begin bij Hergroei
  // Runen (deel B): één per gebouw vanaf fase 3, gemaakt van Kristallen. De prijs stijgt met elke rune die je al hebt. Verdwijnen bij Hergroei.
  const RUNE = {
    groei: { naam: 'Rune van groei', tekst: 'Dit gebouw maakt +50%', kost: { kristal: 40, steen: 400 } },
    rust:  { naam: 'Rune van rust',  tekst: 'Dit gebouw valt nooit stil door een gebeurtenis', kost: { kristal: 25, steen: 200 } },
    vlot:  { naam: 'Rune van vaart', tekst: 'Upgrades van dit gebouw bouwen twee keer zo snel', kost: { kristal: 25, hout: 2000 } },
  };
  const runeGroei = 1.6, runeFase = 3;
  // Bosgebeurtenissen. doel = gebouwen die stil kunnen vallen; tev = tevredenheid in een district daalt; nacht = alleen 's nachts.
  // Een gebeurtenis kost nooit gebouwen of voorraad: hooguit valt een gebouw een paar minuten stil.
  const GEB = {
    storm:      { naam: 'Storm',         doel: ['hakplek', 'zaag', 'kroon', 'liaan', 'hangtuin'], tekst: 'Een storm rukt aan de kronen' },
    plaag:      { naam: 'Plaag',         doel: ['pluk', 'liaan', 'hangtuin', 'bessen'], tekst: 'Een plaag tast de planten aan' },
    instorting: { naam: 'Instorting',    doel: ['groeve', 'tunnel', 'kristgrot', 'kristader'], tekst: 'Een gang stort in' },
    onweer:     { naam: 'Onweersnacht',  tev: true, nacht: true, tekst: 'Donder houdt de bewoners wakker' },
  };
  const novaDeler = 2e11, novaFormule = earned => Math.floor(3 * Math.cbrt(earned / novaDeler));
  const novaWaarde = n => (n / 3) ** 3 * novaDeler;   // waarde die nodig is voor n Nova (zonder bonussen)
  const magieKost = k => ({ kristal: 40 * 4 ** k, energie: 25 * 4 ** k });
  // Ambachten: per grondstof een ladder. Elke trede: die grondstof ×stap. Betaald in de grondstof zelf (×groei per trede),
  // vanaf trede IV ook gereedschap, vanaf VII kristallen. Open bij 'open' stuks van het eerste gebouw. Terug naar 0 bij Hergroei.
  const AMB = { stap: 1.15, max: 10, groei: 3, zeldzaamMax: 5, zeldzaamGroei: 2 };
  const AMBACHT = {
    hout:        { naam: 'Ambacht van het hout',      b: 'hakplek',  open: 10, basis: 1000 },
    bladeren:    { naam: 'Ambacht van de bladeren',   b: 'pluk',     open: 10, basis: 1000 },
    lianen:      { naam: 'Ambacht van de lianen',     b: 'liaan',    open: 10, basis: 500 },
    voedsel:     { naam: 'Ambacht van het voedsel',   b: 'bessen',   open: 10, basis: 700 },
    steen:       { naam: 'Ambacht van de steen',      b: 'groeve',   open: 10, basis: 400 },
    gereedschap: { naam: 'Ambacht van het gereedschap', b: 'werkbank', open: 10, basis: 150 },
    kristal:     { naam: 'Ambacht van de kristallen', b: 'kristgrot', open: 10, basis: 40 },
    energie:     { naam: 'Ambacht van de Flohara-energie', b: 'zangplek', open: 10, basis: 25 },
    nevelparel:  { naam: 'Ambacht van de nevelparels', b: 'nevel',   open: 3, basis: 5 },
    kroonhars:   { naam: 'Ambacht van de kroonhars',  b: 'harst',    open: 3, basis: 5 },
    wortelgloed: { naam: 'Ambacht van het wortelgloed', b: 'wortelk', open: 3, basis: 2 },
  };
  function ambKost(k, t) {   // t = huidige trede (0 = nog niets gekocht)
    const a = AMBACHT[k], z = !!RES[k].zeldzaam, c = { [k]: a.basis * (z ? AMB.zeldzaamGroei : AMB.groei) ** t };
    if (!z && t >= 3) c.gereedschap = (c.gereedschap || 0) + 100 * AMB.groei ** (t - 3);
    if (!z && t >= 6) c.kristal = (c.kristal || 0) + 20 * AMB.groei ** (t - 6);
    return c;
  }

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
    kristader: { naam: 'Kristaladers',      d: 'Dorukha', p: { kristal: .4 }, k: { steen: 8000, kristal: 150, gereedschap: 300 }, w: 3 },
    kelder:    { naam: 'Steenkelder',       d: 'Dorukha', o: { steen: 400, kristal: 40 }, k: { hout: 80, steen: 40 } },
    werkbank:  { naam: 'Werkbank',          d: 'Frikto', p: { gereedschap: .4 }, c: { hout: 1.2, steen: .3 }, k: { hout: 400, steen: 80 }, w: 1 },
    smidse:    { naam: 'Grote werkplaats',  d: 'Frikto', p: { gereedschap: 3.5 }, c: { hout: 8, steen: 2.5 }, k: { hout: 6000, steen: 1200, gereedschap: 100 }, w: 3 },
    slijperij: { naam: 'Slijperij',         d: 'Frikto', p: { kristal: .15 }, c: { steen: 3, gereedschap: .3 }, k: { hout: 3000, steen: 2000, gereedschap: 200 }, w: 2 },
    gerkist:   { naam: 'Gereedschapsopslag', d: 'Frikto', o: { gereedschap: 200 }, k: { hout: 200, steen: 50 } },
    zangplek:  { naam: 'Zangplek',          d: 'Voelari', p: { energie: .02 }, k: { bladeren: 600, lianen: 250 }, w: 1 },
    ontmoet:   { naam: 'Ontmoetingsboom',   d: 'Voelari', p: { energie: .15 }, k: { hout: 5000, kristal: 60, lianen: 800 }, w: 3 },
    geode:     { naam: 'Zingende geode',    d: 'Voelari', p: { kristal: .1 }, k: { lianen: 2000, energie: 30, kristal: 20 }, w: 2 },
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
    { id: 'dauw',     cat: 'A', naam: 'Dauwvangers',            tekst: 'Bladeren ×2',                      k: { hout: 15000, bladeren: 8000 }, eis: { u: ['pluk1'], b: ['hangtuin', 25] }, fx: [{ t: 'prod', res: 'bladeren', x: 2 }] },
    { id: 'hangkw',   cat: 'A', naam: 'Hangende kwekerijen',    tekst: 'Lianen ×2',                        k: { hout: 20000, lianen: 5000 }, eis: { u: ['ranken'], b: ['hangtuin', 25] }, fx: [{ t: 'prod', res: 'lianen', x: 2 }] },
    { id: 'bessenr',  cat: 'A', naam: 'Bessenranken',           tekst: 'Voedsel ×2',                       k: { hout: 10000, bladeren: 8000 }, eis: { u: ['bessen1'], b: ['bessen', 50] }, fx: [{ t: 'prod', res: 'voedsel', x: 2 }] },
    { id: 'splijt',   cat: 'A', naam: 'Splijtwiggen',           tekst: 'Steen ×2',                         k: { hout: 40000, steen: 8000 }, eis: { u: ['beitels'], b: ['tunnel', 25] }, fx: [{ t: 'prod', res: 'steen', x: 2 }] },
    { id: 'hamer',    cat: 'A', naam: 'Hamerritme',             tekst: 'Gereedschap ×2',                   k: { hout: 60000, steen: 15000, gereedschap: 1000 }, eis: { u: ['slijpen'], b: ['smidse', 25] }, fx: [{ t: 'prod', res: 'gereedschap', x: 2 }] },
    { id: 'gehoor',   cat: 'A', naam: 'Kristalgehoor',          tekst: 'Kristallen ×2',                    k: { steen: 40000, kristal: 500 }, eis: { u: ['nerven'], b: ['kristgrot', 25] }, fx: [{ t: 'prod', res: 'kristal', x: 2 }] },
    { id: 'koor',     cat: 'A', naam: 'Avondkoor',              tekst: 'Flohara-energie ×2',               k: { bladeren: 50000, kristal: 300, energie: 100 }, eis: { u: ['bron'], b: ['ontmoet', 10] }, fx: [{ t: 'prod', res: 'energie', x: 2 }] },
    { id: 'haard',    cat: 'A', naam: 'Haardvuur van Moloro',   tekst: 'Alle productie in Moloro ×1,5',    k: { hout: 50000, bladeren: 30000, steen: 3000 }, eis: { b: ['bessen', 50] }, fx: [{ t: 'prod', d: 'Moloro', x: 1.5 }] },
    { id: 'gangen',   cat: 'A', naam: 'Gangenlied van Dorukha', tekst: 'Alle productie in Dorukha ×1,5',   k: { hout: 100000, steen: 30000, gereedschap: 1000 }, eis: { b: ['tunnel', 10] }, fx: [{ t: 'prod', d: 'Dorukha', x: 1.5 }] },
    { id: 'smidsr',   cat: 'A', naam: 'Smidsritme van Frikto',  tekst: 'Alle productie in Frikto ×1,5',    k: { hout: 200000, steen: 50000, gereedschap: 5000 }, eis: { b: ['smidse', 10] }, fx: [{ t: 'prod', d: 'Frikto', x: 1.5 }] },
    { id: 'samenz',   cat: 'A', naam: 'Samenzang van Voelari',  tekst: 'Alle productie in Voelari ×1,5',   k: { bladeren: 150000, lianen: 40000, kristal: 500, energie: 200 }, eis: { b: ['ontmoet', 10] }, fx: [{ t: 'prod', d: 'Voelari', x: 1.5 }] },
    { id: 'diepte',   cat: 'A', naam: 'Stem van de diepte',     tekst: 'Alle productie in Valunari, Kroveli en Lomaruun ×1,5', k: { steen: 500000, gereedschap: 20000, kristal: 2000 }, eis: { d: 'Lomaruun' }, fx: [{ t: 'prod', d: 'Valunari', x: 1.5 }, { t: 'prod', d: 'Kroveli', x: 1.5 }, { t: 'prod', d: 'Lomaruun', x: 1.5 }] },
    // Derde trappen: laat in een ronde, ×1,5 bovenop de tweede trap
    { id: 'kroonzaag', cat: 'A', naam: 'Kroonzagen',          tekst: 'Hout ×1,5',          k: { hout: 2e6, steen: 2e5, gereedschap: 2e4 }, eis: { u: ['zaagtand'], b: ['zaag', 100] }, fx: [{ t: 'prod', res: 'hout', x: 1.5 }] },
    { id: 'bladweef',  cat: 'A', naam: 'Bladweverij',         tekst: 'Bladeren ×1,5',      k: { hout: 1e6, bladeren: 6e5 }, eis: { u: ['dauw'], b: ['hangtuin', 75] }, fx: [{ t: 'prod', res: 'bladeren', x: 1.5 }] },
    { id: 'lianbrug',  cat: 'A', naam: 'Lianenbruggen',       tekst: 'Lianen ×1,5',        k: { hout: 1e6, lianen: 3e5 }, eis: { u: ['hangkw'], b: ['liaan', 100] }, fx: [{ t: 'prod', res: 'lianen', x: 1.5 }] },
    { id: 'oogstfeest',cat: 'A', naam: 'Oogstfeest',          tekst: 'Voedsel ×1,5',       k: { hout: 8e5, bladeren: 6e5 }, eis: { u: ['bessenr'], b: ['bessen', 100] }, fx: [{ t: 'prod', res: 'voedsel', x: 1.5 }] },
    { id: 'diepsteen', cat: 'A', naam: 'Diepe aders',         tekst: 'Steen ×1,5',         k: { hout: 2e6, steen: 5e5 }, eis: { u: ['splijt'], b: ['tunnel', 75] }, fx: [{ t: 'prod', res: 'steen', x: 1.5 }] },
    { id: 'meesters',  cat: 'A', naam: 'Meestersmeden',       tekst: 'Gereedschap ×1,5',   k: { hout: 3e6, steen: 8e5, gereedschap: 5e4 }, eis: { u: ['hamer'], b: ['smidse', 75] }, fx: [{ t: 'prod', res: 'gereedschap', x: 1.5 }] },
    { id: 'kristlied', cat: 'A', naam: 'Kristallied',         tekst: 'Kristallen ×1,5',    k: { steen: 2e6, kristal: 2e4 }, eis: { u: ['gehoor'], b: ['kristgrot', 75] }, fx: [{ t: 'prod', res: 'kristal', x: 1.5 }] },
    { id: 'nachtkoor', cat: 'A', naam: 'Nachtkoor',           tekst: 'Flohara-energie ×1,5', k: { bladeren: 3e6, kristal: 1e4, energie: 1e4 }, eis: { u: ['koor'], b: ['ontmoet', 50] }, fx: [{ t: 'prod', res: 'energie', x: 1.5 }] },
    { id: 'nevelnet',  cat: 'A', naam: 'Nevelnetten',         tekst: 'Nevelparels ×1,5',   k: { lianen: 2e6, gereedschap: 1e5 }, eis: { b: ['nevel', 25] }, fx: [{ t: 'prod', res: 'nevelparel', x: 1.5 }] },
    { id: 'harsgoot',  cat: 'A', naam: 'Harsgoten',           tekst: 'Kroonhars ×1,5',     k: { hout: 1e7, gereedschap: 2e5 }, eis: { b: ['harst', 25] }, fx: [{ t: 'prod', res: 'kroonhars', x: 1.5 }] },
    { id: 'gloedader', cat: 'A', naam: 'Gloedaders',          tekst: 'Wortelgloed ×1,5',   k: { steen: 1e7, kristal: 1e5 }, eis: { b: ['wortelk', 25] }, fx: [{ t: 'prod', res: 'wortelgloed', x: 1.5 }] },
    { id: 'woudlied',  cat: 'A', naam: 'Lied van het hele woud', tekst: 'Alle productie ×1,25', k: { hout: 5e7, steen: 1e7, energie: 1e5 }, eis: { u: ['kroonzaag', 'bladweef', 'lianbrug', 'oogstfeest', 'diepsteen', 'meesters', 'kristlied', 'nachtkoor', 'nevelnet', 'harsgoot', 'gloedader'] }, fx: [{ t: 'alles', x: 1.25 }] },
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
    // Moloro: bewoners zonder baan laten meewerken
    { id: 'handen',   cat: 'E', naam: 'Helpende handen',        tekst: 'Bewoners zonder baan helpen mee: per 10% meer bewoners dan banen +5% productie, hoogstens +20%. Helpers eten ook.', k: { hout: 6000, bladeren: 4000, steen: 400 }, eis: { b: ['familie', 3] }, fx: [{ t: 'helpers', per: .5, max: .2 }] },
    { id: 'warmnest', cat: 'E', naam: 'Warme nesten',           tekst: 'Slaapnest: 4 bewoners in plaats van 3', k: { hout: 25000, bladeren: 25000 }, eis: { u: ['maaltijd'], b: ['nest', 50] }, fx: [{ t: 'bed', b: 'nest', plus: 1 }] },
    { id: 'grootfam', cat: 'E', naam: 'Grote families',         tekst: 'Familiekamer: 20 bewoners in plaats van 15', k: { hout: 300000, bladeren: 200000, steen: 30000 }, eis: { u: ['familieb'], b: ['familie', 25] }, fx: [{ t: 'bed', b: 'familie', plus: 5 }] },
    { id: 'uitgesl',  cat: 'A', naam: 'Uitgeslapen werkers',    tekst: 'Alle productie ×1,1', k: { hout: 400000, bladeren: 300000, steen: 40000, gereedschap: 3000 }, eis: { b: ['nest', 75], b2: ['familie', 15] }, fx: [{ t: 'alles', x: 1.1 }] },
    { id: 'holen',    cat: 'B', naam: 'Gevulde holen',          tekst: 'Bij honger zakt de productie naar 75% in plaats van 50%', k: { hout: 8000, bladeren: 5000 }, eis: { b: ['voorraad', 25] }, fx: [{ t: 'hongerF', x: .75 }] },
    { id: 'slaaplied',cat: 'E', naam: 'Sora\'s slaaplied',      tekst: 'Zolang Sora in Moloro staat: plafond van Helpende handen ×1,3', k: { hout: 80000, bladeren: 60000, lianen: 10000 }, eis: { u: ['handen'], heeft: 'sora' }, fx: [{ t: 'helpMax', x: 1.3, als: ['sora', 'Moloro'] }] },
    { id: 'kruidtuin',cat: 'A', naam: 'Liri\'s kruidentuin',    tekst: 'Zolang Liri in Moloro staat: voedsel ×1,5 en onderhoud −15%', k: { hout: 30000, bladeren: 25000 }, eis: { b: ['bessen', 30], heeft: 'liri' }, fx: [{ t: 'prod', res: 'voedsel', x: 1.5, als: ['liri', 'Moloro'] }, { t: 'onderhoud', x: .85, als: ['liri', 'Moloro'] }] },
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
    // Dorp
    { id: 'b2500', naam: '2.500 gebouwen',           test: s => s.tot >= 2500 },
    { id: 'b5000', naam: '5.000 gebouwen',           test: s => s.tot >= 5000 },
    { id: 'df5',   naam: 'Zeven meesterwerken: in elk district een gebouw op fase 5', test: s => s.f5d >= 7 },
    { id: 'bew1k', naam: '1.000 bewoners',           test: s => s.bedden >= 1000 },
    { id: 'h10m',  naam: 'Tien miljoen hout',        test: s => s.hout >= 1e7 },
    { id: 'h1g',   naam: 'Een miljard hout',         test: s => s.hout >= 1e9 },
    // Lomari
    { id: 'band20', naam: 'Een Lomari op Band 20',   test: s => s.band >= 20 },
    { id: 'band50', naam: 'Een Lomari op Band 50',   test: s => s.band >= 50 },
    { id: 'toc25', naam: '25 tochten volbracht',     test: s => s.t.tochtTot >= 25 },
    { id: 'ver10', naam: 'Tien verre tochten',       test: s => s.t.verTot >= 10 },
    { id: 'rel5',  naam: 'Een reliek op trede V',    test: s => s.reliek >= 5 },
    { id: 'vball', naam: 'Alle Verbanden tegelijk actief', test: s => s.verbandAlle },
    // Woud
    { id: 'geb25', naam: '25 bosgebeurtenissen doorstaan',  test: s => s.t.gebTot >= 25 },
    { id: 'geb100',naam: '100 bosgebeurtenissen doorstaan', test: s => s.t.gebTot >= 100 },
    { id: 'bol50', naam: '50 lichtbollen gevangen',  test: s => s.t.bolTot >= 50 },
    { id: 'bol250',naam: '250 lichtbollen gevangen', test: s => s.t.bolTot >= 250 },
    { id: 'nacht10', naam: 'Tien nachten doorgemaakt', test: s => s.t.nachtTot >= 10 },
    { id: 'gave25', naam: '25 gaven ingezet',        test: s => s.t.gave >= 25 },
    // Sterrenstam
    { id: 'n5',    naam: 'Vijf keer Hergroei',       test: s => s.runs >= 5 },
    { id: 'n10',   naam: 'Tien keer Hergroei',       test: s => s.runs >= 10 },
    { id: 'n500',  naam: '500 Nova',                 test: s => s.nova >= 500 },
    { id: 'n1000', naam: '1.000 Nova',               test: s => s.nova >= 1000 },
    { id: 'stam',  naam: 'De volle Sterrenstam',     test: s => s.stamVol },
    { id: 'jaar1', naam: 'Eerste Jaarring',          test: s => s.jaar >= 1 },
    { id: 'bep5',  naam: 'Alle vijf Beproevingen doorstaan', test: s => s.beproef >= 5 },
    { id: 'bron10',naam: 'Bronwerk trede 10',        test: s => s.bron >= 10 },
    { id: 'bron20',naam: 'Bronwerk trede 20',        test: s => s.bron >= 20 },
    // Verborgen: zichtbaar zodra je ze haalt
    { id: 'snel',  naam: 'Snelle groei: Hergroei binnen 24 uur', verborgen: true, test: s => s.t.snel >= 1 },
    { id: 'nachtuil', naam: 'Nachtuil: 100 tikken in één nacht', verborgen: true, test: s => s.t.nachtTikMax >= 100 },
    { id: 'nachtbol', naam: 'Licht in het donker: een lichtbol gevangen in de nacht', verborgen: true, test: s => s.t.nachtBol >= 1 },
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
    { id: 't1', tak: 'Verre paden', naam: 'Verre paden', tekst: 'Lomari kunnen op tocht buiten het dorp: terug met buit en soms een reliek dat blijft', k: 40, eis: 'n1', fx: [{ t: 'tocht', plus: 1 }] },
    { id: 't2', tak: 'Verre paden', naam: 'Twee paden',  tekst: 'Twee Lomari tegelijk op tocht', k: 120, eis: 't1', fx: [{ t: 'tocht', plus: 1 }] },
    // Extra takken: niet nodig voor de Jaarring (extra: true)
    { id: 'dn1', tak: 'Dag en nacht', extra: true, naam: 'Nachtwerk',      tekst: "Tikken levert 's nachts ×2 op in plaats van ×1,5", k: 15, fx: [{ t: 'nachtTik', x: 2 / 1.5 }] },
    { id: 'dn2', tak: 'Dag en nacht', extra: true, naam: 'Lichtzoekers',   tekst: 'Lichtbollen verschijnen twee keer zo vaak', k: 30, eis: 'dn1', fx: [{ t: 'lichtVaak', x: 2 }] },
    { id: 'dn3', tak: 'Dag en nacht', extra: true, naam: 'Wakers',         tekst: 'Bosgebeurtenissen duren 30% korter', k: 50, eis: 'dn1', fx: [{ t: 'herstel', x: .7 }] },
    { id: 'dn4', tak: 'Dag en nacht', extra: true, naam: 'Lange bloei',    tekst: 'Gaven van het woud duren 10% langer', k: 80, eis: 'dn2', fx: [{ t: 'gaveDuur', x: 1.1 }] },
    { id: 'gm1', tak: 'Gemeenschap', extra: true, naam: 'Ruime nesten',    tekst: 'Woningen bieden 25% meer bewoners', k: 20, fx: [{ t: 'bedX', x: 1.25 }] },
    { id: 'gm2', tak: 'Gemeenschap', extra: true, naam: 'Dorpsraad',       tekst: 'Elke dag een vierde dagdoel', k: 40, eis: 'gm1', fx: [{ t: 'doelPlus', plus: 1 }] },
    { id: 'gm3', tak: 'Gemeenschap', extra: true, naam: 'Gidsen',          tekst: 'Nog een Lomari tegelijk op tocht', k: 60, eis: 't1', fx: [{ t: 'tocht', plus: 1 }] },
    { id: 'gm4', tak: 'Gemeenschap', extra: true, naam: 'Samen bouwen',    tekst: 'Upgrades naar een hogere fase 20% goedkoper', k: 100, eis: 'gm2', fx: [{ t: 'faseKost', x: .8 }] },
  ];

  return { KENNIS, KENNIS_GROEI, WEEKDOEL, WEEK_NOVA, REEKS_DAGEN, DOEL, DOEL_AANTAL, JAAR, jaarFormule, BEPROEF, BEPROEF_VANAF, BRONWERK, bronwerkKost, TOCHT, RELIEK, RELIEK_MAX, GAVE, GAVE_MAX, GAVE_START, GAVE_GEBKANS, GAVE_KOOPGROEI, RUNE, runeGroei, runeFase, GEB, RES, BAL, novaFormule, novaWaarde, magieKost, AMB, AMBACHT, ambKost, DISTRICTS, GEBIEDEN, START_OPEN, B, FASE_NAAM, CAT, U, ROMEIN, ACH, STAR };
})();
