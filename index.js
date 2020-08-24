const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
var ytStream = require('youtube-audio-stream');
var getYoutubeTitle = require('get-youtube-title');
var getYouTubeID = require('get-youtube-id');
var fs = require('fs');
import { createPlaylist, addPlaylistToQueue, getPlaylists } from './playlist_manager';

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

        createPlaylist(msg.member.nickname, message.split(' ')[1], songs);
    }

    if (message.match(/^!play /g)){
        let url = message.split(/^!play /g)[1];
        let song = await ytdl(url, {type: 'opus', highWaterMark: 1024 * 1024 * 32});

        if (url.match(/^https:\/\/\w+\\.youtube\\.com/g)){
            getYoutubeTitle(getYouTubeID(url), (err, title) => {
                queue.unshift([title, song]);

                let titles = queue.map(x => x[0])
                let channel = client.channels.cache.get('746057842032640024');
                channel.send(`Queue: {${titles.join(', ')}}`);

                if (song == Object.values(queue[queue.length - 1])[1])
                    handle_queue();
            });
        }else{
            addPlaylistToQueue(msg.member.nickname, message.split(' ')[1], queue);

            let titles = queue.map(x => x[0]);
            let channel = client.channels.cache.get('746057842032640024');
            channel.send(`Queue: {${titles.join(', ')}}`);

            if (getPlaylists(msg.member.nickname, message.split(' ')[1]).songs[0] == Object.values(queue[queue.length - 1])[1])
                    handle_queue();
        }
    }
});

client.login(token);