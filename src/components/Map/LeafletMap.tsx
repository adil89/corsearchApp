import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons with proper typing
const DefaultIcon = L.Icon.Default;
DefaultIcon.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

interface LeafletMapProps {
  lat: number;
  lng: number;
  zoom?: number;
}

export function LeafletMap({ lat, lng, zoom = 10 }: LeafletMapProps) {
  const position: LatLngExpression = [lat, lng];

  return (
    <MapContainer 
      center={position} 
      zoom={zoom} 
      className="w-full h-96 rounded-lg z-0"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
