import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin } from 'react-icons/fi';
import { renderToString } from 'react-dom/server';

// Fix for default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Sport colors for markers
const sportColors = {
  badminton: '#EF4444', // red
  football: '#10B981',  // green
  cricket: '#3B82F6',   // blue
  tennis: '#F59E0B',    // yellow
  basketball: '#F97316', // orange
  table_tennis: '#8B5CF6', // purple
  volleyball: '#EC4899', // pink
  default: '#6366F1' // indigo (primary)
};

const createCustomIcon = (sport, isHovered) => {
  const color = sportColors[sport] || sportColors.default;
  const iconHtml = renderToString(
    <div style={{
      backgroundColor: color,
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      color: 'white',
      border: '3px solid white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
      transition: 'transform 0.2s ease-out',
      zIndex: isHovered ? 1000 : 1
    }}>
      <FiMapPin size={20} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Component to handle map view updates when venues change
const MapUpdater = ({ venues, hoveredVenueId }) => {
  const map = useMap();
  
  useEffect(() => {
    if (venues && venues.length > 0) {
      const bounds = L.latLngBounds();
      let hasValidCoords = false;
      
      venues.forEach(venue => {
        if (venue.location?.coordinates && venue.location.coordinates.length === 2) {
          // MongoDB stores as [longitude, latitude], Leaflet needs [latitude, longitude]
          bounds.extend([venue.location.coordinates[1], venue.location.coordinates[0]]);
          hasValidCoords = true;
        }
      });
      
      if (hasValidCoords) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [venues, map]);

  useEffect(() => {
    if (hoveredVenueId) {
      const venue = venues.find(v => v._id === hoveredVenueId);
      if (venue && venue.location?.coordinates && venue.location.coordinates.length === 2) {
        map.flyTo(
          [venue.location.coordinates[1], venue.location.coordinates[0]], 
          15, 
          { duration: 0.5 }
        );
      }
    }
  }, [hoveredVenueId, venues, map]);

  return null;
};

const VenuesMap = ({ venues, hoveredVenueId, onMarkerClick }) => {
  // Default to a central location (e.g., India center)
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  return (
    <div className="w-full h-full rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 z-0 relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapUpdater venues={venues} hoveredVenueId={hoveredVenueId} />

        {venues.map((venue) => {
          if (!venue.location?.coordinates || venue.location.coordinates.length !== 2) return null;
          
          // [latitude, longitude]
          const position = [venue.location.coordinates[1], venue.location.coordinates[0]];
          const primarySport = venue.sports && venue.sports.length > 0 ? venue.sports[0] : 'default';
          const isHovered = hoveredVenueId === venue._id;

          return (
            <Marker 
              key={venue._id} 
              position={position}
              icon={createCustomIcon(primarySport, isHovered)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(venue)
              }}
              zIndexOffset={isHovered ? 1000 : 0}
            >
              <Popup className="rounded-xl overflow-hidden custom-popup">
                <div className="p-1 min-w-[200px]">
                  {venue.images && venue.images.length > 0 && (
                    <div className="w-full h-24 mb-2 rounded-lg overflow-hidden">
                      <img 
                        src={venue.images[0].url} 
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h4 className="font-bold text-gray-900 truncate">{venue.name}</h4>
                  <p className="text-xs text-gray-500 mb-2 truncate">{venue.location?.address}</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-primary">
                      {venue.pricing?.currency || '₹'}{venue.pricing?.hourly || 0}/hr
                    </span>
                    <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                      ★ {venue.rating?.average || '0.0'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 4px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-content {
          margin: 8px;
        }
      `}</style>
    </div>
  );
};

export default VenuesMap;
