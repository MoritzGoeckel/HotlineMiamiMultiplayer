var Map = require("./Map.js");
var MapObject = require("./MapObject.js");
var vMath = require("./VectorMath.js");

module.exports = class{
    constructor(){
        this.projectiles = {};
        this.lastId = 0;
    }

    addProjectile(map, speed, position, direction, texture){
        let theBase = this;

        let id = "p_" + this.lastId++;

        let obj = new MapObject(position, direction, id, texture, undefined).makeCollidableCircle(4); //Client side
        obj.movement = {x:Math.cos(direction) * speed, y:Math.sin(direction) * speed};
        map.addObject(obj);
        this.projectiles[id] = true;
    }

    update(map){
        for(let id in this.projectiles)
        {
            let obj = map.getObject(id);
            obj.changePosDir(vMath.add(obj.pos, obj.movement), undefined);

            var collidingObjs = map.checkCollision(obj, 500);
            if(collidingObjs != false){
                for(let a in collidingObjs){
                    if(collidingObjs[a].collisionMode != undefined && collidingObjs[a].speedChange == undefined)
                    {
                        console.log("Intersect with collidable"); //Todo: Handle on server
                        map.removeObject(id);
                        delete this.projectiles[id];
                    }

                    if(collidingObjs[a].collisionMode != undefined && collidingObjs[a].playerId != undefined)
                    {
                        console.log("Intersect with player: " + collidingObjs[a].playerId); //Todo: Handle on server
                    }
                }
            }
        }
    }
}