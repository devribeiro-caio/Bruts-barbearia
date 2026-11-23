import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, QrCode } from 'lucide-react';
import { formatMoney } from '../lib/format.js';
import { createPixPayload, getPixPhoneKey } from '../lib/pix.js';

export function PixPayment({ amountCents, reference = 'BRUTUS01', compact = false }) {
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const payload = createPixPayload(amountCents, reference);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
      .then((dataUrl) => { if (active) setQrCode(dataUrl); })
      .catch(() => { if (active) setQrCode(''); });
    return () => { active = false; };
  }, [payload]);

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={`pix-payment ${compact ? 'pix-payment--compact' : ''}`}>
      <div className="pix-payment__heading"><div><span className="eyebrow"><QrCode size={14} /> PAGAMENTO</span><h3>Reserve com Pix.</h3></div><strong>{formatMoney(amountCents)}</strong></div>
      <div className="pix-payment__content">
        {qrCode ? <img className="pix-payment__qr" src={qrCode} alt="QR Code para pagamento via Pix" /> : <div className="pix-payment__qr pix-payment__qr--loading">Gerando QR Code…</div>}
        <div className="pix-payment__details">
          <p>Escaneie o QR Code no app do seu banco ou copie o código Pix.</p>
          <span className="pix-payment__key">Chave Pix: {getPixPhoneKey()}</span>
          <button className="button button--outline pix-payment__copy" type="button" onClick={copyPayload} disabled={!qrCode}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Código copiado' : 'Copiar código Pix'}
          </button>
          <small>O pagamento deve ser feito somente após conferir o valor. A confirmação do agendamento continua dependendo do cabeleireiro.</small>
        </div>
      </div>
    </section>
  );
}
