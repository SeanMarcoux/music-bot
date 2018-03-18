const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');
const request = require('request');
var ytdl = require('ytdl-core');

var volume = 0.1;
var dispatchers= [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("Music");
    var channels = client.channels.array();
    for(var j = 0; j < channels.length; j++)
    {
        if(channels[j].type === "voice" && channels[j].name.includes("music")) {
            channels[j].join().then(connection => console.log('Connected!')).catch(console.error);
        }
    }
});


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
    else if(message.startsWith("$youtube ")) {
        playYoutube(msg);
    }
    else if(message.startsWith("$volumeup ")) {
        volumeUp(msg, message);
    }
    else if(message.startsWith("$volumedown ")) {
        volumeDown(msg, message);
    }
    else {
        msg.reply("I didn't understand that command. If it was meant for another bot, my bad!");
    }
}

function help(msg) {
    msg.reply("The following commands are available:\n"
        + "*$help*: Displays this message\n"
        /*+ "*$music*: I'll play the best song ever\n"*/
        + "*$youtube (url)*: I'll play the audio from the video you link to\n"
        + "*$volumeup (number)*: I'll increase the volume by the amount you requested\n"
        + "*$volumedown (number)*: I'll decrease the volume by the amount you requested");
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

function playYoutube(msg) {
    var streamUrl = getStringAfterSpace(msg.content);
    const streamOptions = {seek: 0, volume: volume};
    console.log("Streaming audio from " + streamUrl);
    
    dispatchers = [];
    if (streamUrl) {
        const stream = ytdl(streamUrl, {filter: 'audioonly'});
        for (const connection of client.voiceConnections.values()) {
            var dispatcher = connection.playStream(stream, streamOptions);
            dispatchers.push(dispatcher);
        }
    }
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
    for (var dispatcher of dispatchers) {
        dispatcher.setVolume(0.1*amount);
    }
    
    volume += 0.1*amount;
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
    
    volume -= 0.1*amount;
}

function updateBroadcastVolumes() {
    console.log("Volume being set to " + volume);
    for (var dispatcher of dispatchers) {
        dispatcher.setVolume(volume);
    }
}

var key = fs.readFileSync("key.txt");
client.login(key.toString());