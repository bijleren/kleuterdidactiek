/*
  The vocabulary "Woordenschat" listens for — copied verbatim from iOS
  Features/Woordenschat/WoordenschatWords.swift (kleuterdidactiek.be
  vocabulary_words + custom_vocabulary, snapshot 2026-08-17).
*/
import { fold } from '../../lib/dutch';

export const WOORDENSCHAT_RAW = `
aantrekken
aarde
achter
achterkant
achteruit
acteur
ademen
Afrika
afstoten
akker
als dan
altijd
anders
appartement
appel
arceren
auteur
baby
bakkerij
balk
bang
batterij
beek
beeld
beenderen
België
berg
berm
betalen
bewegen
beweging
bewolking
bibliotheek
bijdoen
binnen
blad
blauw
blij
bloem
boerderij
bol
boom
boos
bos
botten
boven
bovenkant
breder
breed
brief
bruin
buiten
buiten beeld
bus
camera
cirkel
continent
daarna
dag
dagboek
dan
dans
de Maas
de Nijl
de Schelde
decor
dezelfde vorm
dichtbij
dichter
dichterbij komen
diep
dieper
diepste
dik
dikker
dikste
dinsdag
donderdag
donker
dorst
draaien
driehoek
dun
dunner
dunste
één meer
één minder
eerder
eerlijk verdelen
eerst
eerste
Egypte
eieren
eraf
erbij
euro
Europa
even groot
evenveel
fabriek
fauna
fietshelm
film
flora
fluit
fossielen
foto
gazon
gebogen
gebogen lijn
geboren worden
geel
geen enkel
gelijk
gelijk maken
gelijke groepjes maken
geluid
geven
gewas
gisteren
glad
graf
gras
grasland
grijs
groeien
groen
groepjes maken
groot
grootste
grot
groter
hagel
handpop
handtrom
hard
hart
hartslag
heel lang geleden
herfst
hetzelfde
heuvel
hoek
hoeveel
hoeveel meer
hoeveel minder
hoger
hoog
honger
hoogste
horen
huid
huis
illustrator
in
in beeld
insecten
instrument
jaar
je huisnummer
je straatnaam
juist erna
juist ervoor
kaft
kan
kan niet
keer nemen
kiemen
kind
klank
klankgroep
klein
kleiner
kleinste
kleuren
kleuter
koe
kopen
kort
korter
kortst
kortste
kost meer
kost minder
kostuum
krijgen
kring
kubus
kunstenaar
laag
laagste
laat
laatste
lager
lamp
land
lang
lang geleden
langer
langst
langste
langzaam
later
leeg
leger
lente
letter
licht
lichtbron
lichter
lichtste
lied
lijn
longen
lucht
maag
maan
maandag
magneet
magnetisch
markt
masker
meer
meest
meeste
mening
microfoon
middelste
midden
minder
minst
minste
misschien
mist
moe
mogelijk
mond
morgen
muzikant
naar beneden
naar boven
naar mij toe
naast
nacht
neerslag
neus
niet
niet evenveel
niet gelijk
niets
nieuw
nooit
Noordpool
nu
oceaan
ogen
omhoog
omlaag
onder
onderkant
op
opnieuw
opzij
oranje
oren
oud
overleg
overmorgen
oversteken
paars
park
patroon
pengreep
penseel
peuter
piramide
plas
potlood
prijs
proeven
punt
recht
recht naar
rechte lijn
rechthoek
reflectie
regen
riet
rij
rijm
rivier
rol
rond
rood
rots
rotsachtig
rotsschildering
ruiken
ruilen
ruw
samen
samentellen
samenvoegen
schaap
schaduw
schilder
schilderij
schrijfhouding
schrijfpatroon
schrijfrichting
schuin naar
smal
smaller
sneeuw
snel
soms
sparen
spiegel
spiegelbeeld
spiegelen
spieren
splitsen
spoor
stal
stam
standbeeld
steil
stem
stemmen
stempel
stengel
sterren
sterven
steunen
stilte
stopbord
stopcontact
straat
straks
strand
tamboerijn
te laat
te veel
te vroeg
te weinig
tegen
tegenover
tekenpapier
temperatuur
titel
toneel
toon
trage
trein
triangel
trots
tuin
tussen
uit
vallei
van mij weg
van minder naar meer
van weinig naar veel
vandaag
varken
veel
ver
veraf
verbaasd
verdelen
verder
verdrietig
verf
vergroten
verkeerslichten
verkleedkleren
verkleinen
verkopen
verschuiven
vervormen
verzinnen
vierkant
vijver
vissen
voelen
voetpad
vogels
vol
volgende
voller
volwassene
voor
voorkant
vooruit
vorige
vrijdag
vroeg
vroeger
vrucht
vruchtbaar
water
week
weg
wegnemen
weide
weinig
wereldbol
werkplaats
werktuig
wind
winkel
winter
wit
woensdag
wonen
woord
woorddeel
wortel
zaad
zacht
zand
zanderig
zanger
zangeres
zaterdag
zebrapad
zee
zien
zijkant
zintuigen
zogend
zomer
zon
zondag
zoogdieren
Zuidpool
zwaar
zwaarder
zwaarste
zwart
zwembad
`;


/** Folded entries (deduplicated) → original spelling, for display. */
const ENTRIES: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const line of WOORDENSCHAT_RAW.split('\n')) {
    const orig = line.trim();
    const w = fold(orig);
    if (w && !m.has(w)) m.set(w, orig);
  }
  return m;
})();

/** Single words, folded for matching. */
export const SINGLES: Set<string> = new Set([...ENTRIES.keys()].filter((w) => !w.includes(' ')));

/** Multi-word phrases, folded, longest first (so longer phrases win). */
export const PHRASES: string[] = [...ENTRIES.keys()].filter((w) => w.includes(' ')).sort((a, b) => b.length - a.length);

/** Display form: the original spelling with a capital first letter ("België", "De Maas"). */
export function displayWord(folded: string): string {
  const o = ENTRIES.get(folded) ?? folded;
  return o.charAt(0).toUpperCase() + o.slice(1);
}
