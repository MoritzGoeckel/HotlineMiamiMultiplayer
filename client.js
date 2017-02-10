var ClientLogic = require("./ClientLogic.js");
var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var Render = require("./Render.js");
var TechnicalConfig = require("./Config/Technical.js");
var GameplayConfig = require("./Config/Gameplay.js");

$(document).ready(function(){
    var socket = io.connect('http:' + window.location.href.split(":")[1] + ':64003');
    var me;
    
    let deserializers = {};
    deserializers = new Map().updateDeserializer(deserializers);

    let data = {};
    data.map = new Map();

    socket.on('set', function (input) {

        console.log(input);

        let id = input.id;
        let obj = input.obj;

        data[id] = deserializers[obj.deserializeFunction](obj.data);

        //Send Update to the Server
        /*setInterval(function(){ 

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
        }, 1000 / TechnicalConfig.clientToServerComRate);*/
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

    //The keyboard
    var keys = [];
    window.onkeyup = function(e) {keys[e.keyCode]=false;}
    window.onkeydown = function(e) {keys[e.keyCode]=true;}

    //The canvas
    var pixi = new PIXI.autoDetectRenderer(window.innerWidth - 10, window.innerHeight - 10);
    var canvas = pixi.view;
    document.getElementById("content").appendChild(canvas);

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
    /*setInterval(function(){
        logic.updateMovement(me, map, keys, mouse, function(){
            socket.emit("trigger_fire", {pos:me.pos, dir:me.dir});
        });
        
        logic.updateProjectiles(me, map, projectiles);
    }, 1000 / TechnicalConfig.clientTickrate);*/

    //Render loop
    let render = undefined;
    setInterval(function(){
        if(data.map != undefined && render == undefined)
            render = new Render(data.map, pixi);        

        render.drawFrame(me, data.map);
    }, 1000 / TechnicalConfig.clientFramerate);

});

//Todo: File too long