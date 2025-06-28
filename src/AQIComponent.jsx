import React, { useState } from 'react';
import axios from 'axios';

const API_KEY = 'ee163c41fd47efe12bfd405aaa8d42f5';

const cities = [
  { name: 'Chernobyl', lat: 51.2768, lon: 30.2210 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Wellington', lat: -41.2865, lon: 174.7762 },
  { name: 'Jeddah', lat: 21.5433, lon: 39.1728 },
];


const getAQILabel = (aqi) => {
  switch (aqi) {
    case 1: return 'Good 🟢';
    case 2: return 'Fair 🟡';
    case 3: return 'Moderate 🟠';
    case 4: return 'Unhealthy 🔴';
    case 5: return 'Very Hazardous 🟣';
    default: return 'Unknown';
  }
};

const AQIComponent = () => {
  const [selectedCity, setSelectedCity] = useState(cities[0].name);
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAQI = async () => {
    const city = cities.find(c => c.name === selectedCity);
    if (!city) return;
    setLoading(true);

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}`
      );
      setAqiData(response.data.list[0]);
    } catch (error) {
      console.error('Error fetching AQI:', error);
    }

    setLoading(false);
  };

  return (
    <div className="aqi-card" style={{ padding: '20px', background: '#111', color: '#fff', borderRadius: '10px' }}>
      <label>
        Choose a City:
        <select
          onChange={(e) => setSelectedCity(e.target.value)}
          value={selectedCity}
          style={{ marginLeft: '10px' }}
        >
          {cities.map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
        </select>
      </label>

      <br />
      <button
        onClick={fetchAQI}
        disabled={loading}
        style={{
          marginTop: '20px',
          padding: '8px 16px',
          fontSize: '1rem',
          background: '#00ffd5',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Loading...' : 'Get Air Quality'}
      </button>

      {aqiData && (
        <div style={{ marginTop: '30px' }}>
          <h2>{selectedCity}</h2>
          <p style={{ fontWeight: 'bold' }}>{getAQILabel(aqiData.main.aqi)}</p>
          <p>PM2.5: {aqiData.components.pm2_5} µg/m³</p>
          <p>PM10: {aqiData.components.pm10} µg/m³</p>
          <p style={{ color: '#888' }}>Updated: {new Date().toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default AQIComponent;