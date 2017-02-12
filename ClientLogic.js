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

    updateProjectiles(me, map, projectiles)
    {

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