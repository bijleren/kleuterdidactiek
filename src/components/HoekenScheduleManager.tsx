import { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, Plus, ToggleLeft, ToggleRight, Repeat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import { getActivityIcon } from '../lib/activityIcons';
import { toLocalDateString } from '../utils/dateUtils';

interface HoekenTemplate {
  id: string;
  name: string;
  icon: string;
}

interface HoekenSchedule {
  id: string;
  template_id: string;
  group_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  frequency: string;
  day_of_week: number[];
  start_time: string;
  duration_minutes: number;
  hoekenwerk_templates: {
    name: string;
    icon: string;
  };
}

interface HoekenScheduleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  groupId: string;
  groupName: string;
  templates: HoekenTemplate[];
  onScheduleChanged: () => void;
}

const DAY_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Dagelijks',
  weekly: 'Wekelijks',
  bi_weekly: 'Tweewekelijks',
};
const DURATION_OPTIONS = [
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 uur' },
  { value: 90, label: '1,5 uur' },
];

export default function HoekenScheduleManager({
  isOpen,
  onClose,
  schoolId,
  groupId,
  groupName,
  templates,
  onScheduleChanged,
}: HoekenScheduleManagerProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<HoekenSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    template_id: '',
    frequency: 'weekly',
    day_of_week: [1, 2, 3, 4, 5] as number[],
    start_time: '09:00',
    duration_minutes: 45,
    start_date: toLocalDateString(new Date()),
    end_date: '',
  });

  useEffect(() => {
    if (isOpen) loadSchedules();
  }, [isOpen, groupId]);

  const loadSchedules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('hoekenwerk_schedules')
      .select('*, hoekenwerk_templates(name, icon)')
      .eq('group_id', groupId)
      .order('start_time');
    setSchedules(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.template_id || !user) return;

    await supabase.from('hoekenwerk_schedules').insert({
      template_id: formData.template_id,
      group_id: groupId,
      is_active: true,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      frequency: formData.frequency,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      duration_minutes: formData.duration_minutes,
      created_by: user.id,
    });

    setShowCreateForm(false);
    resetForm();
    loadSchedules();
    onScheduleChanged();
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    await supabase
      .from('hoekenwerk_schedules')
      .update({ is_active: !currentState, updated_at: new Date().toISOString() })
      .eq('id', id);
    loadSchedules();
    onScheduleChanged();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('hoekenwerk_schedules').delete().eq('id', id);
    loadSchedules();
    onScheduleChanged();
  };

  const toggleDay = (day: number) => {
    const current = formData.day_of_week;
    if (current.includes(day)) {
      setFormData({ ...formData, day_of_week: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, day_of_week: [...current, day].sort() });
    }
  };

  const resetForm = () => {
    setFormData({
      template_id: templates[0]?.id || '',
      frequency: 'weekly',
      day_of_week: [1, 2, 3, 4, 5],
      start_time: '09:00',
      duration_minutes: 45,
      start_date: toLocalDateString(new Date()),
      end_date: '',
    });
  };

  const renderIcon = (iconName: string, className: string = 'w-5 h-5') => {
    if (iconName && /^[A-Z]/.test(iconName)) {
      const IconComponent = getActivityIcon(iconName);
      if (IconComponent) return <IconComponent className={className} />;
    }
    return <span className={className}>{iconName}</span>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hoekenwerk Roosters" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Automatische hoekenwerk planning voor <span className="font-semibold">{groupName}</span>
          </p>
          {!showCreateForm && templates.length > 0 && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-blue text-white rounded-xl text-sm font-semibold hover:scale-105 transition-transform shadow-md"
            >
              <Plus className="w-4 h-4" />
              Nieuw rooster
            </button>
          )}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-2xl">
            <Repeat className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Maak eerst een hoekenwerk template aan</p>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-sky-blue/5 border-2 border-sky-blue/20 rounded-2xl p-5 space-y-4">
            <h3 className="font-baloo text-deep-purple text-lg">Nieuw rooster</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Template *</label>
              <select
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
              >
                <option value="">Kies een template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Frequentie</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                >
                  <option value="daily">Dagelijks</option>
                  <option value="weekly">Wekelijks</option>
                  <option value="bi_weekly">Tweewekelijks</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duur</label>
                <select
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                >
                  {DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Dagen</label>
              <div className="flex gap-2">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                      formData.day_of_week.includes(i)
                        ? 'bg-deep-purple text-white shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Starttijd</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Startdatum</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Einddatum</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                  placeholder="Onbeperkt"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.template_id || formData.day_of_week.length === 0}
                className="flex-1 bg-sky-blue text-white px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                Opslaan
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Laden...</div>
        ) : schedules.length === 0 && !showCreateForm ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nog geen roosters ingesteld</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  schedule.is_active
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-deep-purple/10 flex items-center justify-center">
                      {renderIcon(schedule.hoekenwerk_templates.icon, 'w-4 h-4 text-deep-purple')}
                    </div>
                    <span className="font-semibold text-sm text-gray-800 truncate">
                      {schedule.hoekenwerk_templates.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      {FREQUENCY_LABELS[schedule.frequency]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {schedule.start_time.slice(0, 5)} ({schedule.duration_minutes} min)
                    </span>
                    <span>
                      {schedule.day_of_week.map((d) => DAY_LABELS[d]).join(', ')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(schedule.id, schedule.is_active)}
                  className="flex-shrink-0"
                  title={schedule.is_active ? 'Pauzeren' : 'Activeren'}
                >
                  {schedule.is_active ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
