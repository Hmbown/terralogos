# Contributing to Terra-Logos

Thank you for your interest in contributing to Terra-Logos! 🌍

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Basic knowledge of React, Three.js, and WebGL
- (Optional) Cloudflare account for testing serverless functions

### Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/terralogos.git
   cd terralogos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   # Frontend only (uses mock data)
   npm run dev
   
   # Full stack with API emulation
   npm run pages:dev:watch
   ```

4. **Access the app**
   - Frontend: http://localhost:5173
   - API: http://localhost:8788 (if running full stack)

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes
- Write clean, readable code
- Follow existing code style and patterns
- Add comments for complex logic (especially in shaders)
- Keep commits focused and atomic

### 3. Test Thoroughly

**For Code Changes:**
```bash
npm run lint        # Check for linting errors
npm run build       # Verify production build
npm run test        # Run unit tests (if applicable)
```

**For Visual/3D Changes:**
- Follow the [Visual Test Checklist](docs/development/VISUAL_TEST_CHECKLIST.md)
- Test on multiple browsers (Chrome, Firefox, Safari)
- Verify performance (60 FPS target)
- Test responsive behavior on mobile

**For API/Backend Changes:**
- Test with `npm run pages:dev:watch`
- Verify SSE stream connectivity
- Check D1 database interactions
- Confirm error handling

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add description of your feature"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding/updating tests
- `chore:` Maintenance tasks

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub using the provided template.

## Code Style Guidelines

### JavaScript/JSX
- Use functional components with hooks
- Destructure props for clarity
- Keep components small and focused
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Three.js / React Three Fiber
- Use `useRef` for mutable Three.js objects
- Clean up resources in `useEffect` cleanup functions
- Dispose of geometries, materials, and textures
- Use `useMemo` for expensive computations
- Keep shader code in separate files

### GLSL Shaders
- Add comments explaining shader logic
- Use descriptive uniform names (e.g., `uSunDirection` not `uSD`)
- Keep shaders optimized (minimize texture lookups)
- Document shader inputs/outputs

### Performance
- Profile changes with DevTools
- Maintain 60 FPS on mid-range hardware
- Use GPU instancing for repeated geometry
- Implement LOD where appropriate
- Optimize texture sizes

## Project Structure

```
src/
├── components/
│   ├── Hardware/          # 3D visualization components
│   │   ├── EarthBase/     # Earth + atmosphere + overlays
│   │   ├── CoreMHD/       # Magnetosphere
│   │   ├── CrustInterface/# Seismic + volcanic
│   │   └── Audio/         # Spatial audio
│   ├── Dashboard/         # UI panels
│   └── Navigation/        # Navigation components
└── core/
    ├── hooks/             # Custom React hooks
    ├── store/             # Zustand state management
    └── utils/             # Helper functions
```

## What to Contribute

### High Priority
- 🐛 Bug fixes
- 📱 Mobile optimization
- ♿ Accessibility improvements
- 📚 Documentation improvements
- ✅ Test coverage

### Feature Ideas
- 🌐 Real-time flight path data integration
- 🌦️ Live weather API integration
- 🛰️ Additional satellite tracking
- 🎨 New visualization modes
- 📊 Data export functionality
- 🎮 Interactive controls

### Advanced Features
- ☁️ Volumetric cloud rendering
- 🌑 Cloud shadow casting
- ⏰ Time scrubbing controls
- ✨ Post-processing effects (bloom, SSAO)
- 🌊 Ocean wave animation

## Testing Checklist

Before submitting a PR, ensure:

- [ ] Code builds without errors (`npm run build`)
- [ ] No linter warnings (`npm run lint`)
- [ ] Visual quality maintained (no regressions)
- [ ] Performance acceptable (60 FPS on mid-range GPU)
- [ ] Works on Chrome, Firefox, Safari
- [ ] Mobile responsive (if UI changes)
- [ ] Documentation updated (if API changes)
- [ ] No console errors or warnings

## Need Help?

- 📖 Check the [docs/](docs/) folder for guides
- 🔍 Read the [Verification Report](docs/development/VERIFICATION_REPORT.md) for technical details
- 💬 Open an issue for questions or discussion
- 📧 Tag maintainers in your PR for review

## Code Review Process

1. **Automated checks** run on every PR
2. **Maintainer review** for code quality and architecture
3. **Visual review** for 3D/UI changes
4. **Testing** on multiple browsers/devices
5. **Merge** once approved

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Terra-Logos better! 🚀🌍

