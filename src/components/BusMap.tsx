import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression, Icon, LatLngBoundsExpression } from 'leaflet';
import { Bus } from '../types';
import 'leaflet/dist/leaflet.css';

interface BusMapProps {
  buses: Bus[];
}

// Custom bus icon
const busIcon = new Icon({
  iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/bus.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const MapContent: React.FC<{ buses: Bus[] }> = ({ buses }) => {
  const map = useMap();
  
  useEffect(() => {
    if (buses.length > 0 && buses.some(bus => bus.current_location)) {
      // Get valid bus locations
      const validBuses = buses.filter(bus =>
        bus.current_location &&
        bus.current_location.lat !== 0 &&
        bus.current_location.lng !== 0
      );
      
      if (validBuses.length === 1) {
        // If only one valid bus, center on it
        const bus = validBuses[0];
        map.setView(
          [bus.current_location!.lat, bus.current_location!.lng] as LatLngExpression,
          15
        );
      } else if (validBuses.length > 1) {
        // If multiple valid buses, create a bounds object
        const latLngs = validBuses.map(bus =>
          [bus.current_location!.lat, bus.current_location!.lng] as [number, number]
        );
        map.fitBounds(latLngs);
      }
    }
  }, [buses, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {buses.filter(bus => bus.current_location).map((bus) => (
        <Marker
          key={bus.id}
          position={[bus.current_location!.lat, bus.current_location!.lng] as LatLngExpression}
          icon={busIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>Bus {bus.bus_number}</strong><br />
              Status: <span className={`font-medium ${
                bus.status === 'active' ? 'text-green-600' :
                bus.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
              }`}>{bus.status}</span><br />
              Seats: {bus.available_seats}/{bus.total_seats}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export const BusMap: React.FC<BusMapProps> = ({ buses }) => {
  return (
    <div className="h-96 rounded-lg overflow-hidden shadow-md relative z-0">
      <MapContainer
        center={[14.5995, 120.9842] as LatLngExpression}
        zoom={15}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
      >
        <MapContent buses={buses} />
      </MapContainer>
    </div>
  );
};