import React, { useState } from 'react';
import useHVCStore from '../../core/store/useHVCStore';
import DataTable from './DataTable';
import HelpTooltip from '../Help/HelpTooltip';
import '../../styles/livedata.css';

const LiveDataPanel = () => {
  const metrics = useHVCStore((state) => state.metrics);
  const [expandedSections, setExpandedSections] = useState({
    seismic: true,
    solar: true,
    climate: true,
    volcanic: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getSeismicTableData = () => {
    if (!metrics.lastSeismicEvent) return [];
    const event = metrics.lastSeismicEvent;
    // Check if this is a placeholder/waiting state
    const isPlaceholder = !event.id && (event.label === 'WAITING FOR SIGNAL...' || event.label === 'SIGNAL LOST' || event.label === 'NO RECENT EARTHQUAKES');
    if (isPlaceholder) return [];
    
    return [{
      id: event.id || 'latest',
      location: event.label || 'Unknown',
      magnitude: event.magnitude !== null && event.magnitude !== undefined ? event.magnitude.toFixed(1) : 'N/A',
      time: event.timestamp ? formatTimestamp(event.timestamp) : 'Unknown',
      raw: event,
    }];
  };

  const getVolcanoTableData = () => {
    if (!Array.isArray(metrics.volcanoes) || metrics.volcanoes.length === 0) return [];
    return metrics.volcanoes
      .filter(v => v && (v.lat !== undefined && v.lon !== undefined))
      .map(v => ({
        id: v.id || `volcano-${v.lat}-${v.lon}`,
        name: v.name || 'Unnamed Volcano',
        status: v.status || 'UNKNOWN',
        location: typeof v.lat === 'number' && typeof v.lon === 'number' 
          ? `${v.lat.toFixed(2)}, ${v.lon.toFixed(2)}`
          : 'N/A, N/A',
        raw: v,
      }));
  };

  const getSolarTableData = () => {
    if (!metrics.solar) return [];
    return [{
      id: 'solar-current',
      flareClass: metrics.solar.class || 'A',
      flux: metrics.solar.flux ? metrics.solar.flux.toExponential(2) : '0',
      windSpeed: metrics.solar.windSpeed ? `${metrics.solar.windSpeed} km/s` : 'N/A',
      protonLevel: metrics.solar.protonLevel || 'None',
      raw: metrics.solar,
    }];
  };

  const getClimateTableData = () => {
    const data = [];
    if (metrics.atmosphere?.co2) {
      data.push({
        id: 'co2',
        metric: 'CO₂ Concentration',
        value: `${metrics.atmosphere.co2} ppm`,
        source: 'NOAA Mauna Loa',
      });
    }
    if (metrics.crustTemp !== null && metrics.crustTemp !== undefined) {
      data.push({
        id: 'temp',
        metric: 'Surface Temperature',
        value: `${metrics.crustTemp.toFixed(1)} K (${(metrics.crustTemp - 273.15).toFixed(1)}°C)`,
        source: 'Open-Meteo',
      });
    }
    return data;
  };

  const getUSGSEventLink = (event) => {
    if (!event?.id) return null;
    return `https://earthquake.usgs.gov/earthquakes/eventpage/${event.id}`;
  };

  const Section = ({ id, title, helpContent, sourceLink, children, collapsible = true }) => {
    const isExpanded = expandedSections[id];
    return (
      <div className={`data-section ${isExpanded ? 'expanded' : ''}`}>
        <div 
          className="section-header"
          onClick={() => collapsible && toggleSection(id)}
        >
          <div className="section-title-group">
            <h2 className="section-title">{title}</h2>
            {helpContent && (
              <HelpTooltip 
                content={helpContent}
                title={title}
                sourceLink={sourceLink}
              />
            )}
          </div>
          {sourceLink && (
            <a 
              href={sourceLink.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="source-link-header"
              onClick={(e) => e.stopPropagation()}
            >
              {sourceLink.label} →
            </a>
          )}
          {collapsible && (
            <span className="section-toggle">{isExpanded ? '−' : '+'}</span>
          )}
        </div>
        {isExpanded && (
          <div className="section-content">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="live-data-panel">
      <div className="panel-header">
        <h1>Live Earth Telemetry</h1>
        {metrics.lastUpdated && (
          <div className="last-updated">
            Last updated: {formatTimestamp(metrics.lastUpdated)}
          </div>
        )}
      </div>

      <Section
        id="seismic"
        title="Seismic Activity"
        helpContent="Real-time earthquake data from the USGS. Shows the most recent earthquake with magnitude 2.5 or greater detected in the last hour."
        sourceLink={{
          url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson",
          label: "USGS API"
        }}
      >
        {(() => {
          const event = metrics.lastSeismicEvent;
          const isPlaceholder = event && (event.label === 'WAITING FOR SIGNAL...' || event.label === 'SIGNAL LOST' || event.label === 'NO RECENT EARTHQUAKES');
          const tableData = getSeismicTableData();
          
          if (isPlaceholder) {
            return (
              <div className="no-data">
                {event.label === 'NO RECENT EARTHQUAKES' 
                  ? 'No earthquakes with magnitude 2.5+ detected in the last hour.'
                  : event.label === 'SIGNAL LOST'
                  ? 'Unable to connect to USGS seismic feed. Please check your connection.'
                  : 'Waiting for seismic data...'}
              </div>
            );
          }
          
          if (tableData.length > 0) {
            return (
              <DataTable
                data={tableData}
                columns={[
                  { key: 'location', label: 'Location', sortable: true },
                  { key: 'magnitude', label: 'Magnitude', sortable: true },
                  { key: 'time', label: 'Time', sortable: true },
                ]}
                sourceLinks={{
                  location: (row) => getUSGSEventLink(row.raw)
                }}
                onRowClick={(row) => {
                  const link = getUSGSEventLink(row.raw);
                  if (link) window.open(link, '_blank');
                }}
              />
            );
          }
          
          return <div className="no-data">Waiting for seismic data...</div>;
        })()}
      </Section>

      <Section
        id="solar"
        title="Solar Activity"
        helpContent="Solar X-ray flux, solar wind speed, and proton flux data from NOAA's Space Weather Prediction Center. Higher flare classes (M, X) can cause geomagnetic storms."
        sourceLink={{
          url: "https://www.swpc.noaa.gov/",
          label: "NOAA SWPC"
        }}
      >
        {metrics.solar ? (
          <DataTable
            data={getSolarTableData()}
            columns={[
              { key: 'flareClass', label: 'Flare Class', sortable: true },
              { key: 'flux', label: 'X-Ray Flux', sortable: true },
              { key: 'windSpeed', label: 'Solar Wind Speed', sortable: true },
              { key: 'protonLevel', label: 'Proton Storm Level', sortable: true },
            ]}
            sourceLinks={{
              flareClass: () => "https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json"
            }}
          />
        ) : (
          <div className="no-data">Waiting for solar data...</div>
        )}
        {metrics.coreLoad !== null && (
          <div className="metric-display">
            <div className="metric-item">
              <span className="metric-label">Core MHD Load (K-Index):</span>
              <span className="metric-value">{(metrics.coreLoad * 9).toFixed(1)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Alfvén Bus Velocity:</span>
              <span className="metric-value">{metrics.mantleBandwidth ? `${metrics.mantleBandwidth.toFixed(0)} km/s` : 'N/A'}</span>
            </div>
          </div>
        )}
      </Section>

      <Section
        id="volcanic"
        title="Volcanic Activity"
        helpContent="Elevated volcano alerts from the USGS Volcano Notification Service. Shows volcanoes with Orange or Red alert levels indicating active or imminent eruptions."
        sourceLink={{
          url: "https://volcanoes.usgs.gov/hans-public/",
          label: "USGS VNS"
        }}
      >
        {(() => {
          const tableData = getVolcanoTableData();
          if (tableData.length > 0) {
            return (
              <DataTable
                data={tableData}
                columns={[
                  { key: 'name', label: 'Volcano Name', sortable: true },
                  { key: 'status', label: 'Alert Level', sortable: true },
                  { key: 'location', label: 'Coordinates', sortable: true },
                ]}
              />
            );
          }
          return <div className="no-data">No elevated volcano alerts (Orange/Red) at this time.</div>;
        })()}
      </Section>

      <Section
        id="climate"
        title="Climate & Atmosphere"
        helpContent="Atmospheric CO₂ measurements from Mauna Loa Observatory and surface temperature data. These metrics track long-term climate trends."
        sourceLink={{
          url: "https://gml.noaa.gov/ccgg/trends/",
          label: "NOAA GML"
        }}
      >
        {getClimateTableData().length > 0 ? (
          <DataTable
            data={getClimateTableData()}
            columns={[
              { key: 'metric', label: 'Metric', sortable: true },
              { key: 'value', label: 'Value', sortable: true },
              { key: 'source', label: 'Source', sortable: true },
            ]}
            sourceLinks={{
              metric: (row) => {
                if (row.id === 'co2') return "https://gml.noaa.gov/ccgg/trends/";
                if (row.id === 'temp') return "https://open-meteo.com/";
                return null;
              }
            }}
          />
        ) : (
          <div className="no-data">Waiting for climate data...</div>
        )}
      </Section>
    </div>
  );
};

export default LiveDataPanel;

