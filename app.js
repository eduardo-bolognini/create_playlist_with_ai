require('dotenv').config();

const path = require('path');
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { client_id, client_secret, redirect_uri, openai_key, admin_password } = process.env;  
const { openai_instruction, openai_response } = require('./consts');  
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: openai_key });
const fs = require('fs');
const DB_PATH = path.join(__dirname, 'user_usage.json');

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({
    usageLog: {},
    privilegedUsers: []
  }));
}

function readDb() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function canUseServiceToday(userId) {
  const db = readDb();
  
  if (db.privilegedUsers.includes(userId)) {
    return true;
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  if (!db.usageLog[userId]) {
    db.usageLog[userId] = { lastUsed: today, count: 1 };
    writeDb(db);
    return true;
  }
  
  if (db.usageLog[userId].lastUsed === today && db.usageLog[userId].count >= 1) {
    return false;
  }
  
  if (db.usageLog[userId].lastUsed !== today) {
    db.usageLog[userId].lastUsed = today;
    db.usageLog[userId].count = 1;
  } else {
    db.usageLog[userId].count += 1;
  }
  
  writeDb(db);
  return true;
}

const scopes = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email'
];

function createSpotifyClient() {
  return new SpotifyWebApi({
    redirectUri: redirect_uri,
    clientId: client_id,
    clientSecret: client_secret
  });
}

async function getSongsFromAI(prompt) {
  const response = await openai.responses.create({
    model: "gpt-4.1",
    instructions: openai_instruction,
    tools: [{ type: "web_search_preview" }],
    input: prompt,
    text: {
      format: openai_response
    }
  });
  
  const event = JSON.parse(response.output_text);
  return event;
}

async function addTracks(spotifyApi, playlistId, tracks) {
  for (const { name, artist } of tracks) {
    const res = await spotifyApi.searchTracks(`track:${name} artist:${artist}`);
    if (res.body.tracks.items.length) {
      const id = res.body.tracks.items[0].id;
      await spotifyApi.addTracksToPlaylist(playlistId, [`spotify:track:${id}`]);
    } else console.warn(`Track not found: ${name} - ${artist}`);
  }
}

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  const spotifyApi = createSpotifyClient();
  res.redirect(spotifyApi.createAuthorizeURL(scopes, 'state-token'));
});

app.get('/callback', async (req, res) => {
  const spotifyApi = createSpotifyClient();
  const { code, error } = req.query;
  if (error) return res.send(`Callback error: ${error}`);
  
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);
    
    const me = await spotifyApi.getMe();
    const userId = me.body.id;
    
    res.cookie('access_token', data.body.access_token, { httpOnly: true });
    res.cookie('refresh_token', data.body.refresh_token, { httpOnly: true });
    res.cookie('user_id', userId, { httpOnly: true });
    
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Error retrieving tokens');
  }
});

app.post('/admin/add-privileged', (req, res) => {
  const { adminPassword, userId } = req.body;
  
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || admin_password;
  
  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Password amministratore non valida' });
  }
  
  const db = readDb();
  if (!db.privilegedUsers.includes(userId)) {
    db.privilegedUsers.push(userId);
    writeDb(db);
  }
  
  res.json({ success: true, message: `Utente ${userId} aggiunto agli utenti privilegiati` });
});

app.post('/admin/check-user-usage', (req, res) => {
  const { adminPassword } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || admin_password;
  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Password amministratore non valida' });
  }
  const db = readDb();
  res.json({
    privilegedUsers: db.privilegedUsers,
    usageLog: db.usageLog
  });
});


app.post('/generate', async (req, res) => {
  const accessToken = req.cookies.access_token;
  const userId = req.cookies.user_id;
  
  if (!accessToken || !userId) {
    return res.status(401).json({ error: 'Access token o ID utente mancante. Effettua il login.' });
  }
  
  if (!canUseServiceToday(userId)) {
    return res.status(429).json({ 
      error: 'Hai raggiunto il limite di utilizzi giornalieri (1). Riprova domani.',
      isLimitReached: true
    });
  }
  
  try {
    const spotifyApi = createSpotifyClient();
    spotifyApi.setAccessToken(accessToken);
    
    const prompt = req.body.prompt;
    const aiResult = await getSongsFromAI(prompt);
    
    const playlist = await spotifyApi.createPlaylist(aiResult.name, {
      description: aiResult.description,
      public: false
    });
    
    await addTracks(spotifyApi, playlist.body.id, aiResult.tracks);
    
    res.json({ url: playlist.body.external_urls.spotify });
  } catch (err) {
    if (err.statusCode === 401 || err.message.includes('access token')) {
      return res.status(401).json({ error: 'Token scaduto o non valido. Effettua nuovamente il login.' });
    }
    console.log(err);
    res.status(500).json({ error: 'Errore interno durante la creazione della playlist.' });
  }
});

app.get('/check-usage', (req, res) => {
  const userId = req.cookies.user_id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Devi effettuare il login per verificare il tuo stato di utilizzo' });
  }
  
  const db = readDb();
  const isPrivileged = db.privilegedUsers.includes(userId);
  const usageInfo = db.usageLog[userId] || { lastUsed: null, count: 0 };
  const today = new Date().toISOString().split('T')[0];
  const canUseToday = isPrivileged || usageInfo.lastUsed !== today || usageInfo.count < 1;
  
  res.json({
    userId,
    isPrivileged,
    lastUsed: usageInfo.lastUsed,
    usageCount: usageInfo.count,
    canUseToday,
    dailyLimit: isPrivileged ? 'illimitato' : 1
  });
});

const PORT = process.env.PORT || 3050;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
