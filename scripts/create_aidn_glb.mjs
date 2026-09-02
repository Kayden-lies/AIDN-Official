import fs from 'node:fs';
import path from 'node:path';

// Synchronize user's official src/a.glb to public assets
const srcPath = path.resolve('src/a.glb');
if (fs.existsSync(srcPath)) {
  const pubDir = path.resolve('public');
  if (!fs.existsSync(pubDir)) {
    fs.mkdirSync(pubDir, { recursive: true });
  }
  fs.copyFileSync(srcPath, path.join(pubDir, 'a.glb'));
  fs.copyFileSync(srcPath, path.join(pubDir, 'aidn.glb'));
  fs.copyFileSync(srcPath, path.join(pubDir, 'AIDN Logo 3D Model.glb'));
  console.log('Synchronized official src/a.glb to public directory.');
}
