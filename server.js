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

// --- SPOTIFY OAUTH FLOW ---
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Sirve los archivos estáticos compilados de React
app.use(express.static(path.join(__dirname, 'dist')));

// Helper para obtener la URL pública dinámicamente
const getDynamicRedirectUri = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/auth/spotify/callback`;
};

app.get('/auth/spotify', (req, res) => {
  const scope = 'user-top-read playlist-modify-public playlist-modify-private';
  const dynamicRedirectUri = getDynamicRedirectUri(req);
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(dynamicRedirectUri)}`;
  res.redirect(authUrl);
});

app.get('/auth/spotify/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) {
    return res.redirect(`/?error=spotify_auth_failed`);
  }

  try {
    const dynamicRedirectUri = getDynamicRedirectUri(req);
    const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        code: code.toString(),
        redirect_uri: dynamicRedirectUri,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();
    if (data.access_token) {
      // Redirigir al frontend pasando el token
      res.redirect(`/?spotifyToken=${data.access_token}`);
    } else {
      res.redirect(`/?error=spotify_token_failed`);
    }
  } catch (error) {
    console.error('Spotify Auth Error:', error);
    res.redirect(`/?error=spotify_server_error`);
  }
});

// --- HELPER: GET USER TOP ARTISTS FROM SPOTIFY ---
async function getSpotifyTopArtists(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.items.map(artist => artist.name).join(', ');
  } catch (error) {
    console.error("Error fetching Spotify Top Artists:", error);
    return null;
  }
}

// ENDPOINT: Get Spotify Profile
app.get('/api/spotify/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching profile' });
  }
});

// ENDPOINT: Get Spotify Library (Top Tracks instead of Saved Tracks)
app.get('/api/spotify/library', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    const tracks = data.items ? data.items.map(item => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      album: item.album.name,
      artwork: item.album.images[0]?.url,
      previewUrl: item.preview_url
    })) : [];
    
    res.json({ success: true, tracks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching library' });
  }
});

// ENDPOINT: Get Spotify Discover Recommendations
app.get('/api/spotify/discover', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  
  try {
    // 1. Get Top Artists to use as seeds
    const topRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let seedArtists = '';
    let topData = { items: [] };
    
    if (topRes.ok) {
      topData = await topRes.json();
      seedArtists = topData.items ? topData.items.map(a => a.id).join(',') : '';
    }

    let recUrl = `https://api.spotify.com/v1/recommendations?limit=12`;
    if (seedArtists) {
      recUrl += `&seed_artists=${seedArtists}`;
    } else {
      // Fallback si el usuario no tiene artistas top
      recUrl += `&seed_genres=pop,dance,electronic`;
    }

    // 2. Get Recommendations
    const recRes = await fetch(recUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let recData = { tracks: [] };
    if (recRes.ok) {
      recData = await recRes.json();
    } else {
      console.error('Spotify API Error en discover (recommendations):', await recRes.text());
      // Fallback a algunas canciones de prueba si Spotify bloquea
      return res.json({
        success: true,
        tracks: [
          { id: '1', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', artwork: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=300&h=300&fit=crop', previewUrl: null },
          { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', artwork: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=300&h=300&fit=crop', previewUrl: null }
        ],
        aiDescription: "Hemos generado estas frecuencias alternas ya que tus datos profundos están protegidos temporalmente."
      });
    }

    const tracks = recData.tracks ? recData.tracks.map(item => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      album: item.album.name,
      artwork: item.album.images[0]?.url,
      previewUrl: item.preview_url
    })) : [];

    // 3. Generar una descripción curada con IA
    let aiDescription = "He explorado el algoritmo para traerte estas frecuencias que encajan con tu energía actual.";
    if (seedArtists && topData.items) {
      const topArtistNames = topData.items.map(a => a.name).join(', ');
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Actúa como un curador musical de lujo. El usuario ama a: ${topArtistNames}. Escribe 1 sola oración poética y corta (máximo 20 palabras) presentando un set de descubrimientos musicales seleccionados especialmente para él. No uses comillas.`;
        const result = await model.generateContent(prompt);
        aiDescription = result.response.text().trim();
      } catch (e) {
        console.error('Gemini error en discover:', e);
      }
    }

    res.json({ success: true, tracks, aiDescription });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching discovery' });
  }
});

// ENDPOINT: Profile Analysis (Gemini + Spotify)
app.get('/api/spotify/profile-analysis', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  
  try {
    const topRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!topRes.ok) {
      console.error('Spotify API Error en profile-analysis:', await topRes.text());
      return res.json({ 
        success: true, 
        cards: [
          { title: "Vibra Misteriosa", desc: "No pudimos acceder a tu historial profundo, pero sabemos que tienes un gusto único." },
          { title: "Cuenta Privada", desc: "Para desbloquear tu perfil, asegúrate de tener actividad reciente o permisos activos." }
        ], 
        topGenres: [] 
      });
    }
    
    const topData = await topRes.json();
    
    if (!topData.items || topData.items.length === 0) {
      return res.json({ 
        success: true, 
        cards: [{ title: "Recolectando Datos", desc: "Aún estamos recolectando datos sobre tus frecuencias sonoras. ¡Sigue escuchando música!" }], 
        topGenres: [] 
      });
    }

    const artistNames = topData.items.map(a => a.name).join(', ');
    const genresArray = [...new Set(topData.items.flatMap(a => a.genres))];
    const topGenres = genresArray.slice(0, 5);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Actúa como un psicoanalista musical experto. El usuario escucha principalmente a: ${artistNames}. Sus géneros top son: ${topGenres.join(', ')}.
Redacta 3 "Tarjetas de Curiosidades Musicales" describiendo su personalidad musical.
Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
[
  { "title": "Tu Vibra Principal", "desc": "Descripción corta y poética de tu vibra." },
  { "title": "El Patrón Oculto", "desc": "Una curiosidad sobre por qué escuchas esos géneros." },
  { "title": "Tu Escenario Ideal", "desc": "El lugar o momento perfecto para tu banda sonora." }
]`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const cards = JSON.parse(result.response.text());

    res.json({ success: true, cards, topGenres });
  } catch (error) {
    console.error('Profile Analysis Error:', error);
    res.status(500).json({ success: false, error: 'Error analizando perfil' });
  }
});

// Mock de Contexto Calendario
const getSimulatedContext = () => {
  const hour = new Date().getHours();
  let timeContext = "";
  if (hour >= 6 && hour < 12) timeContext = "Mañana productiva";
  else if (hour >= 12 && hour < 18) timeContext = "Tarde de enfoque";
  else timeContext = "Noche de relajación";
  
  return { 
    reuniones: hour < 18 ? 2 : 0, 
    urgencia: hour < 12 ? "alta" : "baja", 
    tareas_pendientes: hour < 15 ? 4 : 1, 
    momento_dia: timeContext,
  };
};

// ENDPOINT 1: Generar Preguntas
app.get('/api/generate-questions', async (req, res) => {
  try {
    const userContext = getSimulatedContext();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Eres un asistente empático de productividad y bienestar. Haz 3 preguntas cortas de opción múltiple al usuario para inferir su estado de ánimo (valencia y energía) basándote en su contexto actual.`;
    const userPrompt = `
      Contexto: ${JSON.stringify(userContext)}
      Devuelve ÚNICAMENTE un JSON: {"questions": [{"id": "q1", "text": "?", "options": ["Op1", "Op2", "Op3"]}]}
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(result.response.text());
    res.json({ success: true, data: data.questions });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al generar preguntas.' });
  }
});

// ENDPOINT 2: Recomendar Música (Con Spotify Context)
app.post('/api/recommend', async (req, res) => {
  try {
    const { answers, spotifyToken, selectedGenres, profileAnalysis } = req.body;
    const userContext = getSimulatedContext();
    
    // Si hay token de Spotify, extraer sus gustos reales y biblioteca
    let spotifyContextText = "";
    if (spotifyToken) {
      try {
        const topArtRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        if (topArtRes.ok) {
          const topArtData = await topArtRes.json();
          const topArtists = topArtData.items ? topArtData.items.map(a => a.name).join(', ') : null;
          if (topArtists) {
            spotifyContextText = `\nArtistas Reales más escuchados recientemente (¡PRIORIZA ESTE ESTILO!): ${topArtists}`;
          }
        }
        
        // Fetch some recent library tracks for extra context
        const libraryResponse = await fetch('https://api.spotify.com/v1/me/tracks?limit=5', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        if (libraryResponse.ok) {
          const libraryData = await libraryResponse.json();
          const savedTracks = libraryData.items?.map(i => i.track.name).join(', ');
          if (savedTracks) {
            spotifyContextText += `\nCanciones Guardadas Recientemente (usa el mismo vibra o estilo musical): ${savedTracks}`;
          }
        }
      } catch (e) {
        console.error('Spotify context fetch error en recommend:', e);
      }
    } else if (selectedGenres && selectedGenres.length > 0) {
      spotifyContextText = `\nGéneros Base Seleccionados manualmente: ${selectedGenres.join(', ')}`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Eres un curador musical experto. Analizas el contexto del usuario y sus gustos reales. Infieres su Valencia (-1 a 1) y Energía (-1 a 1) basándote en sus respuestas, y recomiendas 5 canciones que encajen perfectamente. SI TIENES ARTISTAS REALES, intenta sugerir canciones de esos artistas o del mismo estilo exacto.`;

    const userPrompt = `
      Contexto de calendario: ${JSON.stringify(userContext)}
      Respuestas del Check-in: ${JSON.stringify(answers)}
      ${spotifyContextText}
      ${profileAnalysis ? `\nPerfil Psicológico-Musical del usuario (Usa esto para entender su personalidad profunda y sugerir canciones curadas): \n"${profileAnalysis}"` : ''}
      
      Devuelve ÚNICAMENTE un JSON con este formato exacto:
      {
        "inferred_state": { "valence": 0.5, "energy": 0.8 },
        "playlist": [
          {"title": "Nombre", "artist": "Artista", "genre": "Género", "duration": "03:45", "reason": "Breve razón por la que encaja"}
        ]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json" }
    });

    let rawText = result.response.text();
    // Limpiar Markdown (```json ... ```) si Gemini lo incluye por error
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const playlistData = JSON.parse(rawText);

    res.json({
      success: true,
      data: playlistData
    });

  } catch (error) {
    console.error('Error in /api/recommend:', error);
    res.status(500).json({ success: false, error: 'Hubo un error con Gemini.' });
  }
});

// Catch-all route para que el enrutamiento de React funcione si se recarga la página
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🎧 AuraBeat Backend corriendo en puerto ${PORT}`));
