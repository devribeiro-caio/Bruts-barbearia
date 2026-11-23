import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, MessageCircle, Scissors } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, LoadingState } from '../components/Feedback.jsx';
import { CalendarGrid } from '../components/CalendarGrid.jsx';
import { PixPayment } from '../components/PixPayment.jsx';
import { api } from '../lib/api.js';
import { formatMoney } from '../lib/format.js';
import { currentMonthKey, formatCalendarDate } from '../lib/calendar.js';

export function BookingPage({ user, whatsappPhone }) {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(searchParams.get('servico') || '');
  const [month, setMonth] = useState(currentMonthKey());
  const [availability, setAvailability] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [hoursConfigured, setHoursConfigured] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/api/public/services')
      .then((result) => {
        if (!active) return;
        setServices(result.services);
        const requestedServiceId = searchParams.get('servico');
        setServiceId((current) => {
          if (current && result.services.some((service) => service._id === current)) return current;
          if (requestedServiceId && result.services.some((service) => service._id === requestedServiceId)) return requestedServiceId;
          return result.services[0]?._id || '';
        });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoadingServices(false); });
    api.get('/api/public/business-hours')
      .then((result) => { if (active) setHoursConfigured(result.days.some((day) => day.isOpen)); })
      .catch(() => { if (active) setHoursConfigured(false); });
    return () => { active = false; };
  }, [searchParams]);

  useEffect(() => {
    if (!serviceId) return;
    let active = true;
    setLoadingSlots(true);
    setError('');
    api.get(`/api/public/availability?serviceId=${encodeURIComponent(serviceId)}&month=${encodeURIComponent(month)}`)
      .then((result) => {
        if (!active) return;
        setAvailability(result.availability);
        setSelectedDate((current) => result.availability.days.some((day) => day.date === current && day.availableCount) ? current : '');
        setSelectedTime('');
      })
      .catch((requestError) => { if (active) { setAvailability(null); setError(requestError.message); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [serviceId, month]);

  const selectedService = useMemo(() => services.find((service) => service._id === serviceId), [services, serviceId]);
  const selectedDay = availability?.days.find((day) => day.date === selectedDate);
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre agendamento na Brutus Cortes.')}` : null;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!user) {
      setError('Crie sua conta ou entre para solicitar este horário.');
      return;
    }
    if (!serviceId || !selectedDate || !selectedTime) {
      setError('Escolha um serviço, uma data e um horário disponível.');
      return;
    }
    try {
      const result = await api.post('/api/appointments', { serviceId, date: selectedDate, time: selectedTime, customerNotes });
      setSuccess(result.appointment);
      setSelectedTime('');
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 409) {
        const refreshed = await api.get(`/api/public/availability?serviceId=${encodeURIComponent(serviceId)}&month=${encodeURIComponent(month)}`).catch(() => null);
        if (refreshed) setAvailability(refreshed.availability);
      }
    }
  }

  if (success) {
    return <section className="page-container booking-page"><div className="booking-success"><span className="booking-success__icon"><Check size={26} /></span><p className="eyebrow">PEDIDO ENVIADO</p><h1>Seu horário está <em>pendente.</em></h1><p>O cabeleireiro precisa confirmar sua solicitação. Você poderá acompanhar o retorno na sua conta.</p><div className="booking-success__summary"><strong>{success.serviceName}</strong><span>{formatCalendarDate(selectedDate)} às {selectedTime}</span><span>{formatMoney(success.priceCents)}</span></div><PixPayment amountCents={success.priceCents} reference={success._id || 'BRUTUS01'} /><div className="button-row"><Link className="button button--primary" to="/minha-conta">Acompanhar pedido <ArrowRight size={16} /></Link><button className="button button--outline" type="button" onClick={() => setSuccess(null)}>Novo agendamento</button></div></div></section>;
  }

  return (
    <section className="page-container booking-page">
      <div className="page-heading page-heading--booking"><div><p className="eyebrow">03 — RESERVE SUA CADEIRA</p><h1>Escolha data e <em>horário.</em></h1><p>O calendário mostra somente o que ainda está livre para o serviço escolhido.</p></div><span className="booking-page__stamp"><CalendarDays size={20} /> AGENDA AO VIVO</span></div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!user ? <Alert tone="info">Você pode consultar a disponibilidade. Para enviar o pedido, <Link to="/entrar?next=%2Fagendar">entre</Link> ou <Link to="/criar-conta">crie sua conta</Link>.</Alert> : null}
      {loadingServices ? <LoadingState label="Carregando catálogo…" /> : null}
      {!loadingServices && services.length === 0 && !error ? <Alert tone="warning">Não há serviços ativos no catálogo. O administrador precisa cadastrar os cortes antes de abrir a agenda.</Alert> : null}
      {hoursConfigured === false && !error ? <Alert tone="warning">A agenda ainda não foi configurada. O cabeleireiro precisa cadastrar os horários de funcionamento no painel antes de oferecer datas.</Alert> : null}

      {services.length > 0 ? (
        <form className="booking-layout" onSubmit={submit}>
          <div className="booking-layout__main">
            <section className="booking-step">
              <div className="booking-step__number">01</div><div className="booking-step__body"><div className="booking-step__heading"><div><span className="eyebrow">SERVIÇO</span><h2>O que vamos fazer?</h2></div><Scissors size={19} /></div>
                <div className="service-choice-grid">{services.map((service) => <button className={`service-choice ${serviceId === service._id ? 'service-choice--selected' : ''}`} type="button" key={service._id} onClick={() => { setServiceId(service._id); setSelectedDate(''); setSelectedTime(''); setSuccess(null); }}><span className="service-choice__name">{service.name}</span><span className="service-choice__description">{service.durationMinutes} min · {service.description || 'Acabamento no detalhe'}</span><strong>{formatMoney(service.priceCents)}</strong><i>{serviceId === service._id ? <Check size={14} /> : null}</i></button>)}</div>
              </div>
            </section>

            <section className="booking-step">
              <div className="booking-step__number">02</div><div className="booking-step__body"><div className="booking-step__heading"><div><span className="eyebrow">DATA</span><h2>Quando fica bom?</h2></div><CalendarDays size={19} /></div>
                {loadingSlots ? <LoadingState label="Consultando disponibilidade…" /> : availability ? <CalendarGrid month={month} days={availability.days} selectedDate={selectedDate} onSelect={(date) => { setSelectedDate(date); setSelectedTime(''); setSuccess(null); }} onChangeMonth={(value) => { setMonth(value); setSelectedDate(''); setSelectedTime(''); }} /> : <p className="muted-copy">Selecione um serviço para consultar as datas disponíveis.</p>}
                {selectedDate && selectedDay ? <div className="time-slot-panel"><div className="time-slot-panel__heading"><div><span className="eyebrow">HORÁRIOS LIVRES</span><h3>{formatCalendarDate(selectedDate)}</h3></div><Clock3 size={18} /></div><div className="time-slot-grid">{selectedDay.slots.map((slot) => <button className={`time-slot ${selectedTime === slot.time ? 'time-slot--selected' : ''}`} type="button" key={slot.time} aria-pressed={selectedTime === slot.time} onClick={() => setSelectedTime(slot.time)}>{slot.time}</button>)}</div></div> : null}
              </div>
            </section>
          </div>

          <aside className="booking-summary">
            <span className="eyebrow">RESUMO DO PEDIDO</span><h2>Sua visita<span>.</span></h2>
            <div className="booking-summary__line"><span>Serviço</span><strong>{selectedService?.name || '—'}</strong></div>
            <div className="booking-summary__line"><span>Duração</span><strong>{selectedService ? `${selectedService.durationMinutes} min` : '—'}</strong></div>
            <div className="booking-summary__line"><span>Data</span><strong>{selectedDate ? formatCalendarDate(selectedDate) : 'Selecione uma data'}</strong></div>
            <div className="booking-summary__line"><span>Horário</span><strong>{selectedTime || 'Selecione um horário'}</strong></div>
            <div className="booking-summary__total"><span>Valor do serviço</span><strong>{selectedService ? formatMoney(selectedService.priceCents) : '—'}</strong></div>
            {selectedService ? <PixPayment amountCents={selectedService.priceCents} compact /> : null}
            <label className="field booking-summary__notes"><span>Observação <small>(opcional)</small></span><textarea value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} maxLength={500} rows={3} placeholder="Tem algum detalhe para contar ao cabeleireiro?" /></label>
            <button className="button button--primary button--wide" type="submit" disabled={!selectedService || !selectedDate || !selectedTime}>Solicitar horário <ArrowRight size={16} /></button>
            <p className="booking-summary__note">O pedido fica pendente até o cabeleireiro confirmar.</p>
            {whatsappUrl ? <a className="booking-summary__whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Tirar uma dúvida</a> : null}
          </aside>
        </form>
      ) : null}
      <div className="booking-page__back"><Link className="text-link text-link--dark" to="/"><ArrowLeft size={15} /> Voltar para os serviços</Link></div>
    </section>
  );
}
