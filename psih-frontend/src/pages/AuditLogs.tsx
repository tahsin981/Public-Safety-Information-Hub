import { useState } from 'react';
import { useAuditLogs } from '../api/hooks';
import { AdminTabs } from '../components/AdminTabs';
import { Button, ErrorBox, Spinner } from '../components/ui';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAuditLogs(page);
  const pg = data?.pagination;
  return (
    <div className="container section">
      <AdminTabs />
      <ErrorBox message={error?.message} />
      {isLoading ? <Spinner /> : (
        <div className="scroll">
          <table>
            <caption className="sr">Audit events, newest first</caption>
            <thead><tr><th>When</th><th>User</th><th>Role</th><th>Entity</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {data?.data.map((l) => (
                <tr key={l.log_id}>
                  <td>{new Date(l.createdAt).toLocaleString()}</td><td>{l.user.user_name}</td><td>{l.user.role}</td>
                  <td>{l.entity_type}</td><td>{l.action}</td><td>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pg && (
        <nav className="row" aria-label="Pagination">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {pg.page} of {pg.pages}</span>
          <Button variant="ghost" disabled={page >= pg.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </nav>
      )}
    </div>
  );
}
