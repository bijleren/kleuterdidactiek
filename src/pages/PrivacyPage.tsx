import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';

export default function PrivacyPage() {
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
            Privacybeleid
          </h1>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">1. Inleiding</h2>
              <p className="text-sm leading-relaxed mb-4">
                Kleuterdidactiek, onderdeel van bijleer.school, hecht veel waarde aan de bescherming van uw persoonsgegevens.
                In dit privacybeleid leggen we uit welke gegevens we verzamelen, waarom we deze gegevens verzamelen en hoe we
                deze gebruiken.
              </p>
              <p className="text-sm leading-relaxed">
                Dit privacybeleid is van toepassing op alle diensten die worden aangeboden via ons platform, inclusief
                Kleuter Planner en alle andere applicaties binnen bijleer.school.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">2. Verantwoordelijke voor de verwerking</h2>
              <p className="text-sm leading-relaxed">
                De verantwoordelijke voor de verwerking van persoonsgegevens is bijleer.school. Voor vragen over dit
                privacybeleid kunt u contact met ons opnemen via de contactpagina.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">3. Welke gegevens verzamelen we?</h2>
              <p className="text-sm leading-relaxed mb-4">
                We verzamelen de volgende categorieën persoonsgegevens:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Accountgegevens: e-mailadres, naam, wachtwoord (versleuteld)</li>
                <li>Schoolgegevens: naam van de school, aantal leerlingen, groepsgegevens</li>
                <li>Leerlinggegevens: voornaam, geboortedatum, groep</li>
                <li>Gebruiksgegevens: activiteiten, evaluaties, observaties, lesplanningen</li>
                <li>Technische gegevens: IP-adres, browser type, apparaat type</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">4. Waarvoor gebruiken we uw gegevens?</h2>
              <p className="text-sm leading-relaxed mb-4">
                We gebruiken uw persoonsgegevens voor de volgende doeleinden:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Het leveren van onze diensten en functionaliteiten</li>
                <li>Het beheren van uw account en toegang tot het platform</li>
                <li>Het opslaan van lesplanningen, evaluaties en observaties</li>
                <li>Het genereren van rapporten en statistieken</li>
                <li>Het verbeteren van onze diensten</li>
                <li>Het communiceren over updates en nieuwe functies</li>
                <li>Het waarborgen van de beveiliging van het platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">5. Rechtsgrondslag voor verwerking</h2>
              <p className="text-sm leading-relaxed mb-4">
                We verwerken uw persoonsgegevens op basis van de volgende rechtsgronden:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Uitvoering van de overeenkomst: voor het leveren van onze diensten</li>
                <li>Gerechtvaardigd belang: voor het verbeteren van onze diensten en beveiliging</li>
                <li>Wettelijke verplichting: indien vereist door wetgeving</li>
                <li>Toestemming: waar dit van toepassing is</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">6. Met wie delen we uw gegevens?</h2>
              <p className="text-sm leading-relaxed mb-4">
                We delen uw persoonsgegevens alleen met derden indien dit noodzakelijk is:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Hostingproviders voor het opslaan van gegevens (Supabase)</li>
                <li>E-maildiensten voor communicatie</li>
                <li>Collega's binnen uw school die ook toegang hebben tot het platform</li>
              </ul>
              <p className="text-sm leading-relaxed mt-4">
                We verkopen uw gegevens nooit aan derden en delen deze alleen met betrouwbare partners die gebonden
                zijn aan strikte privacyverplichtingen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">7. Beveiliging van uw gegevens</h2>
              <p className="text-sm leading-relaxed">
                We nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen
                tegen verlies, misbruik, ongeautoriseerde toegang en openbaarmaking. Dit omvat onder andere:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm mt-4">
                <li>Versleutelde verbindingen (HTTPS/SSL)</li>
                <li>Veilige opslag van wachtwoorden</li>
                <li>Regelmatige beveiligingsupdates</li>
                <li>Toegangscontroles en authenticatie</li>
                <li>Back-ups van gegevens</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">8. Bewaartermijn</h2>
              <p className="text-sm leading-relaxed">
                We bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doeleinden waarvoor deze zijn
                verzameld. Accountgegevens worden bewaard zolang uw account actief is. Na verwijdering van uw account
                worden uw gegevens binnen 30 dagen permanent verwijderd, tenzij we wettelijk verplicht zijn deze langer
                te bewaren.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">9. Uw rechten</h2>
              <p className="text-sm leading-relaxed mb-4">
                U heeft de volgende rechten met betrekking tot uw persoonsgegevens:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                <li>Recht op inzage: u kunt opvragen welke gegevens we van u bewaren</li>
                <li>Recht op rectificatie: u kunt uw gegevens laten corrigeren</li>
                <li>Recht op verwijdering: u kunt uw gegevens laten verwijderen</li>
                <li>Recht op beperking: u kunt de verwerking laten beperken</li>
                <li>Recht op dataportabiliteit: u kunt uw gegevens in gestructureerde vorm ontvangen</li>
                <li>Recht van bezwaar: u kunt bezwaar maken tegen de verwerking</li>
              </ul>
              <p className="text-sm leading-relaxed mt-4">
                Om deze rechten uit te oefenen, kunt u contact met ons opnemen via de contactpagina.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">10. Cookies en tracking</h2>
              <p className="text-sm leading-relaxed">
                We gebruiken alleen essentiële cookies die noodzakelijk zijn voor het functioneren van het platform,
                zoals sessiecookies voor inloggen. We gebruiken geen tracking cookies of analytische cookies zonder
                uw toestemming.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">11. Wijzigingen in dit privacybeleid</h2>
              <p className="text-sm leading-relaxed">
                We kunnen dit privacybeleid van tijd tot tijd aanpassen. Belangrijke wijzigingen zullen we u
                meedelen via e-mail of een melding op het platform. We raden u aan dit privacybeleid regelmatig
                te raadplegen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-baloo text-deep-purple mb-4">12. Contact</h2>
              <p className="text-sm leading-relaxed">
                Als u vragen heeft over dit privacybeleid of over de manier waarop we uw persoonsgegevens verwerken,
                kunt u contact met ons opnemen via de contactpagina op deze website.
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
