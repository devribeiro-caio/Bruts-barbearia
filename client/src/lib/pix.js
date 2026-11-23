const pixPhoneKey = '+5511934632232';
const pixPhoneLabel = '+55 (11) 93463-2232';
const merchantName = 'BRUTUS CORTES';
const merchantCity = 'SAO PAULO';

function field(id, value) {
  const text = String(value);
  return `${id}${String(text.length).padStart(2, '0')}${text}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function createPixPayload(amountCents, reference = 'BRUTUS01') {
  const amount = (Number(amountCents) || 0) / 100;
  const merchantAccount = [
    field('00', 'BR.GOV.BCB.PIX'),
    field('01', pixPhoneKey),
  ].join('');
  const payload = [
    field('00', '01'),
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    amount > 0 ? field('54', amount.toFixed(2)) : '',
    field('58', 'BR'),
    field('59', merchantName),
    field('60', merchantCity),
    field('62', field('05', String(reference).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || 'BRUTUS01')),
  ].join('');
  return `${payload}6304${crc16(`${payload}6304`)}`;
}

export function getPixPhoneKey() {
  return pixPhoneLabel;
}
