// WebGL renderer setup.
// The scene is rendered by post.js into an HDR multisampled target; tone mapping, grading and the sRGB
// encode happen in the final composite pass, so the renderer itself does no tone mapping and no canvas MSAA.
import * as THREE from 'three';
import { qualitySettings } from '../core/config.js';
import { effectiveMaxDpr } from './quality-scaler.js';

export function createRenderer({ canvas, quality = 'high' }) {
  let q = qualitySettings(quality);
  let qLevel = quality;
  // Phase 2E: the pixel ratio is capped by the level AND by the device -
  // a touch screen never renders above 1.5, even at high (pixel count is
  // the single biggest cost on phones).
  const cappedDpr = () => Math.min(window.devicePixelRatio || 1, effectiveMaxDpr(qLevel));
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = q.shadows;
  // Basic = raw depth in a sampler2D. materials.js runs its own PCSS on it (blocker search +
  // receiver-plane depth bias + wide PCF); the stock filter is never used by paper materials.
  renderer.shadowMap.type = THREE.BasicShadowMap;

  return {
    renderer,
    /** CSS-pixel size of the canvas; pixel ratio is clamped by the quality level. */
    setSize(width, height) {
      renderer.setPixelRatio(cappedDpr());
      renderer.setSize(width, height, false);
    },
    setQuality(level) {
      q = qualitySettings(level);
      qLevel = level;
      renderer.shadowMap.enabled = q.shadows;
      renderer.setPixelRatio(cappedDpr());
    },
    dispose() { renderer.dispose(); },
  };
}
