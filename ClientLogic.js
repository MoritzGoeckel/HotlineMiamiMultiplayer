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