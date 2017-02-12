var ClientLogic = require("./ClientLogic.js");
var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var Render = require("./Render.js");
var TechnicalConfig = require("./Config/Technical.js");
var GameplayConfig = require("./Config/Gameplay.js");

var io = require("socket.io");

$(document).ready(function(){
    var socket = io.connect('http:' + window.location.href.split(":")[1] + ':64003');
    var me;
    
    let deserializers = {};
    deserializers = new Map().updateDeserializer(deserializers);

    let data = {};
    data.map = new Map();

    socket.on('set', function (input) {
        let id = input.id;
        let obj = input.obj;

        data[id] = deserializers[obj.deserializeFunction](obj.data);
    });

    socket.on('update', function (data) {

        /*if(data["dir"] != undefined || data["pos"] != undefined)
            map.getObject(data.id).changePosDir(data["pos"], data["dir"]);

        for(var key in data)
            if(players[data.id] != undefined)
                players[data.id][key] = data[key];*/
    });

    var players = {};
    socket.on('you_player_info', function (player) {
        me = player;
        console.log(me);
    });

    socket.on('player_info', function (player) {
        players[player.id] = player;
    });

    socket.on('disconnected', function (data) {   
        console.log("disconnected " + data.id);
        render.removeSprite(map.getObject(data.id).sprite);
        map.removeObject(data.id);
        delete players[data.id];
    });

    //The canvas
    var pixi = new PIXI.autoDetectRenderer(window.innerWidth - 10, window.innerHeight - 10);
    var canvas = pixi.view;
    document.getElementById("content").appendChild(canvas);

    let render = new Render(pixi, ["player", "player_max"]);        

    var logic = new ClientLogic();
    logic.initMouseInput(canvas);
    logic.initKeyboardInput();

    //Render loop
    setInterval(function(){
        if(render != undefined && data.map != undefined && me != undefined)
            render.drawFrame(me, data.map);
    }, 1000 / TechnicalConfig.clientFramerate);

    //Logic loop
    /*setInterval(function(){
        logic.updateMovement(me, map, keys, mouse, function(){
            socket.emit("trigger_fire", {pos:me.pos, dir:me.dir});
        });
        
        logic.updateProjectiles(me, map, projectiles);
    }, 1000 / TechnicalConfig.clientTickrate);*/

    //Send Update to the Server
    setInterval(function(){ 

        for(let key in me.ownedObjects)
        {
            map.getObject(me.ownedObjects[key]).
        }

    }, 1000 / TechnicalConfig.clientToServerComRate);
});