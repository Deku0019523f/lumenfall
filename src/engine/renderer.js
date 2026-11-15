import * as THREE from 'three';

// Unités monde : 1 unité = 1 tuile (32 px logiques). Vue ~ 18 tuiles de haut.
export const VIEW_HEIGHT = 11;

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0b0a14, 1);

  const scene = new THREE.Scene();

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  return { renderer, scene, resize };
}
