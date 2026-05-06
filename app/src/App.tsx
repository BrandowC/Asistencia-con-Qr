import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PublicAttendancePage from './pages/PublicAttendancePage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider, useAuth } from './store/auth';

function ProtectedRoute({
  children,
  path,
  exact,
}: {
  children: React.ReactNode;
  path: string;
  exact?: boolean;
}) {
  const { token } = useAuth();
  return (
    <Route
      path={path}
      exact={exact}
      render={({ location }) =>
        token ? children : <Redirect to={{ pathname: '/login', state: { from: location } }} />
      }
    />
  );
}

function Routes() {
  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/login" exact>
          <LoginPage />
        </Route>
        <Route path="/attendance/:token" exact>
          <PublicAttendancePage />
        </Route>
        <Route path="/settings" exact>
          <SettingsPage />
        </Route>
        <ProtectedRoute path="/dashboard">
          <DashboardPage />
        </ProtectedRoute>
        <Route exact path="/">
          <Redirect to="/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  );
}

export default function App() {
  return (
    <IonApp>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </IonApp>
  );
}
