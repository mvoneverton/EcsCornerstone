import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AssessmentRouter    from './pages/AssessmentRouter';
import CompletionPage      from './pages/CompletionPage';
import InvalidTokenPage    from './pages/InvalidTokenPage';
import AlreadyCompletedPage from './pages/AlreadyCompletedPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/assess/:token" element={<AssessmentRouter />} />
        <Route path="/done"          element={<CompletionPage />} />
        <Route path="/invalid"       element={<InvalidTokenPage />} />
        <Route path="/completed"     element={<AlreadyCompletedPage />} />
        {/* Fallback — any unrecognised path shows the invalid page */}
        <Route path="*"              element={<InvalidTokenPage />} />
      </Routes>
    </BrowserRouter>
  );
}
