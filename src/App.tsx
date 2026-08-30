import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomepageLite from './components/HomepageLite';
import ProFundPage from './components/ProFundPage';
import Footer from './components/Footer';
import LegalPage from './components/LegalPage';
import PrivacyPage from './components/PrivacyPage';
import CookieBanner from './components/CookieBanner';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><HomepageLite /><Footer /></>} />
        <Route path="/pitch" element={<><ProFundPage /><Footer /></>} />
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
