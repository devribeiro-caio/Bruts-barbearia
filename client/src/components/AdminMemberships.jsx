import { useEffect, useState } from 'react';
import { Edit3, Plus, Save, WalletCards, X } from 'lucide-react';
import { Alert, LoadingState } from './Feedback.jsx';
import { api } from '../lib/api.js';
import { centsToInput, formatMoney, parsePriceToCents } from '../lib/format.js';

const emptyForm = { customerId: '', planName: '', monthlyPrice: '', billingDay: '5', startedAt: '', status: 'active', notes: '' };
const statusText = { active: 'Ativo', paused: 'Pausado', cancelled: 'Cancelado' };

function localDateInput(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function AdminMemberships() {
  const [memberships, setMemberships] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ ...emptyForm, startedAt: localDateInput() });
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [memberResult, customerResult] = await Promise.all([
        api.get('/api/admin/memberships'),
        api.get('/api/admin/customers'),
      ]);
      setMemberships(memberResult.memberships);
      setCustomers(customerResult.customers);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditingId('');
    setForm({ ...emptyForm, startedAt: localDateInput() });
    setShowForm(true);
    setNotice('');
  }

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      customerId: String(item.customerId?._id || ''),
      planName: item.planName,
      monthlyPrice: centsToInput(item.monthlyPriceCents),
      billingDay: String(item.billingDay),
      startedAt: localDateInput(new Date(item.startedAt)),
      status: item.status,
      notes: item.notes || '',
    });
    setShowForm(true);
    setNotice('');
  }

  async function save(event) {
    event.preventDefault();
    const monthlyPriceCents = parsePriceToCents(form.monthlyPrice);
    if (monthlyPriceCents === null) { setError('Informe um valor mensal válido.'); return; }
    if (!editingId && !form.customerId) { setError('Selecione um cliente.'); return; }
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      planName: form.planName,
      monthlyPriceCents,
      billingDay: Number(form.billingDay),
      startedAt: form.startedAt,
      status: form.status,
      notes: form.notes,
      ...(!editingId ? { customerId: form.customerId } : {}),
    };
    try {
      if (editingId) await api.patch(`/api/admin/memberships/${editingId}`, payload);
      else await api.post('/api/admin/memberships', payload);
      setShowForm(false);
      setEditingId('');
      setNotice('Plano mensal salvo. Este controle é administrativo e não realiza cobranças.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">CONTROLE MANUAL</p><h2>Planos mensais.</h2><p>Registre valores e vencimentos dos clientes recorrentes. Nenhuma cobrança é processada por esta tela.</p></div><button className="button button--primary" type="button" onClick={startNew}><Plus size={16} /> Adicionar cliente</button></div>
      {error ? <Alert tone="error">{error}</Alert> : null}{notice ? <Alert tone="info">{notice}</Alert> : null}
      {loading ? <LoadingState label="Carregando clientes e planos…" /> : null}
      {showForm ? <form className="admin-form-card" onSubmit={save}><div className="admin-form-card__heading"><h3>{editingId ? 'Editar plano mensal' : 'Adicionar ao plano mensal'}</h3><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={16} /></button></div><div className="admin-form-grid">
        {!editingId ? <label className="field"><span>Cliente</span><select required value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}><option value="">Selecione um cliente</option>{customers.map((customer) => <option value={customer._id} key={customer._id}>{customer.name} · {customer.email}</option>)}</select></label> : <div className="field"><span>Cliente</span><p className="admin-form-static">{memberships.find((item) => item._id === editingId)?.customerId?.name || 'Cliente cadastrado'}</p></div>}
        <label className="field"><span>Nome do plano</span><input required minLength={2} maxLength={80} value={form.planName} onChange={(event) => setForm({ ...form, planName: event.target.value })} placeholder="Ex.: Corte mensal" /></label>
        <label className="field"><span>Valor mensal (R$)</span><input required inputMode="decimal" value={form.monthlyPrice} onChange={(event) => setForm({ ...form, monthlyPrice: event.target.value })} placeholder="149,90" /></label>
        <label className="field"><span>Dia do vencimento</span><input type="number" min="1" max="31" required value={form.billingDay} onChange={(event) => setForm({ ...form, billingDay: event.target.value })} /></label>
        <label className="field"><span>Início do plano</span><input type="date" required value={form.startedAt} onChange={(event) => setForm({ ...form, startedAt: event.target.value })} /></label>
        <label className="field"><span>Situação</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Ativo</option><option value="paused">Pausado</option><option value="cancelled">Cancelado</option></select></label>
        <label className="field admin-form-grid__wide"><span>Observações</span><textarea maxLength={500} rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Anotações para o cabeleireiro" /></label>
      </div><div className="admin-form-card__actions"><button className="button button--outline" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar plano'} <Save size={15} /></button></div></form> : null}
      {!loading && memberships.length === 0 ? <div className="admin-empty"><WalletCards size={23} /><p>Nenhum cliente foi vinculado a um plano mensal.</p><span>Adicione um cliente cadastrado para começar o controle.</span></div> : null}
      {memberships.length > 0 ? <div className="admin-membership-list">{memberships.map((item) => <article className="admin-membership-row" key={item._id}><div className="admin-membership-row__icon"><WalletCards size={18} /></div><div className="admin-membership-row__customer"><strong>{item.customerId?.name || 'Cliente'}</strong><span>{item.customerId?.email || 'Conta removida'}</span></div><div className="admin-membership-row__plan"><strong>{item.planName}</strong><span>Vencimento todo dia {item.billingDay} · desde {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'medium' }).format(new Date(item.startedAt))}</span></div><div className="admin-membership-row__price"><strong>{formatMoney(item.monthlyPriceCents)}</strong><span>por mês</span></div><span className={`membership-status membership-status--${item.status}`}>{statusText[item.status]}</span><button className="icon-button" type="button" aria-label={`Editar plano de ${item.customerId?.name || 'cliente'}`} onClick={() => startEdit(item)}><Edit3 size={15} /></button></article>)}</div> : null}
    </div>
  );
}
