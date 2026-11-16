import * as THREE from 'three';
import { STRIPS, TILES, BACKGROUNDS } from './manifest.js';

const loader = new THREE.TextureLoader();

function load(url, { pixel = false, wrap = false } = {}) {
  return new Promise((resolve) => {
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.magFilter = pixel ? THREE.NearestFilter : THREE.LinearFilter;
      tex.minFilter = pixel ? THREE.NearestFilter : THREE.LinearFilter;
      if (wrap) tex.wrapS = THREE.RepeatWrapping;
      resolve(tex);
    }, undefined, () => resolve(null)); // fichier absent → null (repli procédural)
  });
}

// Charge toutes les images en parallèle. Un échec ne bloque jamais le jeu.
export async function loadAssets() {
  const A = { strips: {}, tiles: {}, bg: {}, ok: 0, missing: 0 };
  const jobs = [];
  for (const [k, v] of Object.entries(STRIPS)) jobs.push(load(v.url).then((t) => (A.strips[k] = t ? { tex: t, frames: v.frames } : null)));
  for (const [k, v] of Object.entries(TILES)) jobs.push(load(v.url, { pixel: v.pixel }).then((t) => (A.tiles[k] = t)));
  for (const [k, v] of Object.entries(BACKGROUNDS)) jobs.push(load(v.url, { wrap: true }).then((t) => (A.bg[k] = t)));
  await Promise.all(jobs);
  const all = [...Object.values(A.strips), ...Object.values(A.tiles), ...Object.values(A.bg)];
  A.ok = all.filter(Boolean).length; A.missing = all.length - A.ok;
  return A;
}
