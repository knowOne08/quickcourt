// frontend/src/pages/user/VenueTest.js
import React, { useState, useEffect } from 'react';
import { venueService } from '../../services/venueService';

const VenueTest = () => {
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);

  const testVenueId = '689a6432be1d0d86a5d84150'; // Aqua Sports Center

  const testVenueAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      setRawResponse(null);
      
      console.log('🧪 Testing venue API with ID:', testVenueId);
      
      // Test 1: Direct fetch to see if it's a CORS issue
      console.log('🔍 Test 1: Direct fetch');
      try {
        const directResponse = await fetch(`http://localhost:4000/api/venues/${testVenueId}`);
        console.log('📡 Direct fetch response status:', directResponse.status);
        const directData = await directResponse.json();
        console.log('📡 Direct fetch data:', directData);
        setRawResponse(directData);
      } catch (directError) {
        console.error('❌ Direct fetch error:', directError);
      }
      
      // Test 2: Using venueService
      console.log('🔍 Test 2: Using venueService');
      const response = await venueService.getVenueById(testVenueId);
      console.log('📡 venueService response:', response);
      
      setVenueData(response.data);
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testVenueAPI();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Venue API Test</h1>
      <button onClick={testVenueAPI}>🔄 Test Again</button>
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          <h2>❌ Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {rawResponse && (
        <div>
          <h2>📡 Raw Direct Fetch Response:</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
      
      {venueData && (
        <div>
          <h2>📊 venueService Response:</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(venueData, null, 2)}
          </pre>
          
          <h2>🏟️ Venue Info:</h2>
          <div>
            <p><strong>Name:</strong> {venueData.venue?.name}</p>
            <p><strong>ID:</strong> {venueData.venue?._id}</p>
            <p><strong>Sports:</strong> {venueData.venue?.sports?.join(', ')}</p>
            <p><strong>Courts Count:</strong> {venueData.venue?.courts?.length || 0}</p>
            <p><strong>Operating Hours:</strong> {venueData.venue?.availability?.openTime} - {venueData.venue?.availability?.closeTime}</p>
          </div>
          
          {venueData.venue?.courts && venueData.venue.courts.length > 0 && (
            <div>
              <h2>🏓 Courts:</h2>
              {venueData.venue.courts.map((court, index) => (
                <div key={court._id || index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
                  <p><strong>Name:</strong> {court.name}</p>
                  <p><strong>Sport:</strong> {court.sport}</p>
                  <p><strong>Price:</strong> ₹{court.pricePerHour}/hour</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VenueTest;
