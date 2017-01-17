(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var vMath = require("./VectorMath.js");

module.exports = class ClientLogic {
    updateMovement(me, map, keys, mouse)
    {
        if(me == undefined)
            return;

        function changeMe(key, value)
        {
            me[key] = value;
            me.changes.push(key);
        }

        if(mouse != undefined && me.pos != undefined && mouse.pos != undefined)
        {
            var courserToPlayer = vMath.sub(mouse.pos, me.pos);
            var newDir = Math.atan2(courserToPlayer.y, courserToPlayer.x);

            if(newDir != me.dir)
                changeMe("dir", newDir);
            
            var courserDistance = vMath.len(courserToPlayer);
            courserToPlayer = vMath.norm(courserToPlayer);
            var movement = {x:0, y:0};

            //W
            if(keys["87"] && courserDistance > 30)
            {
                movement = vMath.add(movement, courserToPlayer);
            }
            //S
            if(keys["83"])
            {
                movement = vMath.sub(movement, courserToPlayer);
            }
            //A
            if(keys["68"])
            {
                movement = vMath.add(movement, vMath.ortho(courserToPlayer));
            }
            //D
            if(keys["65"])
            {
                movement = vMath.sub(movement, vMath.ortho(courserToPlayer));
            }

            if(movement.x != 0 || movement.y != 0)
            {
                movement = vMath.norm(movement);
                movement = vMath.multScalar(movement, 3);
                changeMe("pos", vMath.add(me.pos, movement));
            }
        }
        
        //console.log(keys);

        //Todo game logic / prediction
    }
}
},{"./VectorMath.js":3}],2:[function(require,module,exports){
module.exports = class Render{
    drawFrame(players, me, map)
    {
        if(this.resources != undefined)
        {
            for(var index in players)
                this.drawPlayer(players[index]);   

            this.drawPlayer(me);

            this.pixi.render(this.stage);

            //me.dir++;
        }
    }

    drawPlayer(player)
    {
        if(this.sprites[player.id] == undefined)
        {
            //Has no sprite
            this.sprites[player.id] = new PIXI.Sprite(this.resources.player.texture);
            this.sprites[player.id].anchor.x = 0.5;
            this.sprites[player.id].anchor.y = 0.5;
            this.stage.addChild(this.sprites[player.id]);
        }
        else
        {
            //Already has a sprite
        }

        this.sprites[player.id].position = player.pos;
        this.sprites[player.id].rotation = player.dir;
    }

    removeSprite(id)
    {
        this.stage.removeChild(this.sprites[id])
        delete this.sprites[id];
    }

    constructor(players, map, pixi)
    {
        this.stage = new PIXI.Container();
        this.pixi = pixi;
        this.sprites = {};

        var base = this;

        var loader = PIXI.loader;
        loader.add('player', 'graphics/player.png');
        loader.once('complete', function(e){
            base.resources = e.resources;
            console.log("Resources loaded");
        });
        loader.load();

        this.pixi.backgroundColor = 0xFFFFFF;
    }
}
},{}],3:[function(require,module,exports){
module.exports = {
    add : function(vec1, vec2)
    {
        return {x:vec1.x + vec2.x, y:vec1.y + vec2.y};
    },

    sub : function(vec1, vec2)
    {
        return {x:vec1.x - vec2.x, y:vec1.y - vec2.y};
    },

    norm : function(vec)
    {
        var length = this.len(vec);
        if(length != 0)
            return {x:vec.x / length, y:vec.y / length};
        else
            return vec;
    },

    len : function(vec)
    {
        return Math.abs(vec.x) + Math.abs(vec.y);
    },

    mult : function(vec1, vec2)
    {
        return {x:vec1.x * vec2.x, y:vec1.y * vec2.y};
    },

    multScalar : function(vec1, num)
    {
        return {x:vec1.x * num, y:vec1.y * num};
    },

    ortho : function(vec)
    {
        return {x:-vec.y, y:vec.x};
    }
}
},{}],4:[function(require,module,exports){
var ClientLogic = require("./ClientLogic.js");
var Render = require("./Render.js");

$(document).ready(function(){

    //Connect
    console.log();
    var socket = io.connect('http:' + window.location.href.split(":")[1] + ':64003');

    //The player
    var me;

    //The map
    var map = undefined;

    //Get welcome info for own player
    socket.on('welcome', function (data) {
        me = data;
        me.changes = [];

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
        }, 1000 / 40);
    });

    var players = {};

    //Recieve full update for a player
    socket.on('player_full_info', function (data) {
        players[data.id] = data;
    });

    //Recieve update for a player
    socket.on('player_update', function (data) {    
        for(var key in data)
        {
            if(players[data.id] != undefined)
                players[data.id][key] = data[key];           
        }
    });

    socket.on('disconnected', function (data) {   
        console.log("disconnected " + data.id);
        render.removeSprite(data.id);
        delete players[data.id];
    });

    //The keyboard
    var keys = [];
    window.onkeyup = function(e) {keys[e.keyCode]=false;}
    window.onkeydown = function(e) {keys[e.keyCode]=true;}

    //The canvas
    var pixi = new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    var canvas = pixi.view;

    document.getElementById("content").appendChild(canvas);

    var render = new Render(players, map, pixi);

    //The mouse
    var mouse = {};

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
        logic.updateMovement(me, map, keys, mouse);
    }, 1000 / 100);

    //Render loop
    setInterval(function(){
        render.drawFrame(players, me, map);
    }, 1000 / 100);
});

//Todo: File too long
},{"./ClientLogic.js":1,"./Render.js":2}]},{},[4]);
