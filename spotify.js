const path = require('path');
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { client_id, client_secret, redirect_uri, openai_key,  openai_instruction, openai_response} = require('./consts');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: openai_key });

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
    return event 
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

// Middleware di autenticazione
app.use((req, res, next) => {
  const publicPaths = ['/login', '/callback'];
  if (!req.cookies.access_token && !publicPaths.includes(req.path)) {
    return res.redirect('/login');
  }
  next();
});

// Serviamo index.html dal filesystem
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
    res.cookie('access_token', data.body.access_token, { httpOnly: true });
    res.cookie('refresh_token', data.body.refresh_token, { httpOnly: true });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Error retrieving tokens');
  }
});

app.post('/generate', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const aiResult = await getSongsFromAI(prompt);
    const spotifyApi = createSpotifyClient();
    spotifyApi.setAccessToken(req.cookies.access_token);

    const playlist = await spotifyApi.createPlaylist(aiResult.name, {
      description: aiResult.description,
      public: false
    });
    await addTracks(spotifyApi, playlist.body.id, aiResult.tracks);

    res.json({ url: playlist.body.external_urls.spotify });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3050;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
