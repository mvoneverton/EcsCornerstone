import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

// Auth pages
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Onboarding pages — paid self-serve signup
import OnboardingRegister  from './pages/onboarding/RegisterPage';
import OnboardingSuccess   from './pages/onboarding/SuccessPage';
import OnboardingCancelled from './pages/onboarding/CancelledPage';

// Admin pages
import Dashboard    from './pages/admin/Dashboard';
import PeopleList   from './pages/admin/people/PeopleList';
import InviteForm   from './pages/admin/people/InviteForm';
import PersonDetail from './pages/admin/people/PersonDetail';
import Results      from './pages/admin/Results';
import ResultDetail from './pages/admin/results/ResultDetail';
import Positions    from './pages/admin/Positions';
import Settings     from './pages/admin/Settings';
import Billing      from './pages/admin/Billing';

// Super admin pages
import { SuperAdminLayout }  from './components/superadmin/SuperAdminLayout';
import SuperAdminDashboard   from './pages/superadmin/SuperAdminDashboard';
import CompaniesListPage     from './pages/superadmin/CompaniesListPage';
import CompanyDetailPage     from './pages/superadmin/CompanyDetailPage';
import AuditLogPage          from './pages/superadmin/AuditLogPage';

// People First pages (Module 2)
import PFEventsPage          from './pages/superadmin/pf/PFEventsPage';
import PFEventDetailPage     from './pages/superadmin/pf/PFEventDetailPage';
import PFResultDetailPage    from './pages/superadmin/pf/PFResultDetailPage';
import PFResultsPage         from './pages/superadmin/pf/PFResultsPage';

// Manager view
import ManagerDashboard from './pages/manager/ManagerDashboard';

// Respondent report access
import ReportAccessPage from './pages/report/ReportAccessPage';

// Assessment flow — public, token-based
import AssessFlow from './pages/assess/AssessFlow';

// Gated service landing pages — public, signed-token-based
import AgentPlacementPage from './pages/gated/AgentPlacementPage';
import GatedFcaioPage      from './pages/gated/FcaioPage';

// Legal document pages — public, static
import TermsOfServicePage         from './pages/legal/TermsOfServicePage';
import PrivacyPolicyPage          from './pages/legal/PrivacyPolicyPage';
import DataProcessingAgreementPage from './pages/legal/DataProcessingAgreementPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public auth routes ──────────────────────────────────── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* ── Public onboarding routes (paid self-serve signup) ──── */}
          <Route path="/onboarding/register"  element={<OnboardingRegister />} />
          <Route path="/onboarding/success"   element={<OnboardingSuccess />} />
          <Route path="/onboarding/cancelled" element={<OnboardingCancelled />} />

          {/* ── Public assessment route (token-based) ──────────────── */}
          <Route path="/assess/:token" element={<AssessFlow />} />

          {/* ── Public gated service landing pages (signed token) ──── */}
          {/* Hyphenated is canonical; underscored matches the unlock-email URL. */}
          <Route path="/gated/agent-placement" element={<AgentPlacementPage />} />
          <Route path="/gated/agent_placement" element={<AgentPlacementPage />} />
          <Route path="/gated/fcaio"           element={<GatedFcaioPage />} />

          {/* ── Public legal document pages ────────────────────────── */}
          <Route path="/legal/terms"   element={<TermsOfServicePage />} />
          <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/legal/dpa"     element={<DataProcessingAgreementPage />} />

          {/* ── Protected admin area (company_admin / facilitator) ──── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Index → dashboard is the home screen */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* People */}
            <Route path="people"          element={<PeopleList />} />
            <Route path="people/invite"   element={<InviteForm />} />
            <Route path="people/:id"      element={<PersonDetail />} />

            {/* Results */}
            <Route path="results"             element={<Results />} />
            <Route path="results/:resultId"   element={<ResultDetail />} />

            {/* Positions */}
            <Route path="positions/*" element={<Positions />} />

            {/* Settings & Billing */}
            <Route path="settings"    element={<Settings />} />
            <Route path="billing"     element={<Billing />} />

            {/* Dashboard */}
            <Route path="dashboard"   element={<Dashboard />} />
          </Route>

          {/* ── Protected super admin area ──────────────────────────── */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index                       element={<SuperAdminDashboard />} />
            <Route path="companies"             element={<CompaniesListPage />} />
            <Route path="companies/:companyId"  element={<CompanyDetailPage />} />
            <Route path="audit-log"             element={<AuditLogPage />} />

            {/* People First (Module 2) */}
            <Route path="people-first/events"                 element={<PFEventsPage />} />
            <Route path="people-first/events/:eventId"        element={<PFEventDetailPage />} />
            <Route path="people-first/results"                element={<PFResultsPage />} />
            <Route path="people-first/results/:resultId"      element={<PFResultDetailPage />} />
          </Route>

          {/* ── Protected manager area ──────────────────────────────── */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Public respondent report access (token-based) ───────── */}
          <Route path="/report" element={<ReportAccessPage />} />

          {/* Root → /admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex min-h-screen items-center justify-center bg-navy-50">
                <div className="text-center">
                  <div className="text-5xl font-bold text-navy-200">404</div>
                  <p className="mt-3 text-sm text-gray-500">Page not found</p>
                  <a href="/admin" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
                    Go to dashboard
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
