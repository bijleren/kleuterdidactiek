/*
  Shape data for the "taal" batch: Vormen kinds/words/labels (iOS ShapeKind)
  and the palette + kinds for "Instructies met vormen".
*/
export const SHAPE_KINDS = [
  'punt', 'lijn', 'recht', 'gebogen', 'rond', 'hoek',
  'driehoek', 'rechthoek', 'vierkant', 'cirkel',
  'kubus', 'balk', 'bol', 'piramide',
] as const;
export type ShapeKind = typeof SHAPE_KINDS[number];

/** Accepted spoken words (iOS ShapeKind.words). */
export const SHAPE_WORDS: Record<ShapeKind, string[]> = {
  punt: ['punt'], lijn: ['lijn'], recht: ['recht', 'rechte'], gebogen: ['gebogen'],
  rond: ['rond', 'ronde'], hoek: ['hoek'], driehoek: ['driehoek'], rechthoek: ['rechthoek'],
  vierkant: ['vierkant'], cirkel: ['cirkel'], kubus: ['kubus'], balk: ['balk'], bol: ['bol'],
  piramide: ['piramide', 'pyramide'],
};

/** Feedback text on a correct answer (iOS displayName) — also the hint clip. */
export const SHAPE_DISPLAY: Record<ShapeKind, string> = {
  punt: 'het punt', lijn: 'de lijn', recht: 'recht', gebogen: 'gebogen', rond: 'rond',
  hoek: 'de hoek', driehoek: 'de driehoek', rechthoek: 'de rechthoek', vierkant: 'het vierkant',
  cirkel: 'de cirkel', kubus: 'de kubus', balk: 'de balk', bol: 'de bol', piramide: 'de piramide',
};

/** iOS DigitoolPalette.colors: red, blue, green, yellow, orange, purple. */
export const PALETTE = ['rgb(227,66,61)', 'rgb(56,125,222)', 'rgb(71,173,89)', 'rgb(250,196,48)', 'rgb(242,133,38)', 'rgb(158,92,199)'];

export type FlatKind = 'square' | 'circle' | 'triangle' | 'rectangle';
export type SolidKind = 'bal' | 'kubus' | 'balk' | 'cilinder' | 'kegel' | 'piramide';
export const FLAT_KINDS: FlatKind[] = ['square', 'circle', 'triangle', 'rectangle'];
export const SOLID_KINDS: SolidKind[] = ['bal', 'kubus', 'balk', 'cilinder', 'kegel', 'piramide'];
