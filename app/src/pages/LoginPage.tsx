import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonSpinner,
} from '@ionic/react';
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
      setError(err instanceof Error ? err.message : 'Error desconocido');
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
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonText>
            <h2>Inicio de sesión</h2>
            <p className="muted">Ingresa con tu cuenta de docente o instructor.</p>
          </IonText>

          <IonList inset>
            <IonItem>
              <IonLabel position="stacked">Documento</IonLabel>
              <IonInput
                value={documento}
                onIonInput={(e) => setDocumento(String(e.detail.value ?? ''))}
                placeholder="DOC-DEMO-001"
                required
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(String(e.detail.value ?? ''))}
                placeholder="********"
                required
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Código institución (opcional)</IonLabel>
              <IonInput
                value={institutionCode}
                onIonInput={(e) => setInstitutionCode(String(e.detail.value ?? ''))}
                placeholder="SENA-DEMO o UNI-DEMO"
              />
            </IonItem>
          </IonList>

          {error ? (
            <IonNote color="danger" className="ion-padding-start">
              {error}
            </IonNote>
          ) : null}

          <div className="ion-padding">
            <IonButton type="submit" expand="block" disabled={loading}>
              {loading ? <IonSpinner name="dots" /> : 'Iniciar sesión'}
            </IonButton>
            <IonButton expand="block" fill="clear" routerLink="/settings">
              Configurar URL del backend
            </IonButton>
          </div>

          <IonNote className="ion-padding-start">
            Usuarios demo: <code>DOC-DEMO-001</code> (SENA-DEMO) o <code>DOC-DEMO-002</code> (UNI-DEMO),
            password <code>Demo.2025</code>.
          </IonNote>
        </form>
      </IonContent>
    </IonPage>
  );
}
