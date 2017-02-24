var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var vMath = require("./VectorMath.js");
var GameplayConfig = require('./config/Gameplay');

module.exports = class{
    constructor(){
        this.projectiles = {};
        this.lastId = 0;
    }

    addProjectile(map, speed, position, direction, texture, playerId){
        let now = new Date().getTime();
        let theBase = this;

        let id = "p_" + this.lastId++;

        let obj = new MapObject(position, direction, id, texture, undefined).makeCollidableCircle(4).makeDontSerialize().setZValue(-0.5); //Client side
        obj.movement = {startPos:position, startTimestamp:now, speed:speed, direction:direction};
        obj.bulletOwnerId = playerId;

        map.addObject(obj);
        this.projectiles[id] = true;

        //Remove projectiles that did not hit after some time
        setTimeout(function(){
            if(theBase.projectiles[id] != undefined){
                map.removeObject(id);
                delete theBase.projectiles[id];
            }
        }, GameplayConfig.projectileDespawnTimeout);
    }

    update(map, onHitObject, onHitPlayer){
        let now = new Date().getTime();

        for(let id in this.projectiles)
        {
            let theBase = this;
            let obj = map.getObject(id);
            if(obj != undefined)
            {
                //Todo: Sometimes missing because of too heigh speed
                obj.changePosDir(vMath.add(obj.movement.startPos, vMath.multScalar({x:Math.cos(obj.movement.direction), y:Math.sin(obj.movement.direction)}, (now - obj.movement.startTimestamp) * obj.movement.speed)), undefined);

                let removeBullet = function(){
                    map.removeObject(id);
                    delete theBase.projectiles[id];
                }

                var collidingObjs = map.checkCollision(obj, 500);
                if(collidingObjs != false){
                    for(let a in collidingObjs){
                        if(collidingObjs[a].collisionMode != undefined && collidingObjs[a].speedChange == undefined)
                        {
                            onHitObject(collidingObjs[a], {x:Math.cos(obj.movement.direction), y:Math.sin(obj.movement.direction)}, removeBullet);
                        }

                        if(collidingObjs[a].collisionMode != undefined && collidingObjs[a].playerId != undefined && collidingObjs[a].playerId != obj.bulletOwnerId)
                        {
                            onHitPlayer(collidingObjs[a].playerId, {x:Math.cos(obj.movement.direction), y:Math.sin(obj.movement.direction)}, removeBullet);
                        }
                    }
                }
            }
        }
    }
}