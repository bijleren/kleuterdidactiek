import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Modal from './Modal';
import { loadDoelenPerNet, type DoelRegel, type DoelenPerNet } from '../lib/doelselectie';
import { NET_CODES, NET_LABELS, type NetCode } from '../lib/leerplandoelen';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Minimumdoelcodes van het woord waarop geklikt is. */
  codes: string[];
  /** Waar de doelen bij horen, bv. het woord zelf. */
  herkomst?: string;
  titel?: string;
  /**
   * Het woord waar dit over gaat. Is het opgegeven, dan vallen leerplandoelen
   * af die hun begrippen opsommen zonder dit woord te noemen.
   */
  woord?: string;
}

/**
 * Toont welke doelen bij een woord horen, per net naast elkaar.
 *
 * De woordenschat hangt aan minimumdoelen; elk net vult die met eigen
 * leerplandoelen in. Een leerkracht die haar leerplan moet verantwoorden, wil
 * die lijst kunnen overnemen — vandaar een kopieerknop per net.
 */
export default function DoelenPerNetModal({
  isOpen,
  onClose,
  codes,
  herkomst,
  titel = 'Doelen bij dit woord',
  woord,
}: Props) {
  const [data, setData] = useState<DoelenPerNet | null>(null);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  const [gekopieerd, setGekopieerd] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let afgebroken = false;
    setLaden(true);
    setFout('');
    loadDoelenPerNet(codes, woord)
      .then((d) => {
        if (!afgebroken) setData(d);
      })
      .catch((e) => {
        console.error('Doelen per net laden mislukt', e);
        if (!afgebroken) setFout('De doelen konden niet geladen worden.');
      })
      .finally(() => {
        if (!afgebroken) setLaden(false);
      });
    return () => {
      afgebroken = true;
    };
  }, [isOpen, codes.join('|'), woord]);

  /* Tab tussen code en tekst: zo plakt de lijst in Excel meteen in twee kolommen. */
  const kopieer = async (sleutel: string, regels: DoelRegel[]) => {
    const tekst = regels.map((r) => `${r.code}\t${r.omschrijving}`).join('\n');
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(sleutel);
      setTimeout(() => setGekopieerd((s) => (s === sleutel ? null : s)), 2000);
    } catch {
      setFout('Kopiëren is geblokkeerd door de browser.');
    }
  };

  const sectie = (sleutel: string, titelTekst: string, regels: DoelRegel[], accent: string) => {
    /* Eerst wat het woord echt noemt, daarna de algemene doelen. */
    const gesorteerd = [
      ...regels.filter((r) => r.soort === 'noemt'),
      ...regels.filter((r) => r.soort === 'algemeen'),
    ];

    return (
      <div key={sleutel} className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800">
            {titelTekst} <span className="text-gray-500 font-normal">({regels.length})</span>
          </h4>
          <button
            type="button"
            onClick={() => kopieer(sleutel, regels)}
            disabled={regels.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {gekopieerd === sleutel ? (
              <>
                <Check className="w-4 h-4 text-green-600" /> Gekopieerd
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Kopieer
              </>
            )}
          </button>
        </div>

        {regels.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">Geen doelen voor deze selectie.</p>
        ) : (
          <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100">
            {gesorteerd.map((r) => {
              /*
                Doelen die geen begrippen opsommen dekken het minimumdoel als
                geheel; ze zeggen niets over dit woord in het bijzonder. Grijs,
                zodat de echte treffers eruit springen. Bij GO! is dit vrijwel
                alles wat er is, vandaar dat ze wel blijven staan.
              */
              const algemeen = r.soort === 'algemeen';
              return (
                <li
                  key={r.code}
                  className={`px-4 py-2 text-sm flex gap-3 ${algemeen ? 'bg-gray-50/60' : ''}`}
                  title={algemeen ? 'Algemeen doel: noemt dit woord niet apart.' : undefined}
                >
                  <span className={`font-semibold shrink-0 ${algemeen ? 'text-gray-400' : accent}`}>
                    {r.code}
                  </span>
                  <span className={algemeen ? 'text-gray-400' : 'text-gray-600'}>{r.omschrijving}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titel} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {herkomst ? <span className="font-semibold">{herkomst}</span> : 'Dit woord'} hangt aan
          minimumdoelen. Hieronder staat per net welke leerplandoelen daarmee bediend worden.
        </p>

        {fout && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
            {fout}
          </div>
        )}

        {laden && <p className="text-sm text-gray-500">Doelen laden...</p>}

        {!laden && data && (
          <div className="space-y-4">
            {sectie('minimum', 'Minimumdoelen', data.minimumdoelen, 'text-gray-700')}
            {NET_CODES.map((n: NetCode) =>
              sectie(n, NET_LABELS[n], data.perNet[n], 'text-deep-purple'),
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
