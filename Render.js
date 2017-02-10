var MapObject = require("./MapObject.js");

module.exports = class Render{
    drawFrame(me, map)
    {
        if(this.resources != undefined)
        {
            var base = this;

            let playerObject = map.getObject(me.owned['playerMapObject']);
            
            var objs = map.getObjectsNear(playerObject.pos, 2000);
            objs.forEach(function(value){ //Todo: Every time?? optimization possible
                if(value.sprite == undefined){
                    value.sprite = new PIXI.Sprite(base.resources[value.texture].texture);
                    value.sprite.anchor.x = 0.5;
                    value.sprite.anchor.y = 0.5;
                    base.stage.addChild(value.sprite);
                }

                value.sprite.rotation = value.dir;
                value.sprite.position = value.pos;
            });

            this.pixi.render(this.stage);
        }
    }

    removeSprite(sprite)
    {
        this.stage.removeChild(sprite)
    }

    constructor(pixi)
    {
        this.stage = new PIXI.Container();
        this.pixi = pixi;

        var base = this;

        var loader = PIXI.loader;
        loader.add('player', 'graphics/player.png');
        loader.add('player_max', 'graphics/player_max.png');

        loader.once('complete', function(e){
            base.resources = e.resources;
            console.log("Resources loaded");
        });
        loader.load();

        this.pixi.backgroundColor = 0xFFFFFF;
    }
}