# Lomari: Idle Village

Idle-spel in de wereld van de Lomari: bouw het dorp in de zeven districten, zet de 18 Lomari in, en groei verder met Hergroei, Nova en de Sterrenstam.

Dit is een complete web-app (PWA) zonder build-stap. Zet hem online via https, dan kun je hem op je telefoon installeren.

## Bestanden
| Bestand | Inhoud |
| --- | --- |
| `data.js` | Alle balansgetallen: grondstoffen, gebouwen, districten, gebieden, upgrades, prestaties, Sterrenstam |
| `lomari.js` | De 18 Lomari, hun gaven, de Verbanden en de verbindingen tussen districten |
| `engine.js` | De rekenmotor (geen DOM): productie, kosten, opslag, offline, Hergroei |
| `balans.js` | Computerspeler voor de balanstest (Instellingen → Balanstest) |
| `ui.js`, `index.html` | De interface |
| `sw.js`, `manifest.webmanifest`, `icoon-*.png` | Installeerbaar en offline |
| `portret/`, `dorp.jpg` | Afbeeldingen |
| `tools/simulatie-v1.py` | De eerste balanssimulatie (Python), uit het ontwerp |

Nieuwe gebouwen, upgrades of Lomari voeg je toe als regel in `data.js` of `lomari.js`.

## Online zetten met Vercel (zoals je agenda-app)
1. Maak een nieuwe GitHub-repository, bijvoorbeeld `lomari-idle`, en zet alle bestanden uit deze map erin (de map `portret` ook).
2. Ga naar vercel.com → Add New → Project → kies de repository → Deploy. Geen build-instellingen nodig.
3. Je krijgt een adres zoals `lomari-idle.vercel.app`.

Of zonder GitHub: sleep deze map naar app.netlify.com/drop.

## Installeren op je telefoon
- **iPhone (Safari):** open het adres → deelknop → *Zet op beginscherm*.
- **Android (Chrome):** open het adres → menu (⋮) → *App installeren*.

Daarna opent het spel vanaf je beginscherm, schermvullend, zonder browserbalk, en werkt het ook zonder internet.

## Goed om te weten
- Je voortgang staat in de opslag van die app op je telefoon, los van de versie op claude.ai. Wil je je voortgang meenemen: Instellingen → *Kopieer code* in de ene versie, *Laad geplakte code* in de andere.
- Bij een nieuwe versie: vervang de bestanden in GitHub en verhoog in `sw.js` het nummer achter `CACHE` (bijv. `lomari-v2b`). De app werkt zich dan bij de volgende keer openen bij.

## Android-app
Bij elke push naar `main` bouwt GitHub automatisch een Android-app (zie het tabblad **Actions**).
De nieuwste staat onder **Releases → Latest** als `Lomari-<nummer>.apk`.

Installeren: open die pagina op je Android-telefoon, tik op het .apk-bestand en sta *installeren uit onbekende bronnen* toe voor je browser.
Een nieuwe versie installeer je op dezelfde manier: je voortgang blijft bewaard.

Zelf bouwen (met Android Studio): `npm install`, `npm run web`, `npx cap add android`, `npx cap open android`.
