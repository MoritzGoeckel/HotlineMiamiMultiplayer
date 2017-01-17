var Express = require('express');
var Socket = require('socket.io');
var Player = require('./Player.js');

var vMath = require('./VectorMath.js');
var TechnicalConfig = require('./config/Technical.js');
var GameplayConfig = require('./config/Gameplay');

var Map = require('./Map.js');
var MapObject = require('./MapObject.js');

function createNewIDFunction()
{
  var lastId = 100;
  return function(){
    return lastId++;
  }
}

var getNewId = createNewIDFunction();

//Generate map
var map = new Map();
map.addObject(new MapObject({x:200, y:200}, 0.5 * Math.PI, getNewId(), "player_max"));
map.addObject(new MapObject({x:300, y:300}, 0.5 * Math.PI, getNewId(), "player_max"));

//Expose frontend
var express = Express();
express.use(Express.static('frontend'));
express.listen(TechnicalConfig.httpPort, function () {
  console.log('http on port ' + TechnicalConfig.httpPort);
});

//Create socket server
var server = Socket(TechnicalConfig.socketPort);
console.log('sockets on port ' + TechnicalConfig.socketPort);

//All players
var players = [];

server.on('connection', function(socket){    
    //Player connects
    var player = new Player(getNewId(), {x:Math.random() * 200, y:Math.random() * 200}, 0, socket);
    players.push(player);

    console.log(player.id + " connected");

    socket.emit("welcome", {player:player.serialize(), map:map.serialize()});
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
            if(validateInput(key, player[key], msg[key], new Date().getTime() - player["lastUpdate_" + key])) //Validate the input
            {
              player[key] = msg[key];
              player["lastUpdate_" + key] = new Date().getTime();
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
        player.socket.broadcast.emit("player_update", playerUpdateMsg); //To everyone except the player
    }
  });

}, 1000 / TechnicalConfig.serverToClientComRate);

//Send FULL INFO to other players
setInterval(function() {

  players.forEach(function(player){
        player.socket.broadcast.emit("player_full_info", player.serialize()); //To everyone except the player
  });

}, 1000 / TechnicalConfig.serverToClientFullUpdateRate);

setInterval(function(){
  //Todo: Logic
}, 1000 / TechnicalConfig.serverTickrate);

function validateInput(key, old_value, new_value, delta)
{
  if(key == "id")
    return false;
  if(key == "pos")
  {
    //Collision detection

    //Speed detection
    if(vMath.len(vMath.sub(new_value, old_value)) > GameplayConfig.movementSpeed * delta * 1.3)
      return false;
  }

  //Todo: More Restrictions

  //No one complais -> good
  return true;
}

//Display info
setInterval(function() {
  //Display
}, 1000);

