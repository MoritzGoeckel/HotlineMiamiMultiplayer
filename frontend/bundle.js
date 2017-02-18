(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var vMath = require("./VectorMath.js");
var gameplayConfig = require("./config/Gameplay.js");

module.exports = class ClientLogic {

    constructor(){
        this.lastUpdateMovement = new Date().getTime();
        this.lastFireTime = this.lastUpdateMovement;
        this.fireRate = 1000 / 3;
    }

    initMouseInput(canvas){
        this.mouse = {};
        this.mouse.buttonsArray = [false, false, false, false, false, false, false, false, false];
        let theBase = this;
        document.onmousedown = function(e) {
            theBase.mouse.buttonsArray[e.button] = true;
        };
        document.onmouseup = function(e) {
            theBase.mouse.buttonsArray[e.button] = false;
        };

        canvas.addEventListener('mousemove', function(evt) {
            theBase.mouse.pos = getMousePos(canvas, evt);
        }, false);

        function getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
    }

    initKeyboardInput(){
        this.keys = [];
        let theBase = this;
        window.onkeyup = function(e) {theBase.keys[e.keyCode]=false;}
        window.onkeydown = function(e) {theBase.keys[e.keyCode]=true;}
    }

    updateMovement(me, map, riseEvent)
    {        
        let now = new Date().getTime();
        var delta = now - this.lastUpdateMovement;
        this.lastUpdateMovement = now;

        if(me == undefined)
            return;

        function changeMe(key, value)
        {
            if(key == "dir" || key == "pos"){ //Could also be other things
                me.playerObject.dataObject.setAsOwner(me.id, key, value);
            }
        }

        if(this.mouse != undefined && this.mouse.pos != undefined)
        {
            var courserToPlayer = vMath.sub(this.mouse.pos, me.playerObject.pos);
            var courserDistance = vMath.len(courserToPlayer);
            
            var newDir = Math.atan2(courserToPlayer.y, courserToPlayer.x);

            if(newDir != me.playerObject.dir)
                changeMe("dir", newDir);
            
            courserToPlayer = vMath.norm(courserToPlayer);
            var movement = {x:0, y:0};

            if(this.mouse.buttonsArray[0] && now - this.lastFireTime > this.fireRate)
            {
                this.lastFireTime = now;
                riseEvent("fire");
            }

            //W
            if(this.keys["87"] && courserDistance > gameplayConfig.minMouseDistanceMoveForward)
            {
                movement = vMath.add(movement, courserToPlayer);
            }
            //S
            if(this.keys["83"])
            {
                movement = vMath.sub(movement, courserToPlayer);
            }
            //A
            if(this.keys["68"])
            {
                movement = vMath.add(movement, vMath.ortho(courserToPlayer));
            }
            //D
            if(this.keys["65"])
            {
                movement = vMath.sub(movement, vMath.ortho(courserToPlayer));
            }

            if(movement.x != 0 || movement.y != 0)
            {
                movement = vMath.norm(movement);
                movement = vMath.multScalar(movement, gameplayConfig.movementSpeed * delta);

                var oldPos = me.playerObject.pos;
                var newPos = vMath.add(me.playerObject.pos, movement); //courserDistance ??? todo:

                //Check collision
                me.playerObject.changePosDir(newPos, undefined);

                var collidingObjs = map.checkCollision(me.playerObject, 500);

                if(collidingObjs === false)
                {
                    changeMe("pos", newPos);
                }
                else
                {
                    let colliding = false;
                    let speedChange = undefined;

                    for(let i in collidingObjs){
                        if(collidingObjs[i].speedChange == undefined)
                        {
                            colliding = true;
                            break;
                        }
                        else
                            speedChange = collidingObjs[i].speedChange;
                    }
                    
                    if(colliding == false && speedChange == undefined)
                    {
                        //Okay, continue
                        changeMe("pos", newPos);
                    }
                    else if(colliding == false && speedChange != undefined)
                    {
                        //Slow down
                        var alternativeNewPos = vMath.add(me.playerObject.pos, vMath.multScalar(movement, speedChange));
                        me.playerObject.changePosDir(alternativeNewPos, undefined);
                        changeMe("pos", alternativeNewPos);
                    }
                    else if(colliding)
                    {
                        //It is coliding, get back to old position
                        me.playerObject.changePosDir(oldPos, undefined);
                        //changeMe("pos", oldPos);    
                    }
                }
            }
        }
        
        //console.log(keys);

        //Todo game logic / prediction
    }
}
},{"./VectorMath.js":8,"./config/Gameplay.js":10}],2:[function(require,module,exports){
module.exports = {
    movementSpeed:0.5, 
    minMouseDistanceMoveForward:35,
    playerCollisionRadius:30
};
},{}],3:[function(require,module,exports){
module.exports = {
    serverTickrate:30, 
    clientTickrate:100,
    clientFramerate:100,
    clientToServerComRate:30,
    serverToClientComRate:30,
    serverToClientFullUpdateRate:1,
    httpPort:63884,
    socketPort:64003
};
},{}],4:[function(require,module,exports){
module.exports = class{
    constructor(owner, id)
    {
        this.id = id;
        this.owner = owner;

        this.internal = {};
        this.changeListener = {};
    }

    setAsOwner(yourId, key, value){
        if(this.owner == yourId)
        {
            if(this.internal[key] != value){
                this.internal[key] = value;
                this.changes[key] = true;
                
                if(this.changeListener[key] != undefined)
                    for(let i in this.changeListener[key]){
                        this.changeListener[key][i](key, value);
                    }
            }
        }
        else
            throw new Error("You are not the owner!");
    }

    get(key)
    {
        return this.internal[key];
    }

    setOnChangeListener(key, callback){
        if(this.changeListener[key] == undefined)
            this.changeListener[key] = [];

        this.changeListener[key].push(callback);
    }

    getUpdateMessage(){
        let output = {};
        for(let key in this.changes){
            output[key] = this.internal[key];
        }

        this.changes = {};
        return output;
    }

    applyUpdateMessage(msg){
        for(let key in msg){
            this.internal[key] = msg[key];

            if(this.changeListener[key] != undefined)
                for(let i in this.changeListener[key]){
                    this.changeListener[key][i](key, msg[key]);
                }
        }
    }

    serialize(){
        let output = {};

        output.id = this.id;
        output.owner = this.owner;
        output.internal = this.internal;

        return output;
    }

    deserialize(input){
        this.id = input.id;
        this.owner = input.owner;
        this.internal = input.internal;

        return this;
    }
}
},{}],5:[function(require,module,exports){
var vMath = require("./VectorMath.js");
var MapObject = require("./MapObject.js");

module.exports = class Map{
    constructor(){
        this.objects = {};
        this.collidableIds = {};
    }

    removeObject(id)
    {
        delete this.objects[id];
        
        if(this.collidableIds[id] != undefined)
            delete this.collidableIds[id];
    }

    addObject(obj){ //Todo: Subtree?
        if(this.objects[obj.id] == undefined)
            this.objects[obj.id] = obj;
        else
            console.error("Error: obj already in map!");

        if(obj.collisionMode != undefined)
            this.collidableIds[obj.id] = true;
    }

    getObject(id)
    {
        return this.objects[id];
    }

    getObjectsNear(pos, radius)
    {
        var output = [];
        for(var key in this.objects)
        {
            if(vMath.len(vMath.sub(this.objects[key].pos, pos)) < radius)
                output.push(this.objects[key]);
        }

        return output;
    }

    getCollidablesNear(pos, radius)
    {
        var output = [];
        for(var key in this.collidableIds)
        {
            if(vMath.len(vMath.sub(this.objects[key].pos, pos)) < radius)
                output.push(this.objects[key]);
        }

        return output;
    }

    checkCollision(obj, radius)
    {
        var candidates = this.getCollidablesNear(obj.pos, radius); //Todo: Set Radius
        var result = [];
        candidates.forEach(function(candidate){
            if(candidate.id != obj.id && obj.intersects(candidate))
                result.push(candidate);
        });

        if(result.length == 0)
            return false;
        else
            return result;
    }

    printInfo()
    {
        console.log(this.serialize());
    }

    serialize()
    {
        let output = {deserializeFunction:"map", data:[]};
        for(var key in this.objects)
            output.data.push(this.objects[key].serialize());

        return output;
    }

    updateDeserializer(deserializer){
        deserializer["map"] = function(input)
        {
            let output = new Map();
            input.forEach(function(value){
                var obj = new MapObject();
                obj.deserialize(value);

                output.addObject(obj);
            });

            return output;
        };

        return deserializer;
    }
}
},{"./MapObject.js":6,"./VectorMath.js":8}],6:[function(require,module,exports){
var SAT = require('sat');
var vMath = require("./VectorMath.js");
var DataObject = require("./DataObject.js");


module.exports = class MapObject{

    constructor(pos, dir, id, texture, dataObject)
    {
        this.id = id;

        this.pos = pos;
        this.dir = dir;
        this.texture = texture;

        if(dataObject != undefined){
            this.dataObject = dataObject;
            this.setListeners();
        }
    }

    setListeners(){
        let theBase = this;
        this.dataObject.setOnChangeListener("pos", function(key, value){
            theBase.changePosDir(value, undefined);
        });

        this.dataObject.setOnChangeListener("dir", function(key, value){
            theBase.changePosDir(undefined, value);
        });
    }

    changePosDir(newPos, newDir)
    {
        if(newPos != undefined)
            this.pos = newPos;

        if(newDir != undefined)            
            this.dir = newDir;

        if(this.collisionMode == "poly")
        {
            if(newPos != undefined){
                this.polygon.pos.x = this.pos.x;
                this.polygon.pos.y = this.pos.y;
            }

            if(newDir != undefined)
                this.polygon.setAngle(newDir);
        }
    }

    makeSpeedChange(factor)
    {
        this.speedChange = factor;
        return this;
    }

    makeCollidableCircle(radius)
    {
        this.collisionMode = "circle";
        this.radius = radius;
        return this;
    }

    makeCollidablePoly(polygon)
    {
        this.collisionMode = "poly";
        this.polygon = polygon;
        this.changePosDir(this.pos, this.dir);
        return this;
    }

    makeCollidableBox(width, height)
    {
        this.collisionMode = "poly";
        var box = new SAT.Box(new SAT.Vector(this.pos.x, this.pos.y), width, height);
        this.collision = box.toPolygon();
        return this;
    }

    intersects(mapObject)
    {
        if(mapObject.collisionMode == undefined || this.collisionMode == undefined)
            return false;
        else
        {
            var response = new SAT.Response();

            //Circle
            if(this.collisionMode == "circle" && mapObject.collisionMode == "circle"){

                //console.log("Pos: " + this.pos.x + "#" + this.pos.y + " obj pos: " + mapObject.pos.x + "#" + mapObject.pos.y);
                //console.log((vMath.len(vMath.sub(this.pos, mapObject.pos))) + " | " + (this.radius + mapObject.radius));
                //console.log(vMath.len(vMath.sub(this.pos, mapObject.pos)) < this.radius + mapObject.radius);

                return vMath.len(vMath.sub(this.pos, mapObject.pos)) < this.radius + mapObject.radius;
            }
            if(this.collisionMode == "circle" && mapObject.collisionMode == "poly"){
                return SAT.testCirclePolygon(new SAT.Circle(new SAT.Vector(this.pos.x, this.pos.y), this.radius), mapObject.polygon, response);
            }

            //poly
            if(this.collisionMode == "poly" && mapObject.collisionMode == "poly"){
                return SAT.testPolygonPolygon(this.polygon, mapObject.polygon, response);
            }
            if(this.collisionMode == "poly" && mapObject.collisionMode == "circle"){
                return SAT.testCirclePolygon(new SAT.Circle(new SAT.Vector(mapObject.pos.x,mapObject.pos.y), mapObject.radius), this.polygon, response);
            }

            console.error("Error: Did not find a coparison method for collsion!");
        }
    }

    serialize()
    {
        var output = {id: this.id, pos: this.pos, dir: this.dir, texture: this.texture};
        if(this.collisionMode != undefined)
            output.collisionMode = this.collisionMode;

        if(this.collisionMode == "poly")
            output.polygon = this.polygon; 

        if(this.collisionMode == "circle")
            output.radius = this.radius;

        if(this.speedChange != undefined)
            output.speedChange = this.speedChange;

        if(this.projectile != undefined)
            output.projectile = this.projectile;

        if(this.dataObject != undefined){
            output.dataObject = this.dataObject.serialize();
        }

        return output; 
    }

    deserialize(input)
    {
        for(var key in input)
            if(key == "dataObject")
                this.dataObject = new DataObject().deserialize(input[key]);
            else
                this[key] = input[key];
        

        if(this.dataObject != undefined)
            this.setListeners();

        if(this.projectile != undefined)
            this.makeProjectile(this.projectile);

        return this;
    }
};
},{"./DataObject.js":4,"./VectorMath.js":8,"sat":11}],7:[function(require,module,exports){
var MapObject = require("./MapObject.js");

module.exports = class Render{
    drawFrame(me, map)
    {
        if(this.resources != undefined)
        {
            var base = this;
            let playerObject = map.getObject(me.owned['playerMapObject']);
            
            var objs = map.getObjectsNear(playerObject.pos, 2000);
            objs.forEach(function(value){ //Todo: Every time?? optimization possible
                if(base.sprites[value.id] == undefined){
                    base.sprites[value.id] = new PIXI.Sprite(base.resources[value.texture].texture);
                    base.sprites[value.id].anchor.x = 0.5;
                    base.sprites[value.id].anchor.y = 0.5;
                    base.stage.addChild(base.sprites[value.id]);
                }

                base.sprites[value.id].rotation = value.dir;
                base.sprites[value.id].position = value.pos;
            });

            //Check if you have to remove objects
            if(objs.length < Object.keys(this.sprites))
            {
                let stillExistingSprites = {};
                for(let i in objs)
                    stillExistingSprites[objs[i].id] = this.sprites[objs[i].id];
                
                for(let i in this.sprites){
                    if(stillExistingSprites[i] == undefined){
                        this.removeSprite(this.sprites[i]);
                    }
                }
            }

            this.pixi.render(this.stage);
        }
    }

    removeSprite(objectId)
    {
        let sprite = this.sprites[objectId];
        delete this.sprites[objectId];
        this.stage.removeChild(sprite)
    }

    constructor(pixi, textures)
    {
        this.stage = new PIXI.Container();
        this.pixi = pixi;

        var base = this;

        var loader = PIXI.loader;
        for(let i in textures)
            loader.add(textures[i], 'graphics/' + textures[i] + '.png');

        loader.once('complete', function(e){
            base.resources = e.resources;
            console.log("Resources loaded");
        });
        loader.load();

        this.pixi.backgroundColor = 0xFFFFFF;
        this.sprites = {};
    }
}
},{"./MapObject.js":6}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
var ClientLogic = require("./ClientLogic.js");
var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var Render = require("./Render.js");
var TechnicalConfig = require("./Config/Technical.js");
var GameplayConfig = require("./Config/Gameplay.js");

//var io = require("socket.io");

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
    setInterval(function(){
        if(me != undefined && data.map != undefined)

            if(me.playerObject == undefined)
                me.playerObject = data.map.getObject(me.owned["playerMapObject"]);

            logic.updateMovement(me, data.map, function(event){
                if(event == "fire"){
                    socket.emit("rise_event", {mode:"fire", pos:me.playerObject.pos, dir:me.playerObject.dir});
                    console.log("Fire");
                }
            });
        
        //logic.updateProjectiles(me, map, projectiles);
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
},{"./ClientLogic.js":1,"./Config/Gameplay.js":2,"./Config/Technical.js":3,"./Map.js":5,"./MapObject.js":6,"./Render.js":7}],10:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],11:[function(require,module,exports){
// Version 0.6.0 - Copyright 2012 - 2016 -  Jim Riecken <jimr@jimr.ca>
//
// Released under the MIT License - https://github.com/jriecken/sat-js
//
// A simple library for determining intersections of circles and
// polygons using the Separating Axis Theorem.
/** @preserve SAT.js - Version 0.6.0 - Copyright 2012 - 2016 - Jim Riecken <jimr@jimr.ca> - released under the MIT License. https://github.com/jriecken/sat-js */

/*global define: false, module: false*/
/*jshint shadow:true, sub:true, forin:true, noarg:true, noempty:true, 
  eqeqeq:true, bitwise:true, strict:true, undef:true, 
  curly:true, browser:true */

// Create a UMD wrapper for SAT. Works in:
//
//  - Plain browser via global SAT variable
//  - AMD loader (like require.js)
//  - Node.js
//
// The quoted properties all over the place are used so that the Closure Compiler
// does not mangle the exposed API in advanced mode.
/**
 * @param {*} root - The global scope
 * @param {Function} factory - Factory that creates SAT module
 */
(function (root, factory) {
  "use strict";
  if (typeof define === 'function' && define['amd']) {
    define(factory);
  } else if (typeof exports === 'object') {
    module['exports'] = factory();
  } else {
    root['SAT'] = factory();
  }
}(this, function () {
  "use strict";

  var SAT = {};

  //
  // ## Vector
  //
  // Represents a vector in two dimensions with `x` and `y` properties.


  // Create a new Vector, optionally passing in the `x` and `y` coordinates. If
  // a coordinate is not specified, it will be set to `0`
  /** 
   * @param {?number=} x The x position.
   * @param {?number=} y The y position.
   * @constructor
   */
  function Vector(x, y) {
    this['x'] = x || 0;
    this['y'] = y || 0;
  }
  SAT['Vector'] = Vector;
  // Alias `Vector` as `V`
  SAT['V'] = Vector;


  // Copy the values of another Vector into this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['copy'] = Vector.prototype.copy = function(other) {
    this['x'] = other['x'];
    this['y'] = other['y'];
    return this;
  };

  // Create a new vector with the same coordinates as this on.
  /**
   * @return {Vector} The new cloned vector
   */
  Vector.prototype['clone'] = Vector.prototype.clone = function() {
    return new Vector(this['x'], this['y']);
  };

  // Change this vector to be perpendicular to what it was before. (Effectively
  // roatates it 90 degrees in a clockwise direction)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['perp'] = Vector.prototype.perp = function() {
    var x = this['x'];
    this['x'] = this['y'];
    this['y'] = -x;
    return this;
  };

  // Rotate this vector (counter-clockwise) by the specified angle (in radians).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Vector} This for chaining.
   */
  Vector.prototype['rotate'] = Vector.prototype.rotate = function (angle) {
    var x = this['x'];
    var y = this['y'];
    this['x'] = x * Math.cos(angle) - y * Math.sin(angle);
    this['y'] = x * Math.sin(angle) + y * Math.cos(angle);
    return this;
  };

  // Reverse this vector.
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reverse'] = Vector.prototype.reverse = function() {
    this['x'] = -this['x'];
    this['y'] = -this['y'];
    return this;
  };
  

  // Normalize this vector.  (make it have length of `1`)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['normalize'] = Vector.prototype.normalize = function() {
    var d = this.len();
    if(d > 0) {
      this['x'] = this['x'] / d;
      this['y'] = this['y'] / d;
    }
    return this;
  };
  
  // Add another vector to this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['add'] = Vector.prototype.add = function(other) {
    this['x'] += other['x'];
    this['y'] += other['y'];
    return this;
  };
  
  // Subtract another vector from this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaiing.
   */
  Vector.prototype['sub'] = Vector.prototype.sub = function(other) {
    this['x'] -= other['x'];
    this['y'] -= other['y'];
    return this;
  };
  
  // Scale this vector. An independant scaling factor can be provided
  // for each axis, or a single scaling factor that will scale both `x` and `y`.
  /**
   * @param {number} x The scaling factor in the x direction.
   * @param {?number=} y The scaling factor in the y direction.  If this
   *   is not specified, the x scaling factor will be used.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['scale'] = Vector.prototype.scale = function(x,y) {
    this['x'] *= x;
    this['y'] *= y || x;
    return this; 
  };
  
  // Project this vector on to another vector.
  /**
   * @param {Vector} other The vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['project'] = Vector.prototype.project = function(other) {
    var amt = this.dot(other) / other.len2();
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Project this vector onto a vector of unit length. This is slightly more efficient
  // than `project` when dealing with unit vectors.
  /**
   * @param {Vector} other The unit vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['projectN'] = Vector.prototype.projectN = function(other) {
    var amt = this.dot(other);
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Reflect this vector on an arbitrary axis.
  /**
   * @param {Vector} axis The vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflect'] = Vector.prototype.reflect = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.project(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Reflect this vector on an arbitrary axis (represented by a unit vector). This is
  // slightly more efficient than `reflect` when dealing with an axis that is a unit vector.
  /**
   * @param {Vector} axis The unit vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflectN'] = Vector.prototype.reflectN = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.projectN(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Get the dot product of this vector and another.
  /**
   * @param {Vector}  other The vector to dot this one against.
   * @return {number} The dot product.
   */
  Vector.prototype['dot'] = Vector.prototype.dot = function(other) {
    return this['x'] * other['x'] + this['y'] * other['y'];
  };
  
  // Get the squared length of this vector.
  /**
   * @return {number} The length^2 of this vector.
   */
  Vector.prototype['len2'] = Vector.prototype.len2 = function() {
    return this.dot(this);
  };
  
  // Get the length of this vector.
  /**
   * @return {number} The length of this vector.
   */
  Vector.prototype['len'] = Vector.prototype.len = function() {
    return Math.sqrt(this.len2());
  };
  
  // ## Circle
  //
  // Represents a circle with a position and a radius.

  // Create a new circle, optionally passing in a position and/or radius. If no position
  // is given, the circle will be at `(0,0)`. If no radius is provided, the circle will
  // have a radius of `0`.
  /**
   * @param {Vector=} pos A vector representing the position of the center of the circle
   * @param {?number=} r The radius of the circle
   * @constructor
   */
  function Circle(pos, r) {
    this['pos'] = pos || new Vector();
    this['r'] = r || 0;
  }
  SAT['Circle'] = Circle;
  
  // Compute the axis-aligned bounding box (AABB) of this Circle.
  //
  // Note: Returns a _new_ `Polygon` each time you call this.
  /**
   * @return {Polygon} The AABB
   */
  Circle.prototype['getAABB'] = Circle.prototype.getAABB = function() {
    var r = this['r'];
    var corner = this["pos"].clone().sub(new Vector(r, r));
    return new Box(corner, r*2, r*2).toPolygon();
  };

  // ## Polygon
  //
  // Represents a *convex* polygon with any number of points (specified in counter-clockwise order)
  //
  // Note: Do _not_ manually change the `points`, `angle`, or `offset` properties. Use the
  // provided setters. Otherwise the calculated properties will not be updated correctly.
  //
  // `pos` can be changed directly.

  // Create a new polygon, passing in a position vector, and an array of points (represented
  // by vectors relative to the position vector). If no position is passed in, the position
  // of the polygon will be `(0,0)`.
  /**
   * @param {Vector=} pos A vector representing the origin of the polygon. (all other
   *   points are relative to this one)
   * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @constructor
   */
  function Polygon(pos, points) {
    this['pos'] = pos || new Vector();
    this['angle'] = 0;
    this['offset'] = new Vector();
    this.setPoints(points || []);
  }
  SAT['Polygon'] = Polygon;
  
  // Set the points of the polygon.
  //
  // Note: The points are counter-clockwise *with respect to the coordinate system*.
  // If you directly draw the points on a screen that has the origin at the top-left corner
  // it will _appear_ visually that the points are being specified clockwise. This is just
  // because of the inversion of the Y-axis when being displayed.
  /**
   * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setPoints'] = Polygon.prototype.setPoints = function(points) {
    // Only re-allocate if this is a new polygon or the number of points has changed.
    var lengthChanged = !this['points'] || this['points'].length !== points.length;
    if (lengthChanged) {
      var i;
      var calcPoints = this['calcPoints'] = [];
      var edges = this['edges'] = [];
      var normals = this['normals'] = [];
      // Allocate the vector arrays for the calculated properties
      for (i = 0; i < points.length; i++) {
        calcPoints.push(new Vector());
        edges.push(new Vector());
        normals.push(new Vector());
      }
    }
    this['points'] = points;
    this._recalc();
    return this;
  };

  // Set the current rotation angle of the polygon.
  /**
   * @param {number} angle The current rotation angle (in radians).
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setAngle'] = Polygon.prototype.setAngle = function(angle) {
    this['angle'] = angle;
    this._recalc();
    return this;
  };

  // Set the current offset to apply to the `points` before applying the `angle` rotation.
  /**
   * @param {Vector} offset The new offset vector.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setOffset'] = Polygon.prototype.setOffset = function(offset) {
    this['offset'] = offset;
    this._recalc();
    return this;
  };

  // Rotates this polygon counter-clockwise around the origin of *its local coordinate system* (i.e. `pos`).
  //
  // Note: This changes the **original** points (so any `angle` will be applied on top of this rotation).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['rotate'] = Polygon.prototype.rotate = function(angle) {
    var points = this['points'];
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].rotate(angle);
    }
    this._recalc();
    return this;
  };

  // Translates the points of this polygon by a specified amount relative to the origin of *its own coordinate
  // system* (i.e. `pos`).
  //
  // This is most useful to change the "center point" of a polygon. If you just want to move the whole polygon, change
  // the coordinates of `pos`.
  //
  // Note: This changes the **original** points (so any `offset` will be applied on top of this translation)
  /**
   * @param {number} x The horizontal amount to translate.
   * @param {number} y The vertical amount to translate.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['translate'] = Polygon.prototype.translate = function (x, y) {
    var points = this['points'];
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].x += x;
      points[i].y += y;
    }
    this._recalc();
    return this;
  };


  // Computes the calculated collision polygon. Applies the `angle` and `offset` to the original points then recalculates the
  // edges and normals of the collision polygon.
  /**
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype._recalc = function() {
    // Calculated points - this is what is used for underlying collisions and takes into account
    // the angle/offset set on the polygon.
    var calcPoints = this['calcPoints'];
    // The edges here are the direction of the `n`th edge of the polygon, relative to
    // the `n`th point. If you want to draw a given edge from the edge value, you must
    // first translate to the position of the starting point.
    var edges = this['edges'];
    // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
    // to the position of the `n`th point. If you want to draw an edge normal, you must first
    // translate to the position of the starting point.
    var normals = this['normals'];
    // Copy the original points array and apply the offset/angle
    var points = this['points'];
    var offset = this['offset'];
    var angle = this['angle'];
    var len = points.length;
    var i;
    for (i = 0; i < len; i++) {
      var calcPoint = calcPoints[i].copy(points[i]);
      calcPoint.x += offset.x;
      calcPoint.y += offset.y;
      if (angle !== 0) {
        calcPoint.rotate(angle);
      }
    }
    // Calculate the edges/normals
    for (i = 0; i < len; i++) {
      var p1 = calcPoints[i];
      var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
      var e = edges[i].copy(p2).sub(p1);
      normals[i].copy(e).perp().normalize();
    }
    return this;
  };
  
  
  // Compute the axis-aligned bounding box. Any current state
  // (translations/rotations) will be applied before constructing the AABB.
  //
  // Note: Returns a _new_ `Polygon` each time you call this.
  /**
   * @return {Polygon} The AABB
   */
  Polygon.prototype["getAABB"] = Polygon.prototype.getAABB = function() {
    var points = this["calcPoints"];
    var len = points.length;
    var xMin = points[0]["x"];
    var yMin = points[0]["y"];
    var xMax = points[0]["x"];
    var yMax = points[0]["y"];
    for (var i = 1; i < len; i++) {
      var point = points[i];
      if (point["x"] < xMin) {
        xMin = point["x"];
      }
      else if (point["x"] > xMax) {
        xMax = point["x"];
      }
      if (point["y"] < yMin) {
        yMin = point["y"];
      }
      else if (point["y"] > yMax) {
        yMax = point["y"];
      }
    }
    return new Box(this["pos"].clone().add(new Vector(xMin, yMin)), xMax - xMin, yMax - yMin).toPolygon();
  };
  

  // ## Box
  //
  // Represents an axis-aligned box, with a width and height.


  // Create a new box, with the specified position, width, and height. If no position
  // is given, the position will be `(0,0)`. If no width or height are given, they will
  // be set to `0`.
  /**
   * @param {Vector=} pos A vector representing the bottom-left of the box (i.e. the smallest x and smallest y value).
   * @param {?number=} w The width of the box.
   * @param {?number=} h The height of the box.
   * @constructor
   */
  function Box(pos, w, h) {
    this['pos'] = pos || new Vector();
    this['w'] = w || 0;
    this['h'] = h || 0;
  }
  SAT['Box'] = Box;

  // Returns a polygon whose edges are the same as this box.
  /**
   * @return {Polygon} A new Polygon that represents this box.
   */
  Box.prototype['toPolygon'] = Box.prototype.toPolygon = function() {
    var pos = this['pos'];
    var w = this['w'];
    var h = this['h'];
    return new Polygon(new Vector(pos['x'], pos['y']), [
     new Vector(), new Vector(w, 0), 
     new Vector(w,h), new Vector(0,h)
    ]);
  };
  
  // ## Response
  //
  // An object representing the result of an intersection. Contains:
  //  - The two objects participating in the intersection
  //  - The vector representing the minimum change necessary to extract the first object
  //    from the second one (as well as a unit vector in that direction and the magnitude
  //    of the overlap)
  //  - Whether the first object is entirely inside the second, and vice versa.
  /**
   * @constructor
   */  
  function Response() {
    this['a'] = null;
    this['b'] = null;
    this['overlapN'] = new Vector();
    this['overlapV'] = new Vector();
    this.clear();
  }
  SAT['Response'] = Response;

  // Set some values of the response back to their defaults.  Call this between tests if
  // you are going to reuse a single Response object for multiple intersection tests (recommented
  // as it will avoid allcating extra memory)
  /**
   * @return {Response} This for chaining
   */
  Response.prototype['clear'] = Response.prototype.clear = function() {
    this['aInB'] = true;
    this['bInA'] = true;
    this['overlap'] = Number.MAX_VALUE;
    return this;
  };

  // ## Object Pools

  // A pool of `Vector` objects that are used in calculations to avoid
  // allocating memory.
  /**
   * @type {Array.<Vector>}
   */
  var T_VECTORS = [];
  for (var i = 0; i < 10; i++) { T_VECTORS.push(new Vector()); }
  
  // A pool of arrays of numbers used in calculations to avoid allocating
  // memory.
  /**
   * @type {Array.<Array.<number>>}
   */
  var T_ARRAYS = [];
  for (var i = 0; i < 5; i++) { T_ARRAYS.push([]); }

  // Temporary response used for polygon hit detection.
  /**
   * @type {Response}
   */
  var T_RESPONSE = new Response();

  // Tiny "point" polygon used for polygon hit detection.
  /**
   * @type {Polygon}
   */
  var TEST_POINT = new Box(new Vector(), 0.000001, 0.000001).toPolygon();

  // ## Helper Functions

  // Flattens the specified array of points onto a unit vector axis,
  // resulting in a one dimensional range of the minimum and
  // maximum value on that axis.
  /**
   * @param {Array.<Vector>} points The points to flatten.
   * @param {Vector} normal The unit vector axis to flatten on.
   * @param {Array.<number>} result An array.  After calling this function,
   *   result[0] will be the minimum value,
   *   result[1] will be the maximum value.
   */
  function flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE;
    var max = -Number.MAX_VALUE;
    var len = points.length;
    for (var i = 0; i < len; i++ ) {
      // The magnitude of the projection of the point onto the normal
      var dot = points[i].dot(normal);
      if (dot < min) { min = dot; }
      if (dot > max) { max = dot; }
    }
    result[0] = min; result[1] = max;
  }
  
  // Check whether two convex polygons are separated by the specified
  // axis (must be a unit vector).
  /**
   * @param {Vector} aPos The position of the first polygon.
   * @param {Vector} bPos The position of the second polygon.
   * @param {Array.<Vector>} aPoints The points in the first polygon.
   * @param {Array.<Vector>} bPoints The points in the second polygon.
   * @param {Vector} axis The axis (unit sized) to test against.  The points of both polygons
   *   will be projected onto this axis.
   * @param {Response=} response A Response object (optional) which will be populated
   *   if the axis is not a separating axis.
   * @return {boolean} true if it is a separating axis, false otherwise.  If false,
   *   and a response is passed in, information about how much overlap and
   *   the direction of the overlap will be populated.
   */
  function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    var rangeA = T_ARRAYS.pop();
    var rangeB = T_ARRAYS.pop();
    // The magnitude of the offset between the two polygons
    var offsetV = T_VECTORS.pop().copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(axis);
    // Project the polygons onto the axis.
    flattenPointsOn(aPoints, axis, rangeA);
    flattenPointsOn(bPoints, axis, rangeB);
    // Move B's range to its position relative to A.
    rangeB[0] += projectedOffset;
    rangeB[1] += projectedOffset;
    // Check if there is a gap. If there is, this is a separating axis and we can stop
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
      T_VECTORS.push(offsetV); 
      T_ARRAYS.push(rangeA); 
      T_ARRAYS.push(rangeB);
      return true;
    }
    // This is not a separating axis. If we're calculating a response, calculate the overlap.
    if (response) {
      var overlap = 0;
      // A starts further left than B
      if (rangeA[0] < rangeB[0]) {
        response['aInB'] = false;
        // A ends before B does. We have to pull A out of B
        if (rangeA[1] < rangeB[1]) { 
          overlap = rangeA[1] - rangeB[0];
          response['bInA'] = false;
        // B is fully inside A.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      // B starts further left than A
      } else {
        response['bInA'] = false;
        // B ends before A ends. We have to push A out of B
        if (rangeA[1] > rangeB[1]) { 
          overlap = rangeA[0] - rangeB[1];
          response['aInB'] = false;
        // A is fully inside B.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      }
      // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
      var absOverlap = Math.abs(overlap);
      if (absOverlap < response['overlap']) {
        response['overlap'] = absOverlap;
        response['overlapN'].copy(axis);
        if (overlap < 0) {
          response['overlapN'].reverse();
        }
      }      
    }
    T_VECTORS.push(offsetV); 
    T_ARRAYS.push(rangeA); 
    T_ARRAYS.push(rangeB);
    return false;
  }
  SAT['isSeparatingAxis'] = isSeparatingAxis;
  
  // Calculates which Voronoi region a point is on a line segment.
  // It is assumed that both the line and the point are relative to `(0,0)`
  //
  //            |       (0)      |
  //     (-1)  [S]--------------[E]  (1)
  //            |       (0)      |
  /**
   * @param {Vector} line The line segment.
   * @param {Vector} point The point.
   * @return  {number} LEFT_VORONOI_REGION (-1) if it is the left region,
   *          MIDDLE_VORONOI_REGION (0) if it is the middle region,
   *          RIGHT_VORONOI_REGION (1) if it is the right region.
   */
  function voronoiRegion(line, point) {
    var len2 = line.len2();
    var dp = point.dot(line);
    // If the point is beyond the start of the line, it is in the
    // left voronoi region.
    if (dp < 0) { return LEFT_VORONOI_REGION; }
    // If the point is beyond the end of the line, it is in the
    // right voronoi region.
    else if (dp > len2) { return RIGHT_VORONOI_REGION; }
    // Otherwise, it's in the middle one.
    else { return MIDDLE_VORONOI_REGION; }
  }
  // Constants for Voronoi regions
  /**
   * @const
   */
  var LEFT_VORONOI_REGION = -1;
  /**
   * @const
   */
  var MIDDLE_VORONOI_REGION = 0;
  /**
   * @const
   */
  var RIGHT_VORONOI_REGION = 1;
  
  // ## Collision Tests

  // Check if a point is inside a circle.
  /**
   * @param {Vector} p The point to test.
   * @param {Circle} c The circle to test.
   * @return {boolean} true if the point is inside the circle, false if it is not.
   */
  function pointInCircle(p, c) {
    var differenceV = T_VECTORS.pop().copy(p).sub(c['pos']);
    var radiusSq = c['r'] * c['r'];
    var distanceSq = differenceV.len2();
    T_VECTORS.push(differenceV);
    // If the distance between is smaller than the radius then the point is inside the circle.
    return distanceSq <= radiusSq;
  }
  SAT['pointInCircle'] = pointInCircle;

  // Check if a point is inside a convex polygon.
  /**
   * @param {Vector} p The point to test.
   * @param {Polygon} poly The polygon to test.
   * @return {boolean} true if the point is inside the polygon, false if it is not.
   */
  function pointInPolygon(p, poly) {
    TEST_POINT['pos'].copy(p);
    T_RESPONSE.clear();
    var result = testPolygonPolygon(TEST_POINT, poly, T_RESPONSE);
    if (result) {
      result = T_RESPONSE['aInB'];
    }
    return result;
  }
  SAT['pointInPolygon'] = pointInPolygon;

  // Check if two circles collide.
  /**
   * @param {Circle} a The first circle.
   * @param {Circle} b The second circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   the circles intersect.
   * @return {boolean} true if the circles intersect, false if they don't. 
   */
  function testCircleCircle(a, b, response) {
    // Check if the distance between the centers of the two
    // circles is greater than their combined radius.
    var differenceV = T_VECTORS.pop().copy(b['pos']).sub(a['pos']);
    var totalRadius = a['r'] + b['r'];
    var totalRadiusSq = totalRadius * totalRadius;
    var distanceSq = differenceV.len2();
    // If the distance is bigger than the combined radius, they don't intersect.
    if (distanceSq > totalRadiusSq) {
      T_VECTORS.push(differenceV);
      return false;
    }
    // They intersect.  If we're calculating a response, calculate the overlap.
    if (response) { 
      var dist = Math.sqrt(distanceSq);
      response['a'] = a;
      response['b'] = b;
      response['overlap'] = totalRadius - dist;
      response['overlapN'].copy(differenceV.normalize());
      response['overlapV'].copy(differenceV).scale(response['overlap']);
      response['aInB']= a['r'] <= b['r'] && dist <= b['r'] - a['r'];
      response['bInA'] = b['r'] <= a['r'] && dist <= a['r'] - b['r'];
    }
    T_VECTORS.push(differenceV);
    return true;
  }
  SAT['testCircleCircle'] = testCircleCircle;
  
  // Check if a polygon and a circle collide.
  /**
   * @param {Polygon} polygon The polygon.
   * @param {Circle} circle The circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonCircle(polygon, circle, response) {
    // Get the position of the circle relative to the polygon.
    var circlePos = T_VECTORS.pop().copy(circle['pos']).sub(polygon['pos']);
    var radius = circle['r'];
    var radius2 = radius * radius;
    var points = polygon['calcPoints'];
    var len = points.length;
    var edge = T_VECTORS.pop();
    var point = T_VECTORS.pop();
    
    // For each edge in the polygon:
    for (var i = 0; i < len; i++) {
      var next = i === len - 1 ? 0 : i + 1;
      var prev = i === 0 ? len - 1 : i - 1;
      var overlap = 0;
      var overlapN = null;
      
      // Get the edge.
      edge.copy(polygon['edges'][i]);
      // Calculate the center of the circle relative to the starting point of the edge.
      point.copy(circlePos).sub(points[i]);
      
      // If the distance between the center of the circle and the point
      // is bigger than the radius, the polygon is definitely not fully in
      // the circle.
      if (response && point.len2() > radius2) {
        response['aInB'] = false;
      }
      
      // Calculate which Voronoi region the center of the circle is in.
      var region = voronoiRegion(edge, point);
      // If it's the left region:
      if (region === LEFT_VORONOI_REGION) {
        // We need to make sure we're in the RIGHT_VORONOI_REGION of the previous edge.
        edge.copy(polygon['edges'][prev]);
        // Calculate the center of the circle relative the starting point of the previous edge
        var point2 = T_VECTORS.pop().copy(circlePos).sub(points[prev]);
        region = voronoiRegion(edge, point2);
        if (region === RIGHT_VORONOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge);
            T_VECTORS.push(point); 
            T_VECTORS.push(point2);
            return false;
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
        T_VECTORS.push(point2);
      // If it's the right region:
      } else if (region === RIGHT_VORONOI_REGION) {
        // We need to make sure we're in the left region on the next edge
        edge.copy(polygon['edges'][next]);
        // Calculate the center of the circle relative to the starting point of the next edge.
        point.copy(circlePos).sub(points[next]);
        region = voronoiRegion(edge, point);
        if (region === LEFT_VORONOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge); 
            T_VECTORS.push(point);
            return false;              
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
      // Otherwise, it's the middle region:
      } else {
        // Need to check if the circle is intersecting the edge,
        // Change the edge into its "edge normal".
        var normal = edge.perp().normalize();
        // Find the perpendicular distance between the center of the 
        // circle and the edge.
        var dist = point.dot(normal);
        var distAbs = Math.abs(dist);
        // If the circle is on the outside of the edge, there is no intersection.
        if (dist > 0 && distAbs > radius) {
          // No intersection
          T_VECTORS.push(circlePos); 
          T_VECTORS.push(normal); 
          T_VECTORS.push(point);
          return false;
        } else if (response) {
          // It intersects, calculate the overlap.
          overlapN = normal;
          overlap = radius - dist;
          // If the center of the circle is on the outside of the edge, or part of the
          // circle is on the outside, the circle is not fully inside the polygon.
          if (dist >= 0 || overlap < 2 * radius) {
            response['bInA'] = false;
          }
        }
      }
      
      // If this is the smallest overlap we've seen, keep it. 
      // (overlapN may be null if the circle was in the wrong Voronoi region).
      if (overlapN && response && Math.abs(overlap) < Math.abs(response['overlap'])) {
        response['overlap'] = overlap;
        response['overlapN'].copy(overlapN);
      }
    }
    
    // Calculate the final overlap vector - based on the smallest overlap.
    if (response) {
      response['a'] = polygon;
      response['b'] = circle;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    T_VECTORS.push(circlePos); 
    T_VECTORS.push(edge); 
    T_VECTORS.push(point);
    return true;
  }
  SAT['testPolygonCircle'] = testPolygonCircle;
  
  // Check if a circle and a polygon collide.
  //
  // **NOTE:** This is slightly less efficient than polygonCircle as it just
  // runs polygonCircle and reverses everything at the end.
  /**
   * @param {Circle} circle The circle.
   * @param {Polygon} polygon The polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testCirclePolygon(circle, polygon, response) {
    // Test the polygon against the circle.
    var result = testPolygonCircle(polygon, circle, response);
    if (result && response) {
      // Swap A and B in the response.
      var a = response['a'];
      var aInB = response['aInB'];
      response['overlapN'].reverse();
      response['overlapV'].reverse();
      response['a'] = response['b'];
      response['b'] = a;
      response['aInB'] = response['bInA'];
      response['bInA'] = aInB;
    }
    return result;
  }
  SAT['testCirclePolygon'] = testCirclePolygon;
  
  // Checks whether polygons collide.
  /**
   * @param {Polygon} a The first polygon.
   * @param {Polygon} b The second polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonPolygon(a, b, response) {
    var aPoints = a['calcPoints'];
    var aLen = aPoints.length;
    var bPoints = b['calcPoints'];
    var bLen = bPoints.length;
    // If any of the edge normals of A is a separating axis, no intersection.
    for (var i = 0; i < aLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, a['normals'][i], response)) {
        return false;
      }
    }
    // If any of the edge normals of B is a separating axis, no intersection.
    for (var i = 0;i < bLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, b['normals'][i], response)) {
        return false;
      }
    }
    // Since none of the edge normals of A or B are a separating axis, there is an intersection
    // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
    // final overlap vector.
    if (response) {
      response['a'] = a;
      response['b'] = b;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    return true;
  }
  SAT['testPolygonPolygon'] = testPolygonPolygon;

  return SAT;
}));

},{}]},{},[9]);
