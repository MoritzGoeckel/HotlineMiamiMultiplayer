var ClientLogic = require("./ClientLogic.js");
var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var Render = require("./Render.js");
var TechnicalConfig = require("./Config/Technical.js");
var GameplayConfig = require("./Config/Gameplay.js");

$(document).ready(function(){
    var socket = io.connect('http:' + window.location.href.split(":")[1] + ':64003');

    //The player
    var me;

    //The map
    var map = new Map();
    let projectiles = [];

    //Get welcome info for own player
    socket.on('welcome', function (data) {
        me = data.player;
        me.changes = [];

        map.deserialize(data.map);

        var mapobj = new MapObject(me.pos, me.dir, me.id, "player");
        mapobj.makeCollidableCircle(GameplayConfig.playerCollisionRadius);
        map.addObject(mapobj);

        console.log(map);

        //Send Update to the Server
        setInterval(function(){ 

            if(me.changes.length > 0)
            {
                var msg = {};
                for(var index in me.changes)
                {
                    var key = me.changes[index];
                    msg[key] = me[key];
                }
                me.changes = [];

                socket.emit("update", msg);
            }
        }, 1000 / TechnicalConfig.clientToServerComRate);
    });

    var players = {};

    //Recieve full update for a player
    socket.on('player_full_info', function (player) {
        if(players[player.id] == undefined)
        {
            //Init other player
            var mapobj = new MapObject(player.pos, player.dir, player.id, "player");
            mapobj.makeCollidableCircle(GameplayConfig.playerCollisionRadius);
            mapobj.isPlayer = true;
            map.addObject(mapobj);
        }
        players[player.id] = player;
    });

    //TODO: DO serverside
    socket.on("projectiles_update", function(projectiles_update){
        projectiles = projectiles_update;
    });

    //Recieve update for a player
    socket.on('player_update', function (data) {

        if(data["dir"] != undefined || data["pos"] != undefined)
            map.getObject(data.id).changePosDir(data["pos"], data["dir"]);

        for(var key in data)
            if(players[data.id] != undefined)
                players[data.id][key] = data[key];
    });

    socket.on('disconnected', function (data) {   
        console.log("disconnected " + data.id);
        render.removeSprite(map.getObject(data.id).sprite);
        map.removeObject(data.id);
        delete players[data.id];
    });

    //The keyboard
    var keys = [];
    window.onkeyup = function(e) {keys[e.keyCode]=false;}
    window.onkeydown = function(e) {keys[e.keyCode]=true;}

    //The canvas
    var pixi = new PIXI.autoDetectRenderer(window.innerWidth - 10, window.innerHeight - 10);
    var canvas = pixi.view;

    document.getElementById("content").appendChild(canvas);

    var render = new Render(map, pixi);

    //The mouse
    var mouse = {};
    mouse.buttonsArray = [false, false, false, false, false, false, false, false, false];
    document.onmousedown = function(e) {
        mouse.buttonsArray[e.button] = true;
    };
    document.onmouseup = function(e) {
        mouse.buttonsArray[e.button] = false;
    };

    canvas.addEventListener('mousemove', function(evt) {
        mouse.pos = getMousePos(canvas, evt);
    }, false);

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    var logic = new ClientLogic();

    //Logic loop
    setInterval(function(){
        logic.updateMovement(me, map, keys, mouse, function(){
            socket.emit("trigger_fire", {pos:me.pos, dir:me.dir});
        });
        
        logic.updateProjectiles(me, map, projectiles);
    }, 1000 / TechnicalConfig.clientTickrate);

    //Render loop
    setInterval(function(){
        render.drawFrame(me, map);
    }, 1000 / TechnicalConfig.clientFramerate);

});

//Todo: File too long