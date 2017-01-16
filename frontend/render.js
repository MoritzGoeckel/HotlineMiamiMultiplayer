class Renderer{
    drawFrame(players, me, map)
    {
        if(this.resources != undefined)
        {
            for(var index in players)
            {
                this.drawPlayer(players[index]);   
            }

            this.drawPlayer(me);

            this.pixi.render(this.stage);

            //me.dir++;
        }
    }

    drawPlayer(player)
    {
        if(this.sprites[player.id] == undefined)
        {
            //Has no sprite
            this.sprites[player.id] = new PIXI.Sprite(this.resources.player.texture);
            this.sprites[player.id].anchor.x = 0.5;
            this.sprites[player.id].anchor.y = 0.5;
            this.stage.addChild(this.sprites[player.id]);
        }
        else
        {
            //Already has a sprite
        }

        this.sprites[player.id].position = player.pos;
        this.sprites[player.id].rotation = player.dir;
    }

    constructor(players, map, pixi)
    {
        this.stage = new PIXI.Container();
        this.pixi = pixi;
        this.sprites = {};

        var base = this;

        var loader = PIXI.loader;
        loader.add('player', 'graphics/player.png');
        loader.once('complete', function(e){
            base.resources = e.resources;
            console.log("Resources loaded");
        });
        loader.load();

        this.pixi.backgroundColor = 0xFFFFFF;
    }
}