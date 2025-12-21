import * as THREE from 'three';

export const COLORS = {
  SILVER: new THREE.Color('#E8E8E8'), // Brighter silver
  PLATINUM: new THREE.Color('#F0F0F0'), // Almost white silver
  PEARL: new THREE.Color('#F8F8FF'),
  DEEP_SPACE: new THREE.Color('#020208'), // Slightly deeper/cooler
  GOLD_ACCENT: new THREE.Color('#FFD700'),
};

// Muted, earthy, pastel tones
export const MORANDI_PALETTE = [
  '#E0D6D1', // Muted Pinkish Beige
  '#D7C4BB', // Warm Grey/Brown
  '#C8D5CD', // Sage Green/Grey
  '#B5C2C7', // Muted Blue Grey
  '#E6D4CF', // Dusty Pink
  '#D8D3CD', // Warm Grey
  '#BFB8B0', // Taupe
  '#A8A4A0', // Stone
];

// Specific subset for frames as requested: Light Gold, Grey, Pink
export const FRAME_PALETTE = [
  '#E8E0D5', // Light Gold / Champagne
  '#D8D3CD', // Grey
  '#E6D4CF', // Pink
];

export const CONFIG = {
  TREE_HEIGHT: 12,
  TREE_RADIUS: 4.5,
  PARTICLE_COUNT: 7500,
  ORNAMENT_COUNT: 150, // Total count will be split among types
  PHOTO_COUNT: 10,
  UNLEASH_SPEED: 2.5,
  RETURN_SPEED: 1.5,
};

// Placeholder images for the gallery
export const PHOTO_URLS = Array.from({ length: 10 }).map((_, i) => 
  `https://picsum.photos/seed/luxury${i}/600/800`
);