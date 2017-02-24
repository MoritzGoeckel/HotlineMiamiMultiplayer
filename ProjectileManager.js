var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var vMath = require("./VectorMath.js");

module.exports = class{
    constructor(){
        this.projectiles = {};
        this.lastId = 0;
    }

    addProjectile(map, speed, position, direction, texture, playerId){
        let theBase = this;

        let id = "p_" + this.lastId++;

        let obj = new MapObject(position, direction, id, texture, undefined).makeCollidableCircle(4); //Client side
        obj.movement = {x:Math.cos(direction) * speed, y:Math.sin(direction) * speed};
        obj.bulletOwnerId = playerId;

        map.addObject(obj);
        this.projectiles[id] = true;
    }

    update(map, onHitObject, onHitPlayer){
        for(let id in this.projectiles)
        {
            let theBase = this;
            let obj = map.getObject(id);
            if(obj != undefined)
            {
                obj.changePosDir(vMath.add(obj.pos, obj.movement), undefined);

                let removeBullet = function(){
                    map.removeObject(id);
                    delete theBase.projectiles[id];
                }

                var collidingObjs = map.checkCollision(obj, 500);
                if(collidingObjs != false){
                    for(let a in collidingObjs){
                        if(collidingObjs[a].collisionMode != undefined && collidingObjs[a].speedChange == undefined)
                        {
                            onHitObject(collidingObjs[a], removeBullet);
                        }

                        if(collidingObjs[a].collisionMode != undefined && collidingObjs[a].playerId != undefined && collidingObjs[a].playerId != obj.bulletOwnerId)
                        {
                            onHitPlayer(collidingObjs[a].playerId, removeBullet);
                        }
                    }
                }
            }
        }
    }
}