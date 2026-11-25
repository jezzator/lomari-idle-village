/* Lomari: Idle Village — de 18 Lomari, Verbanden en verbindingen (v2 deel A).
   pas(L) = passieve effecten bij Band L. Buiten het eigen district werken ze voor 40% (Koro: overal 100%).
   b: true = werkt pas vanaf deel B (systeem bestaat nog niet). */
window.LOM = (() => {
  const L = [
    { id: 'melo',   naam: 'Melo',   pers: 'Nieuwsgierig en vriendelijk', gave: 'Kan verborgen doorgangen en geheime plekken aanvoelen.', spec: 'Ontdekking', d: 'Dorukha',
      eis: { start: true }, pasTekst: L => `Elke 10 minuten ${pct(.04 + .005 * L)} kans op een verborgen plek`, pas: L => [{ t: 'vondst', plus: .04 + .005 * L }] },
    { id: 'tiku',   naam: 'Tiku',   pers: 'Speels en energiek', gave: 'Kan korte tijd uitzonderlijk snel bewegen.', spec: 'Snelheid', d: 'Takelom',
      eis: { start: true }, pasTekst: L => `Verzamelen +100% · bouwtijd −${Math.min(30, L)}%`, pas: L => [{ t: 'verzamel', x: 2 }, { t: 'bouwX', x: 1 - Math.min(.3, .01 * L) }] },
    { id: 'beki',   naam: 'Beki',   pers: 'Vrolijk en sociaal', gave: 'Kan planten helpen herstellen en groeien.', spec: 'Groei', d: 'Lomavii',
      eis: { start: true }, pasTekst: L => `Bladeren, lianen en voedsel +${n1(Math.min(45, 1.5 * L))}%`, pas: L => ['bladeren', 'lianen', 'voedsel'].map(res => ({ t: 'prod', res, x: 1 + Math.min(.45, .015 * L) })) },
    { id: 'koro',   naam: 'Koro',   pers: 'Aards en betrouwbaar', gave: 'Kan natuurlijke materialen tijdelijk versterken.', spec: 'Versterking', d: 'Takelom', overal: true,
      eis: { gebouwen: 15 }, pasTekst: L => `Opslag van de grondstoffen van zijn district +${Math.min(60, 2 * L)}% · hout en steen in prijzen −${n1(.5 * L)}%`,
      pas: (L, waar) => [{ t: 'capD', d: waar, x: 1 + Math.min(.6, .02 * L) }, { t: 'kostRes', res: ['hout', 'steen'], x: 1 - .005 * L }] },
    { id: 'varo',   naam: 'Varo',   pers: 'Kalm en vastberaden', gave: 'Kan trillingen in de grond waarnemen.', spec: 'Trilling', d: 'Dorukha',
      eis: { district: 'Dorukha' }, pasTekst: L => `Steen +${n1(1.5 * L)}% · kans op instortingen −${Math.min(50, 2 * L)}%`, pas: L => [{ t: 'prod', res: 'steen', x: 1 + .015 * L }, { t: 'gebKansT', id: 'instorting', x: 1 - Math.min(.5, .02 * L) }] },
    { id: 'piko',   naam: 'Piko',   pers: 'Levendig en ondeugend', gave: 'Kan lichtgevende illusies maken.', spec: 'Licht', d: 'Rikilari',
      eis: { district: 'Rikilari' }, pasTekst: L => `Elke ${180 - 2 * L} seconden een lichtbol in het dorp`, pas: L => [{ t: 'licht', sec: 180 - 2 * L }] },
    { id: 'brakka', naam: 'Brakka', pers: 'Stoer en enthousiast', gave: 'Kan tijdelijk zijn fysieke kracht vergroten.', spec: 'Kracht', d: 'Takelom',
      eis: { fase3: 'Takelom' }, pasTekst: L => `Hout en steen +${L}% · groeifase 3–5 −${n1(.5 * L)}%`,
      pas: L => [{ t: 'prod', res: 'hout', x: 1 + .01 * L }, { t: 'prod', res: 'steen', x: 1 + .01 * L }, { t: 'faseHoog', x: 1 - .005 * L }] },
    { id: 'sora',   naam: 'Sora',   pers: 'Dromerig en intuïtief', gave: 'Kan emoties van anderen aanvoelen.', spec: 'Gevoel', d: 'Moloro',
      eis: { bewoners: 30 }, pasTekst: L => `Toont tevredenheid per district · Moloro +${n1(5 + .5 * L)} tevredenheid`, pas: L => [{ t: 'tev', d: 'Moloro', plus: 5 + .5 * L }] },
    { id: 'liri',   naam: 'Liri',   pers: 'Zachtaardig en zorgzaam', gave: 'Kan verzwakte planten en dieren helpen herstellen.', spec: 'Herstel', d: 'Moloro',
      eis: { gebeurtenissen: 1 }, pasTekst: L => `Onderhoud −${Math.min(30, L)}% · gebeurtenissen duren −${n1(Math.min(45, 1.5 * L))}% korter`, pas: L => [{ t: 'onderhoud', x: 1 - Math.min(.3, .01 * L) }, { t: 'herstel', x: 1 - Math.min(.45, .015 * L) }] },
    { id: 'niko',   naam: 'Niko',   pers: 'Moedig en loyaal', gave: 'Kan een beschermend energieveld vormen.', spec: 'Bescherming', d: 'Rikilari',
      eis: { gebeurtenissen: 3 }, pasTekst: L => `Kans op bosgebeurtenissen −${Math.min(30, L)}%`, pas: L => [{ t: 'gebKans', x: 1 - Math.min(.3, .01 * L) }] },
    { id: 'nira',   naam: 'Nira',   pers: 'Behendig en nieuwsgierig', gave: 'Kan onder water zien en stromingen voelen.', spec: 'Stroming', d: 'Lomavii',
      eis: { gebouw: ['werkbank', 1] }, pasTekst: L => `Productieketens verbruiken −${Math.min(30, L)}% input`, pas: L => [{ t: 'ketenIn', x: 1 - Math.min(.3, .01 * L) }] },
    { id: 'ori',    naam: 'Ori',    pers: 'Rustig en bedachtzaam', gave: 'Kan oude herinneringen in voorwerpen waarnemen.', spec: 'Herinnering', d: 'Frikto',
      eis: { upgrades: 20 }, pasTekst: L => `Upgrades −${n1(Math.min(15, .5 * L))}%`, pas: L => [{ t: 'upKost', x: 1 - Math.min(.15, .005 * L) }] },
    { id: 'droki',  naam: 'Droki',  pers: 'Eigenwijs en vindingrijk', gave: 'Kan kleine voorwerpen tijdelijk laten zweven.', spec: 'Vinding', d: 'Frikto',
      eis: { fase3: 'Frikto' }, pasTekst: L => `Gereedschap +${n1(1.5 * L)}%`, pas: L => [{ t: 'prod', res: 'gereedschap', x: 1 + .015 * L }] },
    { id: 'seli',   naam: 'Seli',   pers: 'Lief en verbindend', gave: 'Kan spanningen tussen anderen verminderen.', spec: 'Verbinding', d: 'Voelari',
      eis: { bewoners: 150 }, pasTekst: L => `Drukte-grens +${Math.floor(L / 3)} · Verband-bonussen +${L}%`, pas: L => [{ t: 'drukte', plus: Math.floor(L / 3) }, { t: 'verband', plus: .01 * L }] },
    { id: 'elomi',  naam: 'Elomi',  pers: 'Wijs en harmonieus', gave: 'Kan magische patronen en oude symbolen begrijpen.', spec: 'Patronen', d: 'Voelari',
      eis: { ooit: ['kristal', 1000] }, pasTekst: L => `Kristallen +${n1(1.5 * L)}% (runen volgen in deel B)`, pas: L => [{ t: 'prod', res: 'kristal', x: 1 + .015 * L }] },
    { id: 'yomi',   naam: 'Yomi',   pers: 'Mysterieus en oplettend', gave: 'Kan bewegingen in het donker waarnemen.', spec: 'Donker', d: 'Dorukha',
      eis: { vondsten: 5 }, pasTekst: L => `Offline-opbrengst +${n1(.5 * L)}% · 's nachts productie +${n1(Math.min(15, .5 * L))}%`, pas: L => [{ t: 'offlineEff', plus: .005 * L }, { t: 'nacht', plus: Math.min(.15, .005 * L) }] },
    { id: 'kavo',   naam: 'Kavo',   pers: 'Vrij en avontuurlijk', gave: 'Kan korte afstanden door natuurlijke openingen afleggen.', spec: 'Doorgang', d: 'Rikilari',
      eis: { districten: 7 }, pasTekst: L => `Elke verbinding +${n1(.5 * L)}% extra in beide districten`, pas: L => [{ t: 'verbind', plus: .005 * L }] },
    { id: 'veyra',  naam: 'Veyra',  pers: 'Intuïtief en ervaren', gave: 'Kan oude magische energie herkennen.', spec: 'Oude energie', d: 'Voelari',
      eis: { energie: 100000 }, pasTekst: L => `Flohara-energie +${2 * L}% · toont de beste Hergroei`, pas: L => [{ t: 'prod', res: 'energie', x: 1 + .02 * L }, { t: 'veyra' }] },
  ];
  function pct(x) { return n1(x * 100) + '%'; }
  function n1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }

  // Verbanden: fx alleen voor wat in deel A werkt; b: true = effect volgt in deel B
  const V = [
    { id: 'diepe',   naam: 'Diepe stilte',     leden: ['melo', 'varo', 'yomi'], tekst: 'Dubbele vondstkans', fx: [{ t: 'vondstX', x: 2 }] },
    { id: 'openw',   naam: 'Open wegen',       leden: ['melo', 'kavo'], tekst: 'Ontdekte gebieden direct verbonden', b: true },
    { id: 'snel',    naam: 'Snel en sterk',    leden: ['tiku', 'brakka'], tekst: 'Bouwtijd in Takelom −15%', fx: [{ t: 'bouwD', d: 'Takelom', x: .85 }] },
    { id: 'lichtl',  naam: 'Lichtloop',        leden: ['tiku', 'piko'], tekst: 'Lichtbollen blijven twee keer zo lang en geven +25%', fx: [{ t: 'lichtX', duur: 2, x: 1.25 }] },
    { id: 'doorst',  naam: 'Doorstroom',       leden: ['tiku', 'kavo'], tekst: 'Reistijd tussen districten −50%', fx: [{ t: 'reis', x: .5 }] },
    { id: 'groen',   naam: 'Groen herstel',    leden: ['beki', 'liri'], tekst: 'Plantgebouwen zonder onderhoud: plagen leggen ze niet meer stil', fx: [{ t: 'geenGeb', id: 'plaag' }] },
    { id: 'bron',    naam: 'Bron en blad',     leden: ['beki', 'nira'], tekst: 'Ketens met plantinput +25%', b: true },
    { id: 'samen',   naam: 'Samenzang',        leden: ['beki', 'seli'], tekst: 'Voedsel +10%, Voelari +10 tevredenheid', fx: [{ t: 'prod', res: 'voedsel', x: 1.1 }, { t: 'tev', d: 'Voelari', plus: 10 }] },
    { id: 'hart',    naam: 'Hart en hand',     leden: ['sora', 'seli'], tekst: 'Drukte-grens +2 in alle districten', fx: [{ t: 'drukte', plus: 2 }] },
    { id: 'zorg',    naam: 'Zorgkring',        leden: ['sora', 'liri'], tekst: 'Tevredenheid herstelt drie keer zo snel na een gebeurtenis', fx: [{ t: 'tevHerstel', x: 3 }] },
    { id: 'avond',   naam: 'Avondlicht',       leden: ['sora', 'piko'], tekst: "'s Nachts +5 tevredenheid", fx: [{ t: 'nachtTev', plus: 5 }] },
    { id: 'wacht',   naam: 'Wachtlijn',        leden: ['niko', 'varo'], tekst: 'Geen instortingen meer', fx: [{ t: 'geenGeb', id: 'instorting' }] },
    { id: 'schild',  naam: 'Schild en zorg',   leden: ['niko', 'liri'], tekst: 'Schade door gebeurtenissen maximaal de helft', fx: [{ t: 'schild' }] },
    { id: 'voorh',   naam: 'Voorhoede',        leden: ['niko', 'brakka'], tekst: 'Elke storm levert 1 uur houtproductie op', fx: [{ t: 'voorhoede' }] },
    { id: 'stevig',  naam: 'Stevige grond',    leden: ['koro', 'brakka'], tekst: 'Gebouwen in groeifase 4 en 5 +25% opslag', b: true },
    { id: 'steen',   naam: 'Steenvast',        leden: ['koro', 'varo'], tekst: 'Steenopslag ×2', fx: [{ t: 'capRes', res: 'steen', x: 2 }] },
    { id: 'kist',    naam: 'Gereedschapskist', leden: ['koro', 'droki'], tekst: 'Gereedschapsopslag ×2', fx: [{ t: 'capRes', res: 'gereedschap', x: 2 }] },
    { id: 'water',   naam: 'Waterrad',         leden: ['nira', 'droki'], tekst: 'Ketens in Frikto +20%', fx: [{ t: 'prod', d: 'Frikto', x: 1.2 }] },
    { id: 'rivier',  naam: 'Rivierweg',        leden: ['nira', 'kavo'], tekst: 'Lomavii is verbonden met alle districten', fx: [{ t: 'rivier' }] },
    { id: 'kennis',  naam: 'Oude kennis',      leden: ['ori', 'elomi'], tekst: 'Runen kosten 20% minder kristallen', b: true },
    { id: 'herin',   naam: 'Herinnerde bron',  leden: ['ori', 'veyra'], tekst: 'Hergroei levert 10% meer op', fx: [{ t: 'nova', x: 1.1 }] },
    { id: 'terug',   naam: 'Teruggewonnen',    leden: ['ori', 'droki'], tekst: 'Automatisch bouwen kiest de beste prijs per effect', b: true },
    { id: 'lieder',  naam: 'Oude liederen',    leden: ['seli', 'elomi'], tekst: 'Voelari levert +10% Flohara-energie', fx: [{ t: 'prod', d: 'Voelari', x: 1.1 }] },
    { id: 'nacht',   naam: 'Nachtlicht',       leden: ['piko', 'yomi'], tekst: "'s Nachts kan een lichtbol Nachtbloesem opleveren", b: true },
    { id: 'oorspr',  naam: 'Oorsprong',        leden: ['elomi', 'veyra'], tekst: 'Magische upgrades kosten 15% minder energie', fx: [{ t: 'magieE', x: .85 }] },
    { id: 'stil',    naam: 'Stille bron',      leden: ['yomi', 'veyra'], tekst: 'Offline Flohara-energie +25%', fx: [{ t: 'offlineEnergie', x: 1.25 }] },
  ];

  // Verbindingen tussen districten: de eerste twee zijn er altijd, elke Touwbrug legt de volgende aan.
  const VERB = [['Takelom', 'Lomavii'], ['Lomavii', 'Moloro'], ['Takelom', 'Rikilari'], ['Rikilari', 'Dorukha'], ['Lomavii', 'Voelari'],
    ['Moloro', 'Voelari'], ['Voelari', 'Dorukha'], ['Dorukha', 'Frikto'], ['Moloro', 'Frikto'], ['Takelom', 'Voelari'], ['Voelari', 'Frikto'], ['Rikilari', 'Voelari']];
  const VERB_GRATIS = 2;

  // Opslag die bij een district hoort (voor Koro)
  const OPSLAG_D = { Takelom: ['hout'], Dorukha: ['steen', 'kristal'], Lomavii: ['lianen', 'bladeren'], Moloro: ['voedsel'], Frikto: ['gereedschap'], Voelari: ['energie'], Rikilari: [], Valunari: ['nevelparel'], Kroveli: ['kroonhars'], Lomaruun: ['wortelgloed'] };

  const CFG = {
    buiten: .4, reisSec: 600, xpPerUur: 60, xpPerGebouw: .1, xpBasis: 100, xpGroei: 1.22, bandMax: 30,
    drukteGrens: 2, druktePerLomari: 5, tevMin: 80, tevMax: 120, zangTev: .25, zangTevMax: 10,
    verbindPct: .01, vondstSec: 600, vondstMax: 3, vondstBuitSec: 7200, vondstBonus: .01,
    lichtDuur: 20, lichtBuitSec: 30,
  };
  return { L, V, VERB, VERB_GRATIS, OPSLAG_D, CFG };
})();
