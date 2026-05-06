import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  IonNote,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';

type Status = 'loading' | 'idle' | 'submitting' | 'success' | 'error';

export default function PublicAttendancePage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [sessionStatus, setSessionStatus] = useState<string>('UNKNOWN');
  const [documento, setDocumento] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [registered, setRegistered] = useState<{ nombre: string; registeredAt: string } | null>(null);

  useEffect(() => {
    api
      .publicGetSession(token)
      .then((s) => {
        setSessionStatus(s.status);
        setStatus('idle');
      })
      .catch((e: unknown) => {
        setFeedback(e instanceof Error ? e.message : 'Sesión no disponible');
        setStatus('error');
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setFeedback(null);
    try {
      const data = await api.publicRegister(token, documento.trim());
      setRegistered({ nombre: data.nombre, registeredAt: data.registeredAt });
      setStatus('success');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'No se pudo registrar la asistencia');
      setStatus('error');
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Registro de asistencia</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="public-attendance">
          <IonText>
            <h2>Registra tu asistencia</h2>
            <p className="muted">Ingresa tu documento. Los datos quedan asociados a la sesión actual.</p>
          </IonText>

          {status === 'loading' ? <IonSpinner /> : null}

          {sessionStatus !== 'ACTIVE' && status !== 'loading' && status !== 'success' ? (
            <IonNote color="warning">
              Estado de la sesión: <strong>{sessionStatus}</strong>. Solo se acepta registro si está ACTIVE.
            </IonNote>
          ) : null}

          {status === 'success' && registered ? (
            <IonText color="success">
              <h3>¡Asistencia registrada!</h3>
              <p>
                <strong>{registered.nombre}</strong>
              </p>
              <p className="muted">{new Date(registered.registeredAt).toLocaleString()}</p>
            </IonText>
          ) : (
            <form onSubmit={handleSubmit}>
              <IonList inset>
                <IonItem>
                  <IonLabel position="stacked">Documento</IonLabel>
                  <IonInput
                    value={documento}
                    onIonInput={(e) => setDocumento(String(e.detail.value ?? ''))}
                    placeholder="EST-DEMO-001"
                    required
                    disabled={status === 'submitting'}
                  />
                </IonItem>
              </IonList>

              {feedback ? <IonNote color="danger">{feedback}</IonNote> : null}

              <IonButton
                expand="block"
                type="submit"
                disabled={status === 'submitting' || sessionStatus !== 'ACTIVE'}
              >
                {status === 'submitting' ? <IonSpinner name="dots" /> : 'Confirmar asistencia'}
              </IonButton>
            </form>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
