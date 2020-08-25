const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
var ytStream = require('youtube-audio-stream');
var getYoutubeTitle = require('get-youtube-title');
var getYouTubeID = require('get-youtube-id');
var fs = require('fs');
var addPlaylistToQueue = require('./playlist_manager').addPlaylistToQueue;
var createPlaylist = require('./playlist_manager').createPlaylist;
var getPlaylists = require('./playlist_manager').getPlaylists;

var queue = [];

var dispatcher;
var connection;

const token = JSON.parse(fs.readFileSync('./token.json')).token;

client.on('ready', async () => {
    console.log('Bot is ready to go to Ram Ranch\'s house...');
    let channel = client.channels.cache.get('746057842531893268');
    connection = await channel.join();
});

function handle_queue(){
    if (queue.length == 0){
        return;
    }

    let broadcast = client.voice.createBroadcast();
    console.log(Object.values(queue[queue.length - 1])[1]);
    let broadcastDispatcher = broadcast.play(Object.values(queue[queue.length - 1])[1]);
    dispatcher = connection.play(broadcast);

    let titles = queue.map(x => x[0])
    console.log(titles.join(', '));

    let channel = client.channels.cache.get('746057842032640024');
    channel.send(`Queue: {${titles.join(', ')}}`);

    broadcastDispatcher.on('finish', () => {
        queue.pop();
        dispatcher.destroy();
        handle_queue();
    });
}

client.on('message', async (msg) => {
    let message = msg.content;

    if (message.match(/^!playlist\s\w+\s/g)){
        songs = message.split(/^!playlist\s\w+\s/g)[1].split(',').map(x => x.trim());

        createPlaylist(msg.member.displayName, message.split(' ')[1], songs);
    }

    if (message.match(/^!play /g)){
        let url = message.split(/^!play /g)[1];

        if (url.match(/^https:/g)){
            let song = await ytdl(url, {type: 'opus', highWaterMark: 1024 * 1024 * 32});
            console.log('HERE');

            getYoutubeTitle(getYouTubeID(url), (err, title) => {
                queue.unshift([title, song]);

                let titles = queue.map(x => x[0])
                let channel = client.channels.cache.get('746057842032640024');
                channel.send(`Queue: {${titles.join(', ')}}`);

                if (song == Object.values(queue[queue.length - 1])[1])
                    handle_queue();
            });
        }else{
            await addPlaylistToQueue(msg.member.displayName, message.split(' ')[1], queue);

            let titles = queue.map(x => x[0]);
            let channel = client.channels.cache.get('746057842032640024');
            channel.send(`Queue: {${titles.join(', ')}}`);

            let playlist = await getPlaylists(msg.member.displayName, message.split(' ')[1]);

            //if (playlist['songs'][0] === Object.values(queue[queue.length - 1])[1])
                    handle_queue();
        }
    }
});

client.login(token);