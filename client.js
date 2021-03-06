var ClientLogic = require("./ClientLogic.js");
var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var Render = require("./Render.js");
var TechnicalConfig = require("./Config/Technical.js");
var GameplayConfig = require("./Config/Gameplay.js");
var ProjectileManager = require("./ProjectileManager.js");
var Cross = require("./Cross.js");
var Camera = require("./Camera.js");
var vMath = require("./VectorMath.js");
var Input = require("./Input.js");
var AudioBank = require("./AudioBank.js");

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

    let audio = new AudioBank(["rifle_shot", "silenced", "reload"]);

    var socket = io.connect('http:' + window.location.href.split(":")[1] + ':64003');
    var me;
    
    //The canvas
    var pixi = new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    var canvas = pixi.view;
    document.getElementById("content").appendChild(canvas);
    let input = new Input(canvas);

    let cross;
    let camera = new Camera({x:0, y:0});

    let render = new Render(pixi, ["player", "player_max", "healthpickup", "boxsmall", "boxmedium", "boxlarge", "ammopickup", "bullet", "blood1", "blood2", "blood3", "blood4", "floor_tile", "floor_tile_big", "floor_tile_quarter", "floor_tile_quarter_big", "wall", "wall_corner", "wall_big", "wall_corner_big", "cross-300", "cross-301", "cross-302", "cross-303"], function(){
        cross = new Cross(["cross-301", "cross-302", "cross-303", "cross-302", "cross-301"], render);
    });        

    let projectileManager = new ProjectileManager();

    let deserializers = {};
    deserializers = new Map().updateDeserializer(deserializers);

    let data = {};
    data.map = new Map();

    socket.on('set', function (msg) {
        let id = msg.id;
        let obj = msg.obj;

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
        audio.play("silenced", 0.3);
    
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

    //Render loop
    setInterval(function(){
        if(render != undefined && data.map != undefined && me != undefined)
            render.drawFrame(me, data.map, camera);
            cross.setPosition(vMath.add(input.getMousePosition(), camera.getPosition()));
    }, 1000 / TechnicalConfig.clientFramerate);

    //Logic loop
    setInterval(function(){
        if(me != undefined && data.map != undefined)

            if(me.playerObject == undefined)
                me.playerObject = data.map.getObject(me.owned["playerMapObject"]);

            camera.update(input.getMousePosition(), me.playerObject.pos, cross);

            logic.updateMovement(me, data.map, input, cross, function(event){
                if(event == "fire"){
                    
                    setTimeout(function(){
                        socket.emit("rise_event", {mode:"fire", pos:me.playerObject.pos, dir:me.playerObject.dir});
                    }, 0);

                    audio.play("silenced", 0.7);

                    projectileManager.addProjectile(data.map, 2.5, me.playerObject.pos, me.playerObject.dir, "bullet", me.id);
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