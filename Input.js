module.exports = class{

    constructor(element){

        let theBase = this;

        let moveCallback = function(e){
            var movementX = e.movementX ||
                e.mozMovementX          ||
                e.webkitMovementX       ||
                0,
            movementY = e.movementY ||
                e.mozMovementY      ||
                e.webkitMovementY   ||
                0;

            theBase.position.x += movementX;
            theBase.position.y += movementY;
        }

        let changeCallback = function(e){
            console.log(e);

            if (document.pointerLockElement === element ||
                document.mozPointerLockElement === element ||
                document.webkitPointerLockElement === element) {
                // Pointer was just locked
                // Enable the mousemove listener
                document.addEventListener("mousemove", moveCallback, false);
            } else {
                // Pointer was just unlocked
                // Disable the mousemove listener
                document.removeEventListener("mousemove", moveCallback, false);
                this.unlockHook(this.element);
            }
        }

        document.addEventListener('pointerlockchange', changeCallback, false);
        document.addEventListener('mozpointerlockchange', changeCallback, false);
        document.addEventListener('webkitpointerlockchange', changeCallback, false);

        element.requestPointerLock = element.requestPointerLock ||
			     element.mozRequestPointerLock ||
			     element.webkitRequestPointerLock;

        element.onclick = function(){
            element.requestPointerLock();
            console.log("Requested");
        };

        this.position = {x:0, y:0};

        this.buttonsArray = [false, false, false, false, false, false, false, false, false];
        document.onmousedown = function(e) {
            theBase.buttonsArray[e.button] = true;
        };
        document.onmouseup = function(e) {
            theBase.buttonsArray[e.button] = false;
        };

        this.keys = [];
        window.onkeyup = function(e) {theBase.keys[e.keyCode]=false;}
        window.onkeydown = function(e) {theBase.keys[e.keyCode]=true;}
    }

    getMousePosition(){
        return this.position;
    }

    getMouseButtons(){
        return this.buttonsArray;
    }

    getKeyboard(){
        return this.keys;
    }
}