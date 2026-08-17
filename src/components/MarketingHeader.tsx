import { Link } from 'react-router-dom';

export default function MarketingHeader() {
  return (
    <header className="relative z-10 bg-gradient-to-r from-deep-purple to-[#7B7FFF] rounded-[40px] shadow-2xl px-6 py-8 mx-4 mt-4 md:mx-6 md:mt-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="hidden md:block flex-1"></div>
          <Link to="/" className="md:flex-1">
            <h1 className="text-4xl md:text-5xl font-baloo text-white text-center drop-shadow-lg whitespace-nowrap">
              🌈 Kleuterdidactiek
            </h1>
          </Link>
          <div className="flex md:flex-1 justify-center md:justify-end gap-3">
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 border border-white/20"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-white text-deep-purple px-4 py-2 rounded-full font-semibold text-sm shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Registreer
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/voor-wie" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Voor wie?
          </Link>
          <span className="text-white/40">•</span>
          <Link to="/hoe-werkt-het" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Hoe werkt het?
          </Link>
          <span className="text-white/40">•</span>
          <Link to="/waarom" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Waarom?
          </Link>
          <span className="text-white/40">•</span>
          <Link to="/prijs" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Prijs
          </Link>
          <span className="text-white/40">•</span>
          <Link to="/nieuwe-scholen" className="text-sunny-yellow hover:text-white transition-colors text-sm font-semibold flex items-center gap-1">
            ✨ Nieuwe scholen 2026–2027
          </Link>
          <span className="text-white/40">•</span>
          <Link to="/contact" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
