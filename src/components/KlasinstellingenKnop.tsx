import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import Modal from './Modal';
import { LEEFTIJDEN, NET_CODES, NET_LABELS, type Leeftijd, type NetCode } from '../lib/leerplandoelen';
import { useSchooljaar } from '../contexts/SchooljaarContext';
import { schooljaarLabel } from '../utils/schooljaar';

const LEEFTIJD_LABELS: Record<Leeftijd, string> = {
  '2,5-4': 'Instap en 1ste kleuterklas (2,5-4 jaar)',
  '4-5': '2de kleuterklas (4-5 jaar)',
  '5-6': '3de kleuterklas (5-6 jaar)',
};

/**
 * Instellingen die bepalen welke doelen een leerkracht standaard ziet: het net
 * van de school en de leeftijdsgroep van de klas.
 *
 * Ze staan naast de schoolkiezer omdat ze bij die keuze horen — het net geldt
 * voor de hele school, de leeftijdsgroep voor de klas die nu openstaat. Het
 * bolletje op de knop laat zien of er nog iets in te vullen valt, zodat je er
 * niet naar hoeft te zoeken.
 */
export default function KlasinstellingenKnop() {
  const { selectedSchool, setSelectedSchool, selectedGroup, setSelectedGroup } = useSchool();
  const schooljaar = useSchooljaar();
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [bevestigNet, setBevestigNet] = useState<NetCode | '' | null>(null);

  const [net, setNet] = useState<string>('');
  const [leeftijd, setLeeftijd] = useState<string>('');

  useEffect(() => {
    setNet(selectedSchool?.net_code ?? '');
    setLeeftijd(selectedGroup?.leeftijdsgroep ?? '');
  }, [selectedSchool?.net_code, selectedGroup?.leeftijdsgroep, open]);

  if (!selectedSchool) return null;

  const netOk = !!selectedSchool.net_code;
  const leeftijdOk = !selectedGroup || !!selectedGroup.leeftijdsgroep;
  const allesOk = netOk && leeftijdOk;

  const bewaarNet = async (waarde: NetCode | '') => {
    setBezig(true);
    setFout('');
    try {
      const { error } = await supabase
        .from('schools')
        // De gegenereerde types lossen hier op naar never; zie leerplandoelen.ts.
        .update({ net_code: waarde || null } as never)
        .eq('id', selectedSchool.id);
      if (error) throw error;
      setSelectedSchool({ ...selectedSchool, net_code: waarde || null });
      setNet(waarde);
    } catch (e) {
      console.error('Net bewaren mislukt', e);
      setFout('Het net kon niet bewaard worden.');
      setNet(selectedSchool.net_code ?? '');
    } finally {
      setBezig(false);
      setBevestigNet(null);
    }
  };

  const bewaarLeeftijd = async (waarde: string) => {
    if (!selectedGroup) return;
    setBezig(true);
    setFout('');
    try {
      const { error } = await supabase
        .from('groups')
        .update({ leeftijdsgroep: waarde || null } as never)
        .eq('id', selectedGroup.id);
      if (error) throw error;
      setSelectedGroup({ ...selectedGroup, leeftijdsgroep: waarde || null });
      setLeeftijd(waarde);
    } catch (e) {
      console.error('Leeftijdsgroep bewaren mislukt', e);
      setFout('De leeftijdsgroep kon niet bewaard worden.');
      setLeeftijd(selectedGroup.leeftijdsgroep ?? '');
    } finally {
      setBezig(false);
    }
  };

  const stip = allesOk ? 'bg-green-400' : 'bg-red-500';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={
          !schooljaar.isHuidig
            ? `Instellingen — je bekijkt schooljaar ${schooljaar.label}`
            : allesOk
            ? 'Instellingen — alles ingevuld'
            : 'Instellingen — er ontbreekt nog iets'
        }
        aria-label="Instellingen voor net en leeftijdsgroep"
        className="relative bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full border-2 border-white/30 transition-colors"
      >
        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        <span
          className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-deep-purple ${stip}`}
        />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Instellingen">
        <div className="space-y-6">
          {fout && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
              {fout}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">Onderwijsnet van de school</label>
              <Status ok={netOk} />
            </div>
            <select
              value={net}
              disabled={bezig}
              onChange={(e) => setBevestigNet((e.target.value || '') as NetCode | '')}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none disabled:opacity-50"
            >
              <option value="">Niet opgegeven — toon alle doelen</option>
              {NET_CODES.map((n) => (
                <option key={n} value={n}>{NET_LABELS[n]}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Geldt voor <span className="font-semibold">{selectedSchool.name}</span> en dus voor al je
              collega's. Bepaalt welke leerdoelen iedereen standaard te zien krijgt.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Schooljaar</label>
            <select
              value={schooljaar.startjaar}
              onChange={(e) => schooljaar.kies(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
            >
              {schooljaar.keuzes.map((jaar, i) => (
                <option key={jaar} value={jaar}>
                  {schooljaarLabel(jaar)}{i === 0 ? ' (dit schooljaar)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Bepaalt welke cijfers je ziet in de doelenoverzichten, de analyses en de rapporten.
              Alleen voor jou, en standaard het lopende schooljaar.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Leeftijdsgroep van {selectedGroup ? selectedGroup.name : 'de klas'}
              </label>
              <Status ok={leeftijdOk} />
            </div>
            {selectedGroup ? (
              <>
                <select
                  value={leeftijd}
                  disabled={bezig}
                  onChange={(e) => bewaarLeeftijd(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none disabled:opacity-50"
                >
                  <option value="">Niet opgegeven — toon alle doelen</option>
                  {LEEFTIJDEN.map((l) => (
                    <option key={l} value={l}>{LEEFTIJD_LABELS[l]}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Geldt alleen voor deze klas. Je kan altijd alle doelen tonen.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Kies eerst een klas.</p>
            )}
          </div>
        </div>
      </Modal>

      {/*
        Het net raakt iedereen in de school, dus altijd eerst bevestigen — ook
        als het nog leeg was, want vanaf dat moment verandert wat collega's zien.
      */}
      <Modal isOpen={bevestigNet !== null} onClose={() => setBevestigNet(null)} title="Zeker weten?">
        <div className="space-y-5">
          <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 space-y-1">
              <p className="font-semibold">Dit geldt voor de hele school.</p>
              <p>
                Iedereen van {selectedSchool.name} krijgt vanaf nu standaard de leerdoelen van{' '}
                <span className="font-semibold">
                  {bevestigNet ? NET_LABELS[bevestigNet as NetCode] : 'geen enkel net'}
                </span>{' '}
                te zien. Wat al geregistreerd is, verandert niet.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setBevestigNet(null)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={() => bevestigNet !== null && bewaarNet(bevestigNet)}
              disabled={bezig}
              className="flex-1 px-4 py-3 rounded-xl bg-deep-purple text-white font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {bezig ? 'Bewaren...' : 'Ja, aanpassen'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Status({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <Check className="w-3 h-3" /> In orde
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Nog invullen
    </span>
  );
}
