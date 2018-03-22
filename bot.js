const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');
const request = require('request');
var ytdl = require('ytdl-core');

var volume = 0.1;
var paused = false;
var shuffle = false;
var dispatchers = [];
var youtubeQueue = [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("Music");
    //connectToMusicChannels();
});

function connectToMusicChannels() {
    for (const connection of client.voiceConnections.values()) {
        connection.disconnect();
    }
    var channels = client.channels.array();
    for(var j = 0; j < channels.length; j++)
    {
        if(channels[j].type === "voice" && channels[j].name.includes("music")) {
            channels[j].join().then(connection => console.log('Connected!')).catch(console.error);
        }
    }
}


client.on('message', msg => {
    if(msg.channel.name && !(msg.channel.name.toLowerCase().includes("bot")))
        return;
    if(msg.author.username == "music-bot")
        return;
    if(!msg.channel.name)
        console.log("Message received from " + msg.author.username + ": " + msg.content);
    
    var message = msg.content.toLowerCase();
    
    if(message === "music-bot, die")
    {
        setTimeout(function () {
            msg.reply("D:");
            setTimeout(function () {
                throw 'Goodbye cruel world';
            }, 1000);
        }, 1000);
    }
    
    reactToCommands(msg, message);
});

function reactToCommands(msg, message)
{
    if(!message.startsWith("$")) {
        return;
    }
    else if(message.startsWith("$help")) {
        help(msg);
    }
    /*else if(message.startsWith("$music")) {
        playMusic(msg);
    }*/
    else if(message.startsWith("$queue ")) {
        queueYoutube(msg);
    }
    else if(message.startsWith("$volumeup ")) {
        volumeUp(msg, message);
    }
    else if(message.startsWith("$volumedown ")) {
        volumeDown(msg, message);
    }
    else if(message.startsWith("$pause")) {
        pause(msg);
    }
    else if(message.startsWith("$resume")) {
        resume(msg);
    }
    else if(message.startsWith("$shuffle")) {
        shuffle = true;
        msg.reply("Now in shuffle mode");
    }
    else if(message.startsWith("$normal")) {
        shuffle = false;
        msg.reply("Now in linear mode");
    }
    else {
        msg.reply("I didn't understand that command. If it was meant for another bot, my bad!");
    }
}

function help(msg) {
    msg.reply("The following commands are available:\n"
        + "*$help*: Displays this message\n"
        /*+ "*$music*: I'll play the best song ever\n"*/
        + "*$queue (url)*: I'll queue up the audio from the video you link to\n"
        + "*$volumeup (number)*: I'll increase the volume by the amount you requested\n"
        + "*$volumedown (number)*: I'll decrease the volume by the amount you requested\n"
        + "*$pause*: I'll pause the current music\n"
        + "*$resume*: I'll resume the current music\n"
        + "*$shuffle*: I'll put myself in shuffle mode\n"
        + "*$normal*: I'll take myself out of shuffle mode");
}

/*function playMusic(msg) {
    const broadcast = client.createVoiceBroadcast();
    broadcast.playFile('./Music/Roundabout.mp3');
    // Play "music.mp3" in all voice connections that the client is in
    for (const connection of client.voiceConnections.values()) {
        var dispatcher = connection.playBroadcast(broadcast);
        dispatcher.setVolume(0.1);
    }
}*/

function queueYoutube(msg) {
    var streamUrl = getStringAfterSpace(msg.content);
    console.log("Adding " + streamUrl + " to the queue");
    youtubeQueue.push(streamUrl);
    if(youtubeQueue.length == 1 && dispatchers.length == 0)
        playNextInQueue();
}

function playNextInQueue() {
    resetDispatchers();
    if(youtubeQueue.length == 0) {
        console.log("Queue emptied");
        return;
    }
    connectToMusicChannels();
    
    if(!shuffle)
        var streamUrl = youtubeQueue.shift();
    else {
        var index = getRandomInt(0, youtubeQueue.length-1);
        var streamUrl = youtubeQueue[index];
        youtubeQueue.splice(index, 1);
    }
    const streamOptions = {seek: 0, volume: volume};
    console.log("Streaming audio from " + streamUrl);
    messageAllChannels("Now playing " + streamUrl);
    
    if (streamUrl) {
        const stream = ytdl(streamUrl, {filter: 'audioonly'});
        var count = 0;
        for (const connection of client.voiceConnections.values()) {
            var dispatcher = connection.playStream(stream, streamOptions);
            if(count ==0)
            {
                dispatcher.on('end', () => {
                    console.log("Stream ended");
                    playNextInQueue();
                });
            }
            count++;
            dispatchers.push(dispatcher);
        }
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function messageAllChannels(message) {
    var channels = client.channels.array();
    for(var j = 0; j < channels.length; j++)
    {
        if(channels[j].type === "text" && channels[j].name.includes("bot")) {
            channels[j].send(message);
        }
    }
}

function resetDispatchers() {
    dispatchers = [];
}

function getStringAfterSpace(string) {
    if(string.indexOf(" ") > 0)
        return string.slice(string.indexOf(" ")+1, string.length);
    return null;
}

function volumeUp(msg, message) {
    var amount = getStringAfterSpace(message);
    if(isNaN(amount))
    {
        msg.reply(amount + " is not a number!");
        return;
    }
    
    amount = parseInt(amount);
    if(amount > 5)
    {
        msg.reply("Fuck off, I don't want to be deaf");
        return;
    }
    for (var dispatcher of dispatchers) {
        dispatcher.setVolume(0.1*amount);
    }
}

function volumeDown(msg, message) {
    var amount = getStringAfterSpace(message);
    if(isNaN(amount))
    {
        msg.reply(amount + " is not a number!");
        return;
    }
    
    amount = parseInt(amount);
    for (var dispatcher of dispatchers) {
        //Increase by 1 so that volumedown 1 actually has an effect
        dispatcher.setVolume(1/(amount+1));
    }
}

function updateBroadcastVolumes() {
    console.log("Volume being set to " + volume);
    for (var dispatcher of dispatchers) {
        dispatcher.setVolume(volume);
    }
}

function pause(msg) {
    if(dispatchers.length == 0) {
        msg.reply("There is nothing playing to pause!");
        return;
    }
    if(paused) {
        msg.reply("It is already paused!");
        return;
    }
    console.log("Pausing music");
    
    for(var i = 0; i < dispatchers.length; i++) {
        dispatchers[i].pause();
    }
    paused = true;
}

function resume(msg) {
    if(dispatchers.length == 0 || !paused) {
        msg.reply("There's nothing paused to resume!");
        return;
    }
    console.log("Resuming music");
    
    for(var i = 0; i < dispatchers.length; i++) {
        dispatchers[i].resume();
    }
    paused = false;
}

var key = fs.readFileSync("key.txt");
client.login(key.toString());