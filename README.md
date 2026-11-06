# CAFFEINE

Mobiele cafeïnetracker in Lafbekken-stijl. Gewone HTML, CSS en JavaScript, geen bouwstap, geen backend. Interface in het Engels.

## Bestanden

```
index.html              app-schil en navigatie
manifest.webmanifest    installatie op beginscherm
sw.js                   service worker (offline)
css/app.css             alle stijlen
js/app.js               schermen, formulieren, interactie
js/model.js             berekeningen en datumlogica (puur, testbaar)
js/store.js             lokale opslag met versie en foutafhandeling
js/content.js           30+ Fun Facts en 30+ Mythbusters met bronnen
js/faces.js             gezichten (SVG) en knipper/rondkijk-animatie
fonts/                  Barlow Condensed 900 en Rubik (SIL OFL, lokaal gehost)
icons/                  PNG-iconen 192, 512, maskable en Apple touch icon
```

## Lokaal starten

Modules en de service worker werken niet via `file://`. Start een lokale webserver in de map:

```
python3 -m http.server 8000
```

Open daarna `http://localhost:8000/`.

## Publiceren op GitHub Pages

1. Maak een repository aan en zet de inhoud van deze map in de root (of in `/docs`).
2. Ga naar Settings, Pages. Kies bij Source "Deploy from a branch", kies `main` en `/ (root)` (of `/docs`). Opslaan.
3. Na een minuut staat de app op `https://<gebruikersnaam>.github.io/<repository>/`. Alle paden zijn relatief, dus het subpad werkt.
4. Zet je een nieuwe versie online, verhoog dan `VERSION` in `sw.js`. De app toont dan "A new version is ready" met een knop om te herladen.

## Op het beginscherm zetten

- iPhone (Safari): open de link, tik op Deel, kies "Zet op beginscherm".
- Android (Chrome): open de link, menu met drie puntjes, "App installeren" of "Toevoegen aan startscherm".

## Opslag en offline

- Alle persoonlijke gegevens staan in `localStorage` van deze browser op dit apparaat, onder één versieerbaar document (`schema: 1`). Geen account, geen synchronisatie.
- Browsergegevens wissen kan de gegevens verwijderen. Gebruik Export (JSON of CSV) in Settings. Een JSON-export kan via "Restore from JSON export" teruggezet worden.
- Mislukt opslaan (vol of geblokkeerd), dan verandert er niets en toont de app een melding. Er wordt nooit "opgeslagen" bevestigd als dat niet lukte.
- Na het eerste bezoek werkt de hele app offline, inclusief nieuwe dagelijkse kaarten (die komen uit de ingebouwde collectie). Alleen de bronlinks op de kaarten hebben internet nodig.

## Berekeningsmodel

`remaining = dose × 0.5 ^ (uren sinds inname / 5)`, per consumptie apart en opgeteld.

- 5 uur halfwaardetijd is een expliciete algemene aanname, geen persoonlijke meting. Werkelijke afbraak verschilt sterk.
- Opname is vereenvoudigd: de afbouw start op het gelogde tijdstip. Vóór dat tijdstip telt de consumptie niet mee.
- Alles werkt met tijdstempels. Herberekening bij openen, terugkeren naar de app en elke 30 seconden zolang de app zichtbaar is. Middernacht, zomertijd en bedtijden na middernacht zijn getest.
- Weergave in hele mg. Onder 1 mg: "Less than 1 mg". Toekomst heet "Projection".
- Bedtijden van 00:00 tot 11:59 horen bij de nacht die de avond ervoor begint (bijvoorbeeld 00:30 is "Night of Fri 6 Nov to Sat 7 Nov").
- Instellingen (bedtijd, daglimiet, stoptijd) worden met een ingangsdatum bewaard. Een wijziging geldt vanaf vandaag, oude recaps behouden de waarden van toen.

## Tankschaal

De tank toont 0 tot 300 mg. Gekozen zodat een gewone koffie (ongeveer 100 mg) zichtbaar een derde vult en de schaal bij normaal gebruik stabiel blijft. Het is uitdrukkelijk geen limiet of doel en staat los van de daglimiet. Boven 300 mg blijft het echte getal staan, loopt de tank zichtbaar een beetje over en staat er "Over the tank's display scale". De vloeistofkleur is altijd hetzelfde oranje, zodat kleur geen veiligheidsoordeel suggereert.

## Herinneringen (platformbeperking)

- "In the app": melding op Home in het half uur vóór je stoptijd, als je de app opent.
- "Plus notification": vraagt pas dan toestemming. Een systeemmelding verschijnt alleen als de app open is of nog op de achtergrond draait. Een gesloten webapp krijgt geen geplande meldingen. Dat staat ook zo in Settings.

## Kenniskaarten

33 Fun Facts en 31 Mythbusters, elk met ID, categorie, titel, inhoud, onderwerp, bron(nen) en controledatum (6 november 2026). De claims zijn tegen de genoemde bronnen gecontroleerd. Kanttekeningen:

- Bij Juliano & Griffiths (2004) en Meredith e.a. (2013) is de inhoud gecontroleerd via ScienceDaily-samenvattingen, en bij Heaney (2002) via de samenvatting van American Bone Health. De oorspronkelijke artikelen waren niet direct leesbaar.
- Het EFSA-advies (2015) is gecontroleerd via de EUFIC-samenvatting; de link wijst naar het originele advies.
- Clark & Landolt: tijdschrift en paginanummers zijn gecontroleerd, het jaartal (2017 versus 2018 online) verschilt per databank.

Elke dag wordt per categorie één kaart gekozen die nog niet getoond is. Als de collectie op is, begint een nieuwe ronde die de laatste kaarten even overslaat. Het dagpaar wordt opgeslagen en blijft na herladen gelijk.

## Browserbeperkingen

- iOS: geen trilfeedback (Safari ondersteunt `navigator.vibrate` niet). Op Android werkt een korte tik.
- iOS: systeemmeldingen alleen voor een op het beginscherm gezette app (iOS 16.4+), en ook dan alleen terwijl die actief is.
- Opslag kan door de browser gewist worden bij langdurig niet gebruiken of weinig ruimte (vooral Safari). Exporteer af en toe.
- Datum- en tijdkiezers volgen de taal en notatie van het toestel.
- Reizen naar een andere tijdzone: kalenderdagen volgen de huidige tijdzone van het apparaat.

## Getest

Geautomatiseerd in headless Chrome (390 en 320 px breed, tijdzone Europe/Amsterdam, met gesimuleerde klok):

- Eerste gebruik zonder fictieve gegevens, introductie, eerste consumptie.
- Meerdere consumpties op één dag, consumptie van gisteren die vandaag nog in de tank zit, dagteller die om middernacht reset.
- Bedtijd 00:30 na middernacht, juiste nacht en schatting.
- Favoriet snel loggen, dubbele invoer afvangen, Undo.
- Achteraf toevoegen (gisteren), wijzigen van hoeveelheid en tijd, verwijderen en herstellen.
- Favoriet aanpassen zonder dat gelogde drankjes veranderen.
- What if?-preview zonder logwijziging; toekomstig tijdstip in het logformulier geweigerd.
- Kaarten: twee per dag, afzonderlijk omdraaien (ook met toetsenbord en reduced motion), zelfde paar na herladen, nieuw paar de volgende dag, archief en bewaren.
- Recap en slaapcheck de volgende ochtend, gekoppeld aan de juiste nacht.
- Weekweergave telt dagen zonder registratie niet als nul.
- JSON- en CSV-export, alles wissen, schone start na herladen.
- Service worker, manifest, offline openen.
- Geen horizontale overloop op 320 px, geen consolefouten.

Niet getest op echte telefoons. Controleer installatie en meldingen op je eigen iPhone of Android-toestel.
