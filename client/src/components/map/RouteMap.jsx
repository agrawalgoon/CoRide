import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { decodePolyline } from '../../services/routingService';

// ─────────────────────────────────────────────────
// Marker icon factories (Google Maps visual style)
// ─────────────────────────────────────────────────

/** Blue circle with white ring – Google Maps origin pin */
const originIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:22px;height:22px;
      border-radius:50%;
      background:#1a73e8;
      border:3px solid #ffffff;
      box-shadow:0 2px 8px rgba(26,115,232,0.55);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:7px;height:7px;border-radius:50%;background:#ffffff;"></div>
    </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14]
});

/** Red teardrop – Google Maps destination pin */
const destinationIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:32px;height:42px;">
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z"
              fill="#e53935" stroke="#b71c1c" stroke-width="1"/>
        <circle cx="16" cy="16" r="7" fill="#ffffff"/>
        <circle cx="16" cy="16" r="4" fill="#e53935"/>
      </svg>
    </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -44]
});

/** Blue passenger pickup waypoint */
const makePickupIcon = (idx) => L.divIcon({
  className: '',
  html: `
    <div style="
      position:relative;width:28px;height:36px;
      display:flex;align-items:center;justify-content:center;
    ">
      <svg viewBox="0 0 28 36" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.268 21.732 0 14 0z"
              fill="#1565c0" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="14" cy="13" r="6" fill="#ffffff"/>
        <text x="14" y="17" text-anchor="middle" font-size="8" font-weight="bold" fill="#1565c0">${idx}</text>
      </svg>
    </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38]
});

/** Purple drop-off waypoint */
const makeDropIcon = (idx) => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:26px;height:34px;">
      <svg viewBox="0 0 26 34" width="26" height="34" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.82 0 0 5.82 0 13c0 8.925 13 21 13 21S26 21.925 26 13C26 5.82 20.18 0 13 0z"
              fill="#7b1fa2" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="13" cy="12" r="5.5" fill="#ffffff"/>
        <text x="13" y="16" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#7b1fa2">${idx}</text>
      </svg>
    </div>`,
  iconSize: [26, 34],
  iconAnchor: [13, 34],
  popupAnchor: [0, -36]
});

// ─────────────────────────────────────────────────
// Floating Route Info Badge – renders over the map
// ─────────────────────────────────────────────────

/** Renders a Leaflet divIcon marker at the midpoint of the polyline */
function RouteInfoBadge({ points, routeInfo }) {
  const map = useMap();

  useEffect(() => {
    if (!routeInfo || !points || points.length < 2) return;

    const { distanceKm, durationMinutes, fuelLitres } = routeInfo;
    if (!distanceKm && !durationMinutes) return;

    // Place badge at ~40% along the polyline for a natural mid-route feel
    const idx = Math.floor(points.length * 0.40);
    const [lat, lng] = points[idx] || points[Math.floor(points.length / 2)];

    const dur = durationMinutes
      ? durationMinutes >= 60
        ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} min`
        : `${durationMinutes} min`
      : null;
    const dist = distanceKm ? `${distanceKm} km` : null;
    const fuel = fuelLitres ? `${fuelLitres} L fuel` : null;

    const subLine = [dist, fuel].filter(Boolean).join(' · ');

    const badgeHtml = `
      <div style="
        background:rgba(255,255,255,0.97);
        border-radius:10px;
        padding:7px 13px;
        box-shadow:0 4px 18px rgba(0,0,0,0.18);
        border:1.5px solid rgba(26,115,232,0.18);
        display:inline-flex;flex-direction:column;align-items:center;
        white-space:nowrap;
        font-family:system-ui,-apple-system,sans-serif;
        position:relative;
      ">
        ${dur ? `<span style="font-size:13px;font-weight:800;color:#1a1a1a;letter-spacing:-0.3px;">${dur}</span>` : ''}
        ${subLine ? `<span style="font-size:10px;font-weight:600;color:#5f6368;margin-top:1px;">${subLine}</span>` : ''}
        <div style="
          position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-top:8px solid rgba(255,255,255,0.97);
          filter:drop-shadow(0 2px 2px rgba(0,0,0,0.10));
        "></div>
      </div>`;

    const icon = L.divIcon({
      className: '',
      html: badgeHtml,
      iconAnchor: [0, 8]  // center horizontally; tail points down to road
    });

    const marker = L.marker([lat, lng], { icon, interactive: false, zIndexOffset: 1000 });
    marker.addTo(map);
    return () => { marker.remove(); };
  }, [points, routeInfo, map]);

  return null;
}

// ─────────────────────────────────────────────────
// Auto-fit bounds
// ─────────────────────────────────────────────────

function FitBounds({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return;
    const valid = coordinates.filter(c => c && Number.isFinite(c[0]) && Number.isFinite(c[1]));
    if (valid.length === 1) map.setView(valid[0], 14);
    else if (valid.length > 1) map.fitBounds(L.latLngBounds(valid), { padding: [48, 48], maxZoom: 15 });
  }, [coordinates, map]);
  return null;
}

// ─────────────────────────────────────────────────
// Main RouteMap component
// ─────────────────────────────────────────────────

export default function RouteMap({
  origin,
  destination,
  bookings = [],
  polyline = null,
  routeInfo = null,   // { distanceKm, durationMinutes, fuelLitres, provider }
  className = 'h-72'
}) {
  const polylinePoints = useMemo(() => (polyline ? decodePolyline(polyline) : null), [polyline]);

  const oLat = Number(origin?.latitude);
  const oLon = Number(origin?.longitude);
  const dLat = Number(destination?.latitude);
  const dLon = Number(destination?.longitude);
  const hasOrigin = Number.isFinite(oLat) && Number.isFinite(oLon);
  const hasDestination = Number.isFinite(dLat) && Number.isFinite(dLon);

  const activeBookings = (bookings || []).filter(
    b => ['ACCEPTED', 'BOARDED', 'ARRIVED'].includes(b.status)
      && b.pickupLatitude != null
      && b.pickupLongitude != null
  );

  // Bounding coordinates (origin → pickups → destination)
  const boundCoords = useMemo(() => {
    const pts = [];
    if (hasOrigin) pts.push([oLat, oLon]);
    activeBookings.forEach(b => {
      pts.push([Number(b.pickupLatitude), Number(b.pickupLongitude)]);
      if (b.dropLatitude != null) pts.push([Number(b.dropLatitude), Number(b.dropLongitude)]);
    });
    if (hasDestination) pts.push([dLat, dLon]);
    return pts;
  }, [oLat, oLon, dLat, dLon, activeBookings, hasOrigin, hasDestination]);

  // Fallback straight-line coords if no polyline
  const fallbackLine = useMemo(() => {
    const pts = [];
    if (hasOrigin) pts.push([oLat, oLon]);
    activeBookings.forEach(b => pts.push([Number(b.pickupLatitude), Number(b.pickupLongitude)]));
    if (hasDestination) pts.push([dLat, dLon]);
    return pts;
  }, [oLat, oLon, dLat, dLon, activeBookings, hasOrigin, hasDestination]);

  const defaultCenter = hasOrigin ? [oLat, oLon] : [19.8817, 75.3399];
  const activePts = polylinePoints && polylinePoints.length > 1 ? polylinePoints : fallbackLine;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div className={`w-full relative ${className}`}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
          zoomControl={true}
        >
          {/* Tile Layer – clean OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds coordinates={boundCoords} />

          {/* ── Road Polyline (Google Maps navigation style) ── */}
          {activePts.length > 1 && (
            <>
              {/* Outer casing – dark blue halo for contrast */}
              <Polyline
                positions={activePts}
                color="#1557b0"
                weight={9}
                opacity={0.55}
                lineCap="round"
                lineJoin="round"
              />
              {/* Inner electric-blue route line */}
              <Polyline
                positions={activePts}
                color="#1a73e8"
                weight={5}
                opacity={1}
                lineCap="round"
                lineJoin="round"
                dashArray={polylinePoints ? undefined : '8 10'}
              />
            </>
          )}

          {/* ── Floating route info badge ── */}
          {routeInfo && activePts.length > 1 && (
            <RouteInfoBadge points={activePts} routeInfo={routeInfo} />
          )}

          {/* ── Origin Marker (blue circle, Google style) ── */}
          {hasOrigin && (
            <Marker position={[oLat, oLon]} icon={originIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-blue-800">Trip Origin</p>
                  <p className="text-slate-600 mt-0.5">{origin.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ── Passenger Pickup & Drop Markers ── */}
          {activeBookings.map((booking, idx) => (
            <React.Fragment key={booking.id || idx}>
              <Marker
                position={[Number(booking.pickupLatitude), Number(booking.pickupLongitude)]}
                icon={makePickupIcon(idx + 1)}
              >
                <Popup>
                  <div className="text-xs font-sans">
                    <p className="font-bold text-blue-700">
                      Pickup #{idx + 1}: {booking.passenger?.name || 'Passenger'}
                    </p>
                    <p className="text-slate-600 mt-0.5">{booking.pickupAddress}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Seats: {booking.seatsBooked} · Status: {booking.status}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {booking.dropLatitude != null && booking.dropLongitude != null && (
                <Marker
                  position={[Number(booking.dropLatitude), Number(booking.dropLongitude)]}
                  icon={makeDropIcon(idx + 1)}
                >
                  <Popup>
                    <div className="text-xs font-sans">
                      <p className="font-bold text-purple-700">
                        Drop-off #{idx + 1}: {booking.passenger?.name || 'Passenger'}
                      </p>
                      <p className="text-slate-600 mt-0.5">{booking.dropAddress}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          ))}

          {/* ── Destination Marker (red teardrop, Google style) ── */}
          {hasDestination && (
            <Marker position={[dLat, dLon]} icon={destinationIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-red-800">Destination</p>
                  <p className="text-slate-600 mt-0.5">{destination.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span style={{ background: '#1a73e8' }} className="inline-block w-2.5 h-2.5 rounded-full" />
          Origin
        </span>
        {activeBookings.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span style={{ background: '#1565c0' }} className="inline-block w-2.5 h-2.5 rounded-full" />
            {activeBookings.length} Pickup{activeBookings.length > 1 ? 's' : ''}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span style={{ background: '#e53935' }} className="inline-block w-2.5 h-2.5 rounded-full" />
          Destination
        </span>
        {routeInfo?.provider && (
          <span className="ml-auto text-slate-400 text-[10px]">
            Route via {routeInfo.provider === 'google_routes' ? 'Google Routes' : routeInfo.provider === 'openrouteservice' ? 'ORS' : 'OSRM'}
          </span>
        )}
      </div>
    </div>
  );
}
