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
