const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const url = JSON.parse(fs.readFileSync('./token.json')).connection_string;
//const url = 'mongodb://localhost:27017/';
const ytdl = require('ytdl-core');
var getYoutubeTitle = require('get-youtube-title');
var getYouTubeID = require('get-youtube-id');

async function createPlaylist(user, name, songs){
    let db = await new MongoClient(url, { useUnifiedTopology: true }).connect();
    db = db.db('rusty_crusts');

    if (await getPlaylists(user, name)){
        return;
    }
    
    db.collection('playlists').insertOne({
        user: user,
        name: name,
        songs: songs
    }, (error) => {
        if (error)
            throw error;
    });
}

async function addPlaylistToQueue(user, name, queue){
    let db = await new MongoClient(url, { useUnifiedTopology: true }).connect();
    db = db.db('rusty_crusts');
    
    let playlist = await getPlaylists(user, name);

    if (!playlist){
        return
    }

    songs = playlist.songs;

    let streams = []

    for (let i = 0; i < songs.length; i++) {
        let stream = await ytdl(songs[i], {type: 'opus', highWaterMark: 1024 * 1024 * 256});
        streams.push(stream);
        queue.unshift([songs[i], stream, user, name]);
    }

    await db.collection('playlists').updateOne({user: user, name: name}, {$set: {streams: streams}});
}

async function getPlaylists(user, name=null){
    let db = await new MongoClient(url, { useUnifiedTopology: true }).connect();
    db = db.db('rusty_crusts');

    let playlists;

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

async function deletePlaylists(user, names=null){
    let db = await new MongoClient(url, {useUnifiedTopology: true}).connect();
    db = db.db('rusty_crusts');

    if (!getPlaylists(user, names)){
        return;
    }

    if (!names){
        await db.collection('playlists').deleteMany({user: user});
    }
    else{
        for (let i = 0; i < names.length; i++){
            await db.collection('playlists').deleteOne({user: user, name: names[i]});
        }
    }
}

module.exports = { createPlaylist, addPlaylistToQueue, getPlaylists, deletePlaylists }