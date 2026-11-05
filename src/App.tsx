import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomepageLite from './components/HomepageLite';
import DealFlowPage from './components/DealFlowPage';
import ProFundPage from './components/ProFundPage';
import Footer from './components/Footer';
import LegalPage from './components/LegalPage';
import PrivacyPage from './components/PrivacyPage';
import CookieBanner from './components/CookieBanner';
import TermsPage from './components/TermsPage';
import CalculatorPage from './components/CalculatorPage';
import SellPage from './components/SellPage';
import LpPage from './components/LpPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><HomepageLite /><Footer /></>} />
        <Route path="/dealflow" element={<DealFlowPage />} />
        <Route path="/pitch" element={<><ProFundPage /><Footer /></>} />
        {/* v3 (05/11) : les pages fondateurs et LP. Chaque route a AUSSI son entrée
            dans ROUTES de scripts/prerender.mjs (sinon HTTP 404) et dans public/sitemap.xml. */}
        <Route path="/terms" element={<><TermsPage /><Footer /></>} />
        <Route path="/calculator" element={<><CalculatorPage /><Footer /></>} />
        <Route path="/sell" element={<><SellPage /><Footer /></>} />
        <Route path="/lp" element={<><LpPage /><Footer /></>} />
        <Route path="/legal" element={<><LegalPage /><Footer /></>} />
        <Route path="/privacy" element={<><PrivacyPage /><Footer /></>} />
        {/* Sans cette route, une URL inconnue ne matche rien et React rend une
            page BLANCHE (le 404.html de GitHub Pages sert bien la SPA, mais
            aucune route ne correspond). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
    </BrowserRouter>
  );
}
