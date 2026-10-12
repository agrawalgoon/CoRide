import React, { useEffect } from 'react';
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
import { MapPin, Navigation, Users } from 'lucide-react';
import { decodePolyline } from '../../services/routingService';

// Create custom colored Leaflet marker icons with clean SVG pins
const createCustomMarkerIcon = (color = '#059669', label = '') =>
  L.divIcon({
    className: 'coride-route-marker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 24 32" width="32" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 32 12 32C12 32 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
          <circle cx="12" cy="11" r="5" fill="#ffffff"/>
        </svg>
        ${label ? `<span style="position: absolute; top: 5px; font-size: 9px; font-weight: bold; color: ${color};">${label}</span>` : ''}
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40]
  });

// Auto-adjust zoom/center to fit all points
function FitBounds({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return;

    const validCoords = coordinates.filter(
      (c) => c && Number.isFinite(c[0]) && Number.isFinite(c[1])
    );

    if (validCoords.length === 1) {
      map.setView(validCoords[0], 13);
    } else if (validCoords.length > 1) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [coordinates, map]);

  return null;
}

export default function RouteMap({
  origin,
  destination,
  bookings = [],
  polyline = null,
  className = 'h-72'
}) {
  const encodedPolylinePoints = polyline ? decodePolyline(polyline) : null;
  const oLat = Number(origin?.latitude);
  const oLon = Number(origin?.longitude);
  const dLat = Number(destination?.latitude);
  const dLon = Number(destination?.longitude);

  const hasOrigin = Number.isFinite(oLat) && Number.isFinite(oLon);
  const hasDestination = Number.isFinite(dLat) && Number.isFinite(dLon);

  // Accepted or active bookings with valid coordinates
  const activeBookings = (bookings || []).filter(
    (b) =>
      ['ACCEPTED', 'BOARDED', 'ARRIVED'].includes(b.status) &&
      b.pickupLatitude != null &&
      b.pickupLongitude != null
  );

  // Build coordinate list for route path & bounds
  const allCoordinates = [];
  if (hasOrigin) allCoordinates.push([oLat, oLon]);

  activeBookings.forEach((b) => {
    allCoordinates.push([Number(b.pickupLatitude), Number(b.pickupLongitude)]);
    if (b.dropLatitude != null && b.dropLongitude != null) {
      allCoordinates.push([Number(b.dropLatitude), Number(b.dropLongitude)]);
    }
  });

  if (hasDestination) allCoordinates.push([dLat, dLon]);

  const defaultCenter = hasOrigin ? [oLat, oLon] : [19.8817, 75.3399];

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white space-y-2">
      <div className={`w-full relative ${className}`}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds coordinates={allCoordinates} />

          {/* Road Polyline connecting the route geometry */}
          {encodedPolylinePoints && encodedPolylinePoints.length > 1 ? (
            <Polyline
              positions={encodedPolylinePoints}
              color="#047857"
              weight={5}
              opacity={0.85}
            />
          ) : allCoordinates.length > 1 ? (
            <Polyline
              positions={allCoordinates}
              color="#059669"
              weight={4}
              opacity={0.7}
              dashArray="6, 8"
            />
          ) : null}

          {/* Origin Marker */}
          {hasOrigin && (
            <Marker
              position={[oLat, oLon]}
              icon={createCustomMarkerIcon('#10b981', 'A')}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-emerald-800">Trip Origin (Driver)</p>
                  <p className="text-slate-600 mt-0.5">{origin.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Passenger Pickup & Drop Markers */}
          {activeBookings.map((booking, idx) => (
            <React.Fragment key={booking.id || idx}>
              {/* Pickup Point */}
              <Marker
                position={[Number(booking.pickupLatitude), Number(booking.pickupLongitude)]}
                icon={createCustomMarkerIcon('#2563eb', `P${idx + 1}`)}
              >
                <Popup>
                  <div className="text-xs font-sans">
                    <p className="font-bold text-blue-700">
                      Pickup #{idx + 1}: {booking.passenger?.name || 'Passenger'}
                    </p>
                    <p className="text-slate-600 mt-0.5">{booking.pickupAddress}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Seats: {booking.seatsBooked} • Status: {booking.status}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Drop Point (if distinct) */}
              {booking.dropLatitude != null && booking.dropLongitude != null && (
                <Marker
                  position={[Number(booking.dropLatitude), Number(booking.dropLongitude)]}
                  icon={createCustomMarkerIcon('#8b5cf6', `D${idx + 1}`)}
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

          {/* Destination Marker */}
          {hasDestination && (
            <Marker
              position={[dLat, dLon]}
              icon={createCustomMarkerIcon('#f43f5e', 'B')}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-rose-800">Trip Destination</p>
                  <p className="text-slate-600 mt-0.5">{destination.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Origin</span>
        </div>
        {activeBookings.length > 0 && (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>{activeBookings.length} Passenger Pickup(s)</span>
          </div>
        )}
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
}
