import {
  LEEFTIJDEN,
  NET_CODES,
  NET_LABELS,
  OVSG_GROEPEN,
  OVSG_GROEP_LABELS,
  type Leeftijd,
  type NetCode,
  type OvsgGroep,
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
  /**
   * Een net is verplicht: de knop "Minimumdoelen" en het vinkje "toon alle
   * doelen" vervallen. Op de leerdoelenpagina bestaat er buiten een net immers
   * niets om te tonen — een leerplandoel hoort altijd bij een net.
   */
  netVerplicht?: boolean;
  /**
   * OVSG deelt fijner in dan de gedeelde banden. Geef deze twee mee en bij
   * OVSG verschijnen vier leerjaren in plaats van drie banden.
   */
  ovsgGroep?: OvsgGroep | 'all';
  onOvsgGroepChange?: (groep: OvsgGroep | 'all') => void;
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
  netVerplicht = false,
  ovsgGroep = 'all',
  onOvsgGroepChange,
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
      {!netVerplicht && klasFilterActief && onToonAllesChange && (
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
        <span className="text-xs font-semibold text-gray-500 w-20">
          {netVerplicht ? 'Net' : 'Doelen'}
        </span>
        {!netVerplicht && (
          <button className={knop(net === 'all')} onClick={() => kiesNet('all')}>
            Minimumdoelen
          </button>
        )}
        {NET_CODES.map((n) => (
          <button key={n} className={knop(net === n)} onClick={() => kiesNet(n)}>
            {NET_LABELS[n]}
          </button>
        ))}
      </div>

      {/*
        OVSG kent elk doel aan precies een leerjaar toe en heeft er vier waar de
        gedeelde indeling er drie kent: instap (2,5) en 1ste kleuterklas (3)
        vallen allebei in 2,5-4. Bij OVSG tonen we daarom hun eigen leerjaren.
      */}
      {net === 'OVSG' && onOvsgGroepChange ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 w-20">Leerjaar</span>
          <button
            className={knop(ovsgGroep === 'all')}
            onClick={() => onOvsgGroepChange('all')}
          >
            Alle
          </button>
          {OVSG_GROEPEN.map((g) => (
            <button
              key={g}
              className={knop(ovsgGroep === g)}
              onClick={() => onOvsgGroepChange(g)}
            >
              {OVSG_GROEP_LABELS[g]}
            </button>
          ))}
        </div>
      ) : (
        net !== 'all' && (
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
        )
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
