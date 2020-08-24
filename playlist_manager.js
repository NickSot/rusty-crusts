const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/rusty_crusts';
const ytdl = require('ytdl-core');

var db = await MongoClient.connect(url).db();
db.close();

async function createPlaylist(user, name, songs){
    await db.open();

    if (db.collection('playlists').find({
        user: user,
        name: name
    }).first()){
        return;
    }
    
    db.collection('playlists').insertOne({
        user: user,
        name: name,
        songs: songs
    }, (error, result) => {
        db.close();
        if (result){
            console.log(result);
        }
    });
}

async function addPlaylistToQueue(user, name, queue){
    await db.open();
    
    let songs = db.collection('playlists').find({
        user: user,
        name: name
    }).first().songs;
    
    db.close();

    for (let url of songs){
        let song = await ytdl(song, {type: 'opus', highWaterMark: 1024 * 1024 * 32});
        
        getYoutubeTitle(getYouTubeID(url), (err, title) => {
            queue.unshift([title, song]);
        });
    }
}

async function getPlaylists(user, name=null){
    db.open();

    let playlist;

    if (!name){
        playlists = await db.collection("playlists").find({
            user: user
        }).toArray();
    }
    else{
        playlists = await db.collection("playlists").find({
            user: user,
            name: name
        }).first();
    }

    return playlists;
}

export { createPlaylist, addPlaylistToQueue, getPlaylists }