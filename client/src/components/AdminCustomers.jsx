import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Alert, LoadingState } from './Feedback.jsx';
import { api } from '../lib/api.js';

export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      api.get(`/api/admin/customers?search=${encodeURIComponent(search)}`)
        .then((result) => { if (active) setCustomers(result.customers); })
        .catch((requestError) => { if (active) setError(requestError.message); })
        .finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [search]);

  return (
    <div className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">BASE DE CLIENTES</p><h2>Quem senta na cadeira.</h2><p>Contas criadas pelos clientes ficam disponíveis para a gestão do plano mensal.</p></div><span className="admin-section-heading__icon"><Users size={20} /></span></div>
      <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou e-mail" aria-label="Buscar clientes" /></label>
      {error ? <Alert tone="error">{error}</Alert> : null}{loading ? <LoadingState label="Buscando clientes…" /> : null}
      {!loading && !error && customers.length === 0 ? <div className="admin-empty"><p>Nenhum cliente encontrado.</p><span>Novos clientes aparecem após criarem uma conta.</span></div> : null}
      {customers.length > 0 ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cliente</th><th>E-mail</th><th>Cadastro</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id}><td>{customer.name}</td><td>{customer.email}</td><td>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'medium' }).format(new Date(customer.createdAt))}</td></tr>)}</tbody></table></div> : null}
    </div>
  );
}
