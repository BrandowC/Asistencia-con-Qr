import {
  IonAlert,
  IonBackButton,
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { addCircleOutline, businessOutline, layersOutline, peopleOutline, trashOutline } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { AcademicUnit, Institution, Person } from '../api/types';
import { useAuth } from '../store/auth';

type Tab = 'institutions' | 'units' | 'people';
type Context = 'SENA' | 'UNIVERSIDAD';
type UnitType = 'FICHA' | 'MATERIA';

export default function ManagePage() {
  const { person } = useAuth();
  const [tab, setTab] = useState<Tab>('institutions');
  const [present] = useIonToast();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [institutionId, setInstitutionId] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<{ kind: Tab; id: string; label: string } | null>(null);

  const isAdmin = person?.roles.includes('ADMIN') ?? false;

  function notify(message: string, color: 'success' | 'danger' | 'medium' = 'success') {
    void present({ message, duration: 2200, color, position: 'bottom' });
  }

  const loadInstitutions = useCallback(async () => {
    setLoading(true);
    try {
      const items = await api.getInstitutions();
      setInstitutions(items);
      if (!institutionId && items.length > 0) {
        const target = person?.institutionId && items.find((i) => i.id === person.institutionId);
        setInstitutionId((target ?? items[0])!.id);
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error cargando instituciones', 'danger');
    } finally {
      setLoading(false);
    }
  }, [institutionId, person]);

  const loadUnits = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      setUnits(await api.getUnits(institutionId));
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error cargando unidades', 'danger');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  const loadPeople = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      setPeople(await api.getPeople({ institutionId }));
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error cargando personas', 'danger');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  useEffect(() => {
    if (!institutionId) return;
    loadUnits();
    loadPeople();
  }, [institutionId, loadUnits, loadPeople]);

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.kind === 'institutions') {
        await api.deleteInstitution(confirmDelete.id);
        notify('Institución desactivada');
        await loadInstitutions();
      } else if (confirmDelete.kind === 'units') {
        await api.deleteUnit(confirmDelete.id);
        notify('Unidad desactivada');
        await loadUnits();
      } else {
        await api.deletePerson(confirmDelete.id);
        notify('Persona desactivada');
        await loadPeople();
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error eliminando', 'danger');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>Gestión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding fade-in">
        <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as Tab)}>
          <IonSegmentButton value="institutions">
            <IonIcon icon={businessOutline} />
            <IonLabel>Instituciones</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="units">
            <IonIcon icon={layersOutline} />
            <IonLabel>Unidades</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="people">
            <IonIcon icon={peopleOutline} />
            <IonLabel>Personas</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {tab !== 'institutions' ? (
          <IonItem className="slide-up">
            <IonLabel position="stacked">Institución activa</IonLabel>
            <IonSelect
              value={institutionId}
              onIonChange={(e) => setInstitutionId(String(e.detail.value ?? ''))}
              placeholder="Selecciona una institución"
            >
              {institutions.map((i) => (
                <IonSelectOption key={i.id} value={i.id}>
                  {i.name} ({i.code})
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        ) : null}

        {tab === 'institutions' ? (
          <InstitutionsTab
            institutions={institutions}
            isAdmin={isAdmin}
            loading={loading}
            onCreated={(i) => {
              setInstitutions((prev) => [...prev, i]);
              notify('Institución creada');
              if (!institutionId) setInstitutionId(i.id);
            }}
            onDelete={(i) =>
              setConfirmDelete({ kind: 'institutions', id: i.id, label: `${i.name} (${i.code})` })
            }
            onError={(m) => notify(m, 'danger')}
          />
        ) : null}

        {tab === 'units' ? (
          <UnitsTab
            institutionId={institutionId}
            units={units}
            loading={loading}
            onCreated={(u) => {
              setUnits((prev) => [...prev, u]);
              notify('Unidad creada');
            }}
            onDelete={(u) =>
              setConfirmDelete({ kind: 'units', id: u.id, label: `${u.name} (${u.code})` })
            }
            onError={(m) => notify(m, 'danger')}
          />
        ) : null}

        {tab === 'people' ? (
          <PeopleTab
            institutionId={institutionId}
            people={people}
            units={units}
            loading={loading}
            onCreated={() => {
              loadPeople();
              notify('Persona creada');
            }}
            onDelete={(p) =>
              setConfirmDelete({ kind: 'people', id: p.id, label: `${p.nombre} (${p.documento})` })
            }
            onError={(m) => notify(m, 'danger')}
          />
        ) : null}

        <IonAlert
          isOpen={!!confirmDelete}
          header="Confirmar eliminación"
          message={`Vas a desactivar: ${confirmDelete?.label ?? ''}. Esta acción se puede revertir desde la base de datos.`}
          buttons={[
            { text: 'Cancelar', role: 'cancel', handler: () => setConfirmDelete(null) },
            { text: 'Eliminar', role: 'destructive', handler: handleConfirmDelete },
          ]}
          onDidDismiss={() => setConfirmDelete(null)}
        />
      </IonContent>
    </IonPage>
  );
}

function InstitutionsTab({
  institutions,
  isAdmin,
  loading,
  onCreated,
  onDelete,
  onError,
}: {
  institutions: Institution[];
  isAdmin: boolean;
  loading: boolean;
  onCreated: (i: Institution) => void;
  onDelete: (i: Institution) => void;
  onError: (m: string) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [context, setContext] = useState<Context>('UNIVERSIDAD');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!code.trim() || !name.trim()) {
      onError('Completa código y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createInstitution({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        context,
      });
      onCreated(created);
      setCode('');
      setName('');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error creando institución');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {isAdmin ? (
        <IonCard className="slide-up">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={addCircleOutline} /> Nueva institución
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Código *</IonLabel>
              <IonInput value={code} onIonInput={(e) => setCode(String(e.detail.value ?? ''))} placeholder="UNI-XXX" />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Nombre *</IonLabel>
              <IonInput value={name} onIonInput={(e) => setName(String(e.detail.value ?? ''))} placeholder="Universidad..." />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Contexto *</IonLabel>
              <IonSelect value={context} onIonChange={(e) => setContext(e.detail.value as Context)}>
                <IonSelectOption value="UNIVERSIDAD">Universidad</IonSelectOption>
                <IonSelectOption value="SENA">SENA</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonButton expand="block" onClick={submit} disabled={submitting} className="ion-margin-top">
              {submitting ? <IonSpinner name="dots" /> : 'Crear institución'}
            </IonButton>
          </IonCardContent>
        </IonCard>
      ) : (
        <IonNote className="ion-padding-start">Solo un usuario ADMIN puede crear instituciones.</IonNote>
      )}

      <IonCard className="slide-up">
        <IonCardHeader>
          <IonCardTitle>Instituciones activas</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {loading ? (
            <SkeletonList />
          ) : institutions.length === 0 ? (
            <IonNote>No hay instituciones registradas.</IonNote>
          ) : (
            <IonList>
              {institutions.map((i) => (
                <IonItem key={i.id} className="list-item-pop">
                  <IonLabel>
                    <h3>{i.name}</h3>
                    <IonChip color="primary">{i.code}</IonChip>
                    <IonChip color="medium">{i.context}</IonChip>
                  </IonLabel>
                  {isAdmin ? (
                    <IonButton slot="end" color="danger" fill="clear" onClick={() => onDelete(i)}>
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  ) : null}
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>
    </>
  );
}

function UnitsTab({
  institutionId,
  units,
  loading,
  onCreated,
  onDelete,
  onError,
}: {
  institutionId: string;
  units: AcademicUnit[];
  loading: boolean;
  onCreated: (u: AcademicUnit) => void;
  onDelete: (u: AcademicUnit) => void;
  onError: (m: string) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<UnitType>('MATERIA');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!institutionId) {
      onError('Selecciona una institución.');
      return;
    }
    if (!code.trim() || !name.trim()) {
      onError('Completa código y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createUnit({
        institutionId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
      });
      onCreated(created);
      setCode('');
      setName('');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error creando unidad');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <IonCard className="slide-up">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={addCircleOutline} /> Nueva unidad académica
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel position="stacked">Código *</IonLabel>
            <IonInput value={code} onIonInput={(e) => setCode(String(e.detail.value ?? ''))} placeholder="MAT-101" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Nombre *</IonLabel>
            <IonInput value={name} onIonInput={(e) => setName(String(e.detail.value ?? ''))} placeholder="Matemáticas I" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Tipo *</IonLabel>
            <IonSelect value={type} onIonChange={(e) => setType(e.detail.value as UnitType)}>
              <IonSelectOption value="MATERIA">Materia</IonSelectOption>
              <IonSelectOption value="FICHA">Ficha</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonButton expand="block" onClick={submit} disabled={submitting || !institutionId} className="ion-margin-top">
            {submitting ? <IonSpinner name="dots" /> : 'Crear unidad'}
          </IonButton>
        </IonCardContent>
      </IonCard>

      <IonCard className="slide-up">
        <IonCardHeader>
          <IonCardTitle>Unidades activas</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {loading ? (
            <SkeletonList />
          ) : units.length === 0 ? (
            <IonNote>Sin unidades para esta institución.</IonNote>
          ) : (
            <IonList>
              {units.map((u) => (
                <IonItem key={u.id} className="list-item-pop">
                  <IonLabel>
                    <h3>{u.name}</h3>
                    <IonChip color="primary">{u.code}</IonChip>
                    <IonChip color="medium">{u.type}</IonChip>
                  </IonLabel>
                  <IonButton slot="end" color="danger" fill="clear" onClick={() => onDelete(u)}>
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>
    </>
  );
}

function PeopleTab({
  institutionId,
  people,
  units,
  loading,
  onCreated,
  onDelete,
  onError,
}: {
  institutionId: string;
  people: Person[];
  units: AcademicUnit[];
  loading: boolean;
  onCreated: () => void;
  onDelete: (p: Person) => void;
  onError: (m: string) => void;
}) {
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ESTUDIANTE');
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.documento.toLowerCase().includes(q) ||
        (p.matricula ?? '').toLowerCase().includes(q),
    );
  }, [people, filter]);

  async function submit() {
    if (!institutionId) {
      onError('Selecciona una institución.');
      return;
    }
    if (!documento.trim() || !nombre.trim()) {
      onError('Completa documento y nombre.');
      return;
    }
    if (['ADMIN', 'DOCENTE', 'INSTRUCTOR'].includes(role) && password.length < 4) {
      onError('Para roles administrativos, define una contraseña de al menos 4 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createPerson({
        institutionId,
        documento: documento.trim(),
        nombre: nombre.trim(),
        matricula: matricula.trim() || null,
        email: email.trim() || null,
        password: password.length > 0 ? password : undefined,
        roles: [role],
        unitIds: unitIds.length > 0 ? unitIds : undefined,
      });
      setDocumento('');
      setNombre('');
      setMatricula('');
      setEmail('');
      setPassword('');
      setUnitIds([]);
      onCreated();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error creando persona');
    } finally {
      setSubmitting(false);
    }
  }

  const isStaffRole = ['ADMIN', 'DOCENTE', 'INSTRUCTOR'].includes(role);

  return (
    <>
      <IonCard className="slide-up">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={addCircleOutline} /> Nueva persona
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel position="stacked">Documento *</IonLabel>
            <IonInput value={documento} onIonInput={(e) => setDocumento(String(e.detail.value ?? ''))} placeholder="Cédula o ID" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Nombre completo *</IonLabel>
            <IonInput value={nombre} onIonInput={(e) => setNombre(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Matrícula</IonLabel>
            <IonInput value={matricula} onIonInput={(e) => setMatricula(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput type="email" value={email} onIonInput={(e) => setEmail(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Rol *</IonLabel>
            <IonSelect value={role} onIonChange={(e) => setRole(String(e.detail.value))}>
              <IonSelectOption value="ESTUDIANTE">Estudiante</IonSelectOption>
              <IonSelectOption value="APRENDIZ">Aprendiz</IonSelectOption>
              <IonSelectOption value="DOCENTE">Docente</IonSelectOption>
              <IonSelectOption value="INSTRUCTOR">Instructor</IonSelectOption>
              <IonSelectOption value="ADMIN">Admin</IonSelectOption>
            </IonSelect>
          </IonItem>
          {isStaffRole ? (
            <IonItem>
              <IonLabel position="stacked">Contraseña *</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(String(e.detail.value ?? ''))}
              />
            </IonItem>
          ) : null}
          {units.length > 0 && !isStaffRole ? (
            <IonItem>
              <IonLabel position="stacked">Inscribir en unidades</IonLabel>
              <IonSelect
                multiple
                value={unitIds}
                onIonChange={(e) => setUnitIds(e.detail.value as string[])}
                placeholder="Selecciona una o varias"
              >
                {units.map((u) => (
                  <IonSelectOption key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          ) : null}
          <IonButton expand="block" onClick={submit} disabled={submitting || !institutionId} className="ion-margin-top">
            {submitting ? <IonSpinner name="dots" /> : 'Crear persona'}
          </IonButton>
        </IonCardContent>
      </IonCard>

      <IonCard className="slide-up">
        <IonCardHeader>
          <IonCardTitle>Personas en la institución ({people.length})</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel position="stacked">Buscar</IonLabel>
            <IonInput
              value={filter}
              onIonInput={(e) => setFilter(String(e.detail.value ?? ''))}
              placeholder="Nombre, documento o matrícula"
            />
          </IonItem>
          {loading ? (
            <SkeletonList />
          ) : filtered.length === 0 ? (
            <IonNote>Sin resultados.</IonNote>
          ) : (
            <IonList>
              {filtered.map((p) => (
                <IonItem key={p.id} className="list-item-pop">
                  <IonLabel>
                    <h3>{p.nombre}</h3>
                    <IonText color="medium">
                      <small>{p.documento}{p.matricula ? ` · ${p.matricula}` : ''}</small>
                    </IonText>
                    <div>
                      {p.roles.map((r) => (
                        <IonChip
                          key={r}
                          color={['ADMIN', 'DOCENTE', 'INSTRUCTOR'].includes(r) ? 'primary' : 'success'}
                        >
                          {r}
                        </IonChip>
                      ))}
                    </div>
                  </IonLabel>
                  <IonButton slot="end" color="danger" fill="clear" onClick={() => onDelete(p)}>
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>
    </>
  );
}

function SkeletonList() {
  return (
    <div className="skeleton-stack">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  );
}
