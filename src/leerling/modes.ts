/*
  The exercise catalogue — same modes, categories, order and minimum niveau
  as the iOS app (NumberExerciseMode + ExerciseCategory).
*/
import type { LucideIcon } from 'lucide-react';
import {
  PenLine, Mic, ScanLine, Ear, BoxSelect, RefreshCw, ChevronsUp, Eye, Hash, ListOrdered,
  Heart, Pointer, CircleDot, ArrowLeftRight, ListTree, FlipHorizontal2, Crop, Shapes, ListChecks,
  MessageCircle, Euro, Calendar, CalendarClock, Dice5, Ruler, Hand, Calculator, MousePointerClick,
  Brush, Equal, Grid2x2, Repeat, Hourglass, Quote, Layers, BarChart3, Dice3, Triangle, Box,
  GalleryVertical, Link2, QrCode, Banknote, CircleDashed, RectangleVertical,
} from 'lucide-react';

export type ModeId =
  | 'writeNumber' | 'sayNumber' | 'scanNumber' | 'dictation'
  | 'kleuterTellen' | 'kleuterBehoud' | 'kleuterBegrippen' | 'kleuterSubiteren' | 'kleuterCijfers'
  | 'tellen' | 'playingCard' | 'cardCount' | 'rangorde' | 'telrij' | 'rangtelwoorden'
  | 'spiegel' | 'transformaties' | 'vormen' | 'vormInstructies' | 'woordenschat'
  | 'prijzen' | 'dagen' | 'gisterenMorgen' | 'dobbelsteen' | 'meetlat' | 'handen'
  | 'rekenmachine' | 'rangordeTik' | 'tekenen' | 'positie' | 'gelijkMaken' | 'groepjes'
  | 'geefNeem' | 'tijdMeten' | 'verwoorden' | 'keerNemen' | 'sorteerGrootte'
  | 'kenJeGeld' | 'isHetEvenveel' | 'staafjes'
  | 'digiDobbelsteen' | 'digiVormen' | 'digiLichamen' | 'digiKaarten' | 'digiBlokjes' | 'qrScanner';

export const MODE_ICONS: Record<ModeId, LucideIcon> = {
  writeNumber: PenLine, sayNumber: Mic, scanNumber: ScanLine, dictation: Ear,
  kleuterTellen: BoxSelect, kleuterBehoud: RefreshCw, kleuterBegrippen: ChevronsUp,
  kleuterSubiteren: Eye, kleuterCijfers: Hash, tellen: ListOrdered, playingCard: Heart,
  cardCount: Pointer, rangorde: CircleDot, telrij: ArrowLeftRight, rangtelwoorden: ListTree,
  spiegel: FlipHorizontal2, transformaties: Crop, vormen: Shapes, vormInstructies: ListChecks,
  woordenschat: MessageCircle, prijzen: Euro, dagen: Calendar, gisterenMorgen: CalendarClock,
  dobbelsteen: Dice5, meetlat: Ruler, handen: Hand, rekenmachine: Calculator,
  rangordeTik: MousePointerClick, tekenen: Brush, positie: ArrowLeftRight, gelijkMaken: Equal,
  groepjes: Grid2x2, geefNeem: Repeat, tijdMeten: Hourglass, verwoorden: Quote,
  keerNemen: Layers, sorteerGrootte: BarChart3, kenJeGeld: Banknote, isHetEvenveel: CircleDashed,
  staafjes: RectangleVertical, digiDobbelsteen: Dice3, digiVormen: Triangle, digiLichamen: Box,
  digiKaarten: GalleryVertical, digiBlokjes: Link2, qrScanner: QrCode,
};

export type CategoryId = 'digitool' | 'onderbouw' | 'meetkunde' | 'taalTijd';

export const CATEGORIES: { id: CategoryId; modes: ModeId[] }[] = [
  { id: 'digitool', modes: ['digiDobbelsteen', 'digiVormen', 'digiLichamen', 'digiKaarten', 'digiBlokjes', 'qrScanner'] },
  {
    id: 'onderbouw',
    modes: [
      'writeNumber', 'tekenen', 'sayNumber', 'scanNumber', 'dictation', 'rekenmachine',
      'tellen', 'meetlat', 'staafjes', 'telrij', 'rangtelwoorden', 'kleuterTellen', 'kleuterCijfers',
      'playingCard', 'dobbelsteen', 'handen', 'cardCount', 'kleuterSubiteren',
      'rangorde', 'rangordeTik', 'positie', 'sorteerGrootte',
      'kleuterBehoud', 'kleuterBegrippen', 'isHetEvenveel', 'gelijkMaken', 'groepjes', 'keerNemen',
      'prijzen', 'kenJeGeld', 'geefNeem', 'verwoorden',
    ],
  },
  { id: 'meetkunde', modes: ['spiegel', 'transformaties', 'vormen', 'vormInstructies'] },
  { id: 'taalTijd', modes: ['woordenschat', 'dagen', 'gisterenMorgen', 'tijdMeten'] },
];

/** Lowest "max getal" at which the exercise still works (picker hides it below). */
export function minimumNiveau(m: ModeId): number {
  switch (m) {
    case 'gelijkMaken': case 'groepjes': case 'keerNemen': case 'verwoorden': case 'kleuterTellen':
      return 4;
    default:
      return 3;
  }
}

/** Exercises that use the microphone (shown with a mic badge in the picker). */
export const USES_MIC = new Set<ModeId>([
  'sayNumber', 'tellen', 'playingCard', 'cardCount', 'rangorde', 'telrij', 'rangtelwoorden',
  'vormen', 'woordenschat', 'prijzen', 'dagen', 'gisterenMorgen', 'dobbelsteen', 'meetlat',
  'handen', 'positie', 'geefNeem', 'verwoorden', 'staafjes',
]);

/** Exercises that need the camera. */
export const USES_CAMERA = new Set<ModeId>([
  'writeNumber', 'scanNumber', 'dictation', 'spiegel', 'transformaties', 'qrScanner',
]);

export function isModeId(s: string | undefined): s is ModeId {
  return !!s && s in MODE_ICONS;
}
