import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks';
import { DataProvider, useData } from './context/DataContext';
import AppLayout from './components/layout/AppLayout';
import Splash from './components/layout/Splash';

// Code-split every page (fast first load on mobile)
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Today = lazy(() => import('./pages/Today'));
const Weight = lazy(() => import('./pages/Weight'));
const Water = lazy(() => import('./pages/Water'));
const Habits = lazy(() => import('./pages/Habits'));
const Activity = lazy(() => import('./pages/Activity'));
const Food = lazy(() => import('./pages/Food'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Logs = lazy(() => import('./pages/Logs'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Friends = lazy(() => import('./pages/Friends'));

/** Signed-in area: waits for data, sends first-time users to onboarding. */
function Protected() {
  const { userDoc, loading } = useData();
  const loc = useLocation();
  if (userDoc === undefined) return <Splash />;
  if (!userDoc?.onboarded && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (loc.pathname === '/onboarding')
    return (
      <Suspense fallback={<Splash />}>
        <Onboarding />
      </Suspense>
    );
  return <AppLayout loading={loading} />;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;

  if (!user)
    return (
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );

  return (
    <DataProvider>
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Protected />}>
          <Route path="/onboarding" element={null} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/today" element={<Today />} />
          <Route path="/weight" element={<Weight />} />
          <Route path="/water" element={<Water />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/food" element={<Food />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/logs/:date" element={<Logs />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

