import React, { useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';

interface AddressMapPickerProps {
  apiKey: string;
  onChange: (data: { address: string; lat: number; lng: number }) => void;
  defaultCenter?: { lat: number; lng: number };
}

const containerStyle = {
  width: '100%',
  height: '350px',
};

const defaultMapCenter = { lat: 40.416775, lng: -3.70379 }; // Madrid

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({ apiKey, onChange, defaultCenter }) => {
  const [marker, setMarker] = useState(defaultCenter || defaultMapCenter);
  const [address, setAddress] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarker({ lat, lng });
        setAddress(place.formatted_address || '');
        onChange({ address: place.formatted_address || '', lat, lng });
      }
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      // Reverse geocode para obtener la dirección
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setAddress(results[0].formatted_address);
          onChange({ address: results[0].formatted_address, lat, lng });
        } else {
          setAddress('');
          onChange({ address: '', lat, lng });
        }
      });
    }
  };

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div>
      <Autocomplete
        onLoad={ac => (autocompleteRef.current = ac)}
        onPlaceChanged={handlePlaceChanged}
      >
        <input
          type="text"
          placeholder="Buscar dirección..."
          style={{ width: '100%', padding: 8, marginBottom: 12, borderRadius: 6, border: '1px solid #ccc' }}
        />
      </Autocomplete>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={marker}
        zoom={15}
        onClick={handleMapClick}
      >
        <Marker position={marker} />
      </GoogleMap>
      <div style={{ marginTop: 12 }}>
        <strong>Dirección seleccionada:</strong>
        <div>{address}</div>
        <div><small>Lat: {marker.lat}, Lng: {marker.lng}</small></div>
      </div>
    </div>
  );
};

export default AddressMapPicker; 