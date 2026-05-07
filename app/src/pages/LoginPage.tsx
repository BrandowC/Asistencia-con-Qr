import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
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
import { logInOutline, settingsOutline } from 'ionicons/icons';
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
      <IonContent className="ion-padding fade-in">
        <form onSubmit={handleSubmit}>
          <div className="welcome-card">
            <h2>Bienvenido</h2>
            <p>Ingresa con tu cuenta de docente o instructor para continuar.</p>
          </div>

          <IonList inset className="slide-up">
            <IonItem>
              <IonLabel position="stacked">Documento</IonLabel>
              <IonInput
                value={documento}
                onIonInput={(e) => setDocumento(String(e.detail.value ?? ''))}
                placeholder="Tu documento"
                required
                autocomplete="username"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(String(e.detail.value ?? ''))}
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Código de la institución (opcional)</IonLabel>
              <IonInput
                value={institutionCode}
                onIonInput={(e) => setInstitutionCode(String(e.detail.value ?? ''))}
                placeholder="Solo si tu documento se repite entre instituciones"
              />
            </IonItem>
          </IonList>

          {error ? (
            <IonText color="danger" className="ion-padding-start slide-up">
              <p>{error}</p>
            </IonText>
          ) : null}

          <div className="ion-padding slide-up">
            <IonButton type="submit" expand="block" disabled={loading}>
              {loading ? (
                <IonSpinner name="dots" />
              ) : (
                <>
                  <IonIcon slot="start" icon={logInOutline} />
                  Iniciar sesión
                </>
              )}
            </IonButton>
            <IonButton expand="block" fill="clear" routerLink="/settings">
              <IonIcon slot="start" icon={settingsOutline} />
              Configurar URL del backend
            </IonButton>
          </div>

          <IonNote className="ion-padding-start">
            ¿Aún no tienes una cuenta? El administrador del sistema debe crearla desde la sección de
            gestión.
          </IonNote>
        </form>
      </IonContent>
    </IonPage>
  );
}
