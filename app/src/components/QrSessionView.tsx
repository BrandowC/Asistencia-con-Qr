import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonText } from '@ionic/react';
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
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Sesión QR</IonCardTitle>
        <IonCardSubtitle>
          Estado: <IonBadge color={session.status === 'ACTIVE' ? 'success' : 'medium'}>{session.status}</IonBadge>
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
            <p className="muted" style={{ wordBreak: 'break-all' }}>
              {session.qrUrl}
            </p>
          ) : null}
        </div>

        <IonText>
          <h3>Código de sala</h3>
        </IonText>
        <div style={{ textAlign: 'center' }}>
          <span className="room-code">{session.roomCode ?? '—'}</span>
          <p className="muted">Expira en {formatRemaining(session.roomCodeExpiresAt)}</p>
        </div>

        <IonText>
          <p className="muted">QR vence: {formatRemaining(session.qrExpiresAt)}</p>
        </IonText>

        <IonButton expand="block" onClick={onRotateRoom} fill="outline" disabled={session.status !== 'ACTIVE'}>
          Rotar código de sala
        </IonButton>
        <IonButton expand="block" color="danger" onClick={onClose} disabled={session.status === 'CLOSED'}>
          Cerrar sesión
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}
