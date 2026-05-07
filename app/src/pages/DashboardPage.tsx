import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import {
  documentTextOutline,
  logOutOutline,
  qrCodeOutline,
  schoolOutline,
  settingsSharp,
  trashOutline,
} from 'ionicons/icons';
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
  const [present] = useIonToast();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [enrollments, setEnrollments] = useState<EnrolledPerson[]>([]);
  const [history_, setHistory] = useState<AttendanceSession[]>([]);

  const [institutionId, setInstitutionId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [presentList, setPresent] = useState<PresentRecord[]>([]);
  const [absent, setAbsent] = useState<AbsentRecord[]>([]);
  const [rejections, setRejections] = useState<RejectionRecord[]>([]);

  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState<EnrolledPerson | null>(null);

  function notify(message: string, color: 'success' | 'danger' | 'medium' = 'success') {
    void present({ message, duration: 1800, color, position: 'bottom' });
  }

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

  const loadEnrollmentsAndHistory = useCallback(async () => {
    if (!unitId) return;
    setLoadingEnrollments(true);
    try {
      const [list, hist] = await Promise.all([api.getEnrollments(unitId), api.getSessionsByUnit(unitId)]);
      setEnrollments(list);
      setHistory(hist);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando inscritos');
    } finally {
      setLoadingEnrollments(false);
    }
  }, [unitId]);

  useEffect(() => {
    if (!unitId) {
      setEnrollments([]);
      setHistory([]);
      return;
    }
    loadEnrollmentsAndHistory();
  }, [unitId, loadEnrollmentsAndHistory]);

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
      notify('Sesión QR activada');
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
      notify('Código de sala renovado');
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
      notify('Sesión cerrada', 'medium');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cerrando sesión');
    }
  }

  async function handleUnenrollConfirmed() {
    if (!confirmUnenroll?.enrollmentId) return;
    try {
      await api.unenroll(confirmUnenroll.enrollmentId);
      notify(`${confirmUnenroll.nombre} fue retirado de la unidad`);
      await loadEnrollmentsAndHistory();
      await refreshResults();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo retirar al estudiante', 'danger');
    } finally {
      setConfirmUnenroll(null);
    }
  }

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Promise.all([refreshResults(), loadEnrollmentsAndHistory()]).finally(() => event.detail.complete());
  }

  function logout() {
    clearSession();
    history.replace('/login');
  }

  const selectedUnit = useMemo(() => units.find((u) => u.id === unitId), [units, unitId]);
  const selectedInstitution = useMemo(
    () => institutions.find((i) => i.id === institutionId),
    [institutions, institutionId],
  );
  const aprendizLabel = selectedInstitution?.labels?.aprendiz ?? 'Estudiante';
  const unidadLabel = selectedInstitution?.labels?.unidad ?? 'Unidad académica';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Asistencia con QR</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/manage" title="Gestión">
              <IonIcon slot="icon-only" icon={settingsSharp} />
            </IonButton>
            <IonButton onClick={logout} title="Cerrar sesión">
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding fade-in">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="welcome-card">
          <h2>Hola, {person?.nombre}</h2>
          <p>
            {person?.documento} · {person?.roles.join(', ')}
          </p>
        </div>

        <IonCard className="slide-up">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={schoolOutline} /> 1. Selecciona contexto académico
            </IonCardTitle>
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
              <IonLabel position="stacked">{unidadLabel}</IonLabel>
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

            {institutions.length === 0 && !loadingInstitutions ? (
              <div className="empty-state">
                <IonIcon icon={schoolOutline} />
                <p>No hay instituciones todavía.</p>
                <IonButton size="small" routerLink="/manage">Crear la primera</IonButton>
              </div>
            ) : null}
          </IonCardContent>
        </IonCard>

        {selectedUnit ? (
          <IonCard className="slide-up">
            <IonCardHeader>
              <IonCardTitle>
                2. Inscritos en {selectedUnit.code}
                <IonChip color="primary" style={{ marginLeft: 8 }}>
                  {enrollments.length} {aprendizLabel.toLowerCase()}{enrollments.length === 1 ? '' : 's'}
                </IonChip>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {loadingEnrollments ? (
                <div className="skeleton-stack">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton-row" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="empty-state">
                  <p>No hay {aprendizLabel.toLowerCase()}s inscritos.</p>
                  <IonButton size="small" fill="outline" routerLink="/manage">Inscribir desde gestión</IonButton>
                </div>
              ) : (
                <IonList>
                  {enrollments.map((p) => (
                    <IonItem key={p.id} className="list-item-pop">
                      <IonLabel>
                        <h3>{p.nombre}</h3>
                        <small className="muted">{p.documento}{p.matricula ? ` · ${p.matricula}` : ''}</small>
                      </IonLabel>
                      {p.enrollmentId ? (
                        <IonButton
                          slot="end"
                          fill="clear"
                          color="danger"
                          onClick={() => setConfirmUnenroll(p)}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      ) : null}
                    </IonItem>
                  ))}
                </IonList>
              )}
              <IonButton
                expand="block"
                onClick={startSession}
                disabled={!unitId || creatingSession || session?.status === 'ACTIVE' || enrollments.length === 0}
                className="ion-margin-top"
              >
                {creatingSession ? (
                  <IonSpinner name="dots" />
                ) : (
                  <>
                    <IonIcon slot="start" icon={qrCodeOutline} />
                    Iniciar sesión QR
                  </>
                )}
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : null}

        {session ? (
          <>
            <div className={session.status === 'ACTIVE' ? 'pulse-active' : ''}>
              <QrSessionView session={session} onRotateRoom={handleRotateRoom} onClose={handleClose} />
            </div>
            <IonCard className="slide-up">
              <IonCardHeader>
                <IonCardTitle>3. Resultados en vivo</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <AttendancePanels present={presentList} absent={absent} rejections={rejections} />
              </IonCardContent>
            </IonCard>
          </>
        ) : null}

        {history_.length > 0 ? (
          <IonCard className="slide-up">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={documentTextOutline} /> Historial reciente
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonListHeader>
                  <IonLabel>Sesiones de la unidad</IonLabel>
                </IonListHeader>
                {history_.slice(0, 10).map((s) => (
                  <IonItem key={s.id} className="list-item-pop">
                    <IonLabel>
                      <h3>
                        <IonChip
                          color={
                            s.status === 'ACTIVE'
                              ? 'success'
                              : s.status === 'CLOSED'
                                ? 'medium'
                                : s.status === 'EXPIRED'
                                  ? 'warning'
                                  : 'primary'
                          }
                        >
                          {s.status}
                        </IonChip>
                      </h3>
                      <small className="muted">
                        {s.activatedAt ? new Date(s.activatedAt).toLocaleString() : 'No activada'}
                      </small>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        ) : null}

        {(!institutions.length || !units.length) && !loadingInstitutions && !loadingUnits ? (
          <IonNote className="ion-padding-start">
            <IonText>
              <p>
                Si es la primera vez que usas el sistema, ve a <strong>Gestión</strong> (icono de
                engranaje, arriba a la derecha) para crear instituciones, unidades y personas.
              </p>
            </IonText>
          </IonNote>
        ) : null}

        <IonAlert
          isOpen={!!error}
          header="Error"
          message={error ?? ''}
          buttons={[{ text: 'OK', handler: () => setError(null) }]}
          onDidDismiss={() => setError(null)}
        />

        <IonAlert
          isOpen={!!confirmUnenroll}
          header="Retirar estudiante"
          message={`¿Retirar a ${confirmUnenroll?.nombre} (${confirmUnenroll?.documento}) de esta unidad? La persona seguirá existiendo en el sistema, pero ya no figurará como inscrita aquí.`}
          buttons={[
            { text: 'Cancelar', role: 'cancel', handler: () => setConfirmUnenroll(null) },
            { text: 'Retirar', role: 'destructive', handler: handleUnenrollConfirmed },
          ]}
          onDidDismiss={() => setConfirmUnenroll(null)}
        />
      </IonContent>
    </IonPage>
  );
}
