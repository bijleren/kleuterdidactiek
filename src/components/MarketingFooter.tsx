import { Link } from 'react-router-dom';

export default function MarketingFooter() {
  return (
    <footer className="relative z-5 text-center py-8 mt-16">
      <p className="text-gray-600 font-quicksand">
        &copy; {new Date().getFullYear()} Kleuterdidactiek - Ondersteun elke kleuterklas
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <Link to="/voor-wie" className="text-sm text-gray-500 hover:text-deep-purple transition-colors">
          Voor wie?
        </Link>
        <span className="text-gray-400">•</span>
        <Link to="/hoe-werkt-het" className="text-sm text-gray-500 hover:text-deep-purple transition-colors">
          Hoe werkt het?
        </Link>
        <span className="text-gray-400">•</span>
        <Link to="/waarom" className="text-sm text-gray-500 hover:text-deep-purple transition-colors">
          Waarom?
        </Link>
        <span className="text-gray-400">•</span>
        <Link to="/prijs" className="text-sm text-gray-500 hover:text-deep-purple transition-colors">
          Prijs
        </Link>
        <span className="text-gray-400">•</span>
        <Link to="/contact" className="text-sm text-gray-500 hover:text-deep-purple transition-colors">
          Contact
        </Link>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        <Link to="/privacy" className="text-xs text-gray-400 hover:text-deep-purple transition-colors">
          Privacybeleid
        </Link>
        <span className="text-gray-300">•</span>
        <Link to="/algemene-voorwaarden" className="text-xs text-gray-400 hover:text-deep-purple transition-colors">
          Algemene Voorwaarden
        </Link>
      </div>
    </footer>
  );
}
