# Leerlingendeel — kleuterdidactiek.be/leerling

Webversie van de Kleuterdidactiek iPad-app (`bijleren/kleuterdidactiek-ios`) voor
kinderen. Los van het leerkrachtendeel: eigen login, eigen opmaak (goud op crème,
zoals de app), lazy geladen zodat het de rest van de site niet zwaarder maakt.

## Inloggen (geen leerkrachtaccount nodig op het toestel)
- **QR-kaart** voor de webcam (jsQR). De gedrukte kaarten van bijleer.school
  bevatten `https://bijleer.school/webwijzer?h=<access_hash>`.
- **Leerlingcode + pincode**.
- **Link** `https://kleuterdidactiek.be/leerling?h=<access_hash>` (snelkoppeling per kind).
- **Gast**: oefenen zonder kaart, er wordt niets bewaard.

RPC's (SECURITY DEFINER, anon mag ze uitvoeren): `authenticate_student_by_code`,
`authenticate_student_by_hash`, `bump_rekenlezer_progress_by_hash`.
De `h`-parameter wordt gelezen zonder `+` → spatie (base64-hashes).

## Voortgang
Zelfde tabel en sleutels als de iPad-app: `rekenlezer_progress`, `app = 'kleuterdidactiek'`,
`exercise` = het analytics-voorvoegsel van iOS (`saynumber`, `tellen`, …),
`attempts` per getoonde vraag, `correct` per juist antwoord, tijd onder `sessie`.
Zo ziet de leerkracht in bijleer.school web en iPad samen.

## Spraakherkenning
`lib/speech.ts` gebruikt de Web Speech API (Chrome en Edge; Safari werkt ook,
Firefox niet). Taal `nl-BE`, met terugval op `nl-NL`. Zoals op iOS:
luistert pas als onze eigen audio stil is (geen echo), pauzeert tijdens
instructies, een match moet 0,5 s stabiel blijven, het venster wordt na 1,5 s
stilte leeggemaakt en de sessie herstart vanzelf.
Chrome stuurt de audio naar Google voor herkenning, Edge naar Microsoft; er is
internet nodig.

Testen zonder microfoon (alleen `npm run dev`):
```js
__kdSpeech.grant();            // doe alsof de microfoon mag
__kdSpeech.simulate('vijf');   // alsof het kind "vijf" zei
```

## Structuur
- `LeerlingApp.tsx` — routes `/leerling`, `/leerling/oefenen`, `/leerling/oefenen/:mode`
- `LoginScreen.tsx`, `PickerScreen.tsx`
- `ui.tsx` — ExerciseShell, MicPanel, Keypad, Celebrate, …
- `hooks.ts` — useListen, useMic, useExerciseTracker, …
- `lib/` — speech, audio (opgenomen clips → woordenschat.be → TTS), dutch (getalwoorden en
  matching), student (login), progress
- `exercises/<modeId>.tsx` — één bestand per oefening, automatisch in de keuzelijst
  (`import.meta.glob`). Hulpbestanden per groep in een submap.
- `strings.nl.json` — Nederlandse teksten uit de iOS-app (`Localizable.strings`).
- Audio en beelden: `public/leerling-audio/`, `public/leerling-img/` (kopie van de app-bundel).
