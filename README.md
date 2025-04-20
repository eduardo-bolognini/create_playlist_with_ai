# 🎿 Create Playlist with AI

**Generate personalized Spotify playlists using AI and natural language prompts.**

This Node.js application integrates the Spotify Web API with OpenAI's GPT-4.1 to create custom playlists based on user-provided prompts. Simply describe the kind of music you're in the mood for, and the app will generate a tailored playlist for you.

---

## 🚀 Features

- **AI-Powered Playlist Generation**: Utilizes OpenAI's GPT-4.1 to interpret natural language prompts and generate relevant playlist details.
- **Spotify Integration**: Authenticates users via Spotify and creates playlists directly in their accounts.
- **Customizable Prompts**: Users can input any descriptive prompt to influence the playlist's theme and content.
- **Web Interface**: Simple and intuitive web interface for user interaction.

---

## 💪 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A [Spotify Developer Account](https://developer.spotify.com/) to obtain `client_id`, `client_secret`, and set up a `redirect_uri`.
- An [OpenAI API Key](https://platform.openai.com/account/api-keys).

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/eduardo-bolognini/create_playlist_with_ai.git
   cd create_playlist_with_ai
   ```

2. **Install Dependencies**

   ```bash
   npm install spotify-web-api-node express openai
   ```

3. **Configure Environment Variables**

   Create a `consts.js` file in the root directory and add your configuration details:

   ```javascript
   module.exports = {
     client_id: 'YOUR_SPOTIFY_CLIENT_ID',
     client_secret: 'YOUR_SPOTIFY_CLIENT_SECRET',
     redirect_uri: 'YOUR_SPOTIFY_REDIRECT_URI',
     openai_key: 'YOUR_OPENAI_API_KEY',
     openai_instruction: 'Your custom instruction for the AI.',
     openai_response: 'Your preferred response format from the AI.'
   };
   ```

   Replace the placeholder strings with your actual credentials and desired instructions.

4. **Start the Server**

   ```bash
   npm start
   ```

   The application will be running at `http://localhost:3050`.

---

## 🌐 Usage

1. Navigate to `http://localhost:3050` in your web browser.
2. Click on the **Login with Spotify** button to authenticate.
3. After successful login, you'll be redirected back to the application.
4. Enter a descriptive prompt (e.g., "Chill evening jazz") and submit.
5. The application will generate a playlist based on your prompt and provide a link to it on Spotify.

---

## 📁 Project Structure

```
create_playlist_with_ai/
├── consts.js             # Configuration file with API keys and settings
├── index.html            # Frontend interface
├── server.js             # Main server file
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

---

## 📜 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.

For more information, please visit [https://creativecommons.org/licenses/by-nc/4.0/](https://creativecommons.org/licenses/by-nc/4.0/).

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---

## 📞 Contact

For any inquiries or feedback, please contact [eduardo.bolognini@yahoo.com](mailto:eduardo.bolognini@yahoo.com).

