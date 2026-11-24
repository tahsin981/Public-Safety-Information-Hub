import { NavLink } from 'react-router-dom';

export function AdminTabs() {
  return (
    <>
      <h1>Administration</h1>
      <nav className="subnav" aria-label="Administration sections">
        <NavLink to="/admin/users">Users</NavLink><NavLink to="/admin/officers">Officers</NavLink>
        <NavLink to="/admin/stations">Stations</NavLink><NavLink to="/admin/audit">Audit log</NavLink>
      </nav>
    </>
  );
}
