import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const citiesInfo = [
  { name: 'Chernobyl', lat: 51.2768, lon: 30.2210, radiationLevel: 'High (nuclear accident site)' },
  { name: 'Jeddah', lat: 21.5433, lon: 39.1728, radiationLevel: 'Low' },
  { name: 'Reykjavik', lat: 64.1355, lon: -21.8954, radiationLevel: 'Very low' },
  { name: 'Lahore', lat: 31.5204, lon: 74.3587, radiationLevel: 'Low to moderate' },
  { name: 'Rome', lat: 41.9028, lon: 12.4964, radiationLevel: 'Low' },
];

const AQI_KEY = process.env.REACT_APP_AQI_KEY;

const getAQILabel = (aqi) => {
  switch (aqi) {
    case 1: return 'Good 🟢';
    case 2: return 'Fair 🟡';
    case 3: return 'Moderate 🟠';
    case 4: return 'Unhealthy 🔴';
    case 5: return 'Hazardous 🟣';
    default: return 'Unknown';
  }
};

const getAQIColor = (aqi, isDark) => {
  if (isDark) {
    switch (aqi) {
      case 1: return '#4CAF50';
      case 2: return '#FFEB3B';
      case 3: return '#FF9800';
      case 4: return '#F44336';
      case 5: return '#9C27B0';
      default: return '#7f8c8d';
    }
  } else {
    switch (aqi) {
      case 1: return '#2ecc71';
      case 2: return '#f1c40f';
      case 3: return '#e67e22';
      case 4: return '#e74c3c';
      case 5: return '#8e44ad';
      default: return '#95a5a6';
    }
  }
};

const getRadiationLabel = (value) => {
  if (value < 0.3) return { text: 'Safe ☘️', color: '#2ecc71' };
  if (value < 1.0) return { text: 'Elevated ⚠️', color: '#f1c40f' };
  return { text: 'High ☢️', color: '#e74c3c' };
};

function App() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const fetchCityData = async ({ name, lat, lon }) => {
    try {
      const aqiRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${AQI_KEY}`
      );
      const aqi = aqiRes.data?.list?.[0];

      let radiation = null;
      try {
        const safeRes = await axios.get(
          `https://api.safecast.org/measurements.json?latitude=${lat}&longitude=${lon}&distance=500&unit=usv`
        );
        const sorted = safeRes.data
          ?.filter((m) => m.unit === 'µSv/h' && m.value)
          .sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at));

        const valid = sorted?.[0];
        if (valid) {
          radiation = {
            value: valid.value,
            time: new Date(valid.captured_at).toLocaleString(),
          };
          localStorage.setItem(`radiation_${name}`, JSON.stringify(radiation));
        }
      } catch {
        const cached = localStorage.getItem(`radiation_${name}`);
        if (cached) {
          radiation = JSON.parse(cached);
        }
      }

      return { city: name, aqi, radiation, updated: new Date().toLocaleString() };
    } catch {
      return { city: name, error: true };
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(citiesInfo.map(fetchCityData));
    setReadings(results);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <h1 className="main-title">Hawa'na 🌍</h1>
      <p className="sub-text">Real-time Air Quality & Gamma Radiation Levels</p>

      <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </button>

      <button className="refresh-button" onClick={loadData} disabled={loading}>
        {loading ? 'Updating...' : 'Refresh Data'}
      </button>

      {readings.map((entry, i) => (
        entry.error ? (
          <div key={i} className="card error-card">
            <h2>{entry.city}</h2>
            <p className="error-text">⚠️ Failed to load data</p>
            <p className="radiation-label">
              Expected Radiation Level: {citiesInfo.find(c => c.name === entry.city)?.radiationLevel || 'Unknown'}
            </p>
          </div>
        ) : (
          <div key={i} className="card" style={{ borderLeft: `8px solid ${getAQIColor(entry.aqi.main.aqi, darkMode)}` }}>
            <h2>{entry.city}</h2>
            <p className="aqi-label" style={{ color: getAQIColor(entry.aqi.main.aqi, darkMode) }}>
              {getAQILabel(entry.aqi.main.aqi)}
            </p>
            <p>PM2.5: {entry.aqi.components.pm2_5} µg/m³</p>
            <p>PM10: {entry.aqi.components.pm10} µg/m³</p>
            {entry.radiation && (
              <p style={{ color: getRadiationLabel(entry.radiation.value).color }}>
                Radiation: {entry.radiation.value.toFixed(2)} µSv/h — {getRadiationLabel(entry.radiation.value).text}
                <br />
                <small className="timestamp">Last measured: {entry.radiation.time}</small>
              </p>
            )}
            <p className="radiation-label">
              Expected Radiation Level: {citiesInfo.find(c => c.name === entry.city)?.radiationLevel || 'Unknown'}
            </p>
            <p className="timestamp">Updated: {entry.updated}</p>
          </div>
        )
      ))}
    </div>
  );
}

export default App;
