import { useState } from 'react';
import { ArrowRight, Scissors } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/useAuth.js';
import { Alert } from '../components/Feedback.jsx';

export function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nextPath = searchParams.get('next');
  const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const user = isRegister
        ? await register({ name: form.name, email: form.email, password: form.password })
        : await login({ email: form.email, password: form.password });
      navigate(safeNextPath || (user.role === 'admin' ? '/admin' : isRegister ? '/agendar' : '/minha-conta'), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page page-container">
      <div className="auth-card">
        <div className="auth-card__brand"><span className="brand__mark"><Scissors size={19} /></span><span>BRUTUS CORTES</span></div>
        <p className="eyebrow">{isRegister ? 'SUA CONTA, SEU PRÓXIMO HORÁRIO' : 'ACESSO À CONTA'}</p>
        <h1>{isRegister ? 'Chegue mais.' : 'Bom ter você de volta.'}</h1>
        <p className="auth-card__intro">{isRegister ? 'Crie sua conta para solicitar e acompanhar seus agendamentos.' : 'Entre para acompanhar seus horários ou gerenciar a barbearia.'}</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <form className="form-stack" onSubmit={submit}>
          {isRegister ? <label className="field"><span>Seu nome</span><input name="name" autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={update} placeholder="Como podemos chamar você?" /></label> : null}
          <label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={update} placeholder="voce@email.com" /></label>
          <label className="field"><span>Senha</span><input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} maxLength={72} value={form.password} onChange={update} placeholder={isRegister ? 'Mínimo de 8 caracteres' : 'Sua senha'} /></label>
          {isRegister ? <label className="field"><span>Confirme sua senha</span><input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={form.confirmPassword} onChange={update} placeholder="Digite a senha novamente" /></label> : null}
          <button className="button button--primary button--wide" type="submit" disabled={busy}>{busy ? 'Aguarde…' : isRegister ? 'Criar minha conta' : 'Entrar'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-card__switch">{isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'} <Link to={isRegister ? '/entrar' : '/criar-conta'}>{isRegister ? 'Entrar' : 'Criar conta'}</Link></p>
        <p className="auth-card__footnote">O acesso administrativo é criado separadamente e não pode ser solicitado pelo cadastro público.</p>
      </div>
      <div className="auth-aside"><span className="auth-aside__mark">B<span>/</span></span><p>Atendimento<br />com hora marcada.</p></div>
    </section>
  );
}
