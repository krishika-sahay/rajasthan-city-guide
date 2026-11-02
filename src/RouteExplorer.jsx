import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RouteExplorer.css';

const CITIES = ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer', 'Pushkar', 'Bikaner'];

// [lat, lng]
const COORDS = {
  Jaipur: [26.9124, 75.7873],
  Jodhpur: [26.2389, 73.0243],
  Udaipur: [24.5854, 73.7125],
  Jaisalmer: [26.9157, 70.9083],
  Pushkar: [26.4899, 74.5513],
  Bikaner: [28.0229, 73.3119],
};

const MODES = [
  { id: 'car', label: 'Car', icon: '🚗', speed: 60, color: '#2f7de1' },
  { id: 'bus', label: 'Bus', icon: '🚌', speed: 45, color: '#e0903a' },
  { id: 'train', label: 'Train', icon: '🚆', speed: 55, color: '#d6336c' },
  { id: 'walk', label: 'Walking', icon: '🚶', speed: 5, color: '#2f9e44' },
];

const CAT_COLORS = {
  travel: '#e8590c', historical: '#c92a2a', temples: '#9c36b5',
  markets: '#f08c00', parks: '#2b8a3e', museums: '#1971c2',
  adventure: '#0b7285', culture: '#a61e4d',
};

const hav = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

/* ---------- RAIL NETWORK (approximate main lines) ---------- */
const STATIONS = {
  Jaipur: [26.9196, 75.7878], Phulera: [26.8706, 75.2441], Kishangarh: [26.575, 74.854],
  Ajmer: [26.4499, 74.6399], Pushkar: [26.4899, 74.5513], Beawar: [26.1011, 74.3182],
  'Marwar Jn': [25.728, 73.61], Jodhpur: [26.285, 73.017], Degana: [26.8472, 74.3194],
  'Merta Road': [26.636, 73.911], Nagaur: [27.202, 73.733], Bikaner: [28.0229, 73.3119],
  Sikar: [27.6119, 75.1397], Ratangarh: [28.08, 74.62], Bhilwara: [25.3463, 74.6364],
  Chittorgarh: [24.8887, 74.6469], Udaipur: [24.5854, 73.7125], Phalodi: [27.13, 72.36],
  Pokaran: [26.92, 71.92], Jaisalmer: [26.9157, 70.9083],
};
const RAIL_EDGES = [
  ['Jaipur', 'Phulera'], ['Phulera', 'Kishangarh'], ['Kishangarh', 'Ajmer'],
  ['Ajmer', 'Pushkar'], ['Ajmer', 'Beawar'], ['Beawar', 'Marwar Jn'],
  ['Marwar Jn', 'Jodhpur'], ['Phulera', 'Degana'], ['Degana', 'Merta Road'],
  ['Merta Road', 'Jodhpur'], ['Pushkar', 'Merta Road'], ['Merta Road', 'Nagaur'],
  ['Nagaur', 'Bikaner'], ['Degana', 'Ratangarh'], ['Jaipur', 'Sikar'],
  ['Sikar', 'Ratangarh'], ['Ratangarh', 'Bikaner'], ['Ajmer', 'Bhilwara'],
  ['Bhilwara', 'Chittorgarh'], ['Chittorgarh', 'Udaipur'], ['Jodhpur', 'Phalodi'],
  ['Phalodi', 'Pokaran'], ['Pokaran', 'Jaisalmer'],
];

const nearestStation = (pt) => {
  let best = null, bd = Infinity;
  Object.entries(STATIONS).forEach(([name, c]) => {
    const d = hav(pt, c);
    if (d < bd) { bd = d; best = name; }
  });
  return best;
};

// works for any two points: goes to the nearest station, follows the rail graph, then to the destination
function railRoute(fromPt, toPt) {
  const from = nearestStation(fromPt);
  const to = nearestStation(toPt);

  let stations = [from];
  if (from !== to) {
    const adj = {};
    RAIL_EDGES.forEach(([a, b]) => {
      const d = hav(STATIONS[a], STATIONS[b]) * 1.15;
      (adj[a] ||= []).push([b, d]);
      (adj[b] ||= []).push([a, d]);
    });
    const dist = { [from]: 0 }, prev = {}, todo = new Set(Object.keys(STATIONS));
    while (todo.size) {
      let u = null;
      todo.forEach((s) => { if (dist[s] !== undefined && (u === null || dist[s] < dist[u])) u = s; });
      if (u === null || u === to) break;
      todo.delete(u);
      (adj[u] || []).forEach(([v, d]) => {
        if (dist[v] === undefined || dist[u] + d < dist[v]) { dist[v] = dist[u] + d; prev[v] = u; }
      });
    }
    if (dist[to] === undefined) return null;
    const path = [to];
    while (path[0] !== from) path.unshift(prev[path[0]]);
    stations = path;
  }

  const line = [fromPt, ...stations.map((s) => STATIONS[s]), toPt];
  let km = 0;
  for (let i = 1; i < line.length; i++) km += hav(line[i - 1], line[i]) * 1.15;
  return { line, km: Math.round(km) };
}

/* ---------- ROAD / FOOT ROUTING (free public servers) ---------- */
const routeCache = {};
async function fetchRoute(kind, aName, bName, a, b) {
  const key = `${kind}:${aName}:${bName}`;
  if (routeCache[key]) return routeCache[key];
  const base = kind === 'walk'
    ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
    : 'https://router.project-osrm.org/route/v1/driving';
  const res = await fetch(`${base}/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`);
  const data = await res.json();
  const r = data.routes?.[0];
  if (!r) throw new Error('no route');
  const out = {
    line: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    km: Math.round(r.distance / 1000),
  };
  routeCache[key] = out;
  return out;
}

/* ---------- MAP ---------- */
function RouteMap({ from, to, mode, loc, places, categories, showPlaces, onRoutes }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const cityGroup = useRef(null);
  const placeGroup = useRef(null);
  const routeGroup = useRef(null);

  // create the map once
  useEffect(() => {
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([26.6, 73.8], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    placeGroup.current = L.layerGroup();
    routeGroup.current = L.layerGroup().addTo(map);
    cityGroup.current = L.layerGroup().addTo(map);
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => { clearTimeout(t); map.remove(); };
  }, []);

  // all places (one small dot each, coloured by category)
  useEffect(() => {
    const group = placeGroup.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    places.forEach((p) => {
      const catTitle = categories?.find((c) => c.id === p.cat)?.title ?? p.cat;
      L.circleMarker(p.coords, {
        radius: 5, color: '#fff', weight: 1,
        fillColor: CAT_COLORS[p.cat] || '#555', fillOpacity: 0.95,
      })
        .bindPopup(`<strong>${p.name}</strong><br/>${p.tag}<br/><small>${catTitle}</small>`)
        .bindTooltip(p.name)
        .addTo(group);
    });
  }, [places, categories]);

  useEffect(() => {
    const map = mapRef.current;
    const group = placeGroup.current;
    if (!map || !group) return;
    if (showPlaces) group.addTo(map);
    else map.removeLayer(group);
  }, [showPlaces]);

  // start/end pins + routes
  useEffect(() => {
    const map = mapRef.current;
    const rg = routeGroup.current;
    const cg = cityGroup.current;
    if (!map || !rg || !cg) return;
    rg.clearLayers();
    cg.clearLayers();
    let cancelled = false;

    const pin = (name, cls) =>
      L.marker(loc[name], {
        icon: L.divIcon({
          className: 'map-icon',
          html: `<span class="map-pin ${cls}"></span><span class="map-label">${name}</span>`,
          iconSize: [0, 0],
        }),
      }).addTo(cg);

    if (from) pin(from, 'from');
    if (to) pin(to, 'to');

    if (!(from && to)) {
      onRoutes(null);
      if (from || to) map.setView(loc[from || to], 9);
      else map.setView([26.6, 73.8], 6);
      return;
    }

    const a = loc[from];
    const b = loc[to];
    map.fitBounds(L.latLngBounds([a, b]), { padding: [70, 70] });

    (async () => {
      const [car, walk] = await Promise.allSettled([
        fetchRoute('car', from, to, a, b),
        fetchRoute('walk', from, to, a, b),
      ]);
      if (cancelled) return;

      const straight = { line: [a, b], km: Math.round(hav(a, b) * 1.3) };
      const carR = car.status === 'fulfilled' ? car.value : straight;
      const walkR = walk.status === 'fulfilled' ? walk.value : null;
      const trainR = railRoute(a, b);
      const lines = { car: carR, bus: carR, train: trainR, walk: walkR };

      onRoutes({ car: carR.km, bus: carR.km, train: trainR?.km ?? null, walk: walkR?.km ?? null });

      // draw the selected mode last so it sits on top
      const order = MODES.filter((m) => m.id !== mode).concat(MODES.find((m) => m.id === mode));
      order.forEach((m) => {
        const r = lines[m.id];
        if (!r) return;
        const on = m.id === mode;
        L.polyline(r.line, {
          color: m.color,
          weight: on ? 6 : 3,
          opacity: on ? 1 : 0.45,
          dashArray: m.id === 'bus' ? '10 8' : m.id === 'walk' ? '2 8' : null,
          lineCap: 'round',
        })
          .bindTooltip(`${m.icon} ${m.label}: ${r.km ?? '?'} km`, { sticky: true })
          .addTo(rg);
      });

      const sel = lines[mode];
      if (sel) map.fitBounds(L.latLngBounds(sel.line), { padding: [60, 60] });
    })();

    return () => { cancelled = true; };
  }, [from, to, mode, loc]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="route-map" ref={elRef} />;
}

/* ---------- MAIN ---------- */
export default function RouteExplorer({ places = [], categories = [] }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState('car');
  const [showPlaces, setShowPlaces] = useState(true);
  const [kms, setKms] = useState(null);

  // name -> [lat, lng] for the 6 cities + every place
  const loc = useMemo(() => {
    const o = { ...COORDS };
    places.forEach((p) => { if (!o[p.name]) o[p.name] = p.coords; });
    return o;
  }, [places]);

  // dropdown groups: main cities first, then each category
  const groups = useMemo(() => {
    const g = [{ label: 'Main cities', items: CITIES }];
    categories.forEach((c) => {
      const items = places
        .filter((p) => p.cat === c.id)
        .map((p) => p.name);
      if (items.length) g.push({ label: c.title, items });
    });
    return g;
  }, [places, categories]);

  const renderOptions = (exclude) =>
    groups.map((g) => (
      <optgroup key={g.label} label={g.label}>
        {g.items.filter((n) => n !== exclude).map((n) => (
          <option key={`${g.label}-${n}`} value={n}>{n}</option>
        ))}
      </optgroup>
    ));

  const ready = from && to;
  const m = MODES.find((x) => x.id === mode);
  const km = ready ? (kms?.[mode] ?? null) : null;
  const mins = km ? Math.round((km / m.speed) * 60) : 0;
  const fmt = (mm) => (mm >= 1440
    ? `${Math.floor(mm / 1440)}d ${Math.floor((mm % 1440) / 60)}h`
    : `${Math.floor(mm / 60)}h ${mm % 60}m`);

  const swap = () => { setFrom(to); setTo(from); };
  const usedCats = categories.filter((c) => places.some((p) => p.cat === c.id));

  return (
    <div className="route-layout">
      <div className="route-panel">
        <label>
          From
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Select option</option>
            {renderOptions(to)}
          </select>
        </label>

        <button className="swap route-swap" onClick={swap} aria-label="Swap places">⇅</button>

        <label>
          To
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select option</option>
            {renderOptions(from)}
          </select>
        </label>

        <label className="route-check">
          <input
            type="checkbox"
            checked={showPlaces}
            onChange={(e) => setShowPlaces(e.target.checked)}
          />
          Show all places ({places.length})
        </label>

        <p className="note">
          Car and walking routes follow real roads. Bus uses the same road. Train is an
          approximate rail path between the nearest main stations.
        </p>
      </div>

      <div className="route-right">
        <RouteMap
          from={from}
          to={to}
          mode={mode}
          loc={loc}
          places={places}
          categories={categories}
          showPlaces={showPlaces}
          onRoutes={setKms}
        />

        {/* legends */}
        <div className="map-legend">
          {MODES.map((x) => (
            <span key={x.id}>
              <i className="lg-line" style={{ background: x.color }} /> {x.label}
            </span>
          ))}
        </div>
        {showPlaces && (
          <div className="map-legend">
            {usedCats.map((c) => (
              <span key={c.id}>
                <i className="lg-dot" style={{ background: CAT_COLORS[c.id] }} /> {c.title}
              </span>
            ))}
          </div>
        )}

        <div className="route-bottom">
          {ready && km ? (
            <div className="route-stats">
              <div><strong>{km} km</strong><span>approx. by {m.label.toLowerCase()}</span></div>
              <div>
                <strong>{fmt(mins)}</strong>
                <span>approx. {mode === 'walk' ? 'walking' : `by ${m.label.toLowerCase()}`}</span>
              </div>
            </div>
          ) : (
            <p className="route-hint">
              {ready ? 'Loading route… (or no route found for this mode)' : 'Select both places to see the distance.'}
            </p>
          )}

          <div className="route-modes">
            <span className="route-modes-title">How will you travel?</span>
            <div className="mode-row">
              {MODES.map((x) => (
                <button
                  key={x.id}
                  className={`mode-btn ${mode === x.id ? 'on' : ''}`}
                  style={mode === x.id ? { borderColor: x.color } : undefined}
                  onClick={() => setMode(x.id)}
                  aria-pressed={mode === x.id}
                >
                  <span aria-hidden="true">{x.icon}</span> {x.label}
                </button>
              ))}
            </div>
          </div>

          <p className="note">Distances and times are approximate. Check live maps before travelling.</p>
        </div>
      </div>
    </div>
  );
}