var Express = require('express');
var Socket = require('socket.io');
var Player = require('./Player.js');

var InputValidator = require('./ClientInputValidator.js');

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
map.addObject(new MapObject({x:200, y:200}, 0.3 * Math.PI, getNewId(), "player_max").makeCollidableCircle(30));
map.addObject(new MapObject({x:300, y:300}, 0.5 * Math.PI, getNewId(), "player_max").makeCollidableCircle(30).makeSpeedChange(0.2));

//Expose frontend
var express = Express();
express.use(Express.static(__dirname + '/frontend'));
express.listen(TechnicalConfig.httpPort, function () {
  console.log('http on port ' + TechnicalConfig.httpPort);
});

//Create socket server
var server = Socket(TechnicalConfig.socketPort);
console.log('sockets on port ' + TechnicalConfig.socketPort);

//All players
var players = [];
var projectiles = [];

server.on('connection', function(socket){    
    //Player connects
    var player = new Player(getNewId(), socket);
    players.push(player);

    player.sendToOthers();
    player.addOwnedObject("playerMapObject", getNewId());
    
    map.addObject(
      new MapObject(
        {x:300 * Math.random(), y:300 * Math.random()}, 
        Math.random() * Math.PI, 
        player.getOwnedObject("playerMapObject"), 
        "player")
      .makeCollidableCircle(30)
      .makeSpeedChange(0.2));

    player.sendObject("map", map.serialize());

    //Player disconnects
    socket.on('disconnect', function(){
      map.removeObject(player.getOwnedObject("playerMapObject"));
      players = players.filter(function(value){ return value != player; });
      console.log(player.id + " disconnected");
      server.emit("disconnected", {id:player.id});
    });

    //Recieve update from player
    socket.on('update', function(msg){
        for(var objectId in msg)
        {
          if(player[key] != msg[key])
          {
            if(InputValidator.validateInput(key, player[key], msg[key], new Date().getTime() - player["lastUpdate_" + key])) //Validate the input
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

    /*socket.on("trigger_fire", function(msg){
      projectiles.push(new Projectile(msg.pos, msg.dir, ))
    });*/

});
//Send UPDATE to other players
/*setInterval(function() {

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

        //projectiles_update
    }
  });

}, 1000 / TechnicalConfig.serverToClientComRate);*/

//Send FULL INFO to other players
/*setInterval(function() {

  players.forEach(function(player){
        player.socket.broadcast.emit("player_full_info", player.serialize()); //To everyone except the player
  });

}, 1000 / TechnicalConfig.serverToClientFullUpdateRate);

setInterval(function(){
  //Todo: Logic
}, 1000 / TechnicalConfig.serverTickrate);*/