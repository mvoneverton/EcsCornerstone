import { Routes, Route, Navigate } from 'react-router-dom';
import { RosterProvider } from '@/context/RosterContext';
import Layout from '@/components/layout/Layout';

import PlaceholderPage      from '@/pages/PlaceholderPage';
import AgentsPage           from '@/pages/AgentsPage';
import TeamsPage            from '@/pages/TeamsPage';
import AgentDetailPage      from '@/pages/AgentDetailPage';
import AssessmentPage       from '@/pages/AssessmentPage';
import ScanPage             from '@/pages/ScanPage';
import ProcessPage          from '@/pages/ProcessPage';
import CornerstonePage      from '@/pages/CornerstonePage';
import CornerstoneSaasPage  from '@/pages/CornerstoneSaasPage';
import FcaioPage            from '@/pages/FcaioPage';
import AboutPage            from '@/pages/AboutPage';
import HomePage             from '@/pages/HomePage';
import ReservePage              from '@/pages/ReservePage';
import ConfirmationPage         from '@/pages/ConfirmationPage';
import ScanConfirmationPage         from '@/pages/ScanConfirmationPage';
import AssessmentConfirmationPage   from '@/pages/AssessmentConfirmationPage';
import ParticipantCountPage         from '@/pages/ParticipantCountPage';

export default function App() {
  return (
    <RosterProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                 element={<HomePage />} />
          <Route path="/process"          element={<ProcessPage />} />
          <Route path="/scan"                element={<ScanPage />} />
          <Route path="/scan/confirmation"   element={<ScanConfirmationPage />} />
          <Route path="/assessment"              element={<AssessmentPage />} />
          <Route path="/assessment/confirmation"      element={<AssessmentConfirmationPage />} />
          <Route path="/assessment/participant-count" element={<ParticipantCountPage />} />
          {/* 301-equivalent redirect for old /audit URL */}
          <Route path="/audit"            element={<Navigate to="/assessment" replace />} />
          <Route path="/cornerstone"      element={<CornerstonePage />} />
          <Route path="/cornerstone-saas" element={<CornerstoneSaasPage />} />
          <Route path="/about"            element={<AboutPage />} />
          {/* Gated pages — redirect unauthenticated visitors */}
          <Route path="/agents"           element={<AgentsPage />} />
          <Route path="/agents/:agentId"  element={<AgentDetailPage />} />
          <Route path="/teams"            element={<TeamsPage />} />
          <Route path="/fcaio"            element={<FcaioPage />} />
          <Route path="/reserve"          element={<ReservePage />} />
          <Route path="/confirmation"     element={<ConfirmationPage />} />
          <Route path="*"                 element={<PlaceholderPage title="404 — Page Not Found" />} />
        </Route>
      </Routes>
    </RosterProvider>
  );
}
