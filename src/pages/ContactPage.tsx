import { useState } from 'react';
import { Mail, Send, CheckCircle2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';
import { supabase } from '../lib/supabase';

const contactReasons = {
  'demo': 'Demo of meer informatie',
  'new-app': 'Nieuwe app aanvragen',
  'support': 'Ondersteuning op school',
  'pricing': 'Vraag over prijzen',
  'other': 'Andere vraag',
} as const;

export default function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    reason: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const reasonLabel = contactReasons[formData.reason as keyof typeof contactReasons];
      const subjectLine = formData.school
        ? `${reasonLabel} - ${formData.name} (${formData.school})`
        : `${reasonLabel} - ${formData.name}`;

      const messageText = formData.school
        ? `School: ${formData.school}\n\n${formData.message}`
        : formData.message;

      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          type: formData.reason,
          subject: subjectLine,
          message: messageText,
          platform: 'bijleer.school',
        });

      if (dbError) throw dbError;

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError('Er is iets misgegaan. Probeer het opnieuw of stuur ons een e-mail op info@bijleren.eu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-[#FFF5E6] to-[#E8F6F3] font-quicksand overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-24 h-24 bg-coral-pink rounded-full opacity-30 top-[10%] left-[5%] animate-float"></div>
        <div className="absolute w-16 h-16 bg-sky-blue rounded-full opacity-30 top-[20%] right-[10%] animate-float-delayed"></div>
        <div className="absolute w-20 h-20 bg-sunny-yellow rounded-full opacity-30 bottom-[15%] left-[15%] animate-float-delayed-2"></div>
        <div className="absolute w-14 h-14 bg-grass-green rounded-full opacity-30 bottom-[30%] right-[20%] animate-float-delayed-3"></div>
      </div>

      <MarketingHeader />

      <main className="relative z-5 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-baloo text-deep-purple mb-6">
            Neem contact met ons op
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Heb je vragen over Kleuterdidactiek.be? We helpen je graag verder!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <div className="bg-white rounded-3xl p-10 shadow-xl mb-8">
              <h2 className="text-2xl font-baloo text-deep-purple mb-6">
                Stuur ons een bericht
              </h2>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-grass-green/20 to-sky-blue/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-grass-green" />
                  </div>
                  <h3 className="text-xl font-baloo text-deep-purple mb-3">
                    Bedankt voor je bericht!
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    We nemen zo snel mogelijk contact met je op.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-blue to-lavender text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                  >
                    <Home className="w-5 h-5" />
                    Terug naar homepagina
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Naam *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent transition-all"
                      placeholder="Je volledige naam"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      E-mailadres *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent transition-all"
                      placeholder="je@email.be"
                    />
                  </div>

                  <div>
                    <label htmlFor="school" className="block text-sm font-semibold text-gray-700 mb-2">
                      School
                    </label>
                    <input
                      type="text"
                      id="school"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent transition-all"
                      placeholder="Naam van je school (optioneel)"
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                      Reden van contact *
                    </label>
                    <select
                      id="reason"
                      name="reason"
                      required
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent transition-all"
                    >
                      <option value="">Selecteer een reden</option>
                      <option value="demo">Demo of meer informatie</option>
                      <option value="new-app">Nieuwe app aanvragen</option>
                      <option value="support">Ondersteuning op school</option>
                      <option value="pricing">Vraag over prijzen</option>
                      <option value="other">Andere vraag</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Bericht *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent transition-all resize-none"
                      placeholder="Vertel ons waar we je mee kunnen helpen. Wees zo volledig mogelijk."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-sky-blue to-lavender text-white px-8 py-4 rounded-2xl font-baloo text-lg hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Send className="w-5 h-5" />
                    {submitting ? 'Versturen...' : 'Verstuur bericht'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-sky-blue/10 to-lavender/10 rounded-3xl p-10">
              <h2 className="text-2xl font-baloo text-deep-purple mb-6">
                Andere manieren om contact op te nemen
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Mail className="w-6 h-6 text-sky-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">E-mail</h3>
                    <a href="mailto:info@bijleer.school" className="text-gray-600 hover:text-deep-purple transition-colors">
                      info@bijleren.eu
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <h3 className="text-xl font-baloo text-deep-purple mb-4">
                Veelgestelde vragen
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Hoeveel kost kleuterdidactiek.be?</h4>
                  <p className="text-gray-600 text-sm">
                    4,5 euro/leerling/schooljaar. Eén vaste prijs, maar daarvoor krijg je meer dan enkel dit platform. Zo krijg je ook meteen toegang tot woordenschat.be en de bijleer.school .
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Kan ik een demo aanvragen?</h4>
                  <p className="text-gray-600 text-sm">
                    Ja, zeker! Vul het formulier in, selecteer "Vraag een demo aan" in het onderwerp en we plannen graag een demo in.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Is er telefonische ondersteuning?</h4>
                  <p className="text-gray-600 text-sm">
                    Voor technische ondersteuning werken via e-mail. Dringende vraag? Stuur een bericht naar 0471 31 19 77. We voorzien geen telefoonpermanentie. 
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-deep-purple to-lavender rounded-3xl p-10 text-white shadow-xl">
              <h3 className="text-2xl font-baloo mb-4">
                Onderdeel van bijleer.school
              </h3>
              <p className="text-sm text-white/90 mb-6">
                Kleuterdidactiek.be maakt deel uit van het bijleer.school-platform met meerdere educatieve tools voor het kleuteronderwijs.
              </p>
              <a
                href="https://bijleer.school"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-deep-purple px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform"
              >
                Bezoek bijleer.school
              </a>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .animate-float {
          animation: float 20s infinite ease-in-out;
        }

        .animate-float-delayed {
          animation: float 20s infinite ease-in-out;
          animation-delay: 3s;
        }

        .animate-float-delayed-2 {
          animation: float 20s infinite ease-in-out;
          animation-delay: 6s;
        }

        .animate-float-delayed-3 {
          animation: float 20s infinite ease-in-out;
          animation-delay: 9s;
        }
      `}</style>
    </div>
  );
}
