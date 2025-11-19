const USGS_SEISMIC_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson';
const NOAA_KP_URL = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
const NOAA_XRAY_URL = 'https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json';
const NOAA_SOLAR_WIND_URL = 'https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json';
const NOAA_PROTON_URL = 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-plot-1-day.json';
const USGS_VOLCANO_URL = 'https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes';
const NOAA_CO2_URL = 'https://gml.noaa.gov/web/data/co2/trends/co2_mlo_weekly.csv';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast?latitude=19.54&longitude=-155.58&current=temperature_2m';

const GLOBE_RADIUS = 4.2;
const encoder = new TextEncoder();

const toRadians = (deg) => (deg * Math.PI) / 180;

export const sphericalToCartesian = (lat, lon, radius = GLOBE_RADIUS) => {
  const phi = toRadians(90 - lat);
  const theta = toRadians(lon + 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
};

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const getFlareClass = (flux) => {
  if (!flux || flux <= 0) return 'A';
  if (flux < 1e-7) return 'A';
  if (flux < 1e-6) return 'B';
  if (flux < 1e-5) return 'C';
  if (flux < 1e-4) return 'M';
  return 'X';
};

const getStormLevel = (flux) => {
  if (flux >= 100000) return 'S5';
  if (flux >= 10000) return 'S4';
  if (flux >= 1000) return 'S3';
  if (flux >= 100) return 'S2';
  if (flux >= 10) return 'S1';
  return 'None';
};

export async function fetchSeismicFeed() {
  const response = await fetch(USGS_SEISMIC_URL);
  if (!response.ok) throw new Error('USGS seismic feed unavailable');
  return response.json();
}

export function extractLatestSeismicEvent(data) {
  const features = data?.features;
  if (!Array.isArray(features) || features.length === 0) {
    return null;
  }
  const latest = features[0];
  const coords = latest.geometry?.coordinates || [];
  const magnitude = latest.properties?.mag ?? 0;
  const label = latest.properties?.place || 'UNREGISTERED SIGNAL';
  const [lon = 0, lat = 0] = coords;
  const pos = sphericalToCartesian(lat, lon);
  const intensity = clamp((magnitude - 2.0) / 7.0, 0, 1);
  return {
    id: latest.id,
    label,
    magnitude,
    pos,
    intensity,
    timestamp: latest.properties?.time ? new Date(latest.properties.time).toISOString() : null,
  };
}

export async function fetchSolarPacket() {
  const [xrayRes, windRes, protonRes] = await Promise.all([
    fetch(NOAA_XRAY_URL),
    fetch(NOAA_SOLAR_WIND_URL),
    fetch(NOAA_PROTON_URL),
  ]);

  if (!xrayRes.ok) throw new Error('NOAA X-ray feed unavailable');
  if (!windRes.ok) throw new Error('NOAA solar wind feed unavailable');
  if (!protonRes.ok) throw new Error('NOAA proton feed unavailable');

  const [xrayData, windData, protonData] = await Promise.all([
    xrayRes.json(),
    windRes.json(),
    protonRes.json(),
  ]);

  const latestXray = Array.isArray(xrayData) && xrayData.length ? xrayData[xrayData.length - 1] : null;
  const latestWind = Array.isArray(windData) && windData.length ? windData[windData.length - 1] : null;

  // Proton data contains multiple channels – prefer >=10MeV
  let protonFlux = 0;
  if (Array.isArray(protonData) && protonData.length) {
    const tenMeV = protonData.filter((entry) => entry.energy === '>=10 MeV');
    if (tenMeV.length) {
      const last = tenMeV[tenMeV.length - 1];
      protonFlux = parseFloat(last.flux) || 0;
    } else {
      const last = protonData[protonData.length - 1];
      protonFlux = parseFloat(last?.flux) || 0;
    }
  }

  const windSpeed = latestWind ? parseFloat(latestWind[2]) || 0 : 0;
  const windDensity = latestWind ? parseFloat(latestWind[1]) || 0 : 0;
  const windTemp = latestWind ? parseFloat(latestWind[3]) || 0 : 0;

  return {
    solar: {
      flux: latestXray?.flux || 0,
      class: getFlareClass(latestXray?.flux || 0),
      windSpeed,
      protonLevel: getStormLevel(protonFlux),
      timestamps: {
        xray: latestXray?.time_tag || null,
        wind: latestWind ? latestWind[0] : null,
      },
      density: windDensity,
      temperature: windTemp,
    },
    mantleBandwidth: windSpeed,
    solarWindFlux: windSpeed,
    raw: {
      xray: latestXray,
      wind: latestWind,
      protonFlux,
    },
  };
}

export async function fetchKpIndex() {
  const response = await fetch(NOAA_KP_URL);
  if (!response.ok) throw new Error('NOAA K-index feed unavailable');
  const data = await response.json();
  const latest = Array.isArray(data) && data.length ? data[data.length - 1] : null;
  const kp = latest ? parseFloat(latest.kp_index) || 0 : 0;
  return {
    kp,
    load: clamp(kp / 9.0, 0, 1),
    timestamp: latest?.time_tag || null,
  };
}

export async function fetchVolcanoFeed() {
  const response = await fetch(USGS_VOLCANO_URL);
  if (!response.ok) throw new Error(`USGS volcano API error: ${response.status}`);
  const data = await response.json();
  return data
    .filter((v) => v?.color_code === 'ORANGE' || v?.color_code === 'RED')
    .map((v) => {
      const lat = parseFloat(v.lat);
      const lon = parseFloat(v.lon);
      return {
        id: v.vnum,
        name: v.v_name,
        status: v.color_code,
        lat,
        lon,
        pos: sphericalToCartesian(lat, lon),
      };
    });
}

export async function fetchLatestCO2() {
  const response = await fetch(NOAA_CO2_URL);
  if (!response.ok) throw new Error('NOAA CO2 feed unavailable');
  const text = await response.text();
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#') || line.startsWith('year')) continue;
    const parts = line.split(',').map((entry) => entry.trim());
    if (parts.length >= 5) {
      const avg = parseFloat(parts[4]);
      if (!Number.isNaN(avg) && avg > 300) {
        return {
          co2: avg,
          date: `${parts[0]}-${parts[1]}-${parts[2]}`,
          source: 'NOAA Mauna Loa',
        };
      }
    }
  }
  throw new Error('Unable to parse CO2 data');
}

export async function fetchWeatherSample() {
  const response = await fetch(OPEN_METEO_URL);
  if (!response.ok) throw new Error('OpenMeteo feed unavailable');
  const data = await response.json();
  const temperatureC = data?.current?.temperature_2m;
  const temperatureK = typeof temperatureC === 'number' ? temperatureC + 273.15 : 0;
  return {
    source: 'OpenMeteo',
    temperatureC,
    temperatureK,
    raw: data,
  };
}

export async function gatherTelemetrySnapshot() {
  const timestamp = new Date().toISOString();
  const [seismicFeed, kp, solarPacket, volcanoes, climate, weather] = await Promise.all([
    fetchSeismicFeed().catch((err) => ({ error: err.message })),
    fetchKpIndex().catch((err) => ({ error: err.message })),
    fetchSolarPacket().catch((err) => ({ error: err.message })),
    fetchVolcanoFeed().catch((err) => ({ error: err.message })),
    fetchLatestCO2().catch((err) => ({ error: err.message })),
    fetchWeatherSample().catch((err) => ({ error: err.message })),
  ]);

  const seismicEvent = seismicFeed?.error ? null : extractLatestSeismicEvent(seismicFeed);
  const volcanoPayload = Array.isArray(volcanoes) ? volcanoes : [];
  const solarTelemetry = solarPacket?.solar ? solarPacket : null;

  const metrics = {
    coreLoad: kp?.load ?? 0,
    mantleBandwidth: solarTelemetry?.mantleBandwidth ?? 0,
    crustTemp: weather?.temperatureK ?? 288,
    solarWindFlux: solarTelemetry?.solarWindFlux ?? 0,
    lastSeismicEvent:
      seismicEvent || {
        pos: [1, 0, 0],
        intensity: 0,
        label: seismicFeed?.error ? 'SIGNAL LOST' : 'WAITING FOR SIGNAL...'
      },
    volcanoes: volcanoPayload,
    solar: solarTelemetry?.solar || { flux: 0, class: 'A', windSpeed: 0, protonLevel: 'None' },
    atmosphere: {
      co2: climate?.co2 ?? 420,
      tempAnomaly: 0,
    },
  };

  const meta = {
    timestamp,
    sources: {
      seismic: seismicFeed?.error ? { error: seismicFeed.error } : { updated: seismicEvent?.timestamp },
      kp,
      solar: solarTelemetry?.solar?.timestamps || null,
      volcanoes: { count: volcanoPayload.length },
      climate,
      weather: weather ? { source: weather.source, updated: timestamp } : null,
    },
  };

  return {
    timestamp,
    metrics,
    meta,
  };
}

export async function persistSnapshot(env, snapshot) {
  if (!env || !env.TERRA_DB) return;
  const payload = JSON.stringify(snapshot);
  await env.TERRA_DB.prepare(
    `INSERT INTO metric_history (snapshot_time, payload) VALUES (?, ?)`
  )
    .bind(snapshot.timestamp, payload)
    .run();

  await env.TERRA_DB.prepare(
    `INSERT INTO metric_cache (key, payload, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`
  )
    .bind('latest', payload, snapshot.timestamp)
    .run();
}

export async function readLatestSnapshot(env) {
  if (!env || !env.TERRA_DB) return null;
  const row = await env.TERRA_DB.prepare(
    'SELECT payload FROM metric_cache WHERE key = ?'
  )
    .bind('latest')
    .first();
  if (!row || !row.payload) return null;
  try {
    return JSON.parse(row.payload);
  } catch (err) {
    console.warn('[D1] SNAPSHOT PARSE FAILURE', err);
    return null;
  }
}

export const formatSseMessage = (event, data) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return encoder.encode(`event: ${event}\ndata: ${payload}\n\n`);
};
