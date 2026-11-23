import { useEffect, useState } from 'react';
import { Edit3, Plus, Save, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { Alert, LoadingState } from './Feedback.jsx';
import { api } from '../lib/api.js';
import { centsToInput, formatMoney, parsePriceToCents } from '../lib/format.js';

const emptyForm = { name: '', description: '', price: '', durationMinutes: '30', isActive: true };

export function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const result = await api.get('/api/admin/services');
      setServices(result.services);
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
    setForm(emptyForm);
    setShowForm(true);
    setNotice('');
  }

  function startEdit(service) {
    setEditingId(service._id);
    setForm({ name: service.name, description: service.description || '', price: centsToInput(service.priceCents), durationMinutes: String(service.durationMinutes), isActive: service.isActive });
    setShowForm(true);
    setNotice('');
  }

  async function save(event) {
    event.preventDefault();
    const priceCents = parsePriceToCents(form.price);
    if (priceCents === null) { setError('Informe um preço válido.'); return; }
    setSaving(true);
    setError('');
    setNotice('');
    const payload = { name: form.name, description: form.description, priceCents, durationMinutes: Number(form.durationMinutes), isActive: Boolean(form.isActive) };
    try {
      if (editingId) await api.patch(`/api/admin/services/${editingId}`, payload);
      else await api.post('/api/admin/services', payload);
      setShowForm(false);
      setEditingId('');
      setForm(emptyForm);
      setNotice('Serviço salvo. O novo valor já aparece para os clientes.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service) {
    try {
      await api.patch(`/api/admin/services/${service._id}`, { isActive: !service.isActive });
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">MENU DA BARBEARIA</p><h2>Cortes e valores.</h2><p>Os preços demonstrativos precisam ser revisados antes da divulgação.</p></div><button className="button button--primary" type="button" onClick={startNew}><Plus size={16} /> Novo serviço</button></div>
      {error ? <Alert tone="error">{error}</Alert> : null}{notice ? <Alert tone="info">{notice}</Alert> : null}
      {loading ? <LoadingState label="Carregando catálogo…" /> : null}
      {showForm ? <form className="admin-form-card" onSubmit={save}><div className="admin-form-card__heading"><h3>{editingId ? 'Editar serviço' : 'Novo serviço'}</h3><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={16} /></button></div><div className="admin-form-grid"><label className="field"><span>Nome do corte</span><input required minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="field"><span>Preço em reais</span><input required inputMode="decimal" placeholder="45,00" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label className="field"><span>Duração</span><select value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}>{[30, 60, 90, 120, 150, 180, 210, 240].map((minutes) => <option value={minutes} key={minutes}>{minutes} minutos</option>)}</select></label><label className="field"><span>Disponibilidade</span><select value={String(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'true' })}><option value="true">Ativo no catálogo</option><option value="false">Oculto dos clientes</option></select></label><label className="field admin-form-grid__wide"><span>Descrição curta</span><input maxLength={240} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descreva o serviço em uma frase" /></label></div><div className="admin-form-card__actions"><button className="button button--outline" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar serviço'} <Save size={15} /></button></div></form> : null}
      <div className="admin-service-list">{services.map((service) => <article className={`admin-service-row ${!service.isActive ? 'admin-service-row--inactive' : ''}`} key={service._id}><div className="admin-service-row__symbol"><span>BC</span></div><div className="admin-service-row__main"><strong>{service.name}</strong><span>{service.description || 'Sem descrição'}</span><small>{service.durationMinutes} min · {service.isActive ? 'Visível no catálogo' : 'Oculto dos clientes'}{service.isDemo ? ' · valor demonstrativo' : ''}</small></div><strong className="admin-service-row__price">{formatMoney(service.priceCents)}</strong><button className="icon-button" type="button" aria-label={`Editar ${service.name}`} onClick={() => startEdit(service)}><Edit3 size={15} /></button><button className="icon-button" type="button" aria-label={service.isActive ? `Ocultar ${service.name}` : `Ativar ${service.name}`} onClick={() => toggleActive(service)}>{service.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}</button></article>)}</div>
      {!loading && services.length === 0 ? <div className="admin-empty"><p>O catálogo está vazio. Cadastre o primeiro serviço.</p></div> : null}
    </div>
  );
}
