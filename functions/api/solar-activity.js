import { fetchSolarPacket } from '../_utils/telemetry';

export async function onRequest() {
  try {
    const packet = await fetchSolarPacket();
    const payload = {
      xray: {
        flux: packet.solar.flux,
        class: packet.solar.class,
        time: packet.solar.timestamps?.xray || null,
      },
      solarWind: {
        speed: packet.solar.windSpeed,
        density: packet.solar.density,
        temperature: packet.solar.temperature,
        time: packet.solar.timestamps?.wind || null,
      },
      proton: {
        flux: packet.raw?.protonFlux ?? 0,
        stormLevel: packet.solar.protonLevel,
      },
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('[API] SOLAR_ACTIVITY', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
