import { Link } from 'react-router-dom';
import { BookText, Gamepad2, PenTool, Hand, Video, Grid3x3, BarChart3, Calendar, Target, Download, ArrowRight, CheckCircle2, BookOpen, Lightbulb, GraduationCap } from 'lucide-react';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';

export default function HoeWerktHetPage() {
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
            Hoe werkt het?
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Ontdek alle mogelijkheden om op een slimme en efficiënte manier aan de minimumdoelen te werken.
          </p>
        </div>

        {/* Didactiek highlight */}
        <div className="bg-gradient-to-br from-deep-purple to-[#7B7FFF] rounded-3xl p-8 md:p-10 mb-16 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-shrink-0 bg-white/10 p-5 rounded-2xl border border-white/20">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm font-semibold mb-3 border border-white/20">
                <Lightbulb className="w-4 h-4" />
                Meer dan tools — echte didactische ondersteuning
              </div>
              <h2 className="text-2xl md:text-3xl font-baloo mb-3">
                Wij helpen je de doelen écht bereiken
              </h2>
              <p className="text-white/85 leading-relaxed mb-5">
                Kleuterdidactiek stopt niet bij het bijhouden van een checklist. Het platform maakt de inhoud van elk minimumdoel
                toegankelijk: je weet <strong className="text-white">wat</strong> je moet aanleren, <strong className="text-white">hoe</strong> je het kunt oefenen
                en <strong className="text-white">of</strong> elk kind het bereikt heeft. Van volledige woordenschatlijsten tot
                gerichte oefeningen en observatietools — alles is didactisch doordacht.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, label: 'Volledige woordenschatlijsten', sub: 'Alle woorden per domein uit de minimumdoelen' },
                  { icon: <Gamepad2 className="w-5 h-5" />, label: 'Gerichte oefeningen', sub: 'Spelletjes, schrijf- en doe-activiteiten per doel' },
                  { icon: <BarChart3 className="w-5 h-5" />, label: 'Inzicht per kind', sub: 'Volg wie welk doel bereikt heeft' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/10 rounded-xl p-4 border border-white/15">
                    <div className="text-white mb-2">{item.icon}</div>
                    <p className="font-semibold text-sm mb-1">{item.label}</p>
                    <p className="text-white/65 text-xs leading-snug">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple text-center mb-4">
            Wij proberen elk doel te ondersteunen met slimme oplossingen.
          </h2>
          <p className="text-center text-gray-500 max-w-2xl mx-auto mb-12 text-sm">
            Niet zomaar een tool — elk onderdeel is bedacht vanuit een didactisch kader
            zodat leerkrachten weten <em>wat</em> ze moeten aanleren en <em>hoe</em> ze het kunnen aanpakken.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-sky-blue/30">
              <div className="bg-gradient-to-br from-sky-blue/20 to-lavender/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <BookText className="w-8 h-8 text-sky-blue" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-3">
                Woordenschat
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                De minimumdoelen bevatten een uitgebreide woordenschatlijst per thema.
                Kleuterdidactiek maakt die lijst toegankelijk: per klas, per kind, per domein.
                Je ziet meteen welke woorden al gekend zijn en welke nog extra aandacht nodig hebben.
              </p>
              <ul className="space-y-1.5">
                {[
                  'Volledige lijst van woorden uit de minimumdoelen',
                  'Ingedeeld per thema: dieren, emoties, lichaam, wonen…',
                  'Eigen woordenschatlijsten aanmaken per klas',
                  'Exporteer voor ouders, collega\'s of zorgteam',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-sky-blue flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-lavender/30">
              <div className="bg-gradient-to-br from-lavender/20 to-sky-blue/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Gamepad2 className="w-8 h-8 text-lavender" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-3">
                Speel
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Leuke opdrachten meteen gekoppeld aan de minimumdoelen.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-grass-green/30">
              <div className="bg-gradient-to-br from-grass-green/20 to-sky-blue/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <PenTool className="w-8 h-8 text-grass-green" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-3">
                Schrijf
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
               Werk aan schrijfmotoriek en ontdek hoe je aan de nieuwe minimumdoelen kan werken.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-deep-purple/30">
              <div className="bg-gradient-to-br from-deep-purple/20 to-lavender/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Hand className="w-8 h-8 text-deep-purple" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-3">
                Doe
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Praktische doe-activiteiten en opdrachten voor in de klas.
               Alles gekoppeld aan doelen.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-sky-blue/30">
              <div className="bg-gradient-to-br from-sky-blue/20 to-grass-green/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Video className="w-8 h-8 text-sky-blue" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-3">
                Kijk
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Educatieve video's en digitaal materiaal.
                Unieke video's, maar ook een krachtige verzameling van bestaande video's. Gekoppeld aan de nieuwe minimumdoelen.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-lavender/30">
              <div className="bg-gradient-to-br from-lavender/20 to-deep-purple/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Grid3x3 className="w-8 h-8 text-lavender" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-3">
                Hoekenwerk
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Organiseer en plan activiteiten voor verschillende hoeken in de klas.
                Volg op welke leerlingen aan welke doelen werken in elke hoek. Onze interactieve hoekenwerkplanner maakt het verschil.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-grass-green/30 md:col-span-2 lg:col-span-1">
              <div className="bg-gradient-to-br from-grass-green/20 to-lavender/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-grass-green" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-3">
                Routines
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Dagelijkse routines en structuren koppelen aan minimumdoelen.
                Van ochtendkring tot opruimmoment, maak elk moment waardevol. Koppel ze meteen aan de doelen.
              </p>
            </div>
          </div>
        </div>

        {/* Vocabulary spotlight */}
        <div className="bg-gradient-to-br from-sky-blue/10 via-grass-green/10 to-sunny-yellow/10 rounded-3xl p-8 md:p-10 mb-20 border-2 border-sky-blue/25 shadow-lg">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-sky-blue/10 text-sky-blue px-3 py-1 rounded-full text-sm font-semibold mb-4">
                <BookOpen className="w-4 h-4" />
                Woordenschat — een kerndomein
              </div>
              <h3 className="text-2xl font-baloo text-deep-purple mb-4">
                Een helder, volledig overzicht van alle te leren woorden
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                De Vlaamse minimumdoelen bevatten honderden woorden die kleuters moeten leren beheersen.
                Kleuterdidactiek heeft die woorden per thema en leerjaar gestructureerd zodat jij als leerkracht
                precies weet waar je staat — en wat er nog komt.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Dit gaat verder dan een eenvoudige lijst: het platform koppelt elke woordenschatactiviteit
                automatisch aan de bijhorende minimumdoelen, volgt de voortgang per kind en geeft je
                exporteerbare overzichten voor oudergesprekken of zorgteamoverleg.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Bekijk de woordenschatlijst
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-56 space-y-2">
              {[
                { label: 'Dieren', count: '48 woorden', color: 'text-coral-pink border-coral-pink/30 bg-coral-pink/5' },
                { label: 'Emoties & gevoel', count: '24 woorden', color: 'text-[#C97D00] border-sunny-yellow/40 bg-sunny-yellow/5' },
                { label: 'Lichaamsdelen', count: '32 woorden', color: 'text-sky-blue border-sky-blue/30 bg-sky-blue/5' },
                { label: 'Voertuigen', count: '28 woorden', color: 'text-grass-green border-grass-green/30 bg-grass-green/5' },
                { label: 'Wonen & thuis', count: '36 woorden', color: 'text-deep-purple border-lavender/30 bg-lavender/10' },
                { label: '+ 15 andere thema\'s', count: '', color: 'text-gray-400 border-gray-200 bg-gray-50' },
              ].map((cat) => (
                <div key={cat.label} className={`rounded-xl px-4 py-2.5 border-2 ${cat.color} flex justify-between items-center`}>
                  <span className="font-semibold text-sm">{cat.label}</span>
                  {cat.count && <span className="text-xs opacity-70">{cat.count}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple text-center mb-12">
            Planning en opvolging
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-sky-blue/10 to-lavender/10 rounded-3xl p-8">
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Target className="w-8 h-8 text-sky-blue" />
              </div>
              <h3 className="text-2xl font-baloo text-deep-purple mb-4">
                Duidelijk doelenoverzicht
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Krijg een helder overzicht van alle minimumdoelen. Zie in één oogopslag welke doelen
                je al behandeld hebt en waar je nog aan moet werken. Filter op vak, domein of leeftijd.
              </p>
            </div>

            <div className="bg-gradient-to-br from-lavender/10 to-deep-purple/10 rounded-3xl p-8">
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <BarChart3 className="w-8 h-8 text-lavender" />
              </div>
              <h3 className="text-2xl font-baloo text-deep-purple mb-4">
                Evalueer en volg op
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Evalueer eenvoudig de voortgang van je leerlingen. Registreer observaties en
                beoordeel per doel. Laagdrempelig en handig! 
              </p>
            </div>

            <div className="bg-gradient-to-br from-grass-green/10 to-sky-blue/10 rounded-3xl p-8">
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Calendar className="w-8 h-8 text-grass-green" />
              </div>
              <h3 className="text-2xl font-baloo text-deep-purple mb-4">
                Plan je lessen
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Stel lessen samen of gebruik het platform en ontdek nadien aan welke doelen je gewerkt hebt in de les.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 md:p-12 shadow-2xl mb-20">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-br from-deep-purple/20 to-lavender/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-deep-purple" />
            </div>
            <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple mb-4">
              Alle data is exporteerbaar
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-base">
             Exporteer alles naar Excel voor rapporten, analyses of archivering.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-sky-blue/5 to-lavender/5 rounded-2xl p-6 border border-sky-blue/20">
              <h4 className="font-baloo text-lg text-deep-purple mb-3">
                Evaluatierapporten
              </h4>
              <p className="text-sm text-gray-700">
                Exporteer evaluaties per leerling, per klas of per doel. Perfect voor oudergesprekken en rapporten.
              </p>
            </div>
            <div className="bg-gradient-to-br from-lavender/5 to-deep-purple/5 rounded-2xl p-6 border border-lavender/20">
              <h4 className="font-baloo text-lg text-deep-purple mb-3">
                Woordenschatlijsten
              </h4>
              <p className="text-sm text-gray-700">
                Wij hebben alle woorden uit de nieuwe minimumdoelen gehaald die moet beheersd worden door de leerlingen.
              </p>
            </div>
            <div className="bg-gradient-to-br from-grass-green/5 to-sky-blue/5 rounded-2xl p-6 border border-grass-green/20">
              <h4 className="font-baloo text-lg text-deep-purple mb-3">
                Planningsoverzichten
              </h4>
              <p className="text-sm text-gray-700">
                Exporteer je lesplanningen of lesoverzichten..
              </p>
            </div>
            <div className="bg-gradient-to-br from-deep-purple/5 to-lavender/5 rounded-2xl p-6 border border-deep-purple/20">
              <h4 className="font-baloo text-lg text-deep-purple mb-3">
                Voortgangsanalyses
              </h4>
              <p className="text-sm text-gray-700">
                Download overzichten van de klasvoortgang per minimumdoel voor teamoverleg en evaluatie.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-sky-blue to-lavender rounded-3xl p-8 text-center text-white shadow-2xl">
          <h2 className="text-2xl font-baloo mb-6">
            Klaar om Kleuterdidactiek.be uit te proberen?
          </h2>
          <p className="text-base mb-6 text-white/90 max-w-2xl mx-auto">
            Start vandaag nog en ontdek hoe eenvoudig werken met minimumdoelen kan zijn
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
