import { motion } from 'framer-motion';
import { useDashboard } from '../api/hooks';
import { ErrorBox, Spinner } from '../components/ui';

const TILES: [keyof NonNullable<ReturnType<typeof useDashboard>['data']>, string][] = [
  ['totalComplaints', 'Total complaints'], ['pendingComplaints', 'Pending'], ['submittedComplaints', 'Submitted'],
  ['rejectedComplaints', 'Rejected'], ['openInvestigations', 'Open investigations'], ['solvedInvestigations', 'Solved'],
  ['totalStations', 'Stations'], ['totalOfficers', 'Officers'], ['totalUsers', 'Users'],
];

export default function Dashboard() {
  const { data, isLoading, error, dataUpdatedAt } = useDashboard();
  return (
    <div className="container section">
      <h1>Operations dashboard</h1>
      <p className="muted">Refreshes every 30 seconds{dataUpdatedAt ? ` · last updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ''}.</p>
      <ErrorBox message={error?.message} />
      {isLoading ? <Spinner /> : (
        <ul className="tiles">
          {data && TILES.map(([k, l], i) => (
            <motion.li key={k} className="tile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <span className="num">{data[k].toLocaleString()}</span><span>{l}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
