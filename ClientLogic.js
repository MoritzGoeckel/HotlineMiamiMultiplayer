var vMath = require("./VectorMath.js");
var gameplayConfig = require("./config/Gameplay.js");

module.exports = class ClientLogic {

    constructor(){
        this.lastUpdateMovement = new Date().getTime();
        this.lastFireTime = this.lastUpdateMovement;
        this.fireRate = 1000 / 10;
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

    getMousePos(){
        return this.mouse.pos;
    }

    initKeyboardInput(){
        this.keys = [];
        let theBase = this;
        window.onkeyup = function(e) {theBase.keys[e.keyCode]=false;}
        window.onkeydown = function(e) {theBase.keys[e.keyCode]=true;}
    }

    tryChange(me, map, newPos){

        var oldPos = me.playerObject.pos;

        //Duplicated code
        function changeMe(key, value)
        {
            if(key == "dir" || key == "pos"){ //Could also be other things
                me.playerObject.dataObject.setAsOwner(me.id, key, value);
            }
        }

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
                var alternativeNewPos = vMath.add(oldPos, vMath.multScalar(movement, speedChange));
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

            //W
            if(this.keys["87"])
            {
                movement = vMath.add(movement, {x:0, y:-1});
            }
            //S
            if(this.keys["83"])
            {
                movement = vMath.add(movement, {x:0, y:1});
            }
            //A
            if(this.keys["68"])
            {
                movement = vMath.add(movement, {x:1, y:0});
            }
            //D
            if(this.keys["65"])
            {
                movement = vMath.add(movement, {x:-1, y:0});
            }

            if(movement.x != 0 || movement.y != 0)
            {
                movement = vMath.norm(movement);
                movement = vMath.multScalar(movement, gameplayConfig.movementSpeed * delta);

                let movementX = {x:movement.x, y:0};
                let movementY = {x:0, y:movement.y};
                
                //Check collision
                this.tryChange(me, map, vMath.add(me.playerObject.pos, movementX));
                this.tryChange(me, map, vMath.add(me.playerObject.pos, movementY));
            }

            if(this.mouse.buttonsArray[0] && now - this.lastFireTime > this.fireRate)
            {
                this.lastFireTime = now;
                riseEvent("fire");
            }
        }
        
        //console.log(keys);

        //Todo game logic / prediction
    }
}