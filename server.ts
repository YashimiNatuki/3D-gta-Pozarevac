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
