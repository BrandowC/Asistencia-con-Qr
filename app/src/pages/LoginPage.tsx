import { IonContent, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../store/auth';

export default function LoginPage() {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession, token } = useAuth();
  const history = useHistory();
  const location = useLocation<{ from?: { pathname: string } }>();

  useEffect(() => {
    if (token) history.replace('/dashboard');
  }, [token, history]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.login(
        documento.trim(),
        password,
        institutionCode.trim() ? institutionCode.trim() : undefined,
      );
      setSession(data.person, data.token);
      const target = location.state?.from?.pathname ?? '/dashboard';
      history.replace(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Asistencia con QR</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="login-shell">
          <form className="login-card" onSubmit={handleSubmit} autoComplete="on">
            <h1>Acceso al sistema</h1>
            <p className="subtitle">Ingresa con tu cuenta de docente o instructor.</p>

            <div className="field">
              <label htmlFor="documento">Documento</label>
              <input
                id="documento"
                name="documento"
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Tu documento"
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="institutionCode">Código de institución (opcional)</label>
              <input
                id="institutionCode"
                name="institutionCode"
                type="text"
                value={institutionCode}
                onChange={(e) => setInstitutionCode(e.target.value)}
                placeholder="Solo si tu documento se repite entre instituciones"
              />
            </div>

            {error ? <div className="error-msg">{error}</div> : null}

            <button type="submit" className="submit" disabled={loading}>
              {loading ? <IonSpinner name="dots" /> : 'Iniciar sesión'}
            </button>

            <a className="helper-link" onClick={(e) => { e.preventDefault(); history.push('/settings'); }} href="/settings">
              Configurar URL del backend
            </a>

            <p className="footer-note">
              ¿No tienes cuenta? Pídele al administrador que te cree el usuario desde la sección de Gestión.
            </p>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
}
