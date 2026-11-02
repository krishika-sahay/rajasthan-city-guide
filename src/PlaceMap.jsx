import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCoords } from './placeCoords';

export default function PlaceMap({ name, tag }) {
  const elRef = useRef(null);
  const pos = getCoords(name, tag);

  useEffect(() => {
    if (!pos) return;
    const map = L.map(elRef.current, {
      scrollWheelZoom: false,
      keyboard: false, // so arrow keys still change the place in the modal
    }).setView(pos, 13);
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    L.circleMarker(pos, {
      radius: 8, color: '#fff', weight: 2, fillColor: '#e0903a', fillOpacity: 1,
    }).addTo(map);
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => { clearTimeout(t); map.remove(); };
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pos) return null;

  return (
    <div className="place-map-wrap">
      <div className="place-map" ref={elRef} />
      <a
        className="place-map-link"
        href={`https://www.google.com/maps?q=${pos[0]},${pos[1]}`}
        target="_blank"
        rel="noreferrer"
      >
        Open in Google Maps ↗
      </a>
    </div>
  );
}