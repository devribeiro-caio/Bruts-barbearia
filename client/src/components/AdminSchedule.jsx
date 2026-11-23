import { useEffect, useState } from 'react';
import { Clock3, Save } from 'lucide-react';
import { Alert, LoadingState } from './Feedback.jsx';
import { api } from '../lib/api.js';

const dayNames = { 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado', 7: 'Domingo' };
const fallbackDays = Array.from({ length: 7 }, (_, index) => ({ dayOfWeek: index + 1, isOpen: false, openTime: '09:00', closeTime: '18:00' }));

export function AdminSchedule() {
  const [days, setDays] = useState(fallbackDays);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.get('/api/admin/business-hours')
      .then((result) => setDays(result.days.map(({ dayOfWeek, isOpen, openTime, closeTime }) => ({ dayOfWeek, isOpen, openTime, closeTime }))))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  function updateDay(dayOfWeek, field, value) {
    setDays((current) => current.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day));
    setNotice('');
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await api.put('/api/admin/business-hours', { days });
      setDays(result.days.map(({ dayOfWeek, isOpen, openTime, closeTime }) => ({ dayOfWeek, isOpen, openTime, closeTime })));
      setNotice('Expediente semanal salvo. Os clientes verão as datas e horários disponíveis.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">CONFIGURAÇÃO DA AGENDA</p><h2>Expediente semanal.</h2><p>Abra ou feche cada dia e defina quando começa e termina o atendimento.</p></div><span className="admin-section-heading__icon"><Clock3 size={20} /></span></div>
      {error ? <Alert tone="error">{error}</Alert> : null}{notice ? <Alert tone="info">{notice}</Alert> : null}
      {loading ? <LoadingState label="Carregando expediente…" /> : <form onSubmit={save}>
        <div className="schedule-list">{days.map((day) => <div className={`schedule-row ${day.isOpen ? 'schedule-row--open' : ''}`} key={day.dayOfWeek}>
          <div className="schedule-row__day"><strong>{dayNames[day.dayOfWeek]}</strong><span>{day.isOpen ? 'Aberto' : 'Fechado'}</span></div>
          <label className="schedule-toggle"><input type="checkbox" checked={day.isOpen} onChange={(event) => updateDay(day.dayOfWeek, 'isOpen', event.target.checked)} /><span className="schedule-toggle__track" /><span className="sr-only">Abrir {dayNames[day.dayOfWeek]}</span></label>
          <div className="schedule-row__times"><label><span>Abre</span><input type="time" step="1800" value={day.openTime} disabled={!day.isOpen} onChange={(event) => updateDay(day.dayOfWeek, 'openTime', event.target.value)} /></label><span className="schedule-row__dash">—</span><label><span>Fecha</span><input type="time" step="1800" value={day.closeTime} disabled={!day.isOpen} onChange={(event) => updateDay(day.dayOfWeek, 'closeTime', event.target.value)} /></label></div>
        </div>)}</div>
        <div className="schedule-actions"><p>Os horários disponíveis são calculados em intervalos de 30 minutos no fuso de São Paulo.</p><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar expediente'} <Save size={15} /></button></div>
      </form>}
    </div>
  );
}
