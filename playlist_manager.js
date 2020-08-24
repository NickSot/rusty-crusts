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
        songs: songs
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

    let streams = []

    for (let i = 0; i < songs.length; i++) {
        let stream = await ytdl(songs[i], {type: 'opus', highWaterMark: 1024 * 1024 * 32});
        streams.push(stream);
        queue.unshift([songs[i], stream]);
    }

    await db.collection('playlists').updateOne({user: user, name: name}, {$set: {streams: streams}});
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