import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  Search,
  Crosshair,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';

// Default center for Maharashtra / Marathwada region (Chhatrapati Sambhajinagar)
const DEFAULT_CENTER = [19.8817, 75.3399];

// Create customizable Leaflet marker icons with clean SVG pins
const createCustomMarkerIcon = (color = '#059669') =>
  L.divIcon({
    className: 'coride-leaflet-marker',
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
          <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40]
  });

// Leaflet map click listener
function MapClickHandler({ onChoose }) {
  useMapEvents({
    click(e) {
      onChoose(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Controller to pan/recenter map
function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && Number.isFinite(position[0]) && Number.isFinite(position[1])) {
      map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
  }, [map, position]);
  return null;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Choose Location on Map',
  initialLocation,
  markerColor = '#059669',
  label = 'Location'
}) {
  const [selectedPin, setSelectedPin] = useState({
    latitude: initialLocation?.latitude ?? DEFAULT_CENTER[0],
    longitude: initialLocation?.longitude ?? DEFAULT_CENTER[1],
    address: initialLocation?.address ?? ''
  });

  const [mapPosition, setMapPosition] = useState([
    initialLocation?.latitude ?? DEFAULT_CENTER[0],
    initialLocation?.longitude ?? DEFAULT_CENTER[1]
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const markerRef = useRef(null);

  const markerIcon = useMemo(
    () => createCustomMarkerIcon(markerColor),
    [markerColor]
  );

  // Sync with initialLocation when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = initialLocation?.latitude ?? DEFAULT_CENTER[0];
      const lon = initialLocation?.longitude ?? DEFAULT_CENTER[1];
      const addr = initialLocation?.address ?? '';

      setSelectedPin({ latitude: lat, longitude: lon, address: addr });
      setMapPosition([lat, lon]);
      setSearchQuery('');
      setSearchResults([]);
      setErrorMessage('');
      setInfoMessage('');

      if (!addr) {
        reverseGeocode(lat, lon);
      }
    }
  }, [isOpen, initialLocation]);

  // Reverse geocode coordinates to human-readable address using free OpenStreetMap service
  const reverseGeocode = async (lat, lon) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      if (!res.ok) throw new Error('Geocoding request failed');
      const data = await res.json();
      const resolvedAddress = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      setSelectedPin((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        address: resolvedAddress
      }));
    } catch (err) {
      console.warn('Reverse geocode failed, using coordinates format:', err);
      setSelectedPin((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        address: `${lat.toFixed(5)}, ${lon.toFixed(5)}`
      }));
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle dragging the marker
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const latlng = marker.getLatLng();
      const lat = latlng.lat;
      const lon = latlng.lng;
      setSelectedPin((prev) => ({ ...prev, latitude: lat, longitude: lon }));
      setMapPosition([lat, lon]);
      reverseGeocode(lat, lon);
      setInfoMessage('Pin moved. Address updated.');
    }
  };

  // Handle direct map click
  const handleMapClick = (lat, lon) => {
    setSelectedPin((prev) => ({ ...prev, latitude: lat, longitude: lon }));
    setMapPosition([lat, lon]);
    reverseGeocode(lat, lon);
    setInfoMessage('Pin placed at selected point.');
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Browser geolocation is not supported on this device.');
      return;
    }

    setIsLocating(true);
    setErrorMessage('');
    setInfoMessage('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setSelectedPin((prev) => ({ ...prev, latitude: lat, longitude: lon }));
        setMapPosition([lat, lon]);
        reverseGeocode(lat, lon);
        setIsLocating(false);
        setInfoMessage('Centered on current GPS location.');
      },
      (geoErr) => {
        setIsLocating(false);
        const errMap = {
          1: 'Location access was denied. Please select manually on the map or allow location in your browser.',
          2: 'Current location could not be determined. Please tap the map to place your pin.',
          3: 'Location detection timed out. Please try again or tap the map directly.'
        };
        setErrorMessage(errMap[geoErr.code] || 'Unable to retrieve location.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  // On-demand search query (explicit form submit; does NOT query on each keystroke)
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setErrorMessage('');
    setInfoMessage('');
    setSearchResults([]);

    try {
      // 1. Try Photon (Komoot's open OSM-based geocoder, free no API key required)
      let results = [];
      try {
        const photonRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
        );
        if (photonRes.ok) {
          const photonData = await photonRes.json();
          results = (photonData.features || []).map((f) => {
            const [lon, lat] = f.geometry.coordinates;
            const props = f.properties || {};
            const title = props.name || props.street || query;
            const details = [props.street, props.city, props.state, props.country]
              .filter(Boolean)
              .join(', ');
            return {
              id: `${lat}-${lon}-${props.osm_id || Math.random()}`,
              name: title,
              displayName: details ? `${title}, ${details}` : title,
              latitude: lat,
              longitude: lon
            };
          });
        }
      } catch (err) {
        console.warn('Photon lookup unavailable, falling back to OSM search:', err);
      }

      // 2. Fallback to Nominatim search on explicit user button click
      if (!results.length) {
        const nominatimRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
          {
            headers: { 'Accept-Language': 'en' }
          }
        );
        if (nominatimRes.ok) {
          const nominatimData = await nominatimRes.json();
          results = nominatimData.map((item) => ({
            id: item.place_id || String(item.osm_id),
            name: item.display_name.split(',')[0],
            displayName: item.display_name,
            latitude: Number(item.lat),
            longitude: Number(item.lon)
          }));
        }
      }

      if (results.length > 0) {
        setSearchResults(results);
      } else {
        setErrorMessage(
          'No matching places found. You can tap directly on the map or drag the pin to set your location.'
        );
      }
    } catch (err) {
      console.error('Search error:', err);
      setErrorMessage(
        'Place search service is currently unavailable. You can tap the map directly or drag the pin to set your location.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setSelectedPin({
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.displayName
    });
    setMapPosition([result.latitude, result.longitude]);
    setSearchResults([]);
    setSearchQuery(result.name);
    setInfoMessage(`Selected: ${result.name}`);
  };

  const handleConfirm = () => {
    if (!Number.isFinite(selectedPin.latitude) || !Number.isFinite(selectedPin.longitude)) {
      setErrorMessage('Please choose a valid position on the map.');
      return;
    }

    onConfirm({
      address: selectedPin.address || `${selectedPin.latitude.toFixed(5)}, ${selectedPin.longitude.toFixed(5)}`,
      latitude: Number(selectedPin.latitude),
      longitude: Number(selectedPin.longitude)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/65 p-2 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: markerColor }}
            />
            <div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">
                Tap anywhere on the map or drag the marker to your precise spot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            aria-label="Close map modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* On-Demand Place Search (Compliant: no autocomplete on keystroke) */}
        <div className="border-b border-slate-200 p-3 bg-white relative z-20">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search college, campus, area, or landmark (press Search)..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search</span>
            </button>
          </form>

          {/* Selectable search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select a place
              </p>
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full rounded-xl p-2.5 text-left transition-colors hover:bg-emerald-50 flex items-start space-x-2.5"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{result.name}</p>
                    <p className="text-xs text-slate-500 truncate">{result.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notices and feedback */}
        {errorMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && !errorMessage && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 text-xs text-emerald-800 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Interactive Leaflet Map Container */}
        <div className="relative h-[42vh] min-h-[280px] sm:h-[480px] w-full">
          <MapContainer
            center={mapPosition}
            zoom={15}
            scrollWheelZoom
            className="h-full w-full"
          >
            {/* OpenStreetMap TileLayer with visible legal attribution */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onChoose={handleMapClick} />
            <MapFlyTo position={mapPosition} />

            {/* Draggable marker */}
            <Marker
              ref={markerRef}
              draggable={true}
              eventHandlers={{
                dragend: handleMarkerDragEnd
              }}
              position={[selectedPin.latitude, selectedPin.longitude]}
              icon={markerIcon}
            >
              <Popup autoPan={false}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-slate-800">📍 Selected {label}</p>
                  <p className="text-slate-500 mt-0.5">Drag to fine-tune</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Quick instructions floating badge */}
          <div className="absolute top-3 right-3 z-[400] pointer-events-none bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md border border-slate-200 text-[11px] font-semibold text-slate-700 hidden sm:block">
            👆 Drag pin or click map to move
          </div>
        </div>

        {/* Bottom Details & Confirmation Panel */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Selected {label} Address</span>
                {isGeocoding && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
              </div>
              <p className="text-sm font-semibold text-slate-800 break-words mt-0.5">
                {selectedPin.address || 'Resolving address...'}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {selectedPin.latitude.toFixed(6)}, {selectedPin.longitude.toFixed(6)}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 transition-colors shadow-xs"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <Crosshair className="w-4 h-4 text-emerald-600" />
                )}
                <span>Use Current Location</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
              >
                <Check className="w-4 h-4" />
                <span>Confirm {label}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
