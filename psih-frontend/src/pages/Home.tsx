import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThanas } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorBox, Spinner } from '../components/ui';
import { coords, distanceKm } from '../lib/geo';

const StationMap = lazy(() => import('../components/StationMap')); // keeps Leaflet out of the first bundle

export default function Home() {
  const { user } = useAuth();
  const { data: thanas = [], isLoading, error } = useThanas();
  const [here, setHere] = useState<[number, number] | null>(null);
  const [geoErr, setGeoErr] = useState('');

  const locate = () => {
    setGeoErr('');
    if (!navigator.geolocation) return setGeoErr('Location is not supported by this browser.');
    navigator.geolocation.getCurrentPosition(
      (p) => setHere([p.coords.latitude, p.coords.longitude]),
      () => setGeoErr('Location permission was denied. You can still browse the list below.'),
      { timeout: 10_000 },
    );
  };
  const sorted = thanas
    .map((t) => ({ t, km: here && coords(t) ? distanceKm(here, coords(t)!) : null }))
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));

  return (
    <>
      <section className="hero">
        <motion.div className="container" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1>Report it. Track it. Stay informed.</h1>
          <p>Submit an incident to your local thana, follow its progress, and find the nearest police station.</p>
          <div className="row">
            <Link className="btn btn-gold" to={user ? '/complaints/new' : '/register'}>{user ? 'Report an incident' : 'Create free account'}</Link>
            <Button variant="ghost" onClick={locate}>Find my nearest station</Button>
          </div>
        </motion.div>
      </section>

      <section className="container section" aria-labelledby="stations">
        <h2 id="stations">Police stations</h2>
        <ErrorBox message={geoErr || (error ? 'Could not load stations.' : '')} />
        {isLoading ? <Spinner text="Loading stations…" /> : (
          <div className="split">
            <Suspense fallback={<Spinner text="Loading map…" />}>
              <StationMap thanas={thanas} center={here} />
            </Suspense>
            <ul className="cards" aria-label="Station list">
              {sorted.length === 0 && <li className="muted">No stations have been added yet.</li>}
              {sorted.map(({ t, km }) => (
                <li key={t.geo_code} className="card">
                  <strong>{t.thana_name}</strong> <span className="muted">· {t.district}</span>
                  {km != null && <span className="chip">{km.toFixed(1)} km</span>}
                  <div><a href={`tel:${t.tel_no}`}>{t.tel_no}</a> · <a href={`mailto:${t.thana_email}`}>{t.thana_email}</a></div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
