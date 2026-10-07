import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

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

            const apiKey = process.env.GEMINI_API_KEY;
            const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

            const updated: any = await ai.operations.getVideosOperation({
              operation: { name: operationName } as any,
            });

            const uri = updated.response?.generatedVideos?.[0]?.video?.uri || null;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ done: !!updated.done, error: updated.error || null, videoUri: uri }));
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
            const { operationName, videoUri } = parsed;
            const apiKey = process.env.GEMINI_API_KEY;

            let downloadUri = videoUri;
            if (!downloadUri && operationName) {
              const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
              const updated: any = await ai.operations.getVideosOperation({
                operation: { name: operationName } as any,
              });
              downloadUri = updated.response?.generatedVideos?.[0]?.video?.uri;
            }

            if (!downloadUri) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Video URI not found' }));
              return;
            }

            const videoRes = await fetch(downloadUri, {
              headers: { 'x-goog-api-key': apiKey || '' },
            });

            if (!videoRes.ok) {
              throw new Error(`Failed to fetch video: ${videoRes.status}`);
            }

            res.setHeader('Content-Type', 'video/mp4');
            const arrayBuffer = await videoRes.arrayBuffer();
            res.end(Buffer.from(arrayBuffer));
          } catch (err: any) {
            console.error('[Veo Download Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
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
