import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

// Auth pages
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Admin pages
import Dashboard    from './pages/admin/Dashboard';
import PeopleList   from './pages/admin/people/PeopleList';
import InviteForm   from './pages/admin/people/InviteForm';
import PersonDetail from './pages/admin/people/PersonDetail';
import Results      from './pages/admin/Results';
import Positions    from './pages/admin/Positions';
import Settings     from './pages/admin/Settings';
import Billing      from './pages/admin/Billing';

// Assessment flow — public, token-based
import AssessFlow from './pages/assess/AssessFlow';

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

          {/* ── Public assessment route (token-based) ──────────────── */}
          <Route path="/assess/:token" element={<AssessFlow />} />

          {/* ── Protected admin area ────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Index → redirect to /admin/people */}
            <Route index element={<Navigate to="people" replace />} />

            {/* People */}
            <Route path="people"          element={<PeopleList />} />
            <Route path="people/invite"   element={<InviteForm />} />
            <Route path="people/:id"      element={<PersonDetail />} />

            {/* Results — Step 5 */}
            <Route path="results"     element={<Results />} />

            {/* Positions — sub-routes added in Step 6 */}
            <Route path="positions/*" element={<Positions />} />

            {/* Settings & Billing — Step 7 */}
            <Route path="settings"    element={<Settings />} />
            <Route path="billing"     element={<Billing />} />

            {/* Dashboard — accessible at /admin/dashboard */}
            <Route path="dashboard"   element={<Dashboard />} />
          </Route>

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
