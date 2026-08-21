import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Sparkles, BookOpen, Video, Grid3x3, Calendar, Globe, TrendingUp, Heart, Rocket, Users, Lightbulb, ArrowRight } from 'lucide-react';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';

export default function PrijsPage() {
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
            Eenvoudige en transparante prijzen
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Met één vaste prijs krijg je de tools en didactiek die je met het hele team kan inzetten. Je groeit mee met ons — geen verborgen kosten, gewoon één lidmaatschap en direct toegang tot alle nieuwe tools.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-sky-blue to-lavender rounded-3xl p-1 shadow-2xl">
            <div className="bg-white rounded-3xl p-10 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-grass-green/10 text-grass-green px-4 py-2 rounded-full font-semibold mb-6">
                  <Sparkles className="w-5 h-5" />
                  Totaalpakket
                </div>
                <div className="mb-4">
                  <span className="text-5xl md:text-6xl font-baloo text-deep-purple">€4,50</span>
                  <span className="text-xl text-gray-600 ml-2">per leerling per schooljaar</span>
                </div>
                <p className="text-gray-600 text-base">
                  Eenmalige kost per schooljaar
                </p>
              </div>

              <div className="border-t border-gray-200 pt-8 mb-8">
                <h3 className="text-xl font-baloo text-deep-purple mb-6 text-center">
                  Wat krijg je hiervoor?
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Volledige toegang tot Kleuterdidactiek.be en andere bijleer-apps</span>
                        <p className="text-sm text-gray-600">Alle functionaliteiten voor planning en opvolging</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Onbeperkt aantal leerkrachten</span>
                        <p className="text-sm text-gray-600">Het hele schoolteam kan meewerken</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Nieuwe minimumdoelen geïntegreerd</span>
                        <p className="text-sm text-gray-600">Direct aan de slag met de officiële doelen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Exporteer alle data</span>
                        <p className="text-sm text-gray-600">Excel-exports voor rapporten en analyses</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Regelmatige updates</span>
                        <p className="text-sm text-gray-600">Nieuwe functies en verbeteringen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Ondersteuning en begeleiding</span>
                        <p className="text-sm text-gray-600">Hulp bij vragen en problemen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Veilige cloudopslag</span>
                        <p className="text-sm text-gray-600">Jouw data veilig bewaard op Europese servers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Deel eigen leermiddelen</span>
                        <p className="text-sm text-gray-600">Stel samen een aangepaste catalogus samen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Volledig toegang tot bijleer.school</span>
                        <p className="text-sm text-gray-600">Alle tools voor slim ICT-gebruik in de klas</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-grass-green flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800">Toegang tot woordenschat.be</span>
                        <p className="text-sm text-gray-600">Werk aan klanktekenkoppeling en woordenschat</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-lavender/10 to-sky-blue/10 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-deep-purple flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-baloo text-lg text-deep-purple mb-1">
                      Je groeit mee met ons
                    </h4>
                    <p className="text-sm text-gray-700 mb-1">
                      Geen verborgen kosten voor nieuwe tools. Geen extra abonnementen. Eén lidmaatschap geeft je direct toegang tot alle nieuwe tools zodra ze beschikbaar zijn — nu en in de toekomst. De enige kost die kan toenemen is opslagruimte, AI-tokens en begeleidingstijd waarbij we live tot bij je school komen.
                    </p>
                  </div>
                </div>

                <div className="border-t border-lavender/20 pt-4 mb-4">
                  <p className="text-sm font-semibold text-deep-purple mb-3">Inbegrepen in jouw lidmaatschap:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-4 text-center">
                      <Globe className="w-8 h-8 text-sky-blue mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">bijleer.school</p>
                      <p className="text-xs text-gray-500 mt-0.5">Slim ICT-gebruik</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <BookOpen className="w-8 h-8 text-coral-pink mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">woordenschat.be</p>
                      <p className="text-xs text-gray-500 mt-0.5">Klanktekenkoppeling</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <Video className="w-8 h-8 text-lavender mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">Vorming</p>
                      <p className="text-xs text-gray-500 mt-0.5">Professionalisering</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <Grid3x3 className="w-8 h-8 text-grass-green mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">Digitools</p>
                      <p className="text-xs text-gray-500 mt-0.5">Interactieve tools</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <Calendar className="w-8 h-8 text-deep-purple mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">Planningtools</p>
                      <p className="text-xs text-gray-500 mt-0.5">Organisatie</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center border-2 border-dashed border-lavender/40">
                      <Sparkles className="w-8 h-8 text-sunny-yellow mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">Nieuwe tools</p>
                      <p className="text-xs text-gray-500 mt-0.5">Automatisch inbegrepen</p>
                    </div>
                  </div>
                </div>

                <a
                  href="https://bijleer.school"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-deep-purple hover:text-deep-purple/80 transition-colors mt-2 font-semibold"
                >
                  <ExternalLink className="w-4 h-4" />
                  Meer info over bijleer.school en de prijs
                </a>
              </div>

              <div className="text-center">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-sky-blue text-white px-8 py-4 rounded-full font-baloo text-lg hover:scale-105 transition-transform shadow-xl"
                >
                  
                  Neem contact op
                </Link> <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-sky-blue text-white px-8 py-4 rounded-full font-baloo text-lg hover:scale-105 transition-transform shadow-xl"
                >
                 
                 Registreer je
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Vragen? Neem gerust contact met ons op
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget categories section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple mb-3">
              Past binnen uw budget
            </h2>
            <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
              Kies waarvoor jij budget vrijmaakt? De prijs blijft dezelfde en je krijgt toegang tot alle tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* ICT Digisprong */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-sky-blue flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-sky-blue/10 p-2.5 rounded-xl flex-shrink-0">
                  <Grid3x3 className="w-6 h-6 text-sky-blue" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sky-blue uppercase tracking-wide">Budget</p>
                  <h3 className="font-baloo text-lg text-deep-purple leading-tight">ICT Digisprong</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                Gebruik je Digisprong-middelen didactisch zinvol. De tools in{' '}
                <a
                  href="https://bijleer.school"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-blue font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  bijleer.school
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                helpen leerkrachten om toestellen optimaal en didactisch verantwoord in te zetten in de kleuterklas.
              </p>
            </div>

            {/* Taalheld */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-coral-pink flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-coral-pink/10 p-2.5 rounded-xl flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-coral-pink" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-coral-pink uppercase tracking-wide">Budget</p>
                  <h3 className="font-baloo text-lg text-deep-purple leading-tight">Taalheld</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                We werken aan klanktekenkoppeling en woordenschatverrijking via gerichte oefeningen en activiteiten. Volledig afgestemd op de minimumdoelen voor taal in het kleuteronderwijs.
              </p>
            </div>

            {/* Wiskunde */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-grass-green flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-grass-green/10 p-2.5 rounded-xl flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-grass-green" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-grass-green uppercase tracking-wide">Budget</p>
                  <h3 className="font-baloo text-lg text-deep-purple leading-tight">Leermaterialen</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                Een volledige leerlijn wiskunde voor kleuters, rechtstreeks gekoppeld aan de minimumdoelen. Thematisch opgebouwd, didactisch doordacht en direct bruikbaar in de klas.
              </p>
            </div>

            {/* OKAN */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-sunny-yellow flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-sunny-yellow/10 p-2.5 rounded-xl flex-shrink-0">
                  <Users className="w-6 h-6 text-[#C88A00]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#C88A00] uppercase tracking-wide">Budget</p>
                  <h3 className="font-baloo text-lg text-deep-purple leading-tight">Anderstalige nieuwkomers</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                Tools om kinderen te ondersteunen die Nederlands als nieuwe taal leren. Met{' '}
                <a
                  href="https://woordenschat.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C88A00] font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  woordenschat.be
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                als concreet voorbeeld: visuele woordenschatondersteuning en klantkoppelingen voor anderstalige leerlingen.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Twijfel je welk budget van toepassing is?{' '}
            <Link to="/contact" className="text-deep-purple font-semibold hover:underline">
              Neem contact op
            </Link>{' '}
            — we helpen je graag verder.
          </p>
        </div>

        {/* "Too good to be true?" section */}
        <div className="max-w-4xl mx-auto mb-16 space-y-6">

          {/* Headline callout */}
          <div className="bg-gradient-to-br from-deep-purple to-[#7B7FFF] rounded-3xl p-8 md:p-10 text-white shadow-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 border border-white/20">
              <Lightbulb className="w-4 h-4" />
              Klinkt te goed om waar te zijn?
            </div>
            <h2 className="text-2xl md:text-3xl font-baloo mb-4">
              We geloven in toegankelijkheid en echte leerlijnen — voor élke leerkracht
            </h2>
            <p className="text-white/85 leading-relaxed mb-4">
              We willen geen nicheplatform zijn dat alleen bereikbaar is voor scholen met een groot budget.
              Kleuterdidactiek is gebouwd vanuit een visie: <strong className="text-white">kwaliteitsvolle kleuterdidactiek moet voor iedereen beschikbaar zijn</strong>.
              Dezelfde visie die scholen ertoe bewoog om mee te investeren in de bouw van dit platform.
            </p>
            <p className="text-white/85 leading-relaxed">
              Dit platform is gefinancierd door scholen die ICT didactisch wilden inzetten.
              Met het lidmaatschapsgeld krijg je toegang tot alles wat al gebouwd is.
              Scholen die verder willen groeien, financieren samen nieuwe tools en inhoud —
              die vervolgens opnieuw aan de volledige community worden teruggegeven.
              <strong className="text-white"> Een unieke aanpak in Vlaanderen.</strong>
            </p>
          </div>

          {/* September learning lines */}
          <div className="bg-gradient-to-br from-grass-green/10 to-sky-blue/10 rounded-3xl p-8 border-2 border-grass-green/25 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-gradient-to-br from-grass-green to-[#B5F0BE] p-3 rounded-xl flex-shrink-0">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-grass-green/10 text-grass-green px-3 py-1 rounded-full text-xs font-semibold mb-2">
                  Nieuw in september
                </div>
                <h3 className="font-baloo text-xl text-deep-purple mb-2">
                  Niet alleen tools — ook een volledige leerlijn voor alle doelen
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Vanaf september krijg je niet enkel een krachtig platform, maar ook een <strong>volledig uitgewerkte leerlijn</strong> voor
                  alle minimumdoelen. Thematisch geordend, didactisch doordacht en direct bruikbaar in de klas.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {[
                {
                  icon: <BookOpen className="w-5 h-5 text-sky-blue" />,
                  title: 'Thematisch werken',
                  desc: 'Alle didactische doelen zijn uitgewerkt in thema\'s. Jij kiest het thema, het platform levert de inhoud.',
                },
                {
                  icon: <Sparkles className="w-5 h-5 text-sunny-yellow" />,
                  title: 'Krachtige activiteiten',
                  desc: 'Leuke, betekenisvolle activiteiten waarbij de leerkracht tools en ondersteuning krijgt.',
                },
                {
                  icon: <Users className="w-5 h-5 text-grass-green" />,
                  title: 'Zelfstandig oefenen',
                  desc: 'Kinderen kunnen ook zelfstandig aan de slag — het platform begeleidt ze stap voor stap.',
                },
                {
                  icon: <Heart className="w-5 h-5 text-coral-pink" />,
                  title: 'Voor élke leerkracht',
                  desc: 'Of je nu ervaren bent of net start: de leerlijn maakt je les meteen sterker.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl p-4 flex gap-3 shadow-sm">
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-sm text-deep-purple mb-1">{item.title}</p>
                    <p className="text-xs text-gray-600 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-grass-green/10 rounded-xl px-5 py-3 border border-grass-green/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>Inbegrepen in je lidmaatschap</strong> — geen extra kosten wanneer de leerlijnen live gaan.
              </p>
            </div>
          </div>

          {/* Community funding model */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-t-4 border-sky-blue">
            <div className="flex items-start gap-4 mb-5">
              <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] p-3 rounded-xl flex-shrink-0">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-baloo text-xl text-deep-purple mb-2">Het communitymodel: samen bouwen, samen profiteren</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Kleuterdidactiek is opgebouwd met financiering van scholen die ICT didactisch wilden inzetten.
                  Dat model blijven we hanteren: scholen die verder willen groeien, co-financieren nieuwe tools en inhoud.
                  Alles wat daarmee gebouwd wordt, gaat terug naar de volledige community.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { step: '1', label: 'Scholen investeren mee', bgColor: 'bg-sky-blue/10', textColor: 'text-sky-blue' },
                { step: '2', label: 'Nieuwe tools & inhoud worden gebouwd', bgColor: 'bg-grass-green/10', textColor: 'text-grass-green' },
                { step: '3', label: 'Alle leden krijgen gratis toegang', bgColor: 'bg-lavender/10', textColor: 'text-deep-purple' },
              ].map((s) => (
                <div key={s.step} className={`rounded-xl p-4 ${s.bgColor}`}>
                  <div className={`text-2xl font-baloo ${s.textColor} mb-1`}>{s.step}</div>
                  <p className="text-xs text-gray-700 leading-snug font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-deep-purple hover:text-sky-blue transition-colors text-sm font-semibold"
              >
                <ArrowRight className="w-4 h-4" />
                Interesse om mee te investeren? Neem contact op
              </Link>
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
