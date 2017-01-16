var Express = require('express');
var Socket = require('socket.io');
var Player = require('./server_includes/player.js');

//Expose frontend
var express = Express();
express.use(Express.static('frontend'));
express.listen(63884, function () {
  console.log('http on port 63884');
});

//Create socket server
var server = Socket(64003);
console.log('tcp on port 64003');

//All players
var players = [];

var lastPlayerID = 100;

server.on('connection', function(socket){    
    //Player connects
    var player = new Player(lastPlayerID++, {x:Math.random() * 200, y:Math.random() * 200}, 0, socket);
    players.push(player);

    console.log(player.id + " connected");

    socket.emit("welcome", player.serialize());
    socket.broadcast.emit('player_full_info', player.serialize());

    //Player disconnects
    socket.on('disconnect', function(){
      players = players.filter(function(value){ return value != player; });
      console.log(player.id + " disconnected");
      server.emit("disconnected", {id:player.id});
    });

    //Recieve update from player
    socket.on('update', function(msg){
        for(var key in msg)
        {
          if(player[key] != msg[key])
          {
            if(validateInput(key, player[key], msg[key])) //Validate the input
            {
              player[key] = msg[key];
              player.changes.push(key);              
            }
            else
            {
              console.error(player.id + " illegeal action!");
            }
          }
        }
    });
});

//Send UPDATE to other players
setInterval(function() {

  players.forEach(function(player){
    if(player.changes.length > 0)
    {
        var playerUpdateMsg = {};
        for(var index in player.changes)
        {
            var key = player.changes[index];
            playerUpdateMsg[key] = player[key];
        }
        player.changes = [];

        //To make it useable
        playerUpdateMsg.id = player.id;

        //Todo: Bundle the messages
        player.socket.volatile.broadcast.emit("player_update", playerUpdateMsg); //To everyone except the player
    }
  });

}, 1000 / 25);

//Send FULL INFO to other players
setInterval(function() {

  players.forEach(function(player){
        player.socket.broadcast.emit("player_full_info", player.serialize()); //To everyone except the player
  });

}, 1000 / 1);

setInterval(function(){
  //Todo: Logic
}, 1000 / 30);

function validateInput(key, old_value, new_value)
{
  if(key != "id")
    return true;
    //Todo: More restrictions (movement etc)
}

//Display info
setInterval(function() {
  //players.forEach(function(value, index, array){console.log(value.serialize())});
  //console.log("######################################################");
}, 1000);

