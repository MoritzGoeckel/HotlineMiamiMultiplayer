var vMath = require("./VectorMath.js");

module.exports = class{
    constructor(pos){
        this.pos = pos;
    }

    update(mousePos, playerPos, cross){
        /*let player_cross = vMath.sub(cross.getPosition(), playerPos);
        let len = vMath.len(player_cross) / 300;

        if(len > 1)
            len = 1;
        
        console.log(len);

        this.pos = vMath.add(playerPos, vMath.multScalar(vMath.norm(player_cross), len * 300));*/

        //Todo: Camera

        this.pos = playerPos;
    }

    setPosition(pos){
        this.pos = pos;
    }

    getPosition(){
        return this.pos;
    }
}