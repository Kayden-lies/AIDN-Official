import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function modelUploadPlugin(): Plugin {
  return {
    name: 'aidn-model-upload',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Direct serve for AIDN Logo 3D Model.glb with proper mime type regardless of URL encoding
        const decodedUrl = decodeURIComponent(req.url || '');
        if (decodedUrl === '/AIDN Logo 3D Model.glb' || decodedUrl.endsWith('/AIDN Logo 3D Model.glb')) {
          const filePath = path.resolve(__dirname, 'public/AIDN Logo 3D Model.glb');
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
              'Content-Type': 'model/gltf-binary',
              'Content-Length': stat.size,
              'Cache-Control': 'no-cache',
            });
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }

        if (req.url?.startsWith('/api/model-status') && req.method === 'GET') {
          try {
            const pubDir = path.resolve(__dirname, 'public');
            const files = fs.readdirSync(pubDir).filter(f => f.toLowerCase().endsWith('.glb'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ files }));
          } catch (err: unknown) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        if (req.url?.startsWith('/api/upload-model') && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          req.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              const pubDir = path.resolve(__dirname, 'public');
              if (!fs.existsSync(pubDir)) {
                fs.mkdirSync(pubDir, { recursive: true });
              }
              // Save to primary targets
              fs.writeFileSync(path.join(pubDir, 'aidn.glb'), buffer);
              fs.writeFileSync(path.join(pubDir, 'AIDN Logo 3D Model.glb'), buffer);
              
              // Also sync to dist if present
              const distDir = path.resolve(__dirname, 'dist');
              if (fs.existsSync(distDir)) {
                fs.writeFileSync(path.join(distDir, 'aidn.glb'), buffer);
                fs.writeFileSync(path.join(distDir, 'AIDN Logo 3D Model.glb'), buffer);
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, bytes: buffer.length, savedAs: 'AIDN Logo 3D Model.glb' }));
            } catch (err: unknown) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    assetsInclude: ['**/*.glb', '**/*.gltf'],
    plugins: [react(), tailwindcss(), modelUploadPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
