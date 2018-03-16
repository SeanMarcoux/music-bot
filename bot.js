const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');
const request = require('request');

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
    else if(message.startsWith("$music")) {
        playMusic(msg);
    }
    else {
        msg.reply("I didn't understand that command. If it was meant for another bot, my bad!");
    }
}

function help(msg) {
    msg.reply("The following commands are available:\n"
        + "*$help*: Displays this message\n"
        + "*$music*: I'll play the best song ever");
}

function playMusic(msg) {
    const broadcast = client.createVoiceBroadcast();
    broadcast.playFile('./Music/Roundabout.mp3');
    // Play "music.mp3" in all voice connections that the client is in
    for (const connection of client.voiceConnections.values()) {
        var dispatcher = connection.playBroadcast(broadcast);
        dispatcher.setVolume(0.1);
    }
}


var key = fs.readFileSync("key.txt");
client.login(key.toString());