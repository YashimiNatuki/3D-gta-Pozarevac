import express from 'express';
import path from 'path';
import { createReadStream, promises as fs } from 'node:fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  isAllowedGoogleVideoUri,
  isValidVideoOperationName,
  MAX_GENERATED_VIDEO_BYTES,
  readResponseBodyLimited,
} from './src/services/videoDownloadSecurity';
import { parseSingleByteRange } from './src/services/videoRange';

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

// 1b. Gemini API route for dynamic Serbian street banter & pedestrian dobacivanje
app.post('/api/gemini/street-banter', async (req, res) => {
  try {
    const {
      location = 'Tabačka Čaršija',
      weather = 'Rain',
      wantedLevel = 0,
      respect = 99,
      outfit = 'classic',
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    const prompt = `Generiši 8 autentičnih, uličnih, sočnih i živopisnih dobacivanja i komentara prolaznika i likova na ulicama Požarevca (Srbija).
Lokacija: ${location}.
Vreme: ${weather}.
Traženost (Wanted zvezdice policije): ${wantedLevel}/5.
Respekt igrača: ${respect}%.
Outfit: ${outfit}.

Stil je pravi balkanski ulični žargon, požeški sleng, psovke u šmekerskom fazonu, realistično dobacivanje u hodu:
- Neka neki dobace igraču ako brzo trči ili nosi zlato.
- Neka neki komentarišu kišu, blato ili muriju ako ima potera.
- Neka lokalni likovi kažu nešto u fazonu 'Bratina gazi korzo', 'Gde srljaš bre!', 'Alo šmekeru!', 'Pazi auto kod kafane!'.
Odgovori isključivo u validnom JSON formatu kao niz stringova: ["linija 1", "linija 2", ...].`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    let banterList: string[] = [];
    try {
      banterList = JSON.parse(response.text || '[]');
    } catch {
      banterList = [
        "Gde srljaš bre rodjo!",
        "Alo šmekeru, pazi na korzou!",
        "Bratina dominira Požarevcem!",
        "Kakav pljusak, potopi Tabačku!",
        "Vidi ga Don sa zlatnim lancem!",
        "Pazi auto, voze ko ludi!",
      ];
    }

    res.json({ banter: banterList });
  } catch (err: any) {
    console.error('[Gemini Banter Error]', err);
    res.json({
      banter: [
        "Gde srljaš bre rodjo!",
        "Alo šmekeru, pazi na korzou!",
        "Bratina dominira Požarevcem, Full Power!",
        "Kakav pljusak, potopi Tabačku!",
        "Vidi ga Don sa zlatnim lancem!",
        "Pazi auto kod Kafane Požarevac!",
      ],
    });
  }
});

// 1c. Gemini API route for dynamic narrative chronicles & graphic scene direction
app.post('/api/gemini/chronicle', async (req, res) => {
  try {
    const { location, playerStats, eventType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    const prompt = `Kao AiChatBratina v10.0 i gradski hroničar Požarevca, napiši kratak, eksplozivan, filmski ulični bilten o događaju '${eventType}' na lokaciji '${location}'.
Maksimalno 2 rečenice. Stil: 2Pac Thug Life meets srpski noćni triler, energija na maksimumu, koristi 'Full Power', 'Word', 'rodjo'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    res.json({ headline: response.text || 'Konglomerat Preduzeće kontroliše ceo reon. Full Power!' });
  } catch (err: any) {
    res.json({ headline: 'Konglomerat Preduzeće drži centar Požarevca pod punom kontrolom. Word!' });
  }
});

// 1f. Gemini mission director: location-aware, schema-constrained Požarevac contracts.
app.post('/api/gemini/generate-mission', async (req, res) => {
  const context = req.body?.context || {};
  const x = Number.isFinite(Number(context.x)) ? Math.max(-32, Math.min(32, Number(context.x))) : 0;
  const z = Number.isFinite(Number(context.z)) ? Math.max(-32, Math.min(32, Number(context.z))) : 0;
  const fallback = {
    id: `ai_${Date.now()}_${Math.round((x + 32) * 10)}_${Math.round((z + 32) * 10)}`,
    title: 'AI izviđanje: signal sa Požarevca',
    type: 'delivery',
    giver: { name: 'AiChatBratina', role: 'friend', avatar: '◈', phoneTag: 'BRATINA AI' },
    locationName: 'Požarevac — trenutni sektor',
    targetCoords: { x, z },
    description: 'Preuzmi signal u trenutnom sektoru, zatim ga dostavi na Tabačku Čaršiju.',
    dialogueText: 'AI je očitao anomaliju u tvom sektoru. Nema čekanja, rođo brate.',
    completionText: 'Signal je dostavljen. Grad menja ponašanje oko tebe.',
    requiredTimeOfDay: 'any',
    rewardCash: 1250,
    rewardXp: 240,
    rewardRespect: 8,
    timeLimitSeconds: 420,
    checkpoints: [{ label: 'Očitaj signal u trenutnom sektoru', x, z }, { label: 'Dostavi signal na Tabačku', x: 0, z: -10 }],
    status: 'available',
    isDaily: false,
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
    const prompt = `Generiši jedan GTA-style, potpuno fikcionalni ugovor za igru smeštenu u Požarevac.
Igrač je na lokalnim Three.js koordinatama x=${x}, z=${z}; vreme=${context.timeOfDay || 'day'}, vreme=${context.weather || 'Clear'}, wanted=${context.wantedLevel || 0}, respekt=${context.respect || 0}.
Vrati isključivo validan JSON objekat sa poljima: title, type (delivery|hit|escape_police|turf_war|plant_harvest|trade_flip), locationName, description, dialogueText, completionText, requiredTimeOfDay (any|dawn|day|dusk|night), rewardCash (number), rewardXp (number), rewardRespect (number), timeLimitSeconds (number), checkpoints (niz od najmanje 2 objekta sa label,x,z).
Koordinate moraju biti u opsegu -30..30, sadržaj je fikcionalan i bez realnih uputstava za kriminal. Stil: filmski srpski ulični triler, kratko i jasno.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text || '{}');
    const allowedTypes = new Set(['delivery', 'hit', 'escape_police', 'turf_war', 'plant_harvest', 'trade_flip', 'landmark_scout']);
    const checkpoints = Array.isArray(parsed.checkpoints) ? parsed.checkpoints.slice(0, 4).filter((point: any) =>
      typeof point?.label === 'string' && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.z))) : [];
    if (typeof parsed.title !== 'string' || checkpoints.length < 2 || !allowedTypes.has(parsed.type)) {
      res.json({ mission: fallback, source: 'fallback' });
      return;
    }
    const clamp = (value: unknown) => Math.max(-30, Math.min(30, Number(value) || 0));
    const generatedType = parsed.type;
    const semanticFields = generatedType === 'escape_police'
      ? { wantedLevelOnStart: Math.max(1, Math.min(3, Number(parsed.wantedLevelOnStart) || Math.max(1, Number(context.wantedLevel) || 1))), requiresPackagePickup: true }
      : generatedType === 'trade_flip'
        ? { requiredTradeItemId: 'retro_radio_cassette', requiredTradeItemName: 'Retro Radio-Kasetofon 90-ih', requiredTradeQuantity: 1 }
        : generatedType === 'turf_war'
          ? { turfZoneId: ['tz_tabacka', 'tz_korzo', 'tz_cacalica', 'tz_buvljak', 'tz_hipodrom', 'tz_park'].includes(parsed.turfZoneId) ? parsed.turfZoneId : 'tz_cacalica' }
          : {};
    const mission = {
      ...fallback,
      id: `ai_${Date.now()}_${Math.round(x * 10)}_${Math.round(z * 10)}`,
      title: parsed.title.slice(0, 100),
      type: parsed.type,
      locationName: typeof parsed.locationName === 'string' ? parsed.locationName.slice(0, 100) : fallback.locationName,
      description: typeof parsed.description === 'string' ? parsed.description.slice(0, 320) : fallback.description,
      dialogueText: typeof parsed.dialogueText === 'string' ? parsed.dialogueText.slice(0, 240) : fallback.dialogueText,
      completionText: typeof parsed.completionText === 'string' ? parsed.completionText.slice(0, 240) : fallback.completionText,
      requiredTimeOfDay: ['any', 'dawn', 'day', 'dusk', 'night'].includes(parsed.requiredTimeOfDay) ? parsed.requiredTimeOfDay : 'any',
      rewardCash: Math.max(250, Math.min(10000, Number(parsed.rewardCash) || fallback.rewardCash)),
      rewardXp: Math.max(50, Math.min(2500, Number(parsed.rewardXp) || fallback.rewardXp)),
      rewardRespect: Math.max(1, Math.min(100, Number(parsed.rewardRespect) || fallback.rewardRespect)),
      timeLimitSeconds: Math.max(120, Math.min(1800, Number(parsed.timeLimitSeconds) || fallback.timeLimitSeconds)),
      targetCoords: { x: clamp(checkpoints[0].x), z: clamp(checkpoints[0].z) },
      checkpoints: checkpoints.map((point: any) => ({ label: point.label.slice(0, 100), x: clamp(point.x), z: clamp(point.z) })),
      ...semanticFields,
    };
    res.json({ mission, source: 'gemini' });
  } catch (err: any) {
    console.warn('[Gemini Mission Generator Fallback]', err?.message || 'unknown error');
    res.json({ mission: fallback, source: 'fallback' });
  }
});

// 1d. Gemini API route for speech-to-text audio transcription using gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      res.status(400).json({ error: 'Missing audioData payload' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    // Clean base64 header if present
    const base64Clean = audioData.replace(/^data:audio\/\w+;base64,/, '').replace(/^data:[^;]+;base64,/, '');

    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0] || 'audio/webm',
        data: base64Clean,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: 'Transkribuj ovaj audio snimak tačno od reči do reči na srpskom jeziku (ili jeziku govornika). Nemoj dodavati uvod niti zaključak, samo čist transkript.' },
        ],
      },
    });

    const transcribedText = response.text?.trim() || '';
    res.json({ text: transcribedText });
  } catch (err: any) {
    console.error('[Gemini Transcribe Error]', err);
    res.status(500).json({
      error: err.message || 'Greška pri transkripciji glasa',
      text: '',
    });
  }
});

// 1e. Gemini API route for smartphone SMS interactions
app.post('/api/gemini/sms-reply', async (req, res) => {
  try {
    const { contactId = 'sale', message = '', history = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    const characterDirectives: Record<string, string> = {
      sale: `Ti si Sale sa Tabačke Čaršije u Požarevcu, odan ulični brat igrača (Malog Bandita). Žargon: 'rođo brate', 'kružni tok', 'crno tržište', 'keš', 'reoni'. Odgovaraj kratko (1-2 rečenice) kao SMS poruka, energično i ulično.`,
      maja: `Ti si Maja iz Požarevca, devojka Malog Bandita, pametna i privržena, viđate se u Gradskom Parku i na Čačalici. Brineš za njega kad vozi brzo ili ga juri murija. Odgovaraj kratko (1-2 rečenice) kao SMS poruka, sa emocijom i ponekim emodžijem.`,
      murija: `Ti si inspektor MUP-a Požarevac. Hladan, preteći policajac koji upozorava na prekršaje, kamere i poternicu od 3 zvezdice. Odgovaraj kratko (1-2 rečenice) kao zvanična ili preteća policijska SMS poruka.`,
      yashime: `Ti si Yashime, vrhovni arhitekta Konglomerat Preduzeća™, XP master i legenda Požarevca. Tvoj stil je 2Pac Thug Life, 'Full Power', 'Word', 'rodjo brate', 'ro bro', 'gospodine Yashem ti na tuki'. Odgovaraj kratko (1-2 rečenice) kao moćan mentorski SMS.`,
    };

    const directive = characterDirectives[contactId] || characterDirectives.sale;
    const recentHistory = (history || [])
      .slice(-4)
      .map((h: any) => `${h.from === 'me' ? 'Igrač' : 'Ti'}: ${h.text}`)
      .join('\n');

    const prompt = `${directive}

Prethodna konverzacija:
${recentHistory}

Igrač ti šalje SMS: "${message}"

Napiši tvoj direktan SMS odgovor (maksimalno 25 reči, bez meta-teksta, samo čista poruka):`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const replyText = response.text?.trim() || 'Primljeno ro bro, na vezi smo! Full Power!';
    res.json({ reply: replyText });
  } catch (err: any) {
    console.warn('[Gemini SMS Reply Error]', err);
    // Authentic fallback responses per contact
    const fallbacks: Record<string, string> = {
      sale: 'Vidim rođo brate! Čekam te kod Tabačke, pazi na patrole!',
      maja: 'Čuvaj se lepi moj, javi mi se čim završiš poslove! 💕',
      murija: 'Zabeleženo u bazi MUP Požarevac. Pratimo tvoje kretanje.',
      yashime: 'Full Power, bratina! Konglomerat se širi. Word, ro bro!',
    };
    const replyText = fallbacks[req.body.contactId] || fallbacks.sale;
    res.json({ reply: replyText });
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
    if (!isValidVideoOperationName(operationName)) {
      res.status(400).json({ error: { message: 'Invalid generated-video operation name.' } });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

    const updated: any = await ai.operations.getVideosOperation({
      operation: { name: operationName } as any,
    });

    res.json({ done: !!updated.done, error: updated.error || null });
  } catch (err: any) {
    console.error('[Veo Status Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Veo Video Download Proxy
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!isValidVideoOperationName(operationName)) {
      res.status(400).json({ error: 'A valid generated-video operation name is required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
    const updated: any = await ai.operations.getVideosOperation({
      operation: { name: operationName } as any,
    });
    const downloadUri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!isAllowedGoogleVideoUri(downloadUri)) {
      res.status(404).json({ error: 'No downloadable video was returned by the generation service.' });
      return;
    }

    const videoRes = await fetch(downloadUri, {
      headers: { 'x-goog-api-key': apiKey || '' },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });

    if (!videoRes.ok) {
      res.status(502).json({ error: 'The generation service could not provide the video.' });
      return;
    }

    const body = await readResponseBodyLimited(videoRes);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', String(body.byteLength));
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(Buffer.from(body));
  } catch (err: any) {
    console.error('[Veo Download Error]', err?.message || 'Unknown error');
    if (!res.headersSent) {
      res.status(502).json({ error: 'Generated video download failed or exceeded the size limit.' });
    } else {
      res.destroy();
    }
  }
});

const serveIntroVideo: express.RequestHandler = (req, res, next) => {
  const videoPath = path.resolve(process.cwd(), 'public/videos/GameIntro_Pozarevac_ThugLife.mp4');
  void fs.stat(videoPath).then((file) => {
    if (!file.isFile()) {
      next();
      return;
    }

    const range = parseSingleByteRange(req.headers.range, file.size);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (range.kind === 'unsatisfiable') {
      res.status(416).setHeader('Content-Range', `bytes */${file.size}`).setHeader('Content-Length', '0').end();
      return;
    }

    const start = range.kind === 'partial' ? range.start : 0;
    const end = range.kind === 'partial' ? range.end : file.size - 1;
    if (range.kind === 'partial') {
      res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${file.size}`);
    }
    res.setHeader('Content-Length', String(Math.max(0, end - start + 1)));

    if (req.method === 'HEAD' || file.size === 0) {
      res.end();
      return;
    }

    const stream = createReadStream(videoPath, { start, end });
    stream.on('error', (error) => {
      if (res.headersSent) res.destroy(error);
      else res.status(500).end();
    });
    stream.pipe(res);
  }).catch(next);
};

app.get('/videos/GameIntro_Pozarevac_ThugLife.mp4', serveIntroVideo);

// Serve static frontend files
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`[AiChatBratina v10.0] Server running on port ${port} - Full Power!`);
});
