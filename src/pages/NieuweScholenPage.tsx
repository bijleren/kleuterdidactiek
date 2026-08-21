import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';
import FeedbackModal from '../components/FeedbackModal';
import { ArrowRight, ExternalLink, Mail, Sparkles, BookOpen, Calculator, School, MessageSquare } from 'lucide-react';

export default function NieuweScholenPage() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  useEffect(() => {
    if (document.querySelector('script[src="https://player.vimeo.com/api/player.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-[#FFF5E6] to-[#E8F6F3] font-quicksand overflow-hidden relative">
      {/* Floating bg shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-24 h-24 bg-coral-pink rounded-full opacity-20 top-[10%] left-[5%] animate-float" />
        <div className="absolute w-16 h-16 bg-sky-blue rounded-full opacity-20 top-[30%] right-[6%] animate-float-delayed" />
        <div className="absolute w-20 h-20 bg-sunny-yellow rounded-full opacity-20 bottom-[20%] left-[10%] animate-float-delayed-2" />
        <div className="absolute w-14 h-14 bg-grass-green rounded-full opacity-20 bottom-[40%] right-[15%] animate-float-delayed-3" />
      </div>

      <MarketingHeader />

      <main className="relative z-5 max-w-4xl mx-auto px-6 py-12">

        {/* ── HERO ── */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-grass-green/10 text-grass-green px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-grass-green/20">
            <Sparkles className="w-4 h-4" />
            Schooljaar 2026–2027
          </div>
          <h1 className="text-3xl md:text-5xl font-baloo text-deep-purple mb-4 leading-tight">
            Nieuwe scholen welkom<br />
            <span className="text-sky-blue">voor 2026–2027</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Interesse om met Kleuterdidactiek te starten volgend schooljaar? Je bent van harte welkom
            om alvast rond te kijken. De volledige inhoud en het definitieve aanbod zijn beschikbaar
            <strong> eind augustus 2026</strong>.
          </p>
        </section>

        {/* ── VIDEO (portrait) ── */}
        <section className="mb-16 flex justify-center">
          <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-3xl">
            {/* Left: personal message */}
            <div className="md:flex-1 text-center md:text-left">
              <div className="text-4xl mb-4">👋</div>
              <p className="text-gray-700 leading-relaxed text-base">
                Hey, ik ben <strong className="text-deep-purple">Lucas</strong> en heb Bijleren opgericht. Ik heb deze video opgenomen om mijn verhaal met jullie te delen. Ik leg je ook meteen uit hoe de toekomst eruit ziet. Graag bouw ik samen met jou aan iets unieks. Een video zegt meer dan duizend woorden! Kijk maar mee.
              </p>
            </div>
          <div className="w-full max-w-sm flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl">
            <div style={{ padding: '133.33% 0 0 0', position: 'relative' }}>
              <iframe
                src="https://player.vimeo.com/video/1202907697?h=4817eb52af&badge=0&autopause=0&player_id=0&app_id=58479"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                title="IMG_4549"
              />
            </div>
            </div>
          </div>
        </section>

        {/* ── COME BACK END OF AUGUST ── */}
        <section className="mb-16">
          {/* Two videos side by side */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-baloo text-deep-purple mb-3 text-center">
                Kleuterdidactiek.be in het kort
              </h3>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                  <iframe
                    src="https://player.vimeo.com/video/1202752400?h=8d6bf8c7fe&badge=0&autopause=0&player_id=0&app_id=58479"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    title="kleuterdidactiek"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-baloo text-deep-purple mb-3 text-center">
                Dit hebben we voor de kleuterschool
              </h3>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                  <iframe
                    src="https://player.vimeo.com/video/1203171852?h=0cbcbe4f41&badge=0&autopause=0&player_id=0&app_id=58479"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    title="kleuter"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-sunny-yellow/20 to-coral-pink/10 rounded-3xl p-8 border-2 border-sunny-yellow/30 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-2xl font-baloo text-deep-purple mb-3">Kijk gerust alvast rond</h2>
            <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
              Verken en probeer uit, wil je echt het volledige aanbod zien? Kom dan terug <strong>eind augustus 2026</strong>.
              Tegen dan is alles klaar voor een vliegende start van het nieuwe schooljaar.
            </p>
          </div>
        </section>
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple mb-3">Wat kost het lidmaatschap?</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Eén lidmaatschap geeft je school toegang tot alle bijleer-tools.
            </p>
          </div>

          {/* Price card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-t-4 border-sky-blue max-w-md mx-auto text-center">
            <p className="text-sm font-semibold text-sky-blue uppercase tracking-wide mb-2">Per leerling per jaar</p>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-5xl font-baloo text-deep-purple">€4,50</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">excl. 21% btw</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Onbeperkt leerkrachten per school. Toegang tot alle tools gedurende het volledige schooljaar.
            </p>
          </div>

          {/* What's included */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: <School className="w-5 h-5 text-white" />,
                gradient: 'from-deep-purple to-[#7B7FFF]',
                label: 'bijleer.school',
                url: 'https://bijleer.school',
                desc: 'Schoolbeheer + krachtige ICT-tools voor het volledige team',
                accent: 'border-deep-purple',
              },
              {
                icon: <Sparkles className="w-5 h-5 text-white" />,
                gradient: 'from-sky-blue to-[#7EDCD5]',
                label: 'kleuterdidactiek.be',
                url: 'https://kleuterdidactiek.be',
                desc: 'Minimumdoelen, activiteitenplanning en leerlingopvolging voor de kleuterklas',
                accent: 'border-sky-blue',
              },
              {
                icon: <BookOpen className="w-5 h-5 text-white" />,
                gradient: 'from-coral-pink to-[#FF8E8E]',
                label: 'woordenschat.be',
                url: 'https://woordenschat.be',
                desc: 'Alles rond fonemisch bewustzijn en klanktekenkoppeling',
                accent: 'border-coral-pink',
              },
              {
                icon: <Calculator className="w-5 h-5 text-white" />,
                gradient: 'from-grass-green to-[#7AE08A]',
                label: 'Twee apps inbegrepen',
                url: null,
                desc: 'Een app voor rekenen en een app voor letters & lezen — voor extra oefening',
                accent: 'border-grass-green',
              },
            ].map((item) => (
              <div key={item.label} className={`bg-white rounded-2xl p-5 shadow-md border-l-4 ${item.accent} flex gap-4`}>
                <div className={`bg-gradient-to-br ${item.gradient} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-baloo text-deep-purple hover:text-sky-blue transition-colors flex items-center gap-1"
                    >
                      {item.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="font-baloo text-deep-purple">{item.label}</p>
                  )}
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DIDACTIC SUPPORT ── */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-deep-purple to-[#7B7FFF] rounded-3xl p-8 text-white text-center">
            <div className="text-3xl mb-4">🎓</div>
            <h2 className="text-2xl font-baloo mb-3">Meer dan tools — ook didactische begeleiding</h2>
            <p className="text-white/80 leading-relaxed max-w-xl mx-auto mb-6">
              Het lidmaatschap omvat ook begeleiding doorheen het schooljaar.
              Lees alles over wat er inbegrepen is op de prijzenpagina van bijleer.school.
            </p>

            {/* Whole-school toolkit */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6 max-w-xl mx-auto text-left">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 text-center">
                Als alle klassen van de school deelnemen
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: '💬', label: 'Wekelijkse Q&A', desc: 'Live vragen beantwoord door didactisch experten' },
                  { icon: '📰', label: 'Didactische nieuwsbrief', desc: 'Praktische tips en inzichten elke week in je mailbox' },
                  { icon: '🎥', label: 'Volledige webinars', desc: 'Verdiepende sessies over kleuterdidactiek en tools' },
                  { icon: '🏫', label: 'Live trainingen', desc: 'Optie voor persoonlijke begeleiding op school' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{item.label}</p>
                      <p className="text-white/60 text-xs leading-snug mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://bijleer.school/prijzen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-deep-purple px-7 py-3 rounded-full font-baloo text-base shadow-lg hover:scale-105 transition-transform"
            >
              Bekijk volledige prijsinfo
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://blinkqr.app/qr/39AYRLBQ8A"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-7 py-3 rounded-full font-baloo text-base hover:bg-white/20 transition-colors"
            >
              Productcatalogus
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* ── FEEDBACK ── */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-grass-green/10 to-sky-blue/10 rounded-3xl p-8 border-2 border-grass-green/20 text-center">
            <div className="text-3xl mb-4">💬</div>
            <h2 className="text-2xl font-baloo text-deep-purple mb-3">Alle feedback is welkom!</h2>
            <p className="text-gray-600 leading-relaxed max-w-xl mx-auto mb-6">
              Heb je vragen, suggesties of opmerkingen? We bouwen dit platform samen met leerkrachten
              en jouw input maakt het beter. Neem gerust contact op.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-sky-blue text-white px-7 py-3 rounded-full font-baloo text-base shadow-lg hover:scale-105 transition-transform"
            >
              <Mail className="w-4 h-4" />
              Stuur feedback
            </Link>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-sky-blue to-grass-green rounded-3xl p-10 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-baloo text-white mb-4">
              Klaar om te starten?
            </h2>
            <p className="text-white/90 text-base mb-4 max-w-xl mx-auto">
              Maak een gratis account aan en verken de omgeving. Het definitieve aanbod is beschikbaar eind augustus 2026.
            </p>
            <p className="text-white/80 text-sm mb-6 max-w-xl mx-auto">
              Geef jezelf de keuze om tot 1 oktober tot een beslissing te komen. Wil je vooraf al echt meer informatie, laat het weten via{' '}
              <a href="mailto:info@bijleren.eu" className="underline underline-offset-2 hover:text-white transition-colors">info@bijleren.eu</a>.
            </p>

            {/* 2-step flow */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 text-sm text-white/90">
              <div className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2">
                <span className="w-5 h-5 rounded-full bg-white text-sky-blue font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
                Registreer je account
              </div>
              <ArrowRight className="w-4 h-4 text-white/50 hidden sm:block" />
              <div className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2">
                <span className="w-5 h-5 rounded-full bg-white text-sky-blue font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
                Maak een nieuwe school aan of voeg jezelf toe via schoolcode
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-deep-purple px-8 py-4 rounded-full font-baloo text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                Gratis account aanmaken
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://bijleer.school/prijzen"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 text-white border-2 border-white/30 px-8 py-4 rounded-full font-baloo text-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                Prijsinfo
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── FEEDBACK BUTTON ── */}
        <section className="text-center mt-10">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-deep-purple text-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Feedback of vragen? Laat het ons weten
          </button>
        </section>

      </main>

      <MarketingFooter />

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float { animation: float 20s infinite ease-in-out; }
        .animate-float-delayed { animation: float 20s infinite ease-in-out; animation-delay: 3s; }
        .animate-float-delayed-2 { animation: float 20s infinite ease-in-out; animation-delay: 6s; }
        .animate-float-delayed-3 { animation: float 20s infinite ease-in-out; animation-delay: 9s; }
      `}</style>
    </div>
  );
}
