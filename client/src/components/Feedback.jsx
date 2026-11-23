import { Check, Clock3, X } from 'lucide-react';

const statusIcon = { pending: Clock3, confirmed: Check, rejected: X };

export function StatusPill({ status }) {
  const Icon = statusIcon[status] || Clock3;
  const label = ({ pending: 'Pendente', confirmed: 'Confirmado', rejected: 'Recusado' })[status] || status;
  return <span className={`status-pill status-pill--${status}`}><Icon size={13} />{label}</span>;
}

export function Alert({ children, tone = 'info' }) {
  return <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function LoadingState({ label = 'Carregando…' }) {
  return <div className="loading-state"><span className="spinner" aria-hidden="true" />{label}</div>;
}
