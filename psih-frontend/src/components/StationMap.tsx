import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { coords } from '../lib/geo';
import type { Thana } from '../lib/types';

const pin = L.divIcon({ className: 'pin', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] });

export default function StationMap({ thanas, center }: { thanas: Thana[]; center?: [number, number] | null }) {
  const mapped = thanas.filter((t) => coords(t));
  return (
    <MapContainer center={center ?? [23.685, 90.356]} zoom={center ? 12 : 7} className="map" key={center?.join() ?? 'bd'} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {mapped.map((t) => (
        <Marker key={t.geo_code} position={coords(t)!} icon={pin} keyboard>
          <Popup><strong>{t.thana_name}</strong><br />{t.district}<br /><a href={`tel:${t.tel_no}`}>{t.tel_no}</a></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
