/**
 * LinkedIn Profile Analyzer - Main App Component
 * LetsUpgrade Theme - Orange/Coral Palette
 * 
 * Manages application state and orchestrates components:
 * - HeroInput: URL input section
 * - LoadingState: Premium journey loading
 * - Results Dashboard: Score, strengths, improvements, skills
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const WelcomePage = lazy(() => import('./components/WelcomePage'));
const RoadmapCreatorPage = lazy(() => import('./pages/RoadmapCreatorPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        {/* Header */}
        <header className="py-6 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="LetsUpgrade Logo" className="h-16 w-auto" />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="px-4 pb-16">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/career-roadmap-:slug" element={<RoadmapCreatorPage />} />
            </Routes>
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-gray-100">
          <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
            LetsUpgrade Roadmap Creator • Built for professional growth
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
