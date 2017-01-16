var Express = require('express');
var Socket = require('socket.io');
var Player = require('./server_includes/player.js');

//Expose frontend
var express = Express();
express.use(Express.static('frontend'));
express.listen(1000, function () {
  console.log('http on port 1000');
});

//Create socket server
var server = Socket(2000);
console.log('tcp on port 2000');

//All players
var players = [];

server.on('connection', function(socket){    
    //Player connects
    var player = new Player("abc", {x:1, y:1}, 5, socket);
    players.push(player);

    console.log(player.id + " connected");

    socket.emit("welcome", player.serialize());
    socket.broadcast.emit('player_full_info', player.serialize());

    //Player disconnects
    socket.on('disconnect', function(){
      players = players.filter(function(value){ return value != player; });
      console.log(player.id + " disconnected");
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

}, 1000 / 50);

//Send FULL INFO to other players
setInterval(function() {

  players.forEach(function(player){
        player.socket.volatile.broadcast.emit("player_full_info", player.serialize()); //To everyone except the player
  });

}, 1000 / 1);

function validateInput(key, old_value, new_value)
{
  return true;
}

//Display info
setInterval(function() {
  //players.forEach(function(value, index, array){console.log(value.serialize())});
  //console.log("######################################################");
}, 1000);

