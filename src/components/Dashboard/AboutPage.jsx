import React from 'react';
import '../../styles/about.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1>Terra-Logos</h1>
        <p className="about-subtitle">Real-Time Earth Telemetry Dashboard</p>

        <section className="about-section">
          <h2>What is Terra-Logos?</h2>
          <p>
            Terra-Logos is a real-time Earth monitoring system that aggregates and visualizes 
            live telemetry data from multiple scientific sources. It provides a unified view 
            of seismic activity, solar phenomena, atmospheric conditions, and volcanic activity 
            happening right now on our planet.
          </p>
          <p>
            The system streams data every 60 seconds from authoritative sources including the 
            USGS (United States Geological Survey), NOAA (National Oceanic and Atmospheric 
            Administration), and other scientific institutions.
          </p>
        </section>

        <section className="about-section">
          <h2>Data Sources</h2>
          <div className="data-sources-list">
            <div className="data-source-item">
              <h3>Seismic Activity</h3>
              <p>
                <strong>Source:</strong> USGS Earthquake Hazards Program
              </p>
              <p>
                Real-time earthquake data for events magnitude 2.5 and above, updated hourly.
              </p>
              <a 
                href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View API Documentation →
              </a>
            </div>

            <div className="data-source-item">
              <h3>Solar Activity</h3>
              <p>
                <strong>Source:</strong> NOAA Space Weather Prediction Center
              </p>
              <p>
                Solar X-ray flux, solar wind speed, proton flux, and geomagnetic K-index data.
              </p>
              <a 
                href="https://www.swpc.noaa.gov/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Visit NOAA SWPC →
              </a>
            </div>

            <div className="data-source-item">
              <h3>Volcanic Activity</h3>
              <p>
                <strong>Source:</strong> USGS Volcano Hazards Program
              </p>
              <p>
                Elevated volcano alerts (Orange/Red status) from the Volcano Notification Service.
              </p>
              <a 
                href="https://volcanoes.usgs.gov/hans-public/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View Volcano Alerts →
              </a>
            </div>

            <div className="data-source-item">
              <h3>Atmospheric CO₂</h3>
              <p>
                <strong>Source:</strong> NOAA Global Monitoring Laboratory
              </p>
              <p>
                Weekly atmospheric CO₂ measurements from Mauna Loa Observatory.
              </p>
              <a 
                href="https://gml.noaa.gov/ccgg/trends/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View CO₂ Trends →
              </a>
            </div>

            <div className="data-source-item">
              <h3>Weather Data</h3>
              <p>
                <strong>Source:</strong> Open-Meteo
              </p>
              <p>
                Current temperature data from Mauna Loa, Hawaii.
              </p>
              <a 
                href="https://open-meteo.com/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Visit Open-Meteo →
              </a>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Understanding the Metrics</h2>
          <div className="metrics-explanation">
            <div className="metric-explanation-item">
              <h3>Core MHD Load</h3>
              <p>
                Derived from the geomagnetic K-index, this represents the level of geomagnetic 
                activity. Higher values indicate stronger geomagnetic storms.
              </p>
            </div>

            <div className="metric-explanation-item">
              <h3>Alfvén Bus Velocity</h3>
              <p>
                Solar wind speed measured in km/s. Named after Hannes Alfvén, this represents 
                the velocity of charged particles streaming from the Sun.
              </p>
            </div>

            <div className="metric-explanation-item">
              <h3>Solar Flare Class</h3>
              <p>
                Classification of solar X-ray flares: A, B, C, M, and X (weakest to strongest). 
                X-class flares can cause radio blackouts and geomagnetic storms.
              </p>
            </div>

            <div className="metric-explanation-item">
              <h3>Proton Storm Level</h3>
              <p>
                Solar radiation storm intensity (S1-S5 scale). High levels can affect satellites 
                and pose radiation risks to astronauts.
              </p>
            </div>

            <div className="metric-explanation-item">
              <h3>Thermal Dissipation</h3>
              <p>
                Surface temperature in Kelvin. This metric tracks temperature variations that may 
                correlate with other Earth system phenomena.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Technical Details</h2>
          <p>
            Terra-Logos is built with React, Three.js for 3D visualization, and deployed on 
            Cloudflare Pages. Data is persisted in Cloudflare D1 for historical analysis.
          </p>
          <p>
            The system uses Server-Sent Events (SSE) for real-time data streaming, with 
            automatic fallback to REST API polling if the stream connection is lost.
          </p>
        </section>

        <section className="about-section">
          <h2>Privacy & Data</h2>
          <p>
            Terra-Logos does not collect or store any personal information. All data displayed 
            is publicly available scientific data from the sources listed above. Historical data 
            stored in our database is used solely for visualization and analysis purposes.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;

