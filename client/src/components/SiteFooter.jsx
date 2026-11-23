import { ArrowUpRight, Scissors } from 'lucide-react';

function formatWhatsappPhone(phone) {
  const match = phone?.match(/^55(\d{2})(\d{5})(\d{4})$/);
  return match ? `+55 (${match[1]}) ${match[2]}-${match[3]}` : phone;
}

export function SiteFooter({ whatsappPhone }) {
  const link = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Olá! Gostaria de falar com a Brutus Cortes.')}`
    : null;
  const phoneLabel = formatWhatsappPhone(whatsappPhone);

  return (
    <footer className="site-footer">
      <div className="site-footer__top page-container">
        <div className="site-footer__brand"><Scissors size={18} /><span>BRUTUS CORTES</span></div>
        <p>Seu próximo corte começa com um horário.</p>
        {link ? <a href={link} target="_blank" rel="noreferrer">WhatsApp {phoneLabel} <ArrowUpRight size={15} /></a> : <span className="muted-copy">WhatsApp será exibido após a configuração do número.</span>}
      </div>
      <div className="site-footer__bottom page-container"><span>© {new Date().getFullYear()} Brutus Cortes</span><span>Feito para chegar no horário.</span></div>
    </footer>
  );
}
