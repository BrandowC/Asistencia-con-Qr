import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { api } from '../api/client';
import type {
  AbsentRecord,
  AcademicUnit,
  AttendanceSession,
  EnrolledPerson,
  Institution,
  PresentRecord,
  RejectionRecord,
} from '../api/types';
import { useAuth } from '../store/auth';
import QrSessionView from '../components/QrSessionView';
import AttendancePanels from '../components/AttendancePanels';

export default function DashboardPage() {
  const { person, clearSession } = useAuth();
  const history = useHistory();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [enrollments, setEnrollments] = useState<EnrolledPerson[]>([]);
  const [history_, setHistory] = useState<AttendanceSession[]>([]);

  const [institutionId, setInstitutionId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [present, setPresent] = useState<PresentRecord[]>([]);
  const [absent, setAbsent] = useState<AbsentRecord[]>([]);
  const [rejections, setRejections] = useState<RejectionRecord[]>([]);

  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getInstitutions()
      .then((items) => {
        setInstitutions(items);
        if (person?.institutionId) {
          const found = items.find((i) => i.id === person.institutionId);
          if (found) setInstitutionId(found.id);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error cargando instituciones'))
      .finally(() => setLoadingInstitutions(false));
  }, [person]);

  useEffect(() => {
    if (!institutionId) return;
    setLoadingUnits(true);
    setUnits([]);
    setUnitId('');
    api
      .getUnits(institutionId)
      .then(setUnits)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error cargando unidades'))
      .finally(() => setLoadingUnits(false));
  }, [institutionId]);

  useEffect(() => {
    if (!unitId) return;
    setLoadingEnrollments(true);
    Promise.all([api.getEnrollments(unitId), api.getSessionsByUnit(unitId)])
      .then(([list, history]) => {
        setEnrollments(list);
        setHistory(history);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error cargando inscritos'))
      .finally(() => setLoadingEnrollments(false));
  }, [unitId]);

  const refreshResults = useCallback(async () => {
    if (!session) return;
    const [p, a, r] = await Promise.all([
      api.getPresent(session.id),
      api.getAbsent(session.id),
      api.getRejections(session.id),
    ]);
    setPresent(p);
    setAbsent(a);
    setRejections(r);
  }, [session]);

  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') return;
    const id = setInterval(() => {
      refreshResults().catch(() => undefined);
    }, 5000);
    return () => clearInterval(id);
  }, [session, refreshResults]);

  async function startSession() {
    if (!institutionId || !unitId) return;
    setCreatingSession(true);
    setError(null);
    try {
      const created = await api.createSession(institutionId, unitId);
      const activated = await api.activateSession(created.id);
      setSession(activated);
      setPresent([]);
      setAbsent([]);
      setRejections([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando sesión');
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleRotateRoom() {
    if (!session) return;
    try {
      const r = await api.rotateRoomCode(session.id);
      setSession({ ...session, roomCode: r.roomCode, roomCodeExpiresAt: r.roomCodeExpiresAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error rotando código');
    }
  }

  async function handleClose() {
    if (!session) return;
    try {
      const updated = await api.closeSession(session.id);
      setSession({ ...session, ...updated });
      await refreshResults();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cerrando sesión');
    }
  }

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    refreshResults().finally(() => event.detail.complete());
  }

  function logout() {
    clearSession();
    history.replace('/login');
  }

  const selectedUnit = useMemo(() => units.find((u) => u.id === unitId), [units, unitId]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Asistencia con QR</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={logout}>Salir</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonText>
          <h2>Hola, {person?.nombre}</h2>
          <p className="muted">Documento: {person?.documento} · Roles: {person?.roles.join(', ')}</p>
        </IonText>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>1. Selección académica</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Institución</IonLabel>
              <IonSelect
                placeholder={loadingInstitutions ? 'Cargando…' : 'Seleccionar'}
                value={institutionId}
                onIonChange={(e) => setInstitutionId(String(e.detail.value ?? ''))}
              >
                {institutions.map((i) => (
                  <IonSelectOption key={i.id} value={i.id}>
                    {i.name} ({i.code})
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Unidad académica (ficha o materia)</IonLabel>
              <IonSelect
                placeholder={loadingUnits ? 'Cargando…' : 'Seleccionar'}
                value={unitId}
                onIonChange={(e) => setUnitId(String(e.detail.value ?? ''))}
                disabled={!institutionId}
              >
                {units.map((u) => (
                  <IonSelectOption key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {selectedUnit ? (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>2. Inscritos en {selectedUnit.code}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {loadingEnrollments ? (
                <IonSpinner />
              ) : enrollments.length === 0 ? (
                <IonNote>Sin inscritos.</IonNote>
              ) : (
                <IonList>
                  {enrollments.map((p) => (
                    <IonItem key={p.id}>
                      <IonLabel>
                        <h3>{p.nombre}</h3>
                        <small className="muted">{p.documento}</small>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              )}
              <IonButton
                expand="block"
                onClick={startSession}
                disabled={!unitId || creatingSession || (session?.status === 'ACTIVE')}
              >
                {creatingSession ? <IonSpinner name="dots" /> : 'Iniciar sesión QR'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : null}

        {session ? (
          <>
            <QrSessionView session={session} onRotateRoom={handleRotateRoom} onClose={handleClose} />
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>3. Resultados</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <AttendancePanels present={present} absent={absent} rejections={rejections} />
              </IonCardContent>
            </IonCard>
          </>
        ) : null}

        {history_.length > 0 ? (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Historial reciente</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonListHeader>
                  <IonLabel>Sesiones de la unidad</IonLabel>
                </IonListHeader>
                {history_.slice(0, 10).map((s) => (
                  <IonItem key={s.id}>
                    <IonLabel>
                      <h3>{s.status}</h3>
                      <small className="muted">
                        {s.activatedAt ? new Date(s.activatedAt).toLocaleString() : '—'}
                      </small>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        ) : null}

        <IonAlert
          isOpen={!!error}
          header="Error"
          message={error ?? ''}
          buttons={[{ text: 'OK', handler: () => setError(null) }]}
          onDidDismiss={() => setError(null)}
        />
      </IonContent>
    </IonPage>
  );
}
