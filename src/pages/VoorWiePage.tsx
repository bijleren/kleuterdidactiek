import { Link } from 'react-router-dom';
import { Users, Laptop, Target, School, CheckCircle2, ArrowRight } from 'lucide-react';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';

export default function VoorWiePage() {
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
            Voor wie is Kleuterdidactiek.be?
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Een complete plannings- en opvolgingstool, speciaal ontwikkeld voor kleuterklassen in Vlaanderen om te voldoen aan de minimumdoelen.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-sky-blue/30 transition-all">
            <div className="bg-gradient-to-br from-sky-blue/20 to-lavender/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <School className="w-8 h-8 text-sky-blue" />
            </div>
            <h2 className="text-xl font-baloo text-deep-purple mb-4">
              Alle kleuterklassen in Vlaanderen
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Of je nu in een grote stedelijke school werkt of in een kleine landelijke kleuterklas,
              Kleuterdidactiek.be is ontwikkeld voor elke kleuterklasse in Vlaanderen.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Voor kleuterscholen van elke grootte</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Geschikt voor zowel individuele klassen als hele scholen</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Perfect voor teamwerk tussen leerkrachten</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-lavender/30 transition-all">
            <div className="bg-gradient-to-br from-lavender/20 to-sky-blue/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-lavender" />
            </div>
            <h2 className="text-xl font-baloo text-deep-purple mb-4">
              Ondersteuning bij nieuwe minimumdoelen
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Speciaal ontwikkeld om je te ondersteunen bij het werken met de nieuwe minimumdoelen
              voor het kleuteronderwijs in Vlaanderen.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Minimumdoelen geïntegreerd in het systeem</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Eenvoudig opvolgen van doelstellingen per leerling</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Duidelijk overzicht van wat nog moet gebeuren</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-grass-green/30 transition-all">
            <div className="bg-gradient-to-br from-grass-green/20 to-sky-blue/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Laptop className="w-8 h-8 text-grass-green" />
            </div>
            <h2 className="text-xl font-baloo text-deep-purple mb-4">
              ICT slim inzetten
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Voor leerkrachten die ICT op een slimme en efficiënte manier willen inzetten
              om aan de minimumdoelen te werken.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Gebruiksvriendelijke digitale tools</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Alles online toegankelijk, overal en altijd</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Automatische rapportage en data-export</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-deep-purple/30 transition-all">
            <div className="bg-gradient-to-br from-deep-purple/20 to-lavender/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-deep-purple" />
            </div>
            <h2 className="text-xl font-baloo text-deep-purple mb-4">
              Voor het hele schoolteam
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Werk samen met je collega's aan een gedeelde visie en zorg voor duidelijke
              verticale leerlijnen doorheen de hele kleuterschool.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Dezelfde materialen over scholen heen</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Inzicht in wat andere klassen doen</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Eenvoudig materiaal delen met collega's</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-sky-blue to-lavender rounded-3xl p-8 text-center text-white shadow-2xl">
          <h2 className="text-2xl font-baloo mb-6">
            Klaar om te starten?
          </h2>
          <p className="text-base mb-6 text-white/90 max-w-2xl mx-auto">
            Ontdek hoe Kleuterdidactiek.be jouw kleuterklas kan ondersteunen bij de nieuwe minimumdoelen
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-sky-blue px-8 py-4 rounded-full font-baloo text-lg hover:scale-105 transition-transform shadow-xl"
            >
              Gratis registreren
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/prijs"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-full font-baloo text-lg hover:bg-white/20 transition-colors border-2 border-white/30"
            >
              Bekijk prijzen
            </Link>
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
