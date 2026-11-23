import { useState } from 'react';
import { CalendarDays, Clock3, DoorOpen, LayoutDashboard, Scissors, Users, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth.js';
import { AdminAppointments } from '../components/AdminAppointments.jsx';
import { AdminCustomers } from '../components/AdminCustomers.jsx';
import { AdminDashboard } from '../components/AdminDashboard.jsx';
import { AdminMemberships } from '../components/AdminMemberships.jsx';
import { AdminSchedule } from '../components/AdminSchedule.jsx';
import { AdminServices } from '../components/AdminServices.jsx';
import '../styles/admin.css';

const tabs = [
  { id: 'overview', label: 'Resumo', icon: LayoutDashboard },
  { id: 'appointments', label: 'Agenda', icon: CalendarDays },
  { id: 'hours', label: 'Expediente', icon: Clock3 },
  { id: 'services', label: 'Cortes e valores', icon: Scissors },
  { id: 'memberships', label: 'Planos mensais', icon: WalletCards },
  { id: 'customers', label: 'Clientes', icon: Users },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function exit() {
    await logout().catch(() => {});
    navigate('/entrar', { replace: true });
  }

  const content = {
    overview: <AdminDashboard onNavigate={setActiveTab} />,
    appointments: <AdminAppointments />,
    hours: <AdminSchedule />,
    services: <AdminServices />,
    memberships: <AdminMemberships />,
    customers: <AdminCustomers />,
  }[activeTab];

  return (
    <section className="admin-page page-container">
      <div className="admin-topline"><div><span className="admin-mark">B<span>/</span></span><span className="admin-topline__label">ÁREA DO CABELEIREIRO</span></div><div className="admin-topline__user"><span>{user?.name || 'Administrador'}</span><button className="admin-exit" type="button" onClick={exit}><DoorOpen size={15} /> Sair</button></div></div>
      <div className="admin-heading"><div><p className="eyebrow">BRUTUS CORTES · GESTÃO</p><h1>Painel do <em>cabeleireiro.</em></h1><p>Agenda, clientes e detalhes do atendimento em um só lugar.</p></div></div>
      <nav className="admin-tabs" aria-label="Seções administrativas">{tabs.map((tab) => { const Icon = tab.icon; return <button className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`} type="button" key={tab.id} onClick={() => setActiveTab(tab.id)}><Icon size={15} /><span>{tab.label}</span></button>; })}</nav>
      <div className="admin-content" key={activeTab}>{content}</div>
    </section>
  );
}
