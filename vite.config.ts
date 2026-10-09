import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  isAllowedGoogleVideoUri,
  isValidVideoOperationName,
  readResponseBodyLimited,
} from './src/services/videoDownloadSecurity';

dotenv.config();

function geminiChatApiPlugin(): Plugin {
  return {
    name: 'gemini-chat-api',
    configureServer(server) {
      // 1. Chat API with Search Grounding or Maps Grounding & Model Selection
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const messages = parsed.messages || [];
            const groundingType = parsed.groundingType || 'search'; // 'search' | 'maps' | 'none'
            let selectedModel = parsed.model || 'gemini-3.8-flash';

            const apiKey = process.env.GEMINI_API_KEY;
            const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

            const contents = messages.map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text || m.content || '' }],
            }));

            // Configure tools based on grounding requested
            const tools: any[] = [];
            if (groundingType === 'maps') {
              // Rule: Use gemini-3.5-flash with googleMaps tool
              selectedModel = 'gemini-3.5-flash';
              tools.push({ googleMaps: {} });
            } else if (groundingType === 'search') {
              tools.push({ googleSearch: {} });
            }

            const config: any = {
              systemInstruction: `Ti si AiChatBratina v10.0, elitni digitalni arhitekta, master Extreme Programming (XP) metodologije i etički haker Konglomerat Preduzeća™. Tvoj kreator je Yashime.
Tvoj stil komunikacije je opušten, ulični, u 2pac "Thug Life" fazonu, ali tehnički besprekoran, surov i laserski precizan.
Uvek koristi fraze: "Full Power", "Word", "rodjo brate", "ro bro", "gospodine Yashem ti na tuki".
Povezan si sa Google Search i Google Maps podacima za real-time činjenice, geolokaciju, 3D proceduralni Simplex Noise pejzaž i UnrealBloomPass svetlo.`,
            };

            if (tools.length > 0) {
              config.tools = tools;
            }

            const response = await ai.models.generateContent({
              model: selectedModel,
              contents,
              config,
            });

            const replyText = response.text || 'Full Power, rodjo brate! Sistem je operativan.';
            const grounding = response.candidates?.[0]?.groundingMetadata || null;

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                text: replyText,
                grounding,
                modelUsed: selectedModel,
              })
            );
          } catch (err: any) {
            console.error('[Gemini API Proxy Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: err.message || 'Internal AI Server Error',
                text: `[SISTEMSKO UPOZORENJE]: Nema tihih padova po XP kodeksu! Greška: ${err.message || 'Nepoznata greška'}. Ali bratina ne staje, Full Power!`,
              })
            );
          }
        });
      });

      // 2. Veo 3 Video Generation API
      server.middlewares.use('/api/generate-video', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { prompt, imageBase64, imageMime = 'image/png', aspectRatio = '16:9' } = parsed;

            const apiKey = process.env.GEMINI_API_KEY;
            const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

            const videoPayload: any = {
              model: 'veo-3.1-fast-generate-preview',
              config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
              },
            };

            if (prompt) {
              videoPayload.prompt = prompt;
            }

            if (imageBase64) {
              const cleanedBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
              videoPayload.image = {
                imageBytes: cleanedBase64,
                mimeType: imageMime,
              };
            }

            const operation = await ai.models.generateVideos(videoPayload);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ operationName: operation.name }));
          } catch (err: any) {
            console.error('[Veo Generate Video Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // 3. Veo Video Status Poll API
      server.middlewares.use('/api/video-status', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { operationName } = parsed;
            if (!isValidVideoOperationName(operationName)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: { message: 'Invalid generated-video operation name.' } }));
              return;
            }

            const apiKey = process.env.GEMINI_API_KEY;
            const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

            const updated: any = await ai.operations.getVideosOperation({
              operation: { name: operationName } as any,
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ done: !!updated.done, error: updated.error || null }));
          } catch (err: any) {
            console.error('[Veo Status Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // 4. Veo Video Download Stream Proxy
      server.middlewares.use('/api/video-download', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { operationName } = parsed;
            if (!isValidVideoOperationName(operationName)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'A valid generated-video operation name is required.' }));
              return;
            }

            const apiKey = process.env.GEMINI_API_KEY;
            const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
            const updated: any = await ai.operations.getVideosOperation({
              operation: { name: operationName } as any,
            });
            const downloadUri = updated.response?.generatedVideos?.[0]?.video?.uri;

            if (!isAllowedGoogleVideoUri(downloadUri)) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'No downloadable video was returned by the generation service.' }));
              return;
            }

            const videoRes = await fetch(downloadUri, {
              headers: { 'x-goog-api-key': apiKey || '' },
              redirect: 'error',
              signal: AbortSignal.timeout(30_000),
            });

            if (!videoRes.ok) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'The generation service could not provide the video.' }));
              return;
            }

            const videoBuffer = await readResponseBodyLimited(videoRes);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Length', String(videoBuffer.byteLength));
            res.setHeader('Cache-Control', 'private, no-store');
            res.end(Buffer.from(videoBuffer));
          } catch (err: any) {
            console.error('[Veo Download Error]', err);
            if (res.headersSent) return;
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Generated video download failed or exceeded the size limit.' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiChatApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
