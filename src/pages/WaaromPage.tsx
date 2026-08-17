import { Link } from 'react-router-dom';
import { Clock, ListChecks, Users, Share2, ArrowRight, Sparkles, Heart, Zap, Shield } from 'lucide-react';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';

export default function WaaromPage() {
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
            Waarom Kleuterdidactiek.be?
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Ontdek waarom kleuterdidactiek.be het antwoord is op vele noden van kleuterleerkrachten.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white rounded-3xl p-10 shadow-xl border-2 border-transparent hover:border-sky-blue/30 transition-all">
            <div className="bg-gradient-to-br from-sky-blue/20 to-lavender/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-sky-blue" />
            </div>
            <h2 className="text-2xl font-baloo text-deep-purple mb-4">
              Bespaar tijd als leerkracht
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Als leerkracht heb je het al druk genoeg. Kleuterdidactiek.be neemt administratieve taken
              over zodat jij meer tijd hebt voor waar het om draait: je leerlingen.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Automatische koppeling van activiteiten aan minimumdoelen</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Snelle evaluaties met slechts een paar kliks</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Instant overzichten en rapporten genereren</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Minder tijd aan planning, meer tijd in de klas</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-xl border-2 border-transparent hover:border-lavender/30 transition-all">
            <div className="bg-gradient-to-br from-lavender/20 to-deep-purple/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
              <ListChecks className="w-10 h-10 text-lavender" />
            </div>
            <h2 className="text-2xl font-baloo text-deep-purple mb-4">
              Overzicht van wat er nog moet gebeuren
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Verlies nooit het overzicht. Zie altijd duidelijk welke minimumdoelen je al
              behandeld hebt en waar je nog aan moet werken.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Helder dashboard met voortgang per doel</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Visuele indicatoren voor nog te behandelen doelen</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Werk aan woordenschat zoals nooit ervoor</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Overzicht per leerling en per klas</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-xl border-2 border-transparent hover:border-grass-green/30 transition-all">
            <div className="bg-gradient-to-br from-grass-green/20 to-sky-blue/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-grass-green" />
            </div>
            <h2 className="text-2xl font-baloo text-deep-purple mb-4">
              Samenwerken met andere klassen
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Werk samen met collega's en creëer duidelijke verticale leerlijnen doorheen
              de hele kleuterschool. Samen sta je sterker!
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Deel materialen en activiteiten met collega's</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Zie wat andere klassen aan welke doelen werken</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Bouw samen aan een schoolbrede aanpak</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Consistent werken doorheen alle leerjaren</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-xl border-2 border-transparent hover:border-deep-purple/30 transition-all">
            <div className="bg-gradient-to-br from-deep-purple/20 to-lavender/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
              <Share2 className="w-10 h-10 text-deep-purple" />
            </div>
            <h2 className="text-2xl font-baloo text-deep-purple mb-4">
              Gebruiksvriendelijk en makkelijk te delen
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Geen ingewikkelde systemen of lange handleidingen. Kleuter Planner is intuïtief
              en direct te gebruiken. Deel eenvoudig met iedereen die het nodig heeft.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Intuïtieve interface, geen technische kennis vereist</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Toegankelijk op tablet, laptop en desktop</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Deel rapporten met één klik</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Veilige cloud-opslag, altijd toegankelijk</span>
              </li>
            </ul>
          </div>
        </div>

       
        <div className="bg-gradient-to-r from-sky-blue to-lavender rounded-3xl p-8 text-center text-white shadow-2xl">
          <h2 className="text-2xl font-baloo mb-6">
            Overtuigd? Start vandaag nog!
          </h2>
          <p className="text-base mb-6 text-white/90 max-w-2xl mx-auto">
            Sluit je aan bij honderden tevreden kleuterleerkrachten in Vlaanderen
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
