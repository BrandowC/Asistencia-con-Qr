import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonText,
  useIonToast,
} from '@ionic/react';
import { closeCircleOutline, copyOutline, refreshOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import type { AttendanceSession } from '../api/types';

interface Props {
  session: AttendanceSession;
  onRotateRoom: () => void;
  onClose: () => void;
}

function formatRemaining(target: string | null): string {
  if (!target) return '—';
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return 'expirado';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function QrSessionView({ session, onRotateRoom, onClose }: Props) {
  const [, force] = useState(0);
  const [present] = useIonToast();
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function copyUrl() {
    if (!session.qrUrl) return;
    try {
      await navigator.clipboard.writeText(session.qrUrl);
      void present({ message: 'Enlace copiado', duration: 1400, color: 'success', position: 'bottom' });
    } catch {
      void present({ message: 'No se pudo copiar', duration: 1400, color: 'danger', position: 'bottom' });
    }
  }

  return (
    <IonCard className="slide-up">
      <IonCardHeader>
        <IonCardTitle>Sesión QR</IonCardTitle>
        <IonCardSubtitle>
          Estado:{' '}
          <IonBadge color={session.status === 'ACTIVE' ? 'success' : 'medium'}>
            {session.status}
          </IonBadge>
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="qr-card">
          {session.qrPng ? (
            <img src={session.qrPng} alt="QR de la sesión de asistencia" />
          ) : (
            <p className="muted">Activa la sesión para generar el QR.</p>
          )}
          {session.qrUrl ? (
            <div>
              <span className="session-url">{session.qrUrl}</span>
              <br />
              <span className="copy-link" onClick={copyUrl}>
                <IonIcon icon={copyOutline} /> Copiar enlace
              </span>
            </div>
          ) : null}
        </div>

        <IonText>
          <h3 style={{ textAlign: 'center', marginTop: 16 }}>Código de sala</h3>
        </IonText>
        <div style={{ textAlign: 'center' }}>
          <span className="room-code">{session.roomCode ?? '—'}</span>
          <p className="muted">Renueva en {formatRemaining(session.roomCodeExpiresAt)}</p>
        </div>

        <IonText>
          <p className="muted" style={{ textAlign: 'center' }}>
            QR vence en <strong>{formatRemaining(session.qrExpiresAt)}</strong>
          </p>
        </IonText>

        <IonButton expand="block" onClick={onRotateRoom} fill="outline" disabled={session.status !== 'ACTIVE'}>
          <IonIcon slot="start" icon={refreshOutline} />
          Rotar código de sala
        </IonButton>
        <IonButton expand="block" color="danger" onClick={onClose} disabled={session.status === 'CLOSED'}>
          <IonIcon slot="start" icon={closeCircleOutline} />
          Cerrar sesión
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}
