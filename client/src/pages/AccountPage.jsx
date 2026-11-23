import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, LoadingState, StatusPill } from '../components/Feedback.jsx';
import { api } from '../lib/api.js';
import { formatDateTime, formatMoney } from '../lib/format.js';

export function AccountPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/appointments/mine')
      .then((result) => setAppointments(result.appointments))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-container account-page">
      <div className="page-heading"><div><p className="eyebrow">SUA CONTA</p><h1>Seus horários<span>.</span></h1><p>Acompanhe o que está pendente, confirmado ou recusado.</p></div><Link className="button button--primary" to="/agendar">Novo agendamento <ArrowRight size={16} /></Link></div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <LoadingState label="Carregando seus agendamentos…" /> : null}
      {!loading && !error && appointments.length === 0 ? <div className="empty-panel"><CalendarDays size={26} /><h2>Nenhum horário por aqui ainda.</h2><p>Veja a agenda e escolha uma data disponível.</p><Link className="button button--primary" to="/agendar">Ver disponibilidade <ArrowRight size={15} /></Link></div> : null}
      <div className="appointment-list">
        {appointments.map((appointment) => (
          <article className="appointment-card" key={appointment._id}>
            <div className="appointment-card__date"><span className="eyebrow">DATA E HORA</span><strong>{formatDateTime(appointment.startAt)}</strong><span><Clock3 size={14} /> {appointment.durationMinutes} minutos</span></div>
            <div className="appointment-card__service"><span className="eyebrow">SERVIÇO</span><h2>{appointment.serviceName}</h2><strong>{formatMoney(appointment.priceCents)}</strong></div>
            <div className="appointment-card__status"><StatusPill status={appointment.status} />{appointment.status === 'pending' ? <small>Aguardando confirmação do cabeleireiro.</small> : null}{appointment.status === 'confirmed' ? <small>Seu horário está confirmado.</small> : null}{appointment.status === 'rejected' ? <small>Entre em contato para escolher outra data.</small> : null}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
