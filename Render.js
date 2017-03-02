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
                if(base.sprites[value.id] == undefined){
                    base.sprites[value.id] = new PIXI.Sprite(base.resources[value.texture].texture);
                    base.sprites[value.id].anchor.x = .5;
                    base.sprites[value.id].anchor.y = .5;

                    if(value.render_z != undefined)
                        base.sprites[value.id].z = value.render_z;
                    else
                        base.sprites[value.id].z = 0;

                    base.stage.addChild(base.sprites[value.id]);

                    //Sort z values
                    function depthCompare(a, b) { if (a.z < b.z) return -1; if (a.z > b.z) return 1; return 0;}
                    base.stage.children.sort(depthCompare);
                }

                base.sprites[value.id].rotation = value.dir;
                base.sprites[value.id].position = value.pos;
            });

            //Check if you have to remove objects
            if(objs.length < Object.keys(this.sprites).length)
            {
                let stillExistingSprites = {};
                for(let i in objs)
                    stillExistingSprites[objs[i].id] = this.sprites[objs[i].id];
                
                for(let i in this.sprites){
                    if(stillExistingSprites[i] == undefined){
                        this.removeSprite(i);
                    }
                }
            }
            
            this.pixi.render(this.stage);
        }
    }

    addSprite(sprite){
        this.stage.addChild(sprite);
    }

    removeSprite(objectId)
    {
        let sprite = this.sprites[objectId];
        delete this.sprites[objectId];
        this.stage.removeChild(sprite)
    }

    getTexture(name){
        return this.resources[name].texture;
    }

    constructor(pixi, textures, callback)
    {
        this.stage = new PIXI.Container();
        this.pixi = pixi;

        var base = this;

        var loader = PIXI.loader;
        for(let i in textures)
            loader.add(textures[i], 'graphics/' + textures[i] + '.png');

        loader.once('complete', function(e){
            base.resources = e.resources;
            console.log("Resources loaded");
            callback();
        });
        loader.load();

        this.pixi.backgroundColor = 0xFFFFFF;
        this.sprites = {};
    }
}