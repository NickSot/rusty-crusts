const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';
const ytdl = require('ytdl-core');
var getYoutubeTitle = require('get-youtube-title');
var getYouTubeID = require('get-youtube-id');

async function createPlaylist(user, name, songs){
    let db = await new MongoClient(url, { useUnifiedTopology: true }).connect();
    db = db.db('rusty_crusts');

    if (await db.collection('playlists').findOne({
        user: user,
        name: name
    })){
        return;
    }
    
    db.collection('playlists').insertOne({
        user: user,
        name: name,
        urls: songs,
        songs: songs.map(x => ytdl(x, {type: 'opus', highWaterMark: 1024 * 1024 * 32})),
    }, (error, result) => {
        if (error)
            throw error;
    });
}

async function addPlaylistToQueue(user, name, queue){
    let db = await new MongoClient(url, { useUnifiedTopology: true }).connect();
    db = db.db('rusty_crusts');
    
    let playlist = await getPlaylists(user, name);
    songs = playlist.songs;
    let urls = playlist.urls;

    /*for (let url of songs){
        let song = ytdl(url, {type: 'opus', highWaterMark: 1024 * 1024 * 32});

        await getYoutubeTitle(getYouTubeID(url), async (err, title) => {
            await queue.unshift([title, song]);
        });

        console.log(queue.length);
    }*/

    for (let i = 0; i < songs.length; i++) {
        queue.unshift([urls[i], songs[i]]);
    }
}

async function getPlaylists(user, name=null){
    let db = await new MongoClient(url, { useUnifiedTopology: true }).connect();
    db = db.db('rusty_crusts');

    let playlist;

    if (!name){
        playlists = await db.collection("playlists").find({
            user: user
        }).toArray();
    }
    else{
        playlists = await db.collection("playlists").findOne({
            user: user,
            name: name
        });
    }

    return playlists;
}

module.exports = { createPlaylist, addPlaylistToQueue, getPlaylists }