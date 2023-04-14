import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const PORT = 5000;
const app = express();
app.use(express.json());
app.use(cors());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
// CORS

const BASE_API = 'https://api.genius.com';
const ACCESS_TOKEN = 'Q03kqOk50nxxzIbhNs80rsfPczOjtH1r9oVZzeTR2aBe_8U8OHyM8AQWkjUpvexP';
const config = {
    headers: {Authorization: `bearer ${ACCESS_TOKEN}`}
}
// ВСЁ ДЛЯ АПИ

app.listen(PORT, () => console.log('listening on port ' + PORT));

let text;
let perPage;
let sort;

app.get('/', async (req, res) => {
    try {
        text = req.query.text;
        perPage = req.query.perPage;
        sort = req.query.sort;
        const lyrics = await getLyrics();
        res.status(200).json(lyrics);
    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong');
    }
});
  
async function getArtistId() {
    let searchText = text;
    try {
        const response = await axios.get(`${BASE_API}/search?q=${searchText}&access_token=${ACCESS_TOKEN}`);
        for (let i of response.data.response.hits) {
        if (i.result.primary_artist.name.toLowerCase().replace(text.toLowerCase(), '').indexOf('&') < 0 && i.result.primary_artist.name.toLowerCase().includes(text.toLowerCase())) {
            return i.result.primary_artist.id;
        } 
        }
    } catch (err) {
        console.log(err);
    }
}

async function getAllSongs() {
    const id = await getArtistId();
    try {
        if (perPage == 0) {
            let i = 1
            let response = await axios.get(`${BASE_API}/artists/${id}/songs?per_page=50&sort=${sort}&page=${i}&access_token=${ACCESS_TOKEN}`);
            let allSongs = [];
            while (response.data.response.next_page !== null) {
                response = await axios.get(`${BASE_API}/artists/${id}/songs?per_page=50&sort=${sort}&page=${i}&access_token=${ACCESS_TOKEN}`);
                allSongs = allSongs.concat(response.data.response.songs);
                i++;
            }
            allSongs = allSongs.filter((song) => song.artist_names.toLowerCase().includes(text.toLowerCase()));
            return allSongs;
            
        } else {
            const response = await axios.get(`${BASE_API}/artists/${id}/songs?per_page=${perPage}&sort=${sort}&page=1&access_token=${ACCESS_TOKEN}`);
            const allSongs = response.data.response.songs.filter((song) => song.artist_names.toLowerCase().includes(text.toLowerCase()));
            return allSongs;
        }
    } catch(err) {
        console.log(err);
        return [];
    }
}

async function getRandomPickedSong() {
    const allSongs = await getAllSongs();
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    const randomSong = allSongs[randomIndex];
    return randomSong;
}

async function getLyrics() {
    const song = await getRandomPickedSong();
    try {
        const response = await axios.get(song.url);
        const $ = cheerio.load(response.data);
        let lyrics = $('.Lyrics__Container-sc-1ynbvzw-5').text();
        if (lyrics.match(/[-—][А-ЯA-Z]/gm, '\n')) {
            for (let i of lyrics.match(/[-—][А-ЯA-Z]/gm, '\n')) {
                lyrics = lyrics.replace(i, `${i[0]}\n${i[1]}`);
            }
        }
        lyrics = lyrics.replace(/[\.]/gm, ' ');
        lyrics = lyrics.replace(/\s{3}/gm, '\n');
        lyrics = lyrics.replace(/[,—(–:"«»]/gm, '');
        lyrics = lyrics.replace(/[-]/gm, ' ');
        lyrics = lyrics.replace(/[!?)\…]/gm, '\n');
        lyrics = lyrics.replace(/[{]/gm, '[');
        lyrics = lyrics.replace(/[}]/gm, ']');
        const regex = /[a-zа-я\]][\[A-ZА-Я]/gm;

        for (let i of lyrics.match(regex)) {
            lyrics = lyrics.replace(i, `${i[0]}\n${i[1]}`);
        }
        if (lyrics.match(/[a-zа-яА-ЯA-Z][\[+]/gm)) {
            for (let i of lyrics.match(/[a-zа-яА-ЯA-Z][\[+]/gm)) {
                lyrics = lyrics.replace(i, `${i[0]}\n${i[1]}`);
            }
        }
        if (lyrics.match(/[ё][\[А-ЯA-Z]/g)) {
            for (let i of lyrics.match(/[ё][\[А-ЯA-Z]/g)) {
                lyrics = lyrics.replace(i, `${i[0]}\n${i[1]}`);
            }
        }
        while (lyrics.match(/\s{2,}/gm)) {
            lyrics = lyrics.replace(/\s{2,}/gm, ' ');
        }
        lyrics = lyrics.split('\n');
        lyrics = lyrics.map(item => item.trim());
        for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].includes('[') && lyrics[i].includes(']')) {
                continue;
            } else {
                lyrics[i] = lyrics[i].split(' ');
            }
        }

        let lyricsResponse = {
            author: song.primary_artist.name,
            title: song.title,
            lyrics: lyrics,
            image: song.header_image_url,
            url: song.url
        }

        // console.log(song)

        return lyricsResponse;
    } catch (err) {
        console.log(err);
    }
}










  




