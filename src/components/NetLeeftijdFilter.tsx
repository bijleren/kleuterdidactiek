import {
  LEEFTIJDEN,
  NET_CODES,
  NET_LABELS,
  type Leeftijd,
  type NetCode,
} from '../lib/leerplandoelen';

interface NetLeeftijdFilterProps {
  net: NetCode | 'all';
  leeftijd: Leeftijd | 'all';
  onNetChange: (net: NetCode | 'all') => void;
  onLeeftijdChange: (leeftijd: Leeftijd | 'all') => void;
  /** Aantal items dat na filtering overblijft; alleen ter info. */
  aantal?: number;
  /** Staat het vinkje "alle doelen" aan? */
  toonAlles?: boolean;
  onToonAllesChange?: (aan: boolean) => void;
  /** Levert de klas zelf een filter op? Zonder filter heeft het vinkje geen zin. */
  klasFilterActief?: boolean;
  /** Korte omschrijving van de klasinstelling, bv. "GO! · 5-6 jaar". */
  klasOmschrijving?: string;
}

/**
 * Filter op onderwijsnet en leeftijdsgroep.
 * Gedeeld door het doelenoverzicht en de woordenschattracker.
 */
export default function NetLeeftijdFilter({
  net,
  leeftijd,
  onNetChange,
  onLeeftijdChange,
  aantal,
  toonAlles = false,
  onToonAllesChange,
  klasFilterActief = false,
  klasOmschrijving,
}: NetLeeftijdFilterProps) {
  const knop = (actief: boolean) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-all ${
      actief
        ? 'bg-deep-purple text-white shadow-md'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  /**
   * Een leeftijdsgroep bestaat alleen binnen een leerplan: het net bepaalt in
   * welke groep aan een doel gewerkt wordt. Terug naar de minimumdoelen betekent
   * dus ook de leeftijd loslaten, anders blijft er een onzichtbaar filter staan.
   */
  const kiesNet = (n: NetCode | 'all') => {
    onNetChange(n);
    if (n === 'all' && leeftijd !== 'all') onLeeftijdChange('all');
  };

  return (
    <div className="space-y-3">
      {klasFilterActief && onToonAllesChange && (
        <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={toonAlles}
            onChange={(e) => onToonAllesChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-deep-purple focus:ring-deep-purple"
          />
          <span>
            Toon alle doelen
            {klasOmschrijving && (
              <span className="text-gray-500">
                {' '}— anders zie je wat bij deze klas hoort ({klasOmschrijving})
              </span>
            )}
          </span>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 w-20">Doelen</span>
        <button className={knop(net === 'all')} onClick={() => kiesNet('all')}>
          Minimumdoelen
        </button>
        {NET_CODES.map((n) => (
          <button key={n} className={knop(net === n)} onClick={() => kiesNet(n)}>
            {NET_LABELS[n]}
          </button>
        ))}
      </div>

      {net !== 'all' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 w-20">Leeftijd</span>
          <button
            className={knop(leeftijd === 'all')}
            onClick={() => onLeeftijdChange('all')}
          >
            Alle
          </button>
          {LEEFTIJDEN.map((l) => (
            <button
              key={l}
              className={knop(leeftijd === l)}
              onClick={() => onLeeftijdChange(l)}
            >
              {l} jaar
            </button>
          ))}
        </div>
      )}

      {net !== 'all' && (
        <p className="text-xs text-gray-500">
          {aantal !== undefined && <span className="font-semibold">{aantal} doelen. </span>}
          Eigen doelen van de school vallen buiten deze selectie: die komen in geen van beide
          leerplannen voor.
        </p>
      )}
    </div>
  );
}
