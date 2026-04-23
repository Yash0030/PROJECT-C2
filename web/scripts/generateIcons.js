import fs from 'fs';
import sharp from 'sharp';
import path from 'path';

const input = path.resolve('public/logo.png');

async function resize() {
  try {
    await sharp(input).resize(192, 192).toFile('public/pwa-192x192.png');
    console.log('Created pwa-192x192.png');
    await sharp(input).resize(512, 512).toFile('public/pwa-512x512.png');
    console.log('Created pwa-512x512.png');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

resize();
