import { ChevronLeft, ChevronRight } from 'lucide-react';

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function moveMonth(value, delta) {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1, 12);
  return monthKey(date);
}

function monthTitle(value) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1, 12));
}

export function CalendarGrid({ month, days, selectedDate, onSelect, onChangeMonth }) {
  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1, 12);
  const offset = (firstDay.getDay() + 6) % 7;
  const count = new Date(year, monthNumber, 0).getDate();
  const byDate = new Map(days.map((day) => [day.date, day]));
  const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  const currentMonth = monthKey();
  const lastMonth = moveMonth(currentMonth, 6);

  return (
    <div className="calendar-card">
      <div className="calendar-card__heading"><div><span className="eyebrow">ESCOLHA UMA DATA</span><h3>{monthTitle(month)}</h3></div><div className="calendar-controls"><button className="icon-button" type="button" aria-label="Mês anterior" disabled={month <= currentMonth} onClick={() => onChangeMonth(moveMonth(month, -1))}><ChevronLeft size={18} /></button><button className="icon-button" type="button" aria-label="Próximo mês" disabled={month >= lastMonth} onClick={() => onChangeMonth(moveMonth(month, 1))}><ChevronRight size={18} /></button></div></div>
      <div className="calendar-grid calendar-grid--labels">{weekdayLabels.map((label) => <span key={label}>{label}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((day, index) => {
          if (!day) return <span className="calendar-day calendar-day--empty" key={`empty-${index}`} />;
          const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const details = byDate.get(date);
          const available = Boolean(details?.availableCount);
          const selected = selectedDate === date;
          return <button className={`calendar-day ${available ? 'calendar-day--available' : 'calendar-day--disabled'} ${selected ? 'calendar-day--selected' : ''}`} type="button" key={date} disabled={!available} onClick={() => onSelect(date)} aria-label={`${date}${available ? `, ${details.availableCount} horários disponíveis` : ', sem horários disponíveis'}`} aria-pressed={selected}>{day}{available ? <i /> : null}</button>;
        })}
      </div>
      <div className="calendar-legend"><span><i /> Com horário livre</span><span>Datas sem ponto estão indisponíveis</span></div>
    </div>
  );
}
