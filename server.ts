import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// 1. API route for Gemini chat with Search / Maps Grounding & Model Selection
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], groundingType = 'search', model } = req.body;
    let selectedModel = model || 'gemini-3.8-flash';
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text || m.content || '' }],
    }));

    const tools: any[] = [];
    if (groundingType === 'maps') {
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

    res.json({
      text: replyText,
      grounding,
      modelUsed: selectedModel,
    });
  } catch (err: any) {
    console.error('[Gemini Server Error]', err);
    res.status(500).json({
      error: err.message || 'AI Engine Error',
      text: `[SISTEMSKO UPOZORENJE]: Nema tihih padova po XP kodeksu! Greška: ${err.message || 'Greška'}. Ali bratina ne staje, Full Power!`,
    });
  }
});

// 2. Veo 3 Video Generation API
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, imageBase64, imageMime = 'image/png', aspectRatio = '16:9' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    const videoPayload: any = {
      model: 'veo-3.1-fast-generate-preview',
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      },
    };

    if (prompt) videoPayload.prompt = prompt;
    if (imageBase64) {
      const cleaned = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      videoPayload.image = {
        imageBytes: cleaned,
        mimeType: imageMime,
      };
    }

    const operation = await ai.models.generateVideos(videoPayload);
    res.json({ operationName: operation.name });
  } catch (err: any) {
    console.error('[Veo Generate Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Veo Video Status Poll API
app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    const updated: any = await ai.operations.getVideosOperation({
      operation: { name: operationName } as any,
    });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri || null;
    res.json({ done: !!updated.done, error: updated.error || null, videoUri: uri });
  } catch (err: any) {
    console.error('[Veo Status Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Veo Video Download Proxy
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName, videoUri } = req.body;
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
      res.status(404).json({ error: 'Video URI not found' });
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
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend files
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`[AiChatBratina v10.0] Server running on port ${port} - Full Power!`);
});
