/*
  Digitool "Platte vormen" — port of iOS Features/Digitool/DigiVormenView.swift.
  A free canvas with flat shapes (square, circle, triangle, rectangle). Pick a
  colour, drag a shape from the tray onto the canvas (or tap it to add); drag
  to move, tap a placed shape to recolour it, double-tap to remove, pinch /
  rotate with two fingers (mouse: wheel / shift+wheel). Not scored.
*/
import { FreeCanvas } from './digitool/FreeCanvas';
import { FlatShape } from './digitool/shapes';
import type { FlatKind } from './digitool/shapes';

const KINDS: FlatKind[] = ['square', 'circle', 'triangle', 'rectangle'];
const NAMES: Record<FlatKind, string> = { square: 'Vierkant', circle: 'Cirkel', triangle: 'Driehoek', rectangle: 'Rechthoek' };

export default function DigiVormen() {
  return (
    <FreeCanvas<FlatKind>
      mode="digiVormen"
      hintKey="digiVormen.hint"
      kinds={KINDS}
      initialColor={0}
      margin={30}
      size={(k, compact) => {
        const s = compact ? 84 : 110;
        return k === 'rectangle' ? { w: s * 1.5, h: s * 0.75 } : { w: s, h: s };
      }}
      traySize={(k, compact) => {
        const s = compact ? 42 : 54;
        return k === 'rectangle' ? { w: s * 1.4, h: s * 0.7 } : { w: s, h: s };
      }}
      traySlot={(compact) => (compact ? { w: 58, h: 48 } : { w: 74, h: 60 })}
      render={(k, color) => <FlatShape kind={k} color={color} />}
      label={(k) => NAMES[k]}
    />
  );
}
