import {
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonText,
} from '@ionic/react';
import { useState } from 'react';
import type { AbsentRecord, PresentRecord, RejectionRecord } from '../api/types';

const REASON_LABEL: Record<string, string> = {
  NOT_FOUND: 'Documento no registrado',
  NOT_ENROLLED: 'No inscrito en la unidad',
  DUPLICATE: 'Asistencia duplicada',
  SESSION_CLOSED: 'Sesión cerrada',
  QR_EXPIRED: 'QR expirado',
  INVALID_ROOM_CODE: 'Código de sala inválido',
};

interface Props {
  present: PresentRecord[];
  absent: AbsentRecord[];
  rejections: RejectionRecord[];
}

export default function AttendancePanels({ present, absent, rejections }: Props) {
  const [tab, setTab] = useState<'present' | 'absent' | 'rejections'>('present');

  return (
    <>
      <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as typeof tab)}>
        <IonSegmentButton value="present">
          <IonLabel>Presentes ({present.length})</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="absent">
          <IonLabel>Ausentes ({absent.length})</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="rejections">
          <IonLabel>Rechazos ({rejections.length})</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      {tab === 'present' ? (
        <IonList>
          <IonListHeader>
            <IonLabel>Presentes</IonLabel>
          </IonListHeader>
          {present.length === 0 ? (
            <IonItem>
              <IonNote>Sin registros aún.</IonNote>
            </IonItem>
          ) : (
            present.map((p) => (
              <IonItem key={p.id}>
                <IonLabel>
                  <h3>{p.nombre ?? '—'}</h3>
                  <IonText color="medium">
                    <small>{p.documento}</small>
                  </IonText>
                </IonLabel>
                <IonNote slot="end">{new Date(p.registeredAt).toLocaleTimeString()}</IonNote>
              </IonItem>
            ))
          )}
        </IonList>
      ) : null}

      {tab === 'absent' ? (
        <IonList>
          <IonListHeader>
            <IonLabel>Ausentes</IonLabel>
          </IonListHeader>
          {absent.length === 0 ? (
            <IonItem>
              <IonNote>Todos presentes.</IonNote>
            </IonItem>
          ) : (
            absent.map((p) => (
              <IonItem key={p.id}>
                <IonLabel>
                  <h3>{p.nombre}</h3>
                  <IonText color="medium">
                    <small>{p.documento}</small>
                  </IonText>
                </IonLabel>
              </IonItem>
            ))
          )}
        </IonList>
      ) : null}

      {tab === 'rejections' ? (
        <IonList>
          <IonListHeader>
            <IonLabel>Rechazos</IonLabel>
          </IonListHeader>
          {rejections.length === 0 ? (
            <IonItem>
              <IonNote>Sin rechazos.</IonNote>
            </IonItem>
          ) : (
            rejections.map((r) => (
              <IonItem key={r.id}>
                <IonLabel>
                  <h3>{r.documento}</h3>
                  <IonText color="medium">
                    <small>{REASON_LABEL[r.reason ?? ''] ?? r.reason ?? '—'}</small>
                  </IonText>
                </IonLabel>
                <IonBadge color="warning" slot="end">
                  {new Date(r.rejectedAt).toLocaleTimeString()}
                </IonBadge>
              </IonItem>
            ))
          )}
        </IonList>
      ) : null}
    </>
  );
}
