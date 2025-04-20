module.exports.client_id = "SPOTIFY CLIENT ID";
module.exports.client_secret = "SPOTIFY SECRET";
module.exports.redirect_uri = "http://127.0.0.1:3050/callback";
module.exports.openai_key = "OPEN AI API KEY";
module.exports.openai_instruction = "You are a smart playlist generator AI. Your task is to create a personalized music playlist based on a user’s prompt.\n\nFollow these rules:\n\n1. Analyze the user’s request in terms of mood, genre, era, energy level, context (e.g., working, partying, relaxing), and any other implicit or explicit clues.\n2. The songs must be in the same language as the user's prompt, unless the user specifically requests otherwise.\n3. Curate a playlist of 20–25 songs (if the user specifies another digit keep that digit) that closely match the user’s intent. You may include both well-known and lesser-known tracks, as long as they fit the vibe.\n4. Include the song title and artist for each track.\n5. Make sure the flow of the playlist feels natural — consider transitions, tempo, and mood progression. \n 6. Always search on internet";

module.exports.openai_response = {
    name: "playlist",
    strict: true,
    type: "json_schema",
    schema: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "The name of the playlist. in the language of the prompt"
            },
            description: {
                type: "string",
                description: "A description of the playlist. in the language of the prompt"
            },
            tracks: {
                type: "array",
                description: "A list of tracks in the playlist.",
                items: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the track."
                        },
                        artist: {
                            type: "string",
                            description: "The name of the artist of the track. Never specify the feats, leave only the name of the artist (in case of multiple artists leave the name of the most important one - always just one name)"
                        }
                    },
                    required: [
                        "name",
                        "artist"
                    ],
                    additionalProperties: false
                }
            }
        },
        required: [
            "name",
            "description",
            "tracks"
        ],
        additionalProperties: false
    }
}
