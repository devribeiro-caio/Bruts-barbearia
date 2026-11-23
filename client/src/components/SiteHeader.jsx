import { ArrowUpRight, Menu, MessageCircle, Scissors, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

function whatsAppUrl(phone) {
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent('Olá! Gostaria de falar com a Brutus Cortes.')}`;
}

export function SiteHeader({ user, whatsappPhone }) {
  const [open, setOpen] = useState(false);
  const waUrl = whatsAppUrl(whatsappPhone);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" to="/" aria-label="Brutus Cortes — início" onClick={close}>
          <span className="brand__mark"><Scissors size={19} strokeWidth={1.8} /></span>
          <span className="brand__word">BRUTUS<span>CORTES</span></span>
        </Link>
        <button className="icon-button site-header__toggle" type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`site-nav ${open ? 'site-nav--open' : ''}`} aria-label="Navegação principal">
          <NavLink to="/#servicos" onClick={close}>Serviços</NavLink>
          <NavLink to="/agendar" onClick={close}>Agendar</NavLink>
          {user?.role === 'admin' ? <NavLink to="/admin" onClick={close}>Painel</NavLink> : null}
          {user && user.role === 'customer' ? <NavLink to="/minha-conta" onClick={close}>Minha conta</NavLink> : null}
          {!user ? <NavLink to="/entrar" onClick={close}>Entrar</NavLink> : null}
          {waUrl ? <a className="site-nav__whatsapp" href={waUrl} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14} /></a> : <span className="site-nav__whatsapp site-nav__whatsapp--muted"><MessageCircle size={14} /> WhatsApp</span>}
        </nav>
      </div>
    </header>
  );
}
