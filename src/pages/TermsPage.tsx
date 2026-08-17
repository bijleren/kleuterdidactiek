import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-[#FFF5E6] to-[#E8F6F3] font-quicksand overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-24 h-24 bg-coral-pink rounded-full opacity-30 top-[10%] left-[5%] animate-float"></div>
        <div className="absolute w-16 h-16 bg-sky-blue rounded-full opacity-30 top-[20%] right-[10%] animate-float-delayed"></div>
        <div className="absolute w-20 h-20 bg-sunny-yellow rounded-full opacity-30 bottom-[15%] left-[15%] animate-float-delayed-2"></div>
        <div className="absolute w-14 h-14 bg-grass-green rounded-full opacity-30 bottom-[30%] right-[20%] animate-float-delayed-3"></div>
      </div>

      <MarketingHeader />

      <main className="relative z-5 max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-baloo text-deep-purple mb-8">
            Algemene Voorwaarden
          </h1>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">1. Toepassingsgebied</h2>
              <p className="text-sm leading-relaxed mb-4">
                Deze algemene voorwaarden zijn van toepassing op het gebruik van Kleuterdidactiek en alle andere
                diensten die worden aangeboden via bijleer.school. Door een account aan te maken en onze diensten
                te gebruiken, gaat u akkoord met deze voorwaarden.
              </p>
              <p className="text-sm leading-relaxed">
                Deze voorwaarden vormen de overeenkomst tussen bijleer.school en de gebruiker (leerkracht of school).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">2. Definities</h2>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li><strong>Platform:</strong> De website en applicatie Kleuterdidactiek, onderdeel van bijleer.school</li>
                <li><strong>Diensten:</strong> Alle functionaliteiten aangeboden via het platform</li>
                <li><strong>Gebruiker:</strong> Een leerkracht of school die gebruik maakt van het platform</li>
                <li><strong>Account:</strong> De persoonlijke toegang tot het platform</li>
                <li><strong>School:</strong> De onderwijsinstelling waarvoor de diensten worden afgenomen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">3. Toegang tot het platform</h2>
              <p className="text-sm leading-relaxed mb-4">
                Om toegang te krijgen tot het platform moet u een account aanmaken. Bij het aanmaken van een account:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Moet u correcte en volledige informatie verstrekken</li>
                <li>Bent u verantwoordelijk voor het geheimhouden van uw inloggegevens</li>
                <li>Bent u verantwoordelijk voor alle activiteiten die via uw account plaatsvinden</li>
                <li>Moet u onmiddellijk melding maken van ongeautoriseerd gebruik van uw account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">4. Gebruik van de diensten</h2>
              <p className="text-sm leading-relaxed mb-4">
                Bij het gebruik van onze diensten verbindt u zich ertoe:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Het platform alleen te gebruiken voor legale en toegestane doeleinden</li>
                <li>De intellectuele eigendomsrechten van bijleer.school te respecteren</li>
                <li>Geen inhoud te uploaden die illegaal, beledigend of schadelijk is</li>
                <li>Geen pogingen te doen om de beveiliging van het platform te omzeilen</li>
                <li>Geen geautomatiseerde systemen te gebruiken om toegang te krijgen tot het platform</li>
                <li>De privacy van anderen te respecteren</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">5. Prijzen en betaling</h2>
              <p className="text-sm leading-relaxed mb-4">
                De prijs voor het gebruik van het platform bedraagt €4,50 per leerling per schooljaar. Deze prijs:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Is een eenmalige jaarlijkse kost</li>
                <li>Geeft toegang aan een onbeperkt aantal leerkrachten binnen de school</li>
                <li>Geeft toegang tot alle functionaliteiten van Kleuterdidactiek</li>
                <li>Geeft toegang tot alle andere apps binnen bijleer.school</li>
                <li>Wordt jaarlijks gefactureerd</li>
              </ul>
              <p className="text-sm leading-relaxed mt-4">
                Prijswijzigingen worden minimaal 60 dagen van tevoren aangekondigd en gelden alleen voor nieuwe
                facturatieperiodes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">6. Intellectuele eigendom</h2>
              <p className="text-sm leading-relaxed mb-4">
                Alle intellectuele eigendomsrechten met betrekking tot het platform en de aangeboden inhoud behoren
                toe aan bijleer.school of haar licentiegevers. Dit omvat onder meer:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>De software en technologie van het platform</li>
                <li>Het ontwerp en de gebruikersinterface</li>
                <li>De inhoud zoals video's, spelletjes en oefeningen</li>
                <li>De databases met minimumdoelen en educatieve content</li>
              </ul>
              <p className="text-sm leading-relaxed mt-4">
                U mag de inhoud alleen gebruiken binnen het platform en voor uw eigen educatieve doeleinden.
                Reproductie, distributie of commercieel gebruik zonder toestemming is niet toegestaan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">7. Uw content en gegevens</h2>
              <p className="text-sm leading-relaxed mb-4">
                Content die u uploadt of invoert in het platform blijft uw eigendom. Door content te uploaden:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Garandeert u dat u het recht heeft om deze content te gebruiken</li>
                <li>Geeft u ons een licentie om deze content op te slaan en weer te geven binnen het platform</li>
                <li>Blijft u verantwoordelijk voor de inhoud</li>
              </ul>
              <p className="text-sm leading-relaxed mt-4">
                U kunt uw gegevens op elk moment exporteren. Bij het verwijderen van uw account worden al uw gegevens
                permanent verwijderd binnen 30 dagen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">8. Beschikbaarheid en onderhoud</h2>
              <p className="text-sm leading-relaxed">
                We streven ernaar om het platform 24/7 beschikbaar te houden, maar kunnen dit niet garanderen.
                Het platform kan tijdelijk niet beschikbaar zijn wegens onderhoud, updates of technische problemen.
                We zullen gepland onderhoud waar mogelijk vooraf aankondigen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">9. Aansprakelijkheid</h2>
              <p className="text-sm leading-relaxed mb-4">
                bijleer.school is niet aansprakelijk voor:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Indirecte schade of gevolgschade</li>
                <li>Verlies van data, tenzij dit te wijten is aan grove nalatigheid</li>
                <li>Schade als gevolg van het niet beschikbaar zijn van het platform</li>
                <li>Schade veroorzaakt door onjuist gebruik van het platform</li>
                <li>Schade veroorzaakt door derden</li>
              </ul>
              <p className="text-sm leading-relaxed mt-4">
                Onze aansprakelijkheid is in alle gevallen beperkt tot het bedrag dat u in het afgelopen jaar heeft
                betaald voor het gebruik van het platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">10. Gegevensbescherming</h2>
              <p className="text-sm leading-relaxed">
                We verwerken persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG).
                Voor meer informatie verwijzen we naar ons privacybeleid. We nemen passende technische en organisatorische
                maatregelen om uw gegevens te beschermen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">11. Opzegging</h2>
              <p className="text-sm leading-relaxed mb-4">
                U kunt uw account op elk moment opzeggen door contact met ons op te nemen. Bij opzegging:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Stopt uw toegang tot het platform onmiddellijk</li>
                <li>Worden uw gegevens binnen 30 dagen permanent verwijderd</li>
                <li>Wordt geen restitutie gegeven voor het resterende deel van de betaalde periode</li>
              </ul>
              <p className="text-sm leading-relaxed mt-4">
                We kunnen uw account opzeggen of opschorten bij schending van deze voorwaarden, na voorafgaande
                waarschuwing indien mogelijk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">12. Wijzigingen in de voorwaarden</h2>
              <p className="text-sm leading-relaxed">
                We kunnen deze algemene voorwaarden van tijd tot tijd wijzigen. Belangrijke wijzigingen zullen we
                minimaal 30 dagen van tevoren aankondigen via e-mail of een melding op het platform. Door het
                platform te blijven gebruiken na deze wijzigingen, gaat u akkoord met de nieuwe voorwaarden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">13. Toepasselijk recht en geschillen</h2>
              <p className="text-sm leading-relaxed">
                Op deze algemene voorwaarden is Belgisch recht van toepassing. Geschillen die voortvloeien uit deze
                overeenkomst worden voorgelegd aan de bevoegde rechtbank in België. Partijen zullen echter eerst
                proberen om tot een minnelijke schikking te komen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">14. Contact</h2>
              <p className="text-sm leading-relaxed">
                Voor vragen over deze algemene voorwaarden kunt u contact met ons opnemen via de contactpagina
                op deze website.
              </p>
            </section>

            <section className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500 italic">
                Laatste update: {new Date().toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
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
