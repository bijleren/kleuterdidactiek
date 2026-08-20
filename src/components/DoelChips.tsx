import { useEffect, useState } from 'react';
import { loadDoelLabels, type DoelLabel } from '../lib/doelselectie';

interface Props {
  codes: string[];
  /** Toon er hoogstens zoveel; de rest wordt samengevat als "+n". */
  max?: number;
  /** Compacte variant voor lijstweergaven. */
  klein?: boolean;
}

/**
 * Doelcodes met hun naam.
 *
 * Voorheen stond overal alleen de kale code. Bij een minimumdoel ('2.1.3') viel
 * daar nog mee te leven, maar een leerplandoel heet 'WT.528' en zegt zo niets.
 * Leerplandoelen krijgen ook een eigen kleur, zodat je in één oogopslag ziet
 * welke laag je voor je hebt.
 */
export default function DoelChips({ codes, max, klein = false }: Props) {
  const [labels, setLabels] = useState<Map<string, DoelLabel>>(new Map());

  useEffect(() => {
    if (codes.length === 0) return;
    let afgebroken = false;
    loadDoelLabels(codes)
      .then((m) => {
        if (!afgebroken) setLabels(m);
      })
      .catch((e) => console.error('Doellabels laden mislukt', e));
    return () => {
      afgebroken = true;
    };
  }, [codes.join('|')]);

  if (codes.length === 0) return null;

  const zichtbaar = max ? codes.slice(0, max) : codes;
  const rest = codes.length - zichtbaar.length;
  const maat = klein ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <div className="flex flex-wrap gap-1.5">
      {zichtbaar.map((code) => {
        const l = labels.get(code);
        const leerplan = l?.soort === 'leerplandoel';
        return (
          <span
            key={code}
            title={l?.omschrijving ?? code}
            className={`inline-flex items-center gap-1 rounded-full font-medium ${maat} ${
              leerplan ? 'bg-deep-purple/10 text-deep-purple' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span className="font-semibold">{code}</span>
            {!klein && l && l.omschrijving !== code && (
              <span className="max-w-[14rem] truncate opacity-70">{l.omschrijving}</span>
            )}
          </span>
        );
      })}
      {rest > 0 && (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-500 ${maat}`}>
          +{rest}
        </span>
      )}
    </div>
  );
}
