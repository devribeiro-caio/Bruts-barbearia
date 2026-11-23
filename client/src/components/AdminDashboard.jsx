import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck, Clock3, Users, WalletCards } from 'lucide-react';
import { Alert, LoadingState } from './Feedback.jsx';
import { api } from '../lib/api.js';

export function AdminDashboard({ onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/admin/overview')
      .then((result) => setOverview(result.overview))
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!overview) return <LoadingState label="Carregando resumo…" />;

  const cards = [
    { icon: Clock3, label: 'Aguardando resposta', value: overview.pendingAppointments, detail: 'solicitações pendentes', action: 'appointments' },
    { icon: CalendarCheck, label: 'Na agenda de hoje', value: overview.todaysAppointments, detail: 'pedidos e confirmações', action: 'appointments' },
    { icon: WalletCards, label: 'Planos ativos', value: overview.activeMemberships, detail: 'clientes no mensal', action: 'memberships' },
    { icon: Users, label: 'Clientes cadastrados', value: overview.customerCount, detail: 'contas de cliente', action: 'customers' },
  ];

  return (
    <div className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">VISÃO GERAL</p><h2>Bom trabalho hoje.</h2></div><span className="admin-date-label">{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span></div>
      <div className="admin-stat-grid">{cards.map((card) => { const Icon = card.icon; return <button className="admin-stat-card" type="button" key={card.label} onClick={() => onNavigate(card.action)}><span className="admin-stat-card__icon"><Icon size={18} /></span><span className="admin-stat-card__label">{card.label}</span><strong>{card.value}</strong><span className="admin-stat-card__detail">{card.detail} <ArrowRight size={13} /></span></button>; })}</div>
      <div className="admin-onboarding"><span className="admin-onboarding__icon"><Clock3 size={19} /></span><div><strong>Antes de abrir a agenda</strong><p>Cadastre o expediente de cada dia e revise os valores demonstrativos dos serviços.</p></div><button className="button button--outline" type="button" onClick={() => onNavigate('hours')}>Configurar expediente <ArrowRight size={15} /></button></div>
    </div>
  );
}
