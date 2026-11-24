import { NavLink, Outlet, Link } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';
import { Button } from './ui';
import { ANALYSIS_ROLES, DASHBOARD_ROLES, INVESTIGATION_ROLES } from '../lib/types';

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="container bar">
          <Link to="/" className="brand" aria-label="Public Safety Information Hub, home">
            <Logo size={34} /><span>Public Safety<br />Information Hub</span>
          </Link>
          <nav aria-label="Main">
            <NavLink to="/">Stations</NavLink>
            {user && <NavLink to="/complaints">{user.role === 'COMMON' ? 'My complaints' : 'Complaints'}</NavLink>}
            {user?.role === 'COMMON' && <NavLink to="/complaints/new">Report incident</NavLink>}
            {user && INVESTIGATION_ROLES.includes(user.role) && <NavLink to="/investigations">Investigations</NavLink>}
            {user && ANALYSIS_ROLES.includes(user.role) && <NavLink to="/analysis">Analysis</NavLink>}
            {user && DASHBOARD_ROLES.includes(user.role) && <NavLink to="/dashboard">Dashboard</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin/users">Admin</NavLink>}
          </nav>
          <div className="auth">
            {user ? (<><span className="muted" title={user.email}>{user.user_name} · {user.role}</span><Button variant="ghost" onClick={logout}>Sign out</Button></>)
              : (<><Link className="btn btn-ghost" to="/login">Sign in</Link><Link className="btn btn-primary" to="/register">Register</Link></>)}
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="container foot">
        <p><strong>Emergency? Call 999.</strong> This portal is not monitored in real time.</p>
      </footer>
    </MotionConfig>
  );
}
