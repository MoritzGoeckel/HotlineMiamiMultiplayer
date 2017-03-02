var ClientLogic = require("./ClientLogic.js");
var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var Render = require("./Render.js");
var TechnicalConfig = require("./Config/Technical.js");
var GameplayConfig = require("./Config/Gameplay.js");
var ProjectileManager = require("./ProjectileManager.js");
var Cross = require("./Cross.js");
//var io = require("socket.io");

function createNewIDFunction()
{
  var lastId = -100;
  return function(){
    return lastId--;
  }
}

var getNewId = createNewIDFunction();

$(document).ready(function(){
    var socket = io.connect('http:' + window.location.href.split(":")[1] + ':64003');
    var me;
    
    //The canvas
    var pixi = new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    var canvas = pixi.view;
    document.getElementById("content").appendChild(canvas);

    let cross;
    
    let render = new Render(pixi, ["player", "player_max", "healthpickup", "boxsmall", "boxmedium", "boxlarge", "ammopickup", "bullet", "blood1", "blood2", "blood3", "blood4", "floor_tile", "floor_tile_big", "floor_tile_quarter", "floor_tile_quarter_big", "wall", "wall_corner", "wall_big", "wall_corner_big", "cross-300", "cross-301", "cross-302", "cross-303"], function(){
        cross = new Cross(["cross-301", "cross-302", "cross-303", "cross-302", "cross-301"], render);
    });        

    let projectileManager = new ProjectileManager();

    let deserializers = {};
    deserializers = new Map().updateDeserializer(deserializers);

    let data = {};
    data.map = new Map();

    socket.on('set', function (input) {
        let id = input.id;
        let obj = input.obj;

        data[id] = deserializers[obj.deserializeFunction](obj.data);
    });

    socket.on('update', function (msg) {
        for(let objectId in msg)
        {
            let found = false;
            for(let i in me.owned)
                if(me.owned[i] == objectId){
                    found = true;
                    break;
                }

            if(found == false)
                data.map.getObject(objectId).dataObject.applyUpdateMessage(msg[objectId]);
        }
    });

    socket.on("create", function(msg){
        if(data.map.getObject(msg.id) == undefined)
            data.map.addObject(new MapObject().deserialize(msg));
    });

    var players = {};
    socket.on('you_player_info', function (player) {
        me = player;
        console.log(me);
    });

    socket.on('player_info', function (player) {
        players[player.id] = player;
    });

    socket.on('create_projectile', function (msg) {
        projectileManager.addProjectile(data.map, msg.speed, msg.pos, msg.dir, msg.texture, msg.playerId);
    });

    socket.on('disconnected', function (msg) {   
        console.log("disconnected " + msg.id);
        delete players[msg.id];
    });

    socket.on('destroy_object', function(msg){
        data.map.removeObject(msg.id);
    });

    socket.on('customError', function(msg){
        console.log(msg);
    });

    var logic = new ClientLogic();
    logic.initMouseInput(canvas);
    logic.initKeyboardInput();

    //Render loop
    setInterval(function(){
        if(render != undefined && data.map != undefined && me != undefined)
            render.drawFrame(me, data.map);
            cross.setPosition(logic.getMousePos());
    }, 1000 / TechnicalConfig.clientFramerate);

    //Logic loop
    setInterval(function(){
        if(me != undefined && data.map != undefined)

            if(me.playerObject == undefined)
                me.playerObject = data.map.getObject(me.owned["playerMapObject"]);

            logic.updateMovement(me, data.map, function(event){
                if(event == "fire"){
                    
                    setTimeout(function(){
                        socket.emit("rise_event", {mode:"fire", pos:me.playerObject.pos, dir:me.playerObject.dir});
                    }, 0);

                    //Dont know why, but here seems to be a bottleneck
                    projectileManager.addProjectile(data.map, 3, me.playerObject.pos, me.playerObject.dir, "bullet", me.id);
                }
            });

            projectileManager.update(data.map, function(obj, impact, rm){rm();}, function(playerId, impact, rm){rm();});
    }, 1000 / TechnicalConfig.clientTickrate);

    //Send Update to the Server
    setInterval(function(){ 

        if(me != undefined && me.owned != undefined){
            let updateMsg = {};
            for(let key in me.owned)
                updateMsg[me.owned[key]] = data.map.getObject(me.owned[key]).dataObject.getUpdateMessage();
            
            socket.emit("update", updateMsg);
        }
            

    }, 1000 / TechnicalConfig.clientToServerComRate);
});

/*

    Do the projectile somehow

    makeProjectile(demage, movement, map){
        this.projectile = demage;

        this.projectileInterval = setInterval(function(){        
            let coll = map.checkCollision(projectile, 1000);
            if(coll != false){
                for(let c in coll)
                    if(coll[c].onDemage != undefined)
                        coll[c].onDemage(projectile.demage);
                
                //Todo: Destroy the projectile ... do that also on the server
            }
            this.changePosDir(this.pos + movement, undefined);
        }, 10);
    }

    dump(){
        if(this.projectileInterval != undefined)
            clearInterval(this.projectileInterval);
    }

*/