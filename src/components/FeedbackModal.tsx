import { useState } from 'react';
import { X, Bug, Lightbulb, HelpCircle, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type FeedbackType = 'bug' | 'suggestie' | 'vraag';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: FeedbackType; label: string; icon: typeof Bug; description: string; color: string }[] = [
  {
    value: 'bug',
    label: 'Fout melden',
    icon: Bug,
    description: 'Iets werkt niet zoals verwacht',
    color: 'from-red-400 to-red-500',
  },
  {
    value: 'suggestie',
    label: 'Idee of feedback',
    icon: Lightbulb,
    description: 'Een suggestie of verbetering',
    color: 'from-amber-400 to-amber-500',
  },
  {
    value: 'vraag',
    label: 'Vraag stellen',
    icon: HelpCircle,
    description: 'Hulp nodig of iets onduidelijk',
    color: 'from-sky-400 to-sky-500',
  },
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (submitting) return;
    setType('bug');
    setTitle('');
    setDescription('');
    setSubmitted(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('bug_reports').insert({
        type,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 5000),
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        url: window.location.href,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        locale: navigator.language,
        status: 'new',
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOption = TYPE_OPTIONS.find((o) => o.value === type)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative animate-fade-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedOption.color} rounded-t-3xl px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <selectedOption.icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-baloo text-white">Feedback geven</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="bg-grass-green/10 w-16 h-16 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-grass-green" />
              </div>
            </div>
            <h3 className="text-xl font-baloo text-deep-purple">Bedankt voor je feedback!</h3>
            <p className="text-gray-600 text-sm">
              We hebben je bericht ontvangen en nemen het mee in onze verbeteringen.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-8 py-3 rounded-full font-baloo shadow-md hover:scale-105 transition-transform"
            >
              Sluiten
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-center transition-all ${
                      active
                        ? 'border-deep-purple bg-deep-purple/5 text-deep-purple'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-deep-purple' : 'text-gray-400'}`} />
                    <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 text-center -mt-2">{selectedOption.description}</p>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Korte omschrijving <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'bijv. "Knop reageert niet op iPad"'
                    : type === 'suggestie'
                    ? 'bijv. "Mogelijkheid om foto toe te voegen"'
                    : 'bijv. "Hoe stel ik een groep in?"'
                }
                maxLength={200}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-deep-purple focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Details <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Wat deed je precies? Wat verwachtte je te zien? Wat zag je in de plaats?'
                    : type === 'suggestie'
                    ? 'Beschrijf je idee. Waarom zou dit handig zijn?'
                    : 'Stel je vraag zo duidelijk mogelijk.'
                }
                maxLength={5000}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-deep-purple focus:outline-none transition-colors resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/5000</p>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 border-2 border-gray-200 text-gray-600 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !description.trim()}
                className="flex-1 bg-gradient-to-r from-deep-purple to-[#9B9EFF] text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Versturen...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Versturen
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
