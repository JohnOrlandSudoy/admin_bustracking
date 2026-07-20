import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { CheckCircle, Loader2, MapPin, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_TILE_CONFIG,
  TERMINAL_PICKER_ZOOM,
} from '../constants/map';
import { ensureLeafletDefaultIcons } from '../utils/leafletSetup';
import {
  reverseGeocode,
  searchAddresses,
  type GeocodeSuggestion,
} from '../utils/osmGeocoding';

ensureLeafletDefaultIcons();

export interface VerifiedTerminalLocation {
  address: string;
  formatted_address?: string;
  lat: number;
  lng: number;
  place_id?: string | null;
  map_verified: boolean;
}

interface TerminalLocationPickerProps {
  value: VerifiedTerminalLocation | null;
  onChange: (location: VerifiedTerminalLocation | null) => void;
  addressInputId?: string;
}

function MapFlyTo({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 0.6 });
  }, [center, zoom, map]);
  return null;
}

export const TerminalLocationPicker: React.FC<TerminalLocationPickerProps> = ({
  value,
  onChange,
  addressInputId = 'terminal-address-search',
}) => {
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState(value?.address || '');
  const [pending, setPending] = useState<VerifiedTerminalLocation | null>(value);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(
    value ? [value.lat, value.lng] : null
  );
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setSearchText(value?.address || '');
    setPending(value);
    if (value?.lat != null && value?.lng != null) {
      setFlyTarget([value.lat, value.lng]);
    }
  }, [value?.lat, value?.lng, value?.address, value?.map_verified]);

  const applyLocation = useCallback(
    (next: VerifiedTerminalLocation) => {
      setSearchText(next.address);
      setPending(next);
      setFlyTarget([next.lat, next.lng]);
      onChange(next);
      setSuggestions([]);
      setSuggestionsOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = searchText.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const results = await searchAddresses(query);
        setSuggestions(results);
        setSuggestionsOpen(results.length > 0);
        if (results.length === 0) {
          setSearchError('No results found. Try a more specific address.');
        }
      } catch (err) {
        console.error('Address search failed:', err);
        setSuggestions([]);
        setSearchError('Address search failed. Check your internet connection.');
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectSuggestion = (suggestion: GeocodeSuggestion) => {
    applyLocation({
      address: suggestion.label,
      formatted_address: suggestion.formattedAddress,
      lat: suggestion.lat,
      lng: suggestion.lng,
      place_id: suggestion.id,
      map_verified: false,
    });
  };

  const onMarkerDragEnd = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    const next: VerifiedTerminalLocation = {
      ...(pending || { address, lat, lng, map_verified: false }),
      address,
      formatted_address: address,
      lat,
      lng,
      map_verified: false,
    };
    setSearchText(address);
    setPending(next);
    onChange(next);
  };

  const confirmOnMap = () => {
    if (!pending || typeof pending.lat !== 'number' || typeof pending.lng !== 'number') return;
    const verified: VerifiedTerminalLocation = {
      ...pending,
      address: searchText.trim() || pending.address,
      map_verified: true,
    };
    setPending(verified);
    onChange(verified);
  };

  const markerPos: [number, number] | null = pending ? [pending.lat, pending.lng] : null;
  const mapCenter = markerPos || DEFAULT_MAP_CENTER;
  const mapZoom = markerPos ? TERMINAL_PICKER_ZOOM : DEFAULT_MAP_ZOOM;

  return (
    <div className="space-y-3 md:col-span-2">
      <div ref={searchWrapRef} className="relative">
        <label
          htmlFor={addressInputId}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
        >
          <Search className="h-4 w-4 text-pink-500" />
          Search address (OpenStreetMap)
        </label>
        <div className="relative">
          <input
            id={addressInputId}
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
            placeholder="e.g. Payatas, Quezon City"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            autoComplete="off"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        {suggestionsOpen && suggestions.length > 0 && (
          <ul className="absolute z-[1000] mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50 border-b border-gray-100 last:border-0"
                  onClick={() => selectSuggestion(s)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {searchError && <p className="text-xs text-red-600 mt-1">{searchError}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Free search via Photon + Nominatim. Pick a result, drag the pin if needed, then confirm.
        </p>
      </div>

      <div className="relative border border-gray-200 rounded-xl overflow-hidden shadow-inner z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '320px', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer url={MAP_TILE_CONFIG.url} attribution={MAP_TILE_CONFIG.attribution} />
          <MapFlyTo center={flyTarget} zoom={TERMINAL_PICKER_ZOOM} />
          {markerPos && (
            <Marker
              position={markerPos}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  void onMarkerDragEnd(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
        {!markerPos && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5">
            <p className="text-sm text-gray-600 bg-white/90 px-3 py-2 rounded-lg shadow">
              Search an address to place the terminal on the map
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={confirmOnMap}
          disabled={!pending || !Number.isFinite(pending.lat)}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <MapPin className="h-4 w-4" />
          Confirm location on map
        </button>
        {value?.map_verified && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-medium">
            <CheckCircle className="h-4 w-4" />
            Location verified
          </span>
        )}
        {pending && !value?.map_verified && (
          <span className="text-xs text-amber-700">Confirm on map before saving the terminal</span>
        )}
      </div>

      {pending && (
        <p className="text-xs font-mono text-gray-600">
          {pending.lat.toFixed(6)}, {pending.lng.toFixed(6)}
          {pending.place_id ? ` · ${pending.place_id.slice(0, 24)}…` : ''}
        </p>
      )}
    </div>
  );
};

export default TerminalLocationPicker;
