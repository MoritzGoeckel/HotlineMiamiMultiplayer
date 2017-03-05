module.exports = class{
    constructor(textureNames, render){

        let textures = [];
        for(let i = 0; i < textureNames.length; i++){
            textures.push(render.getTexture(textureNames[i]));
        }

        this.sprite = new PIXI.extras.AnimatedSprite(textures);
        this.sprite.loop = true;
        this.sprite.animationSpeed = 0.1;
        this.sprite.gotoAndPlay(0);
        this.sprite.anchor.x = .5;
        this.sprite.anchor.y = .5;

        this.sprite.z = 10;

        render.addSprite(this.sprite);
    }

    setPosition(pos){
        this.sprite.position = pos;
    }

    getPosition(){
        return this.sprite.position;
    }
}