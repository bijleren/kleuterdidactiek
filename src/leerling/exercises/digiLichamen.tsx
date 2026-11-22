/*
  Digitool "Ruimtefiguren" — port of iOS Features/Digitool/DigiLichamenView.swift.
  A free canvas with 3D solids (bol, kubus, balk, cilinder, kegel, piramide)
  drawn with simple shading. Same interaction as "Platte vormen": drag from
  the tray (or tap to add), drag to move, tap to recolour, double-tap to
  remove, pinch / rotate with two fingers (mouse: wheel / shift+wheel).
  Starts with blue selected, like iOS. Not scored.
*/
import { FreeCanvas } from './digitool/FreeCanvas';
import { SolidShape } from './digitool/shapes';
import type { SolidKind } from './digitool/shapes';

const KINDS: SolidKind[] = ['bal', 'kubus', 'balk', 'cilinder', 'kegel', 'piramide'];
const NAMES: Record<SolidKind, string> = {
  bal: 'Bol', kubus: 'Kubus', balk: 'Balk', cilinder: 'Cilinder', kegel: 'Kegel', piramide: 'Piramide',
};

export default function DigiLichamen() {
  return (
    <FreeCanvas<SolidKind>
      mode="digiLichamen"
      hintKey="digiLichamen.hint"
      kinds={KINDS}
      initialColor={1}
      margin={34}
      size={(_k, compact) => (compact ? { w: 92, h: 92 } : { w: 120, h: 120 })}
      traySize={(_k, compact) => (compact ? { w: 44, h: 44 } : { w: 58, h: 58 })}
      traySlot={(compact) => (compact ? { w: 52, h: 52 } : { w: 66, h: 66 })}
      render={(k, color) => <SolidShape kind={k} color={color} />}
      label={(k) => NAMES[k]}
    />
  );
}
