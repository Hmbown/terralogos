# Visual Test Checklist for Terra-Logos Enhancements

## 🎯 Purpose
This checklist helps verify that all visual enhancements are working correctly in the browser.

---

## Pre-Test Setup

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Open Browser**: Navigate to `http://localhost:5173`

3. **Open DevTools**: 
   - Check Console for errors
   - Monitor Performance tab for FPS

---

## ✅ Visual Tests

### 1. **Earth Surface Quality**
- [ ] **Day Side**: Should show detailed land textures with visible topography
- [ ] **Night Side**: Should show city lights (more visible near terminator)
- [ ] **Oceans**: Should have bright specular highlights where sun reflects
- [ ] **Clouds**: Should see TWO distinct cloud layers moving at different speeds
- [ ] **Cloud Movement**: Clouds should slowly drift across the surface
- [ ] **Terminator**: Should be a smooth gradient between day/night (no hard line)
- [ ] **City Glow**: Cities should glow brighter at dusk/dawn (twilight enhancement)
- [ ] **Blue Rim**: Should see subtle blue fresnel glow at Earth's edge

**Pass Criteria**: Earth looks photorealistic with depth and detail

---

### 2. **Atmospheric Layers**
- [ ] **Inner Glow**: Thin bright halo just above Earth's surface
- [ ] **Outer Scattering**: Larger, softer blue haze extending into space
- [ ] **Sun Direction**: Atmosphere should be brightest on sun-facing side
- [ ] **Sunset Colors**: Should see orange/red tones near the terminator in atmosphere
- [ ] **No Flickering**: Atmospheric layers should blend smoothly without z-fighting

**Pass Criteria**: Realistic atmospheric depth with visible scattering

---

### 3. **Level of Detail (LOD)**
**Test by zooming in/out with mouse wheel**:

- [ ] **Close View (< 50 units)**: Earth should have maximum detail (64 segments)
- [ ] **Medium View (50-100 units)**: Slightly reduced detail (32 segments) - should NOT be noticeable
- [ ] **Far View (> 100 units)**: Low detail (16 segments) - visible faceting is acceptable
- [ ] **No Popping**: Transitions between LOD levels should be smooth (no sudden geometry changes)

**Pass Criteria**: Smooth performance at all distances with imperceptible LOD transitions

---

### 4. **Weather Overlay**
- [ ] **Particles Visible**: Should see ~160 small white/blue spheres on Earth's surface
- [ ] **Following Surface**: Particles should stay on the sphere (not floating in space)
- [ ] **Movement**: Particles should slowly rotate with wind speed
- [ ] **Wobble Animation**: Particles should have slight vertical bobbing motion
- [ ] **Pulsing**: Particles should pulse/scale in size
- [ ] **Color Change**: If ionization data is high, particles should turn orange (storm mode)

**Pass Criteria**: Dynamic weather particles that feel alive and responsive

---

### 5. **Flight Paths**
- [ ] **Visible Arcs**: Should see 5 white curved lines connecting major cities
- [ ] **Smooth Curves**: Lines should arc naturally above Earth's surface
- [ ] **Animated Dashes**: Lines should have moving dash pattern (flowing animation)
- [ ] **Airport Markers**: Small white spheres at each endpoint (10 total)
- [ ] **Proper Routes**: 
  - Los Angeles ↔ New York
  - London ↔ Tokyo
  - New Delhi ↔ Sydney
  - São Paulo ↔ Beijing
  - Singapore ↔ Moscow

**Pass Criteria**: Elegant orbital paths with clear animation

---

### 6. **Dynamic Sun System**
**Let the visualization run for 30 seconds**:

- [ ] **Sun Moves**: The day/night terminator should slowly shift across Earth
- [ ] **Atmosphere Follows**: Blue haze should track with the sun position
- [ ] **City Lights**: Night side lights should appear/disappear as sun moves
- [ ] **Cloud Shading**: Clouds should be brighter on day side, darker on night side
- [ ] **Smooth Animation**: No jerky movements or sudden changes

**Pass Criteria**: Natural, continuous day/night cycle

---

### 7. **Solar Flare Response**
**Requires live telemetry data with M or X class flare**:

- [ ] **Atmosphere Color**: Should shift from blue (#3f7cff) to lighter blue (#88aaff)
- [ ] **Atmosphere Intensity**: Glow should become brighter and wider
- [ ] **Smooth Transition**: Color change should interpolate smoothly
- [ ] **Point Light**: Extra bright point light should appear from sun direction

**Pass Criteria**: Visible reaction to solar activity (may need to trigger manually or wait for data)

---

### 8. **Performance**
**Monitor FPS in DevTools Performance tab**:

- [ ] **60 FPS at Rest**: When not moving camera
- [ ] **> 45 FPS While Rotating**: During camera orbit
- [ ] **No Stuttering**: Smooth frame delivery
- [ ] **GPU Usage**: Check if GPU is doing the work (not CPU bound)
- [ ] **Memory Stable**: No memory leaks over 5 minutes

**Pass Criteria**: Smooth 60 FPS experience on mid-range hardware

---

### 9. **Integration with Other Components**
- [ ] **Magnetosphere Lines**: Should see magnetic field lines (from PlasmaTopology)
- [ ] **Auroras**: Should see green/purple auroras near poles (from AuroraBorealis)
- [ ] **ISS Tracker**: Should see small object orbiting Earth (from ISSTracker)
- [ ] **Grid Lines**: Should see lat/lon grid overlay (from GridLines)
- [ ] **No Conflicts**: All components should render without z-fighting or overlap issues

**Pass Criteria**: All components coexist harmoniously

---

### 10. **WebXR / VR Mode** (Optional)
**If you have a VR headset**:

- [ ] **Enter VR Button**: Visible and clickable
- [ ] **VR Mode Starts**: Headset displays the scene
- [ ] **Stereo Rendering**: Each eye sees correct perspective
- [ ] **Head Tracking**: View updates with head movement
- [ ] **Performance**: Maintains 90 FPS in VR (critical for comfort)

**Pass Criteria**: Immersive VR experience without nausea-inducing judder

---

## 🐛 Common Issues & Solutions

### Issue: "Could not load texture"
**Solution**: Check that all texture files exist in `public/textures/`:
```bash
ls public/textures/
# Should see: earthmap.jpg, earthlights.png, earthbump.jpg, 
#             earthspec.jpg, earthclouds_8k.jpg, earthclouds.png
```

### Issue: "Multiple instances of Three.js"
**Solution**: Already fixed in `vite.config.js` with dedupe settings. If persists, clear cache:
```bash
rm -rf node_modules/.vite
npm run dev
```

### Issue: Clouds not visible or identical layers
**Solution**: Verify `cloudTexture2` is loading the distinct PNG texture:
```javascript
// In EarthGlobe.jsx
const CLOUD_MAP_2 = '/textures/earthclouds.png'; // Should be PNG, not JPG
```

### Issue: Poor performance / low FPS
**Solution**: 
1. Reduce atmosphere ray march samples in `AtmosphericScatteringShader.js`:
   ```javascript
   const int NUM_SAMPLES = 12; // down from 16
   const int NUM_LIGHT_SAMPLES = 6; // down from 8
   ```
2. Adjust LOD distances in `EarthGlobe.jsx`:
   ```javascript
   <Detailed distances={[0, 30, 60]}> // closer LOD switches
   ```

### Issue: Atmosphere too bright/dim
**Solution**: Adjust coefficients in `AtmosphericScattering.jsx`:
```javascript
outerRef.current.uRayleighCoefficient = 2.0 * intensity; // decrease for less glow
outerRef.current.uMieCoefficient = 0.003 * intensity; // decrease for sharper edges
```

---

## 📊 Expected Results Summary

| Component | Expected Visual | Performance Impact |
|-----------|----------------|-------------------|
| Earth Surface | Photorealistic with dual clouds | Medium |
| Atmosphere | Blue haze with sunset colors | High (ray marching) |
| LOD System | Imperceptible quality changes | Low (performance boost) |
| Weather | 160 glowing storm particles | Low (GPU instanced) |
| Flight Paths | 5 animated arcs with markers | Low |
| Sun Animation | Slow day/night sweep | Negligible |

---

## ✅ Final Pass/Fail

**Pass Criteria**: 
- 8 out of 10 major tests pass
- No console errors
- Stable 60 FPS
- Visually impressive

**If Failed**:
1. Check console for errors
2. Verify all textures loaded
3. Review VERIFICATION_REPORT.md for known issues
4. Check GPU compatibility (requires WebGL 2.0)

---

## 🎬 Recording Setup

**For documentation/demo videos**:

1. **Camera Positions**:
   - Close-up: `position={[0, 0, 8]}`
   - Medium: `position={[0, 0, 12]}` (default)
   - Far: `position={[0, 0, 20]}`

2. **Best Features to Highlight**:
   - Slow orbit around Earth showing day/night transition
   - Zoom from far (LOD demo) to close-up (detail demo)
   - Wait for twilight zone to show city glow
   - Point out dual cloud layers moving independently

3. **Screen Recording Settings**:
   - 1920x1080 minimum
   - 60 FPS recording
   - Show DevTools Performance tab for credibility

---

**Test Completed By**: _________________  
**Date**: _________________  
**Browser**: _________________  
**GPU**: _________________  
**Result**: ☐ Pass  ☐ Fail  
**Notes**: _________________________________________________________________

