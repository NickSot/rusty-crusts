const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/rusty_crusts';

var db = await MongoClient.connect(url);
db.close();

async function createPlaylist(user, name, songs){
    await db.open();
    
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

    for (let song of songs) {
        queue.unshift(song);
    }
}

async function showPlaylists(user){
    db.open();

    let playlists = await db.collection("playlists").find({
        user: user
    }).toArray();

    return playlists;
}

export { createPlaylist, addPlaylistToQueue, showPlaylists }