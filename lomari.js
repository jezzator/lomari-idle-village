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
      eis: { ooit: ['kristal', 1000] }, pasTekst: L => `Kristallen +${n1(1.5 * L)}% · runen −${Math.min(30, L)}% kristallen`, pas: L => [{ t: 'prod', res: 'kristal', x: 1 + .015 * L }, { t: 'runeKost', x: 1 - Math.min(.3, .01 * L) }] },
    { id: 'yomi',   naam: 'Yomi',   pers: 'Mysterieus en oplettend', gave: 'Kan bewegingen in het donker waarnemen.', spec: 'Donker', d: 'Dorukha',
      eis: { vondsten: 5 }, pasTekst: L => `Offline-opbrengst +${n1(.5 * L)}% · 's nachts productie +${n1(Math.min(15, .5 * L))}%`, pas: L => [{ t: 'offlineEff', plus: .005 * L }, { t: 'nacht', plus: Math.min(.15, .005 * L) }] },
    { id: 'kavo',   naam: 'Kavo',   pers: 'Vrij en avontuurlijk', gave: 'Kan korte afstanden door natuurlijke openingen afleggen.', spec: 'Doorgang', d: 'Rikilari',
      eis: { districten: 7 }, pasTekst: L => `Elke verbinding +${n1(.5 * L)}% extra in beide districten`, pas: L => [{ t: 'verbind', plus: .005 * L }] },
    { id: 'veyra',  naam: 'Veyra',  pers: 'Intuïtief en ervaren', gave: 'Kan oude magische energie herkennen.', spec: 'Oude energie', d: 'Voelari',
      eis: { energie: 100000 }, pasTekst: L => `Flohara-energie +${2 * L}% · toont de beste Hergroei`, pas: L => [{ t: 'prod', res: 'energie', x: 1 + .02 * L }, { t: 'veyra' }] },
  ];

  // Upgradebomen (deel B): elke Band geeft 1 punt voor die Lomari. Knoop 4 is de sleutelknoop en kost ook Nevelparels.
  // Knopen gelden altijd (ook als de Lomari vrij is) en blijven na Hergroei, net als de Band.
  const BOOM_KOST = [1, 2, 3, 5, 8], SLEUTEL = 3, SLEUTEL_PAREL = 5;
  const BOOM = {
    melo:   [['Scherpe neus', 'Vondstkans +1%', [{ t: 'vondst', plus: .01 }]], ['Oude kaarten', 'Vondsten +20% vaker', [{ t: 'vondstX', x: 1.2 }]], ['Korte paden', 'Reistijd −20%', [{ t: 'reis', x: .8 }]],
             ['Verborgen gangen', 'Vondsten +50% vaker', [{ t: 'vondstX', x: 1.5 }]], ['Gids van Dorukha', 'Dorukha +15% productie', [{ t: 'prod', d: 'Dorukha', x: 1.15 }]]],
    tiku:   [['Vlugge handen', 'Verzamelen +25%', [{ t: 'verzamel', x: 1.25 }]], ['Snelle aanvoer', 'Bouwtijd −10%', [{ t: 'bouwX', x: .9 }]], ['Renner', 'Reistijd −25%', [{ t: 'reis', x: .75 }]],
             ['Bliksemsnel', 'Elke tik +50%', [{ t: 'tikX', x: 1.5 }]], ['Bouwritme', 'Bouwtijd nog eens −15%', [{ t: 'bouwX', x: .85 }]]],
    beki:   [['Bladzorg', 'Bladeren +15%', [{ t: 'prod', res: 'bladeren', x: 1.15 }]], ['Bessenhand', 'Voedsel +15%', [{ t: 'prod', res: 'voedsel', x: 1.15 }]], ['Rankenlied', 'Lianen +15%', [{ t: 'prod', res: 'lianen', x: 1.15 }]],
             ['Bloeiend Lomavii', 'Lomavii +30% productie', [{ t: 'prod', d: 'Lomavii', x: 1.3 }]], ['Volle tafel', 'Onderhoud −10%', [{ t: 'onderhoud', x: .9 }]]],
    koro:   [['Stevige rekken', 'Houtopslag +25%', [{ t: 'capRes', res: 'hout', x: 1.25 }]], ['Harde kelders', 'Steenopslag +25%', [{ t: 'capRes', res: 'steen', x: 1.25 }]], ['Versterkte wanden', 'Alle opslag +10%', [{ t: 'opslag', x: 1.1 }]],
             ['Gehard materiaal', 'Hout en steen in prijzen −10%', [{ t: 'kostRes', res: ['hout', 'steen'], x: .9 }]], ['Draagkracht', 'Alle opslag nog eens +15%', [{ t: 'opslag', x: 1.15 }]]],
    varo:   [['Stille hamer', 'Steen +15%', [{ t: 'prod', res: 'steen', x: 1.15 }]], ['Vroege waarschuwing', 'Kans op instortingen −30%', [{ t: 'gebKansT', id: 'instorting', x: .7 }]], ['Kristalader', 'Kristallen +10%', [{ t: 'prod', res: 'kristal', x: 1.1 }]],
             ['Diepe gangen', 'Dorukha +30% productie', [{ t: 'prod', d: 'Dorukha', x: 1.3 }]], ['Geslepen nissen', 'Kristalopslag +25%', [{ t: 'capRes', res: 'kristal', x: 1.25 }]]],
    piko:   [['Lang licht', 'Lichtbollen blijven 25% langer', [{ t: 'lichtX', duur: 1.25, x: 1 }]], ['Helder licht', 'Lichtbollen +25% buit', [{ t: 'lichtX', duur: 1, x: 1.25 }]], ['Lantaarns', "'s Nachts +3 tevredenheid", [{ t: 'nachtTev', plus: 3 }]],
             ['Dwaallicht', 'Lichtbollen 50% langer en +50% buit', [{ t: 'lichtX', duur: 1.5, x: 1.5 }]], ['Nachtgloed', "'s Nachts productie +5%", [{ t: 'nacht', plus: .05 }]]],
    brakka: [['Sterke armen', 'Hout +10%', [{ t: 'prod', res: 'hout', x: 1.1 }]], ['Zware tillers', 'Fase 3 tot 5 −5% kosten', [{ t: 'faseHoog', x: .95 }]], ['Steenbreker', 'Steen +10%', [{ t: 'prod', res: 'steen', x: 1.1 }]],
             ['Bouwploeg', 'Bouwtijd in Takelom −20%', [{ t: 'bouwD', d: 'Takelom', x: .8 }]], ['Krachtpatser', 'Elke tik +20%', [{ t: 'tikX', x: 1.2 }]]],
    sora:   [['Luisterend oor', 'Moloro +3 tevredenheid', [{ t: 'tev', d: 'Moloro', plus: 3 }]], ['Ruimte voor iedereen', 'Drukte-grens +1', [{ t: 'drukte', plus: 1 }]], ['Troost', 'Tevredenheid herstelt 50% sneller', [{ t: 'tevHerstel', x: 1.5 }]],
             ['Gedeeld gevoel', 'Verband-bonussen +10%', [{ t: 'verband', plus: .1 }]], ['Avondrust', "'s Nachts +5 tevredenheid", [{ t: 'nachtTev', plus: 5 }]]],
    liri:   [['Zachte zorg', 'Gebeurtenissen 10% korter', [{ t: 'herstel', x: .9 }]], ['Gezonde maaltijd', 'Onderhoud −5%', [{ t: 'onderhoud', x: .95 }]], ['Plantenkennis', 'Kans op plagen −30%', [{ t: 'gebKansT', id: 'plaag', x: .7 }]],
             ['Helende handen', 'Gebeurtenissen 25% korter', [{ t: 'herstel', x: .75 }]], ['Gevoed dorp', 'Onderhoud nog eens −10%', [{ t: 'onderhoud', x: .9 }]]],
    niko:   [['Wachtronde', 'Kans op bosgebeurtenissen −10%', [{ t: 'gebKans', x: .9 }]], ['Stormscherm', 'Kans op stormen −30%', [{ t: 'gebKansT', id: 'storm', x: .7 }]], ['Snelle hulp', 'Gebeurtenissen 10% korter', [{ t: 'herstel', x: .9 }]],
             ['Energieveld', 'Kans op bosgebeurtenissen −20%', [{ t: 'gebKans', x: .8 }]], ['Veilige wegen', 'Elke verbinding +0,5%', [{ t: 'verbind', plus: .005 }]]],
    nira:   [['Zuinige stroom', 'Ketens verbruiken −5% input', [{ t: 'ketenIn', x: .95 }]], ['Waterkracht', 'Gereedschap +10%', [{ t: 'prod', res: 'gereedschap', x: 1.1 }]], ['Met de stroom mee', 'Reistijd −15%', [{ t: 'reis', x: .85 }]],
             ['Hart van Valunari', 'Valunari +30% productie', [{ t: 'prod', d: 'Valunari', x: 1.3 }]], ['Heldere bron', 'Ketens verbruiken nog eens −10%', [{ t: 'ketenIn', x: .9 }]]],
    ori:    [['Oude lessen', 'Upgrades −5%', [{ t: 'upKost', x: .95 }]], ['Echo van magie', 'Magische upgrades −5% energie', [{ t: 'magieE', x: .95 }]], ['Herinnering', 'Hergroei +3% Nova', [{ t: 'nova', x: 1.03 }]],
             ['Wat de boom onthoudt', 'Hergroei +7% Nova', [{ t: 'nova', x: 1.07 }]], ['Gebundelde kennis', 'Upgrades nog eens −10%', [{ t: 'upKost', x: .9 }]]],
    droki:  [['Handige vondst', 'Gereedschap +15%', [{ t: 'prod', res: 'gereedschap', x: 1.15 }]], ['Zwevende rekken', 'Gereedschapsopslag +25%', [{ t: 'capRes', res: 'gereedschap', x: 1.25 }]], ['Slimme mallen', 'Ketens verbruiken −5% input', [{ t: 'ketenIn', x: .95 }]],
             ['Uitvinderswerkplaats', 'Frikto +30% productie', [{ t: 'prod', d: 'Frikto', x: 1.3 }]], ['Zwevend gereedschap', 'Bouwtijd in Frikto −20%', [{ t: 'bouwD', d: 'Frikto', x: .8 }]]],
    seli:   [['Open armen', 'Drukte-grens +1', [{ t: 'drukte', plus: 1 }]], ['Bindend lied', 'Verband-bonussen +5%', [{ t: 'verband', plus: .05 }]], ['Kring van vrede', 'Voelari +5 tevredenheid', [{ t: 'tev', d: 'Voelari', plus: 5 }]],
             ['Hart van het dorp', 'Verband-bonussen +10%', [{ t: 'verband', plus: .1 }]], ['Bruggenbouwer', 'Elke verbinding +0,5%', [{ t: 'verbind', plus: .005 }]]],
    elomi:  [['Patroonlezer', 'Kristallen +10%', [{ t: 'prod', res: 'kristal', x: 1.1 }]], ['Runenschrift', 'Runen −10% kristallen', [{ t: 'runeKost', x: .9 }]], ['Harmonie', 'Magische upgrades −5% energie', [{ t: 'magieE', x: .95 }]],
             ['Oud symbool', 'Runen −20% kristallen', [{ t: 'runeKost', x: .8 }]], ['Kristalzang', 'Kristallen +20%', [{ t: 'prod', res: 'kristal', x: 1.2 }]]],
    yomi:   [['Nachtwacht', 'Offline-opbrengst +5%', [{ t: 'offlineEff', plus: .05 }]], ['Ogen in het donker', "'s Nachts productie +5%", [{ t: 'nacht', plus: .05 }]], ['Schaduwspoor', 'Vondstkans +1%', [{ t: 'vondst', plus: .01 }]],
             ['Lange nacht', 'Offline-limiet +2 uur', [{ t: 'offline', uren: 2 }]], ['Stille uren', 'Offline-opbrengst +10%', [{ t: 'offlineEff', plus: .1 }]]],
    kavo:   [['Doorsteek', 'Reistijd −25%', [{ t: 'reis', x: .75 }]], ['Open doorgang', 'Elke verbinding +0,3%', [{ t: 'verbind', plus: .003 }]], ['Vrije blik', 'Vondstkans +1%', [{ t: 'vondst', plus: .01 }]],
             ['Wijde wereld', 'Elke verbinding +0,5%', [{ t: 'verbind', plus: .005 }]], ['Overal thuis', 'Reistijd nog eens −40%', [{ t: 'reis', x: .6 }]]],
    veyra:  [['Bronvoeler', 'Flohara-energie +10%', [{ t: 'prod', res: 'energie', x: 1.1 }]], ['Stille stroom', 'Offline Flohara-energie +15%', [{ t: 'offlineEnergie', x: 1.15 }]], ['Oude stem', 'Magische upgrades −5% energie', [{ t: 'magieE', x: .95 }]],
             ['Wortelkennis', 'Hergroei +5% Nova', [{ t: 'nova', x: 1.05 }]], ['Volle bron', 'Flohara-energie +20%', [{ t: 'prod', res: 'energie', x: 1.2 }]]],
  };

  // Actieve vaardigheden (deel B): alleen als de Lomari is ingezet. fx = tijdelijk effect (duur s), direct = gebeurt meteen.
  // Ultiem (vanaf Band 20, kost Wortelgloed): effect twee keer zo sterk en vijf keer zo lang; ultFx vervangt het effect.
  const ACT = {
    melo:   { naam: 'Speurtocht',        tekst: 'Vindt meteen een verborgen plek', direct: 'vondst' },
    tiku:   { naam: 'Bliksemsprint',     tekst: '1 minuut lang elke tik ×3', fx: [{ t: 'tikX', x: 3 }] },
    beki:   { naam: 'Groeispurt',        tekst: '1 minuut lang Lomavii ×2', fx: [{ t: 'prod', d: 'Lomavii', x: 2 }] },
    koro:   { naam: 'Versterken',        tekst: '1 minuut lang hout en steen ×1,5', fx: [{ t: 'prod', res: 'hout', x: 1.5 }, { t: 'prod', res: 'steen', x: 1.5 }] },
    varo:   { naam: 'Diepe dreun',       tekst: '1 minuut lang steen ×2 en kristallen ×1,5', fx: [{ t: 'prod', res: 'steen', x: 2 }, { t: 'prod', res: 'kristal', x: 1.5 }] },
    piko:   { naam: 'Lichtregen',        tekst: 'Vangt meteen een lichtbol', direct: 'bol' },
    brakka: { naam: 'Krachtsprong',      tekst: 'Lopende upgrades zijn 25% sneller klaar', direct: 'bouw' },
    sora:   { naam: 'Kalmte',            tekst: '1 minuut lang +20 tevredenheid in alle districten', fx: [{ t: 'tevAlle', plus: 20 }] },
    liri:   { naam: 'Herstel',           tekst: 'Beëindigt meteen alle bosgebeurtenissen', direct: 'herstel', ultFx: [{ t: 'gebKans', x: 0 }] },
    niko:   { naam: 'Schildveld',        tekst: '5 minuten geen nieuwe bosgebeurtenissen', fx: [{ t: 'gebKans', x: 0 }], duur: 300 },
    nira:   { naam: 'Stroomversnelling', tekst: '1 minuut lang Frikto ×2', fx: [{ t: 'prod', d: 'Frikto', x: 2 }] },
    ori:    { naam: 'Oude herinnering',  tekst: '1 minuut lang upgrades −30%', fx: [{ t: 'upKost', x: .7 }] },
    droki:  { naam: 'Zweefwerk',         tekst: '1 minuut lang gereedschap ×2', fx: [{ t: 'prod', res: 'gereedschap', x: 2 }] },
    seli:   { naam: 'Samenzijn',         tekst: '1 minuut lang Verband-bonussen +50%', fx: [{ t: 'verband', plus: .5 }] },
    elomi:  { naam: 'Patroonlezing',     tekst: '1 minuut lang kristallen ×2', fx: [{ t: 'prod', res: 'kristal', x: 2 }] },
    yomi:   { naam: 'Nachtzicht',        tekst: "5 minuten lang geen productieverlies 's nachts", fx: [{ t: 'nacht', plus: .2 }], duur: 300 },
    kavo:   { naam: 'Doorsteek',         tekst: 'Alle Lomari die onderweg zijn, komen meteen aan', direct: 'reis', ultFx: [{ t: 'reis', x: .1 }] },
    veyra:  { naam: 'Bronroep',          tekst: '1 minuut lang Flohara-energie ×2', fx: [{ t: 'prod', res: 'energie', x: 2 }] },
  };
  const ULT_DIRECT = { vondst: 'Vindt meteen drie verborgen plekken', bol: 'Vangt meteen een lichtbol met drie keer zoveel buit', bouw: 'Lopende upgrades zijn 75% sneller klaar',
    herstel: 'Beëindigt alle bosgebeurtenissen en houdt ze 5 minuten weg', reis: 'Alle Lomari komen meteen aan, en 5 minuten lang reizen ze bijna zonder reistijd' };
  function pct(x) { return n1(x * 100) + '%'; }
  function n1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }

  // Verbanden: fx alleen voor wat in deel A werkt; b: true = effect volgt in deel B
  const V = [
    { id: 'diepe',   naam: 'Diepe stilte',     leden: ['melo', 'varo', 'yomi'], tekst: 'Dubbele vondstkans', fx: [{ t: 'vondstX', x: 2 }] },
    { id: 'openw',   naam: 'Open wegen',       leden: ['melo', 'kavo'], tekst: 'Ontdekte gebieden direct verbonden', fx: [{ t: 'openWegen' }] },
    { id: 'snel',    naam: 'Snel en sterk',    leden: ['tiku', 'brakka'], tekst: 'Bouwtijd in Takelom −15%', fx: [{ t: 'bouwD', d: 'Takelom', x: .85 }] },
    { id: 'lichtl',  naam: 'Lichtloop',        leden: ['tiku', 'piko'], tekst: 'Lichtbollen blijven twee keer zo lang en geven +25%', fx: [{ t: 'lichtX', duur: 2, x: 1.25 }] },
    { id: 'doorst',  naam: 'Doorstroom',       leden: ['tiku', 'kavo'], tekst: 'Reistijd tussen districten −50%', fx: [{ t: 'reis', x: .5 }] },
    { id: 'groen',   naam: 'Groen herstel',    leden: ['beki', 'liri'], tekst: 'Plantgebouwen zonder onderhoud: plagen leggen ze niet meer stil', fx: [{ t: 'geenGeb', id: 'plaag' }] },
    { id: 'bron',    naam: 'Bron en blad',     leden: ['beki', 'nira'], tekst: 'Ketens met plantinput +25%', fx: [{ t: 'ketenPlant', x: 1.25 }] },
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
    { id: 'kennis',  naam: 'Oude kennis',      leden: ['ori', 'elomi'], tekst: 'Runen kosten 20% minder kristallen', fx: [{ t: 'runeKost', x: .8 }] },
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
    buiten: .4, reisSec: 600, xpPerUur: 60, xpPerGebouw: .1, xpBasis: 100, xpGroei: 1.22, bandMax: 30, bandTop: 50, bandWortel: 2,
    actDuur: 60, actCd: 600, ultBand: 20, ultKost: 3, ultCd: 3600, ultDuur: 5, ultSterk: 2,
    drukteGrens: 2, druktePerLomari: 5, tevMin: 80, tevMax: 120, zangTev: .25, zangTevMax: 10,
    verbindPct: .01, vondstSec: 600, vondstMax: 3, vondstBuitSec: 7200, vondstBonus: .01,
    lichtDuur: 20, lichtBuitSec: 30,
  };
  return { ACT, ULT_DIRECT, BOOM, BOOM_KOST, SLEUTEL, SLEUTEL_PAREL, L, V, VERB, VERB_GRATIS, OPSLAG_D, CFG };
})();
