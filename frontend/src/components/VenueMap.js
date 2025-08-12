import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import RedMarkerIcon from './RedMarkerIcon';
import 'leaflet/dist/leaflet.css';

const VenueMap = ({ venues, center }) => {
  // Default center if not provided
  const mapCenter = center || [23.0225, 72.5714]; // Ahmedabad

  // Custom icon for current location (blue marker)
  const currentLocationIcon = new window.L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div style={{ width: '100%', margin: '24px 0' }}>
      <MapContainer center={mapCenter} zoom={12} style={{ height: '400px', width: '100%', borderRadius: '12px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* User's current location marker */}
        {center && (
          <Marker position={center} icon={currentLocationIcon}>
            <Popup>
              <div style={{ minWidth: 120, color: '#1976d2', fontWeight: 600 }}>
                <span role="img" aria-label="current-location" style={{ color: '#1976d2', fontSize: '1.2rem', marginRight: 4 }}>📍</span>
                You are here
              </div>
            </Popup>
          </Marker>
        )}
        {/* Venue markers */}
        {Array.isArray(venues) && venues.map(venue => (
          venue.location?.coordinates ? (
            <Marker
              key={venue._id}
              position={[venue.location.coordinates[1], venue.location.coordinates[0]]} // [lat, lng]
              icon={RedMarkerIcon}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 'bold', color: '#b22222', fontSize: '1.05rem', marginBottom: 4 }}>
                    <span role="img" aria-label="location" style={{ color: 'red', fontSize: '1.2rem', marginRight: 4 }}>📍</span>
                    {venue.name}
                  </div>
                  <div style={{ color: '#555', fontSize: '0.95rem', marginBottom: 4 }}>
                    {venue.location.address}
                  </div>
                  {venue.distance && (
                    <div style={{ color: '#875A7B', fontWeight: 500, fontSize: '0.95rem', marginBottom: 4 }}>
                      {(venue.distance / 1000).toFixed(1)} km away
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${venue.location.coordinates[1]},${venue.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#b22222', textDecoration: 'underline', fontWeight: 500 }}
                  >
                    Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
};

export default VenueMap;
