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
var getSongs = require('./playlist_manager').getSongs;
var voiceChannelId = '746057842531893268';
var textChannelId = '749343170093121626';

var queue = [];

var dispatcher;
var connection;

const token = JSON.parse(fs.readFileSync('./token.json')).token;

client.on('ready', async () => {
    console.log('Bot is ready to go to Ram Ranch\'s house...');
    let channel = client.channels.cache.get(voiceChannelId);
    connection = await channel.join();
});

function handle_queue(){
    if (queue.length == 0){
        return;
    }

    let broadcast = client.voice.createBroadcast();
    let broadcastDispatcher = broadcast.play(Object.values(queue[queue.length - 1])[1]);
    dispatcher = connection.play(broadcast);

    let titles = queue.map(x => x[0])
    console.log(titles.join(', '));

    let channel = client.channels.cache.get(textChannelId);
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
            let song = await ytdl(url, {type: 'opus', highWaterMark: 1024 * 1024 * 128});

            getYoutubeTitle(getYouTubeID(url), (err, title) => {
                queue.unshift([title, song, msg.member.displayName]);

                let titles = queue.map(x => x[0])
                let channel = client.channels.cache.get(textChannelId);
                channel.send(`Queue: {${titles.join(', ')}}`);

                if (song == Object.values(queue[queue.length - 1])[1] &&
                    Object.values(queue[queue.length - 1])[2] === msg.member.displayName)
                    handle_queue();
            });
        }else{
            await addPlaylistToQueue(msg.member.displayName, message.split(' ')[1], queue);
            let playlist = await getPlaylists(msg.member.displayName, message.split(' ')[1]);

            if (!playlist){
                let channel = client.channels.cache.get(textChannelId);
                channel.send("There is no such playlist in your shit!")
                return
            }

            let titles = queue.map(x => x[0]);
            let channel = client.channels.cache.get(textChannelId);
            channel.send(`Queue: {${titles.join(', ')}}`);            

            if (playlist['songs'][0] == Object.values(queue[queue.length - 1])[0] &&
                msg.member.displayName == Object.values(queue[queue.length - 1])[2])
                 handle_queue();
        }
    }
});

client.login(token);