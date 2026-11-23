import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { Alert, LoadingState, StatusPill } from './Feedback.jsx';
import { api } from '../lib/api.js';
import { formatDateTime, formatMoney } from '../lib/format.js';

const filters = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'rejected', label: 'Recusados' },
];

export function AdminAppointments() {
  const [status, setStatus] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = status ? `?status=${status}` : '';
      const result = await api.get(`/api/admin/appointments${query}`);
      setAppointments(result.appointments);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(appointment, action) {
    setBusyId(appointment._id);
    setError('');
    setNotice('');
    try {
      await api.patch(`/api/admin/appointments/${appointment._id}/${action}`, {});
      setNotice(action === 'confirm' ? 'Agendamento confirmado.' : 'Solicitação recusada; o horário foi liberado.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">SOLICITAÇÕES E HORÁRIOS</p><h2>Agenda da barbearia.</h2></div><button className="icon-button" type="button" onClick={load} aria-label="Atualizar agenda"><RefreshCw size={16} /></button></div>
      <div className="admin-filter-bar">{filters.map((filter) => <button className={`admin-filter ${status === filter.value ? 'admin-filter--active' : ''}`} type="button" key={filter.value || 'all'} onClick={() => setStatus(filter.value)}>{filter.label}</button>)}</div>
      {error ? <Alert tone="error">{error}</Alert> : null}{notice ? <Alert tone="info">{notice}</Alert> : null}
      {loading ? <LoadingState label="Carregando agenda…" /> : null}
      {!loading && appointments.length === 0 ? <div className="admin-empty"><p>Nenhum agendamento nesta lista.</p><span>Novas solicitações aparecem aqui quando os clientes pedirem um horário.</span></div> : null}
      <div className="admin-appointment-list">{appointments.map((appointment) => {
        const customer = appointment.customerId;
        return <article className="admin-appointment" key={appointment._id}>
          <div className="admin-appointment__datetime"><span className="eyebrow">DATA E HORA</span><strong>{formatDateTime(appointment.startAt)}</strong><small>{appointment.durationMinutes} minutos</small></div>
          <div className="admin-appointment__customer"><span className="eyebrow">CLIENTE</span><strong>{customer?.name || 'Cliente'}</strong><small>{customer?.email || 'Conta removida'}</small></div>
          <div className="admin-appointment__service"><span className="eyebrow">SERVIÇO</span><strong>{appointment.serviceName}</strong><small>{formatMoney(appointment.priceCents)}</small></div>
          <div className="admin-appointment__status"><StatusPill status={appointment.status} />{appointment.status === 'pending' ? <div className="admin-appointment__actions"><button className="button button--small button--confirm" type="button" onClick={() => changeStatus(appointment, 'confirm')} disabled={busyId === appointment._id}><Check size={14} /> Confirmar</button><button className="button button--small button--reject" type="button" onClick={() => changeStatus(appointment, 'reject')} disabled={busyId === appointment._id}><X size={14} /> Recusar</button></div> : null}</div>
          {appointment.customerNotes ? <p className="admin-appointment__notes"><strong>Observação do cliente:</strong> {appointment.customerNotes}</p> : null}
        </article>;
      })}</div>
    </div>
  );
}
