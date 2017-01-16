function updateGame(players, me, map, keys, mouse)
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
        var courserToPlayer = vecSub(mouse.pos, me.pos);
        var newDir = Math.atan2(courserToPlayer.y, courserToPlayer.x);

        if(newDir != me.dir)
            changeMe("dir", newDir);
        
        courserToPlayer = vecNorm(courserToPlayer);
        var movement = {x:0, y:0};

        //W
        if(keys["87"])
        {
            movement = vecAdd(movement, courserToPlayer);
        }
        //S
        if(keys["83"])
        {
            movement = vecSub(movement, courserToPlayer);
        }
        //A
        if(keys["68"])
        {
            movement = vecAdd(movement, vecOrtho(courserToPlayer));
        }
        //D
        if(keys["65"])
        {
            movement = vecSub(movement, vecOrtho(courserToPlayer));
        }

        if(movement.x != 0 || movement.y != 0)
        {
            movement = vecNorm(movement);
            movement = vecMultScalar(movement, 3);
            changeMe("pos", vecAdd(me.pos, movement));
        }
    }
    
    //console.log(keys);

    //Todo game logic / prediction
}