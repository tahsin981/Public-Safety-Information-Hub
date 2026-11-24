import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireRole } from './auth/RequireRole';
import { ANALYSIS_ROLES, DASHBOARD_ROLES, INVESTIGATION_ROLES } from './lib/types';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { Spinner } from './components/ui';

// Staff-only pages are code-split so citizens never download them.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Complaints = lazy(() => import('./pages/Complaints'));
const NewComplaint = lazy(() => import('./pages/NewComplaint'));
const ComplaintDetail = lazy(() => import('./pages/ComplaintDetail'));
const Investigations = lazy(() => import('./pages/Investigations'));
const CrimeAnalysis = lazy(() => import('./pages/CrimeAnalysis'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminOfficers = lazy(() => import('./pages/AdminOfficers'));
const AdminStations = lazy(() => import('./pages/AdminStations'));

export default function App() {
  return (
    <Suspense fallback={<div className="container"><Spinner /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="complaints" element={<RequireRole><Complaints /></RequireRole>} />
          <Route path="complaints/new" element={<RequireRole roles={['COMMON']}><NewComplaint /></RequireRole>} />
          <Route path="complaints/:id" element={<RequireRole><ComplaintDetail /></RequireRole>} />
          <Route path="investigations" element={<RequireRole roles={INVESTIGATION_ROLES}><Investigations /></RequireRole>} />
          <Route path="analysis" element={<RequireRole roles={ANALYSIS_ROLES}><CrimeAnalysis /></RequireRole>} />
          <Route path="dashboard" element={<RequireRole roles={DASHBOARD_ROLES}><Dashboard /></RequireRole>} />
          <Route path="admin/users" element={<RequireRole roles={['ADMIN']}><AdminUsers /></RequireRole>} />
          <Route path="admin/officers" element={<RequireRole roles={['ADMIN']}><AdminOfficers /></RequireRole>} />
          <Route path="admin/stations" element={<RequireRole roles={['ADMIN']}><AdminStations /></RequireRole>} />
          <Route path="admin/audit" element={<RequireRole roles={['ADMIN']}><AuditLogs /></RequireRole>} />
          <Route path="*" element={<div className="container"><h1>Page not found</h1><Link to="/">Back to home</Link></div>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
