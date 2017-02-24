var Express = require('express');
var Socket = require('socket.io');
var Player = require('./Player.js');

var InputValidator = require('./ClientInputValidator.js');

var vMath = require('./VectorMath.js');
var TechnicalConfig = require('./config/Technical.js');
var GameplayConfig = require('./config/Gameplay');

var Map = require('./Map.js');
var MapObject = require('./MapObject.js');
var DataObject = require('./DataObject.js');

var ProjectileManager = require("./ProjectileManager.js");

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
//map.addObject(new MapObject({x:200, y:200}, 0.3 * Math.PI, getNewId(), "player_max", new DataObject(-1, getNewId())).makeCollidableCircle(30));
//map.addObject(new MapObject({x:300, y:300}, 0.5 * Math.PI, getNewId(), "player_max", new DataObject(-1, getNewId())).makeCollidableCircle(30).makeSpeedChange(0.2));

map.addObject(new MapObject({x:200, y:100}, 0, getNewId(), "boxlarge", new DataObject(-1, getNewId())).makeCollidableBox(144, 81));
map.addObject(new MapObject({x:200, y:350}, Math.PI * 0.5, getNewId(), "boxlarge", new DataObject(-1, getNewId())).makeCollidableBox(81, 144));

map.addObject(new MapObject({x:200, y:500}, 0, getNewId(), "boxlarge", new DataObject(-1, getNewId())).makeCollidableBox(144, 81));
map.addObject(new MapObject({x:200, y:650}, Math.PI * 0.5, getNewId(), "boxlarge", new DataObject(-1, getNewId())).makeCollidableBox(81, 144));

map.addObject(new MapObject({x:200, y:800}, 0, getNewId(), "boxlarge", new DataObject(-1, getNewId())).makeCollidableBox(144, 81));



let projectileManager = new ProjectileManager();

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

let updates = {};

server.on('connection', function(socket){    
    //Player connects
    var player = new Player(getNewId(), socket);
    players.push(player);

    player.sendToOthers();
    player.addOwnedObject("playerMapObject", getNewId());

    let object = new MapObject(
          {x:300 * Math.random(), y:300 * Math.random()}, 
          Math.random() * Math.PI, 
          player.getOwnedObject("playerMapObject"), 
          "player",
          new DataObject(player.id, getNewId())
        )
      .makeCollidableCircle(40)
      .makeSpeedChange(0.2)
      .makePlayer(player.id);

    map.addObject(object);
    server.emit("create", object.serialize());

    player.sendObject("map", map.serialize());

    //Player disconnects
    socket.on('disconnect', function(){
      map.removeObject(player.getOwnedObject("playerMapObject"));
      server.emit('destroy_object', {id:player.getOwnedObject("playerMapObject")});

      players = players.filter(function(value){ return value != player; });
      console.log(player.id + " disconnected");
      server.emit("disconnected", {id:player.id});
    });

    //Recieve update from player
      socket.on('update', function(msg){
        for(var objectId in msg){
          map.getObject(objectId).dataObject.applyUpdateMessage(msg[objectId]);
          if(updates[objectId] == undefined)
            updates[objectId] = {};
          
          for(let key in msg[objectId])
            updates[objectId][key] = true;
        }
    });

    socket.on("rise_event", function(msg){
      if(msg.mode == "fire"){
        projectileManager.addProjectile(map, 3, msg.pos, msg.dir, "bullet", player.id);
        
        let output = {speed:3, pos:msg.pos, dir:msg.dir, texture:"bullet", playerId:player.id};
        socket.broadcast.emit("create_projectile", output);
      }
    });

    /*socket.on("trigger_fire", function(msg){
      projectiles.push(new Projectile(msg.pos, msg.dir, ))
    });*/

});

//Send UPDATE to other players
setInterval(function() {

  let msg = {};
  for(let objectId in updates){
    msg[objectId] = {};
    for(let key in updates[objectId])
      msg[objectId][key] = map.getObject(objectId).dataObject.get(key);
  }

  server.emit("update", msg);
  updates = {};

}, 1000 / TechnicalConfig.serverToClientComRate);

setInterval(function(){
  projectileManager.update(map, function(obj, impact, rm){rm();}, function(playerId, impact, rm){
    //Todo: react to player hit

    let pos = undefined;
    for(let p in players)
      if(players[p].id == playerId)
        pos = map.getObject(players[p].getOwnedObject("playerMapObject")).pos;
      
    let bloodPos = vMath.add({x:pos.x, y:pos.y}, vMath.multScalar(vMath.norm(impact), 100 + Math.round(Math.random() * 100)));

    let obj = new MapObject(bloodPos, Math.atan2(impact.y, impact.x), getNewId(), "blood" + Math.ceil(Math.random() * 3), new DataObject(-1, getNewId())).setZValue(-1);
    map.addObject(obj);
    server.emit("create", obj.serialize());

    rm();
  });
}, 1000 / TechnicalConfig.serverTickrate); //Server tickrate