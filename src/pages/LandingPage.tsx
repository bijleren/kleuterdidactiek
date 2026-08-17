import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, Clock, BookOpen, Sparkles, Users, TrendingUp, CheckCircle2,
  ArrowRight, Heart, Layers, BarChart3, Calendar, Video, PenTool,
  Gamepad2, BookMarked, Mail, FileText, ExternalLink,
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/voor-wie', label: 'Voor wie?' },
  { to: '/hoe-werkt-het', label: 'Hoe werkt het?' },
  { to: '/waarom', label: 'Waarom?' },
  { to: '/prijs', label: 'Prijs' },
  { to: '/nieuwe-scholen', label: '✨ Nieuwe scholen 2026–2027', highlight: true },
  { to: '/contact', label: 'Contact' },
];

export default function LandingPage() {
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
        <div className="absolute w-16 h-16 bg-sky-blue rounded-full opacity-20 top-[25%] right-[8%] animate-float-delayed" />
        <div className="absolute w-20 h-20 bg-sunny-yellow rounded-full opacity-20 bottom-[18%] left-[12%] animate-float-delayed-2" />
        <div className="absolute w-14 h-14 bg-grass-green rounded-full opacity-20 bottom-[35%] right-[18%] animate-float-delayed-3" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-deep-purple to-[#7B7FFF] rounded-[40px] shadow-2xl px-6 py-6 mx-4 mt-4 md:mx-6 md:mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="hidden md:block flex-1" />
            <h1 className="text-3xl md:text-4xl font-baloo text-white text-center drop-shadow-lg md:flex-1 whitespace-nowrap">
              Kleuterdidactiek
            </h1>
            <div className="flex md:flex-1 justify-center md:justify-end gap-3">
              <Link to="/login" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold text-sm transition-all border border-white/20">
                Aanmelden
              </Link>
              <Link to="/register" className="bg-white text-deep-purple px-4 py-2 rounded-full font-semibold text-sm shadow-lg hover:scale-105 transition-transform">
                Registreer
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {NAV_LINKS.map((l, i) => (
              <span key={l.to} className="flex items-center gap-3">
                {i > 0 && <span className="text-white/40">•</span>}
                <Link to={l.to} className={`transition-colors text-sm font-medium ${'highlight' in l && l.highlight ? 'text-[#FFE66D] hover:text-white font-semibold' : 'text-white/80 hover:text-white'}`}>{l.label}</Link>
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-5 max-w-6xl mx-auto px-6 py-12">

        {/* ── HERO ── */}
        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-grass-green/10 text-grass-green px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-grass-green/20">
            <Heart className="w-4 h-4" />
            Gemaakt in co-creatie met kleuterscholen
          </div>

          <h2 className="text-3xl md:text-5xl font-baloo text-deep-purple mb-6 leading-tight max-w-4xl mx-auto">
            Meer tijd voor de klas,<br />
            <span className="text-sky-blue">meer tijd voor jezelf.</span>
          </h2>

          {/* Vimeo demo videos side by side */}
          <div className="mb-8 max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-deep-purple mb-2 text-center">Kleuterdidactiek.be in het kort</p>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
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
              <p className="text-sm font-semibold text-deep-purple mb-2 text-center">All onze kleutertools</p>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
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

          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Kleuterdidactiek geeft leerkrachten een helder overzicht van alle minimumdoelen,
            koppelt elke activiteit automatisch aan de juiste doelen en toont in één blik
            hoe elk kind evolueert — zonder extra papierwerk.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Link to="/register" className="bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-8 py-4 rounded-full font-baloo text-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
              Gratis starten
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/hoe-werkt-het" className="bg-white text-deep-purple border-2 border-deep-purple/20 px-8 py-4 rounded-full font-baloo text-lg shadow-lg hover:scale-105 transition-transform">
              Hoe werkt het?
            </Link>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: '200+', label: 'Vlaamse minimumdoelen', color: 'text-coral-pink' },
              { value: '8', label: 'Ontwikkelingsdomeinen', color: 'text-grass-green' },
              { value: '36', label: 'Weken per schooljaar', color: 'text-sky-blue' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-md text-center">
                <div className={`text-3xl font-baloo ${s.color} mb-1`}>{s.value}</div>
                <div className="text-xs text-gray-500 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CO-CREATION BANNER ── */}
        <section className="bg-gradient-to-r from-deep-purple/5 to-sky-blue/10 rounded-3xl p-8 mb-20 border-2 border-deep-purple/10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 bg-gradient-to-br from-deep-purple to-[#7B7FFF] p-5 rounded-2xl shadow-xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-baloo text-deep-purple mb-2">Gebouwd samen met leerkrachten</h3>
              <p className="text-gray-600 leading-relaxed">
                Elk onderdeel van dit platform is ontwikkeld in nauwe samenwerking met kleuterjuffen en -meesters uit Vlaamse scholen.
                Geen theorie — pure praktijk. De noden op de werkvloer sturen elke nieuwe functie aan.
                Jouw feedback bepaalt mee hoe het platform verder groeit.
              </p>
            </div>
          </div>
        </section>

        {/* ── THREE PILLARS ── */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple mb-3">Niet zomaar tools — echte didactiek</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Het platform denkt met je mee vanuit een didactisch kader, niet als een losse verzameling apps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Calendar className="w-8 h-8 text-white" />,
                gradient: 'from-coral-pink to-[#FFB8C5]',
                title: 'Plan je lessen',
                desc: 'Bouw een lessenplanner op die automatisch de juiste minimumdoelen koppelt aan elke activiteit, elk materiaal en elke video die je inzet. Achteraf zie je per les exact welke doelen je hebt geoefend.',
              },
              {
                icon: <Target className="w-8 h-8 text-white" />,
                gradient: 'from-sky-blue to-[#7EDCD5]',
                title: 'Volg de doelen',
                desc: 'Zie week per week welke doelen geoefend zijn, hoeveel keer en door wie. Kleurcodering maakt voortgang in één oogopslag zichtbaar.',
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-white" />,
                gradient: 'from-grass-green to-[#B5F0BE]',
                title: 'Evalueer kinderen',
                desc: 'Genereer individuele rapporten per leerling en ontdek meteen waar extra aandacht nodig is — altijd onderbouwd met data.',
              },
            ].map((p) => (
              <div key={p.title} className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-transparent hover:border-t-sky-blue/40">
                <div className={`bg-gradient-to-br ${p.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-5`}>
                  {p.icon}
                </div>
                <h3 className="font-baloo text-xl text-deep-purple mb-3">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VOCABULARY SPOTLIGHT ── */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-sky-blue/10 via-grass-green/10 to-sunny-yellow/10 rounded-3xl p-8 md:p-10 border-2 border-sky-blue/30 shadow-xl">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-sky-blue/10 text-sky-blue px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  <BookOpen className="w-4 h-4" />
                  Woordenschat — een kerndomein
                </div>
                <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple mb-4">
                  Helder overzicht van alle woordenschat volgens de minimumdoelen
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  De woordenschatmodule biedt een volledig overzicht van alle te verwerven woorden per thema
                  en leerjaar — rechtstreeks afgeleid van de officiële Vlaamse minimumdoelen.
                  Plan per groep welke woordenschat je aanpakt, volg de voortgang van elk kind
                  en exporteer lijsten voor ouders of zorgteams.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    'Categorieën: dieren, voertuigen, emoties, lichaam, wonen & meer',
                    'Eigen woordenschatlijsten aanmaken per klas',
                    'Koppeling met klanktekenkoppeling via woordenschat.be',
                    'Exporteer naar PDF of Excel voor ouders en collega\'s',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-grass-green flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Link to="/register" className="bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-semibold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Bekijk de online lijst
                  </Link>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSe4pyNY7SyraA630gGPm6C4XL2n3Qpbr823-psqYJ_D7Da0Kg/viewform?usp=dialog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-sunny-yellow text-deep-purple px-6 py-3 rounded-full font-semibold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Ontvang gedrukte versie
                  </a>
                </div>
              </div>

              {/* Vocabulary mini preview */}
              <div className="flex-shrink-0 w-full md:w-64 space-y-3">
                {[
                  { label: 'Dieren', count: '48 woorden', color: 'bg-coral-pink/10 border-coral-pink/30 text-coral-pink' },
                  { label: 'Emoties & gevoel', count: '24 woorden', color: 'bg-sunny-yellow/10 border-sunny-yellow/40 text-[#C97D00]' },
                  { label: 'Lichaamsdelen', count: '32 woorden', color: 'bg-sky-blue/10 border-sky-blue/30 text-sky-blue' },
                  { label: 'Voertuigen', count: '28 woorden', color: 'bg-grass-green/10 border-grass-green/30 text-grass-green' },
                  { label: 'Wonen & thuis', count: '36 woorden', color: 'bg-lavender/20 border-lavender/30 text-deep-purple' },
                ].map((cat) => (
                  <div key={cat.label} className={`rounded-xl px-4 py-3 border-2 ${cat.color} bg-white flex justify-between items-center`}>
                    <span className="font-semibold text-sm">{cat.label}</span>
                    <span className="text-xs opacity-70">{cat.count}</span>
                  </div>
                ))}
                <div className="text-center text-xs text-gray-400 pt-1">+ 15 andere categorieën</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURE GRID ── */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-baloo text-deep-purple mb-3">Alles wat je nodig hebt, op één plek</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Elk onderdeel is ontworpen om de dagelijkse werkdruk van de kleuterleerkracht te verlagen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Target className="w-6 h-6 text-white" />,
                gradient: 'from-coral-pink to-[#FF8E8E]',
                title: '200+ Minimumdoelen',
                desc: 'Volg alle Vlaamse onderwijsdoelen per domein doorheen het schooljaar. Registreer activiteiten en zie meteen welke doelen wanneer geoefend zijn.',
                accent: 'border-coral-pink',
              },
              {
                icon: <Gamepad2 className="w-6 h-6 text-white" />,
                gradient: 'from-sunny-yellow to-[#FFE07D]',
                title: 'Interactieve spelletjes',
                desc: 'Quizzen over kleuren, vormen, cijfers, letters en lichaamsdelen — direct gekoppeld aan specifieke doelen voor gerichte oefening.',
                accent: 'border-sunny-yellow',
              },
              {
                icon: <PenTool className="w-6 h-6 text-white" />,
                gradient: 'from-sky-blue to-[#7EDCD5]',
                title: 'Schrijfoefeningen',
                desc: 'Gestructureerde oefeningen voor fijne motoriek: strepen, cirkels, golven, zigzaggen. Perfect ter voorbereiding op schrijven.',
                accent: 'border-sky-blue',
              },
              {
                icon: <Video className="w-6 h-6 text-white" />,
                gradient: 'from-lavender to-[#D9C8FF]',
                title: 'Videobibliotheek',
                desc: 'Organiseer educatieve video\'s gekoppeld aan onderwijsdoelen. Schrijf notities en track welke video\'s je per groep gebruikt.',
                accent: 'border-lavender',
              },
              {
                icon: <BookMarked className="w-6 h-6 text-white" />,
                gradient: 'from-[#FF8E8E] to-coral-pink',
                title: 'Materiaalbeheer',
                desc: 'Beheer boeken, prentenboeken en spelmateriaal. Koppel alles aan doelen en zie welk materiaal je wanneer inzet.',
                accent: 'border-[#FF8E8E]',
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-white" />,
                gradient: 'from-deep-purple to-lavender',
                title: 'Analytics & rapporten',
                desc: 'Grafieken per domein, actieve vs. niet-geoefende doelen, individuele rapporten. Altijd inzicht in waar extra aandacht nodig is.',
                accent: 'border-deep-purple',
              },
              {
                icon: <Layers className="w-6 h-6 text-white" />,
                gradient: 'from-grass-green to-[#B5F0BE]',
                title: 'Activiteitenborden',
                desc: 'Plan hoekenwerk en activiteitensessies, wijs leerlingen toe aan hoeken en volg per corner welke doelen geoefend worden.',
                accent: 'border-grass-green',
              },
              {
                icon: <Calendar className="w-6 h-6 text-white" />,
                gradient: 'from-[#7EDCD5] to-sky-blue',
                title: 'Lessenplanner',
                desc: 'Plan lessen vooruit en zie per les welke doelen je hebt geoefend. Elke activiteit, elk materiaal en elke video die je inzet wordt automatisch gekoppeld aan de bijhorende minimumdoelen — zo heb je altijd een volledig overzicht.',
                accent: 'border-sky-blue',
              },
              {
                icon: <Users className="w-6 h-6 text-white" />,
                gradient: 'from-[#FFE07D] to-sunny-yellow',
                title: 'Schoolteam samenwerken',
                desc: 'Deel materialen, video\'s en lessen met het volledige team. Onbeperkt aantal leerkrachten binnen één schoolabonnement.',
                accent: 'border-sunny-yellow',
              },
            ].map((f) => (
              <div key={f.title} className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border-t-4 ${f.accent}`}>
                <div className={`bg-gradient-to-br ${f.gradient} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-baloo text-lg text-deep-purple mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TIME SAVING SECTION ── */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-deep-purple to-[#7B7FFF] rounded-3xl p-8 md:p-12 text-white">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                <Clock className="w-4 h-4" />
                Tijdwinst voor de leerkracht
              </div>
              <h2 className="text-2xl md:text-3xl font-baloo mb-3">Minder administratie, meer onderwijs</h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Leerkrachten besparen gemiddeld uren per week omdat doelregistratie,
                lesplanning en rapportering volledig geïntegreerd zijn.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Target className="w-6 h-6" />, title: 'Automatische doelkoppeling', desc: 'Voeg een activiteit toe en de doelen worden meteen bijgehouden — geen handmatig tikken.' },
                { icon: <Sparkles className="w-6 h-6" />, title: 'Slimme suggesties', desc: 'Het systeem toont welke doelen nog weinig geoefend zijn zodat je bewust kunt plannen.' },
                { icon: <FileText className="w-6 h-6" />, title: 'Rapporten in één klik', desc: 'Genereer een volledig kindrapport of klasoverzicht voor ouders of directie in seconden.' },
                { icon: <CheckCircle2 className="w-6 h-6" />, title: 'Geen dubbel werk', desc: 'Eén registratie staat meteen in de agenda, de analytics én het individueel rapport.' },
              ].map((item) => (
                <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                  <div className="text-white mb-3">{item.icon}</div>
                  <h4 className="font-baloo text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BIJLEER PLATFORM ── */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-lavender/10 to-sky-blue/10 rounded-3xl p-8 border-2 border-lavender/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-gradient-to-br from-deep-purple to-lavender p-3 rounded-xl flex-shrink-0">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-baloo text-xl text-deep-purple mb-1">Je groeit mee met ons</h3>
                <p className="text-gray-600 text-sm">
                  Eén lidmaatschap. Geen verborgen kosten. Toegang tot alle nieuwe tools zodra ze beschikbaar zijn — inclusief bijleer.school en woordenschat.be.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'bijleer.school', sub: 'Slim ICT-gebruik', color: 'text-sky-blue' },
                { label: 'woordenschat.be', sub: 'Klanktekenkoppeling', color: 'text-coral-pink' },
                { label: 'Digitools', sub: 'Interactief lesmateriaal', color: 'text-grass-green' },
                { label: 'Toekomstige tools', sub: 'Automatisch inbegrepen', color: 'text-deep-purple' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className={`font-baloo text-base ${item.color} mb-0.5`}>{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NIEUWE SCHOLEN CTA ── */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-sunny-yellow/30 to-coral-pink/20 rounded-3xl p-8 md:p-10 border-2 border-sunny-yellow/40 flex flex-col md:flex-row items-center gap-8">
            <div className="text-5xl flex-shrink-0">🏫</div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-sunny-yellow/30 text-deep-purple px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-sunny-yellow/50">
                ✨ Schooljaar 2026–2027
              </div>
              <h2 className="text-2xl font-baloo text-deep-purple mb-2">Nieuwe school volgend jaar?</h2>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                Verken alvast de omgeving. Het volledige aanbod en alle inhoud zijn beschikbaar einde augustus 2026 — klaar voor een vliegende start.
              </p>
            </div>
            <Link
              to="/nieuwe-scholen"
              className="flex-shrink-0 bg-gradient-to-r from-deep-purple to-[#7B7FFF] text-white px-7 py-3 rounded-full font-baloo text-base shadow-lg hover:scale-105 transition-transform flex items-center gap-2 whitespace-nowrap"
            >
              Meer info
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-sky-blue to-grass-green rounded-3xl p-10 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-baloo text-white mb-4">
              Klaar om tijd te besparen?
            </h2>
            <p className="text-white/90 text-base mb-8 max-w-xl mx-auto">
              Start vandaag gratis en ontdek hoe een helder doelenoverzicht jouw kleuterklas sterker maakt.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="bg-white text-deep-purple px-8 py-4 rounded-full font-baloo text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                Gratis account aanmaken
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/prijs" className="bg-white/20 text-white border-2 border-white/30 px-8 py-4 rounded-full font-baloo text-lg hover:bg-white/30 transition-colors">
                Bekijk de prijs
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-5 text-center py-8 mt-16">
        <p className="text-gray-500 font-quicksand text-sm">© 2025 Kleuterdidactiek — Ondersteun elke kleuterklas</p>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          <Link to="/privacy" className="text-xs text-gray-400 hover:text-deep-purple transition-colors">Privacybeleid</Link>
          <span className="text-gray-300">•</span>
          <Link to="/algemene-voorwaarden" className="text-xs text-gray-400 hover:text-deep-purple transition-colors">Algemene Voorwaarden</Link>
        </div>
      </footer>

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
