import { getWeekNumber } from '../utils/schooljaar';
import { useSchooljaar } from '../contexts/SchooljaarContext';
import { toLocalDateString } from '../utils/dateUtils';

interface WeekBalkProps {
  /** Weeknummers (0-based vanaf 1 september) waarin geoefend is. */
  weken: Set<number>;
  /** Optioneel: klik op een week, met de start- en einddatum van die week. */
  onWeekClick?: (startDatum: string, eindDatum: string, weekIndex: number) => void;
  /** Toon de kop met schooljaar en aantal weken. */
  toonKop?: boolean;
}

/**
 * De didactische weken van het schooljaar als balkje: groen waar geoefend is,
 * grijs waar niet, met de huidige week omrand.
 */
export default function WeekBalk({ weken, onWeekClick, toonKop = true }: WeekBalkProps) {
  const { label, weken: weeks, startDatum, isHuidig } = useSchooljaar();
  // Buiten het lopende jaar is er geen huidige week om te omranden.
  const huidigeWeek = isHuidig ? getWeekNumber(new Date(), startDatum) : -1;

  return (
    <div>
      {toonKop && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-gray-600 font-semibold">Schooljaar {label}</span>
          <span className="text-xs text-gray-500">({weeks.length} weken)</span>
        </div>
      )}

      <div className="flex gap-0.5 h-5 bg-gray-100 rounded-lg w-full px-1">
        {weeks.map((weekStart, weekIndex) => {
          const geoefend = weken.has(weekIndex);
          const isHuidige = weekIndex === huidigeWeek;

          const weekEind = new Date(weekStart);
          weekEind.setDate(weekEind.getDate() + 4);
          const fmt = (d: Date) =>
            d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

          const titel = `Week ${weekIndex + 1}: ${fmt(weekStart)} - ${fmt(weekEind)}${
            isHuidige ? ' (huidige week)' : ''
          }${geoefend ? ' — geoefend' : ' — niet geoefend'}`;

          const klassen = `flex-1 h-full transition-all ${
            geoefend ? 'bg-gradient-to-br from-grass-green to-green-400' : 'bg-gray-200'
          } ${isHuidige ? 'ring-2 ring-deep-purple ring-inset' : ''}`;

          if (!onWeekClick) {
            return <div key={weekIndex} className={klassen} title={titel} />;
          }

          return (
            <button
              key={weekIndex}
              onClick={() => {
                const echtEind = new Date(weekStart);
                echtEind.setDate(echtEind.getDate() + 6);
                onWeekClick(
                  toLocalDateString(weekStart),
                  toLocalDateString(echtEind),
                  weekIndex
                );
              }}
              className={`${klassen} hover:opacity-80 cursor-pointer`}
              title={geoefend ? `${titel} — klik voor details` : titel}
            />
          );
        })}
      </div>
    </div>
  );
}
