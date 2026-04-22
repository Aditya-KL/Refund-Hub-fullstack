import { useCallback, useEffect, useMemo, useState } from 'react';

import { LoginGateway } from './Authentication_Page/LoginGateway';
import { StudentLoginForm } from './Authentication_Page/Login_Page';
import { StudentRegistrationForm } from './Authentication_Page/Registration_Page';
import { RegistrationSuccess } from './Authentication_Page/RegistrationSuccess';

import { SuperAdminDashboard } from './SuperAdmin_Page/SuperAdminDashboard';
import { SecretaryDashboard } from './Secretary_Page/SecretaryDashboard';
import { StudentDashboard } from './Student_Page/StudentDashboard';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const AUTH_EXPIRY_KEY = 'authExpiresAt';

type LoginView = 'gateway' | 'student' | 'registerStudent' | 'registerSuccess';
type RegistrationData = { name: string; studentId: string } | null;
type AppNavState = {
  isAuthenticated: boolean;
  loginView: LoginView;
  registrationData: RegistrationData;
};

const LOGIN_VIEWS: LoginView[] = ['gateway', 'student', 'registerStudent', 'registerSuccess'];

const isLoginView = (value: unknown): value is LoginView =>
  typeof value === 'string' && LOGIN_VIEWS.includes(value as LoginView);

const buildHash = (state: AppNavState) => {
  if (state.isAuthenticated) return '#/app';
  return `#/auth/${state.loginView}`;
};

const parseHashToLoginView = (hash: string): LoginView | null => {
  const match = hash.match(/^#\/auth\/([^/?#]+)/);
  if (!match) return null;
  return isLoginView(match[1]) ? match[1] : null;
};

const clearAuthStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem(AUTH_EXPIRY_KEY);
};

const getAuthExpiry = (): number | null => {
  const raw = localStorage.getItem(AUTH_EXPIRY_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValidSession = () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') return false;
  const expiresAt = getAuthExpiry();
  if (!expiresAt) return false;
  if (Date.now() >= expiresAt) return false;
  return true;
};

function App() {
  const getInitialState = useCallback((): AppNavState => {
    const stateFromHistory = window.history.state?.appNav;
    if (
      stateFromHistory &&
      typeof stateFromHistory === 'object' &&
      typeof stateFromHistory.isAuthenticated === 'boolean' &&
      isLoginView(stateFromHistory.loginView)
    ) {
      const allowAuthenticatedState = !stateFromHistory.isAuthenticated || hasValidSession();
      if (!allowAuthenticatedState) {
        clearAuthStorage();
        return { isAuthenticated: false, loginView: 'gateway', registrationData: null };
      }
      return {
        isAuthenticated: stateFromHistory.isAuthenticated,
        loginView: stateFromHistory.loginView,
        registrationData: stateFromHistory.registrationData ?? null,
      };
    }

    const hashLoginView = parseHashToLoginView(window.location.hash);
    if (hashLoginView) {
      return { isAuthenticated: false, loginView: hashLoginView, registrationData: null };
    }

    const loggedIn = hasValidSession();
    if (!loggedIn) {
      clearAuthStorage();
    }
    return { isAuthenticated: loggedIn, loginView: 'gateway', registrationData: null };
  }, []);

  const initialState = useMemo(() => getInitialState(), [getInitialState]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialState.isAuthenticated);
  const [loginView, setLoginView] = useState<LoginView>(initialState.loginView);
  const [registrationData, setRegistrationData] = useState<RegistrationData>(initialState.registrationData);

  const applyState = useCallback((next: AppNavState) => {
    setIsAuthenticated(next.isAuthenticated);
    setLoginView(next.loginView);
    setRegistrationData(next.registrationData);
  }, []);

  const writeHistoryState = useCallback((next: AppNavState, mode: 'push' | 'replace') => {
    const nextState = { ...(window.history.state || {}), appNav: next };
    const nextUrl = `${window.location.pathname}${window.location.search}${buildHash(next)}`;
    if (mode === 'replace') {
      window.history.replaceState(nextState, '', nextUrl);
    } else {
      window.history.pushState(nextState, '', nextUrl);
    }
  }, []);

  const navigateState = useCallback(
    (next: AppNavState) => {
      applyState(next);
      writeHistoryState(next, 'push');
    },
    [applyState, writeHistoryState]
  );

  useEffect(() => {
    writeHistoryState(
      {
        isAuthenticated,
        loginView,
        registrationData,
      },
      'replace'
    );
    // intentionally run once on first load to establish initial app state entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const popped = event.state?.appNav;
      if (
        popped &&
        typeof popped === 'object' &&
        typeof popped.isAuthenticated === 'boolean' &&
        isLoginView(popped.loginView)
      ) {
        if (popped.isAuthenticated && !hasValidSession()) {
          clearAuthStorage();
          applyState({
            isAuthenticated: false,
            loginView: 'gateway',
            registrationData: null,
          });
          return;
        }
        applyState({
          isAuthenticated: popped.isAuthenticated,
          loginView: popped.loginView,
          registrationData: popped.registrationData ?? null,
        });
        return;
      }

      const loginFromHash = parseHashToLoginView(window.location.hash);
      if (loginFromHash) {
        applyState({ isAuthenticated: false, loginView: loginFromHash, registrationData: null });
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyState]);

  const navigateLoginView = useCallback(
    (nextLoginView: LoginView, nextRegistrationData: RegistrationData = registrationData) => {
      navigateState({
        isAuthenticated: false,
        loginView: nextLoginView,
        registrationData: nextRegistrationData,
      });
    },
    [navigateState, registrationData]
  );

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/logout`, { method: 'POST' });
    } catch {
      // keep local logout flow even if API call fails
    }

    clearAuthStorage();

    navigateState({
      isAuthenticated: false,
      loginView: 'gateway',
      registrationData: null,
    });
  };

  useEffect(() => {
    const forceReloginIfExpired = () => {
      if (!hasValidSession()) {
        clearAuthStorage();
        applyState({
          isAuthenticated: false,
          loginView: 'gateway',
          registrationData: null,
        });
        writeHistoryState(
          {
            isAuthenticated: false,
            loginView: 'gateway',
            registrationData: null,
          },
          'replace'
        );
      }
    };

    forceReloginIfExpired();
    const interval = window.setInterval(forceReloginIfExpired, 60_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        forceReloginIfExpired();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', forceReloginIfExpired);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', forceReloginIfExpired);
    };
  }, [applyState, writeHistoryState]);

  if (isAuthenticated) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.isSuperAdmin) return <SuperAdminDashboard onLogout={handleLogout} />;
    if (user.isSecretary) {
      return <SecretaryDashboard onLogout={handleLogout} department={user.department || 'general'} />;
    }
    return <StudentDashboard onLogout={handleLogout} />;
  }

  switch (loginView) {
    case 'gateway':
      return (
        <LoginGateway
          onLoginClick={() => navigateLoginView('student')}
          onRegisterClick={() => navigateLoginView('registerStudent')}
        />
      );

    case 'student':
      return (
        <StudentLoginForm
          onBack={() => navigateLoginView('gateway')}
          onSignIn={(user: any) => {
            const expiresAt = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem(AUTH_EXPIRY_KEY, String(expiresAt));
            navigateState({
              isAuthenticated: true,
              loginView: 'gateway',
              registrationData: null,
            });
          }}
          onRegister={() => navigateLoginView('registerStudent')}
        />
      );

    case 'registerStudent':
      return (
        <StudentRegistrationForm
          onBack={() => navigateLoginView('gateway')}
          onComplete={(data: any) => {
            const nextRegistrationData = { name: data.fullName, studentId: data.studentId };
            navigateLoginView('registerSuccess', nextRegistrationData);
          }}
        />
      );

    case 'registerSuccess':
      return (
        <RegistrationSuccess
          onGoToLogin={() => navigateLoginView('student', null)}
          studentName={registrationData?.name || 'Student'}
          studentId={registrationData?.studentId || 'STU-XXXX-XXX'}
        />
      );

    default:
      return null;
  }
}

export default App;
