import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SiteFooter } from './components/SiteFooter.jsx';
import { SiteHeader } from './components/SiteHeader.jsx';
import { api } from './lib/api.js';
import { useAuth } from './lib/useAuth.js';
import { AccountPage } from './pages/AccountPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { BookingPage } from './pages/BookingPage.jsx';
import { HomePage } from './pages/HomePage.jsx';

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading"><span className="spinner" />Verificando sua sessão…</div>;
  if (!user) return <Navigate to={`/entrar?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const [contact, setContact] = useState({ whatsappPhone: '', demoPrices: false });

  useEffect(() => {
    let active = true;
    api.get('/api/public/contact')
      .then((result) => { if (active) setContact(result); })
      .catch(() => { if (active) setContact({ whatsappPhone: '', demoPrices: false }); });
    return () => { active = false; };
  }, []);

  return (
    <div className="app-shell">
      <SiteHeader user={user} whatsappPhone={contact.whatsappPhone} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage contact={contact} />} />
          <Route path="/agendar" element={<BookingPage user={user} whatsappPhone={contact.whatsappPhone} />} />
          <Route path="/entrar" element={<AuthPage mode="login" />} />
          <Route path="/criar-conta" element={<AuthPage mode="register" />} />
          <Route path="/minha-conta" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth role="admin"><AdminPage /></RequireAuth>} />
          <Route path="*" element={<div className="empty-state page-container"><span className="eyebrow">404</span><h1>Essa página não está na agenda.</h1><a className="button button--primary" href="/">Voltar ao início</a></div>} />
        </Routes>
      </main>
      <SiteFooter whatsappPhone={contact.whatsappPhone} />
    </div>
  );
}
