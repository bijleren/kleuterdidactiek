import {
  NET_CODES,
  NET_KLEUREN,
  NET_LABELS,
  type DoelNetInfo,
  type WoordNetInfo,
} from '../lib/leerplandoelen';

/**
 * Toont per net in welke leeftijdsgroepen aan een doel gewerkt wordt.
 * Zonder netinformatie is het een eigen doel van de app.
 */
export function DoelNetBadges({ info }: { info: DoelNetInfo | undefined }) {
  if (!info) {
    return (
      <span
        className="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold"
        title="Dit doel komt in geen van beide leerplannen voor."
      >
        Eigen doel
      </span>
    );
  }

  return (
    <>
      <span
        className={`text-xs px-3 py-1 rounded-full font-semibold ${
          info.isTeBereiken ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
        }`}
        title={
          info.isTeBereiken
            ? 'Te bereiken minimumdoel: bindend op populatieniveau.'
            : 'Na te streven minimumdoel op populatieniveau.'
        }
      >
        {info.isTeBereiken ? 'Te bereiken' : 'Na te streven'}
      </span>

      {NET_CODES.map((n) => {
        const leeftijden = info.perNet[n];
        if (!leeftijden || leeftijden.length === 0) return null;
        return (
          <span
            key={n}
            className={`text-xs px-3 py-1 rounded-full font-semibold ${NET_KLEUREN[n]}`}
            title={`${NET_LABELS[n]}: ${(info.doelnummers[n] || []).slice(0, 8).join(', ')}`}
          >
            {NET_LABELS[n]} · {leeftijden.join(' / ')}
          </span>
        );
      })}
    </>
  );
}

/**
 * Toont per net bij welke leeftijd een woord hoort.
 *
 * Het onderscheid direct/afgeleid blijft zichtbaar: 'direct' betekent dat het
 * woord letterlijk als te hanteren begrip in het leerplan staat, 'afgeleid'
 * is een ruwe schatting via de minimumdoelcodes en mag niet als harde
 * uitspraak gelezen worden.
 */
export function WoordNetBadges({ info }: { info: WoordNetInfo | undefined }) {
  if (!info) return null;

  return (
    <>
      {NET_CODES.map((n) => {
        const per = info.perNet[n];
        if (!per || per.leeftijden.length === 0) return null;
        const direct = per.precisie === 'direct';
        return (
          <span
            key={n}
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              direct ? NET_KLEUREN[n] : 'bg-gray-100 text-gray-500'
            }`}
            title={
              direct
                ? `${NET_LABELS[n]} noemt dit woord letterlijk bij dit doel.`
                : `Afgeleid uit de doelcodes van dit woord — een ruwe schatting, geen uitspraak van ${NET_LABELS[n]} zelf.`
            }
          >
            {NET_LABELS[n]} {per.leeftijden.join('/')}
            {!direct && <span className="opacity-70"> ~</span>}
          </span>
        );
      })}
    </>
  );
}
