import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Clock3, Scissors, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatMoney } from '../lib/format.js';
import { Alert, LoadingState } from '../components/Feedback.jsx';

const highlights = [
  { icon: CalendarDays, title: 'Escolha seu horário', text: 'Veja as datas e os horários que ainda estão livres.' },
  { icon: ShieldCheck, title: 'Confirmação do barbeiro', text: 'Seu pedido fica pendente até o cabeleireiro confirmar.' },
  { icon: Sparkles, title: 'Chegue no estilo', text: 'Detalhe seu pedido e venha pronto para a cadeira.' },
];

export function HomePage({ contact }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/api/public/services')
      .then((result) => { if (active) setServices(result.services); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const whatsappUrl = contact.whatsappPhone
    ? `https://wa.me/${contact.whatsappPhone}?text=${encodeURIComponent('Olá! Gostaria de falar com a Brutus Cortes.')}`
    : null;

  return (
    <>
      <section className="hero page-container">
        <div className="hero__photo-wrap">
          <img className="hero__photo" src="/images/brutus-hero.png" alt="Atendimento de corte em uma cadeira de barbearia" />
          <div className="hero__shade" />
        </div>
        <div className="hero__content">
          <p className="eyebrow"><span className="eyebrow__line" /> BARBEARIA · ESTILO · PRECISÃO</p>
          <h1>Seu próximo corte começa com <em>um horário.</em></h1>
          <p className="hero__copy">Escolha o serviço, confira o que está livre e deixe o resto com a gente.</p>
          <div className="hero__actions">
            <Link className="button button--primary" to="/agendar">Agendar meu corte <ArrowRight size={17} /></Link>
            <a className="text-link" href="#servicos">Ver os serviços <ArrowDown size={15} /></a>
          </div>
          <div className="hero__micro"><span>01</span><span>Seu estilo, no seu tempo.</span></div>
        </div>
        <div className="hero__side-label">BRUTUS CORTES · BRUTUS CORTES · BRUTUS CORTES</div>
        <div className="hero__corner-mark">B<span>/</span></div>
      </section>

      <section className="trust-strip page-container" aria-label="Diferenciais">
        <span>ATENDIMENTO COM HORA MARCADA</span><span className="trust-strip__divider" /><span>AGENDAMENTO ONLINE</span><span className="trust-strip__divider" /><span>CONFIRMAÇÃO PELO CABELEIREIRO</span>
      </section>

      <section className="section page-container" id="servicos">
        <div className="section-heading">
          <div><p className="eyebrow">01 — ESCOLHA SEU CORTE</p><h2>Serviços em destaque<span>.</span></h2></div>
          <Link className="text-link text-link--dark" to="/agendar">Ver disponibilidade <ArrowUpRight size={15} /></Link>
        </div>
        {contact.demoPrices ? <Alert tone="warning">Valores iniciais demonstrativos. O cabeleireiro pode atualizá-los no painel antes de divulgar o sistema.</Alert> : null}
        {loading ? <LoadingState label="Carregando serviços…" /> : null}
        {error ? <Alert tone="error">{error} Verifique a configuração do MongoDB para carregar o catálogo real.</Alert> : null}
        {!loading && !error && services.length === 0 ? <div className="empty-state"><Scissors size={26} /><p>Os serviços serão exibidos assim que o catálogo for configurado.</p></div> : null}
        <div className="service-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service._id}>
              <div className="service-card__top"><span className="service-card__index">0{index + 1}</span><Scissors size={18} strokeWidth={1.6} /></div>
              <div className="service-card__body"><h3>{service.name}</h3><p>{service.description || 'Um serviço pensado nos detalhes.'}</p></div>
              <div className="service-card__bottom"><span className="service-card__duration"><Clock3 size={14} /> {service.durationMinutes} min</span><strong>{formatMoney(service.priceCents)}</strong></div>
              <Link to={`/agendar?servico=${service._id}`} className="service-card__link" aria-label={`Agendar ${service.name}`}><ArrowUpRight size={17} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="process-band">
        <div className="page-container process-band__inner">
          <div className="process-band__intro"><p className="eyebrow">02 — DIRETO AO PONTO</p><h2>Do corte ao horário,<br />sem complicação.</h2><p>Você vê a agenda como ela está. O horário só fica confirmado depois do retorno do cabeleireiro.</p><Link className="button button--light" to="/agendar">Abrir agenda <ArrowRight size={16} /></Link></div>
          <div className="process-list">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return <div className="process-item" key={item.title}><span className="process-item__number">0{index + 1}</span><Icon size={21} strokeWidth={1.6} /><div><h3>{item.title}</h3><p>{item.text}</p></div></div>;
            })}
          </div>
        </div>
      </section>

      <section className="closing-cta page-container">
        <div><p className="eyebrow">NO SEU RITMO</p><h2>Uma boa escolha começa<br />com o horário certo.</h2></div>
        <div className="closing-cta__action"><Link className="button button--primary" to="/agendar">Escolher data e horário <ArrowRight size={16} /></Link>{whatsappUrl ? <a className="text-link text-link--dark" href={whatsappUrl} target="_blank" rel="noreferrer">Falar com o cabeleireiro <ArrowUpRight size={14} /></a> : null}</div>
      </section>
    </>
  );
}
