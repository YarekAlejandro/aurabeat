import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- SPOTIFY OAUTH FLOW (kept for authentication only) ---
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Serve compiled React files
app.use(express.static(path.join(__dirname, 'dist')));

const getDynamicRedirectUri = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/auth/spotify/callback`;
};

app.get('/auth/spotify', (req, res) => {
  const scope = 'user-top-read user-read-private user-read-email';
  const dynamicRedirectUri = getDynamicRedirectUri(req);
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(dynamicRedirectUri)}`;
  res.redirect(authUrl);
});

app.get('/auth/spotify/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.redirect(`/?error=spotify_auth_failed`);
  try {
    const dynamicRedirectUri = getDynamicRedirectUri(req);
    const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${authHeader}` },
      body: new URLSearchParams({ code: code.toString(), redirect_uri: dynamicRedirectUri, grant_type: 'authorization_code' })
    });
    const data = await response.json();
    if (data.access_token) {
      res.redirect(`/?spotifyToken=${data.access_token}`);
    } else {
      res.redirect(`/?error=spotify_token_failed`);
    }
  } catch (error) {
    console.error('Spotify Auth Error:', error);
    res.redirect(`/?error=spotify_server_error`);
  }
});

// --- HELPER: iTunes Search API ---
async function searchItunes(query, limit = 10) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}&country=US`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).filter(t => t.previewUrl).map(t => ({
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName,
    artwork: t.artworkUrl100?.replace('100x100', '300x300') || '',
    previewUrl: t.previewUrl,
    duration: `${Math.floor(t.trackTimeMillis / 60000)}:${String(Math.floor((t.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
  }));
}

// --- HELPER: Calendar Context ---
const getSimulatedContext = () => {
  const hour = new Date().getHours();
  let timeContext = hour >= 6 && hour < 12 ? "Mañana productiva" : hour < 18 ? "Tarde de enfoque" : "Noche de relajación";
  return { reuniones: hour < 18 ? 2 : 0, urgencia: hour < 12 ? "alta" : "baja", tareas_pendientes: hour < 15 ? 4 : 1, momento_dia: timeContext };
};

// ENDPOINT: Spotify Profile (still used for user name/avatar)
app.get('/api/spotify/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    const response = await fetch('https://api.spotify.com/v1/me', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) return res.json({ success: false });
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching profile' });
  }
});

// ENDPOINT: Library - Top tracks from iTunes based on saved genres
app.get('/api/library', async (req, res) => {
  try {
    const genreQuery = req.query.genres || 'pop hits 2024';
    const tracks = await searchItunes(genreQuery, 20);
    res.json({ success: true, tracks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching library' });
  }
});

// ENDPOINT: Discover - Gemini picks genres then iTunes fetches tracks
app.get('/api/discover', async (req, res) => {
  try {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const savedGenres = req.query.genres || '';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Step 1: Gemini picks search queries for iTunes
    const genrePrompt = `You are a music curator. It is ${timeOfDay}. The user's favorite genres are: "${savedGenres || 'pop, electronic, indie'}". 
Suggest 3 specific iTunes search queries (artist name or song style) that would match the vibe. 
Return ONLY a JSON array of strings: ["query1", "query2", "query3"]`;

    const genreResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: genrePrompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    let queries = ['indie electronic', 'chill pop hits', 'ambient focus'];
    try {
      let raw = genreResult.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
      queries = JSON.parse(raw);
    } catch (e) {}

    // Step 2: Fetch tracks from iTunes for each query
    const results = await Promise.all(queries.map(q => searchItunes(q, 4)));
    const tracks = results.flat().filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i).slice(0, 12);

    // Step 3: Gemini writes a poetic description
    let aiDescription = `Frecuencias curadas para tu ${timeOfDay === 'morning' ? 'mañana' : timeOfDay === 'afternoon' ? 'tarde' : 'noche'}.`;
    try {
      const descResult = await model.generateContent(
        `Escribe 1 frase poética y corta (máx 15 palabras) en español para presentar este set musical de ${timeOfDay}. Solo la frase, sin comillas.`
      );
      aiDescription = descResult.response.text().trim();
    } catch (e) {}

    res.json({ success: true, tracks, aiDescription });
  } catch (error) {
    console.error('Discover Error:', error);
    res.status(500).json({ success: false, error: 'Error en descubrimiento' });
  }
});

// ENDPOINT: Profile Analysis (Gemini only, no Spotify dependency)
app.get('/api/spotify/profile-analysis', async (req, res) => {
  try {
    const savedGenres = req.query.genres || '';
    const token = req.headers.authorization?.split(' ')[1];
    let artistContext = '';

    // Try to get Spotify artists (optional enhancement)
    if (token) {
      try {
        const topRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', { headers: { 'Authorization': `Bearer ${token}` } });
        if (topRes.ok) {
          const topData = await topRes.json();
          if (topData.items?.length > 0) {
            artistContext = `artistas favoritos: ${topData.items.map(a => a.name).join(', ')}`;
          }
        }
      } catch (e) {}
    }

    const context = artistContext || `géneros favoritos: ${savedGenres || 'música variada'}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Actúa como un psicoanalista musical experto. El usuario escucha principalmente ${context}.
Redacta 4 "Tarjetas de Curiosidades Musicales" describiendo su personalidad musical.
Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
[
  { "title": "Tu Vibra Principal", "emoji": "🎵", "desc": "Descripción corta y poética de tu vibra." },
  { "title": "El Patrón Oculto", "emoji": "🔮", "desc": "Una curiosidad sobre por qué escuchas esos géneros." },
  { "title": "Tu Escenario Ideal", "emoji": "🌙", "desc": "El lugar o momento perfecto para tu banda sonora." },
  { "title": "Tu Alter Ego Musical", "emoji": "⚡", "desc": "Qué tipo de artista serías si pudieras." }
]`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    let rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    const cards = JSON.parse(rawText);
    const topGenres = savedGenres ? savedGenres.split(',').map(g => g.trim()).filter(Boolean) : [];

    res.json({ success: true, cards, topGenres });
  } catch (error) {
    console.error('Profile Analysis Error:', error);
    res.json({
      success: true,
      cards: [
        { title: "Vibra Única", emoji: "🎵", desc: "Tu gusto musical refleja una personalidad profunda y auténtica." },
        { title: "Explorador Sonoro", emoji: "🔮", desc: "Buscas constantemente nuevas experiencias auditivas." }
      ],
      topGenres: []
    });
  }
});

// ENDPOINT 1: Generate Check-in Questions
app.get('/api/generate-questions', async (req, res) => {
  try {
    const userContext = getSimulatedContext();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const systemPrompt = `Eres un asistente empático de productividad y bienestar. Haz 3 preguntas cortas de opción múltiple al usuario para inferir su estado de ánimo (valencia y energía) basándote en su contexto actual.`;
    const userPrompt = `Contexto: ${JSON.stringify(userContext)}\nDevuelve ÚNICAMENTE un JSON: {"questions": [{"id": "q1", "text": "?", "options": ["Op1", "Op2", "Op3"]}]}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: 'application/json' }
    });

    let rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(rawText);
    res.json({ success: true, data: data.questions || data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al generar preguntas.' });
  }
});

// ENDPOINT 2: Recommend Playlist (Gemini picks songs, iTunes provides audio)
app.post('/api/recommend', async (req, res) => {
  console.log('--- Nueva solicitud de Playlist Mágica ---');
  try {
    const { answers, spotifyToken, selectedGenres, profileAnalysis } = req.body;
    const userContext = getSimulatedContext();

    // Optional: try to get Spotify top artists for extra context
    let spotifyContextText = '';
    if (spotifyToken) {
      try {
        const topArtRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        if (topArtRes.ok) {
          const topArtData = await topArtRes.json();
          if (topArtData.items?.length > 0) {
            spotifyContextText = `\nArtistas favoritos del usuario: ${topArtData.items.map(a => a.name).join(', ')}`;
          }
        }
      } catch (e) {}
    } else if (selectedGenres?.length > 0) {
      spotifyContextText = `\nGéneros preferidos: ${selectedGenres.join(', ')}`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const systemPrompt = `Eres un curador musical experto. Infieres el estado emocional del usuario y recomiendas 5 canciones REALES que existan en iTunes/Apple Music. Devuelve canciones populares y conocidas que seguramente existan.`;
    const userPrompt = `
      Contexto del momento: ${JSON.stringify(userContext)}
      Respuestas del Check-in: ${JSON.stringify(answers)}
      ${spotifyContextText}
      ${profileAnalysis ? `\nPerfil Musical del usuario: "${profileAnalysis}"` : ''}
      
      Devuelve ÚNICAMENTE un JSON con este formato exacto:
      {
        "inferred_state": { "valence": 0.5, "energy": 0.8 },
        "playlist": [
          {"title": "Nombre Real de Canción", "artist": "Nombre Real de Artista", "genre": "Género", "duration": "03:45", "reason": "Razón"}
        ]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: 'application/json' }
    });

    let rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    const playlistData = JSON.parse(rawText);

    // Search iTunes for each track to get real preview URLs
    if (playlistData.playlist) {
      const enrichedTracks = await Promise.all(
        playlistData.playlist.map(async (track, i) => {
          const query = `${track.artist} ${track.title}`;
          const itunesResults = await searchItunes(query, 3);
          const match = itunesResults[0];
          return {
            ...track,
            id: match ? match.id : `gemini-${i}`,
            artwork: match?.artwork || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=300&h=300&fit=crop',
            previewUrl: match?.previewUrl || null,
            duration: match?.duration || track.duration || '3:30'
          };
        })
      );
      playlistData.playlist = enrichedTracks;
    }

    console.log('Playlist generada con éxito:', playlistData.playlist?.length, 'canciones');
    res.json({ success: true, data: playlistData });

  } catch (error) {
    console.error('Error in /api/recommend:', error);
    res.status(500).json({ success: false, error: 'Hubo un error con Gemini.' });
  }
});

// Catch-all route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🎧 AuraBeat Backend corriendo en puerto ${PORT}`));
