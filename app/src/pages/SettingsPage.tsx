import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonNote,
} from '@ionic/react';
import { useState } from 'react';
import { getBackendUrl, setBackendUrl } from '../api/client';

export default function SettingsPage() {
  const [url, setUrl] = useState(getBackendUrl());
  const [saved, setSaved] = useState(false);

  function save() {
    setBackendUrl(url.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Ajustes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>URL del backend</h2>
          <p className="muted">
            Configura la URL del API. Para ambiente local típicamente <code>http://localhost:4000</code>.
          </p>
        </IonText>
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Backend URL</IonLabel>
            <IonInput value={url} onIonInput={(e) => setUrl(String(e.detail.value ?? ''))} />
          </IonItem>
        </IonList>
        <IonButton expand="block" onClick={save}>
          Guardar
        </IonButton>
        {saved ? (
          <IonNote color="success" className="ion-padding-start">
            Guardado.
          </IonNote>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
