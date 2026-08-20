import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolProvider } from './contexts/SchoolContext';
import LandingPage from './pages/LandingPage';
import { lazy, Suspense, useState } from 'react';
import { X, Mail } from 'lucide-react';

/*
  Alleen de landingspagina laadt mee in de eerste bundel; die is voor de meeste
  bezoekers het eerste scherm. De rest komt per route binnen, zodat een
  leerkracht die naar Activi-Tijd gaat niet eerst de agenda, de analyses en de
  marketingpagina's moet downloaden.
*/
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const KleuterdoelenPage = lazy(() => import('./pages/KleuterdoelenPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const ActiviTijdPage = lazy(() => import('./pages/ActiviTijdPage'));
const SchoolOnboarding = lazy(() => import('./components/SchoolOnboarding'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const VoorWiePage = lazy(() => import('./pages/VoorWiePage'));
const PrijsPage = lazy(() => import('./pages/PrijsPage'));
const HoeWerktHetPage = lazy(() => import('./pages/HoeWerktHetPage'));
const WaaromPage = lazy(() => import('./pages/WaaromPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const SchoolAnalyticsPage = lazy(() => import('./pages/SchoolAnalyticsPage'));
const NieuweScholenPage = lazy(() => import('./pages/NieuweScholenPage'));

function PaginaLaadt() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] via-[#FFF5E6] to-[#E8F6F3]">
      <div className="text-2xl font-baloo text-[#5D5FEF]">Laden...</div>
    </div>
  );
}

function LaunchSignupWidget() {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (loading || user || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-xs w-full animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-deep-purple to-[#9B9EFF] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-white flex-shrink-0" />
            <span className="text-white font-semibold text-sm">Op de hoogte blijven?</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            aria-label="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            Mogen we je één keer mailen bij de lancering? Deel hier je mailadres.
          </p>
          <a
            href="https://forms.office.com/e/zviHhhk52T"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-gradient-to-r from-deep-purple to-[#9B9EFF] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:scale-105 transition-transform shadow-md"
          >
            Ja, schrijf me in
          </a>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] via-[#FFF5E6] to-[#E8F6F3]">
        <div className="text-2xl font-baloo text-[#5D5FEF]">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] via-[#FFF5E6] to-[#E8F6F3]">
        <div className="text-2xl font-baloo text-[#5D5FEF]">Laden...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/aan-de-slag" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Suspense fallback={<PaginaLaadt />}>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/voor-wie" element={<VoorWiePage />} />
      <Route path="/prijs" element={<PrijsPage />} />
      <Route path="/hoe-werkt-het" element={<HoeWerktHetPage />} />
      <Route path="/waarom" element={<WaaromPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/algemene-voorwaarden" element={<TermsPage />} />
      <Route path="/nieuwe-scholen" element={<NieuweScholenPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <SchoolOnboarding onComplete={() => window.location.href = '/groups'} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aan-de-slag"
        element={
          <ProtectedRoute>
            <KleuterdoelenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doelen"
        element={
          <ProtectedRoute>
            <KleuterdoelenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evalueren"
        element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute>
            <AgendaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyse"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/school-analyse"
        element={
          <ProtectedRoute>
            <SchoolAnalyticsPage />
          </ProtectedRoute>
        }
      />
      {/* Legacy routes for backwards compatibility */}
      <Route
        path="/kleuterdoelen/:groupId"
        element={
          <ProtectedRoute>
            <KleuterdoelenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:groupId"
        element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agenda"
        element={
          <ProtectedRoute>
            <AgendaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activi-tijd"
        element={
          <ProtectedRoute>
            <ActiviTijdPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/:groupId"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
    </Routes>
      </Suspense>
      <LaunchSignupWidget />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SchoolProvider>
          <AppRoutes />
        </SchoolProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
