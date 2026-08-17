import { X, MessageSquare, Rocket, Clock } from 'lucide-react';

interface NonPremiumWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

const COMING_SOON = [
  'Duidelijke handleiding, help en ondersteuning',
  'Videocatalogus met Bijleren-video\'s',
  'Versie 2.0 van Doe-opdrachten',
  'Versie 2.0 van Speel',
  'Versie 2.0 van Woordenschat met alle afbeeldingen en audio, en aanpassingen per onderwijsnet (GO!, Katholiek, OVSG, ...)',
];

export default function NonPremiumWelcomeModal({ isOpen, onClose, onOpenFeedback }: NonPremiumWelcomeModalProps) {
  if (!isOpen) return null;

  const handleFeedback = () => {
    onClose();
    onOpenFeedback();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-deep-purple to-[#9B9EFF] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-baloo text-white">Welkom bij KleuterWijs!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Video */}
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video w-full">
            <iframe
              className="w-full h-full"
              src="https://player.vimeo.com/video/1202752400?h=8d6bf8c7fe&badge=0&autopause=0&player_id=0&app_id=58479"
              title="KleuterWijs introductievideo"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Welcome message */}
          <div className="space-y-3">
            <p className="text-gray-800 text-base leading-relaxed">
              Fijn dat je er bent! Het is nog vroeg voor nieuwe scholen, maar je bent van harte welkom om alvast
              rond te kijken. We staan nog voor de officiële lancering, dus sommige dingen zijn nog niet helemaal
              op punt — dat is normaal en hoort erbij.
            </p>
            <p className="text-gray-700 text-base leading-relaxed">
              We zijn hard bezig om alles klaar te maken voor scholen die zich in{' '}
              <strong className="text-deep-purple">augustus</strong> inschrijven. Je krijgt van ons een update
              zodra alles klaarstaat.
            </p>
          </div>

          {/* Coming soon list */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">Dit staat nog op de planning voor de zomervakantie:</p>
            </div>
            <ul className="space-y-2">
              {COMING_SOON.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-amber-900">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback nudge */}
          <p className="text-gray-700 text-base leading-relaxed">
            Heb je vragen, ideeën of feedback? Klik op de{' '}
            <strong className="text-deep-purple">feedbackknop</strong> en we nemen zo snel mogelijk contact
            met je op.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleFeedback}
              className="flex items-center justify-center gap-2 flex-1 border-2 border-deep-purple text-deep-purple px-5 py-3 rounded-xl font-semibold text-sm hover:bg-deep-purple/5 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Feedback geven
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-deep-purple to-[#9B9EFF] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md hover:scale-105 transition-transform"
            >
              Aan de slag!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
