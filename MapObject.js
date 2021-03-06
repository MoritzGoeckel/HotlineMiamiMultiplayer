var SAT = require('sat');
var vMath = require("./VectorMath.js");
var DataObject = require("./DataObject.js");


module.exports = class MapObject{

    constructor(pos, dir, id, texture, dataObject)
    {
        this.id = id;

        this.pos = pos;
        this.dir = dir;
        this.texture = texture;

        if(dataObject != undefined){
            this.dataObject = dataObject;
            this.setListeners();
        }
    }

    setListeners(){
        let theBase = this;
        this.dataObject.setOnChangeListener("pos", function(key, value){
            theBase.changePosDir(value, undefined);
        });

        this.dataObject.setOnChangeListener("dir", function(key, value){
            theBase.changePosDir(undefined, value);
        });
    }

    changePosDir(newPos, newDir)
    {
        if(newPos != undefined)
            this.pos = newPos;

        if(newDir != undefined)            
            this.dir = newDir;

        if(this.collisionMode == "poly")
        {
            if(newPos != undefined){
                this.polygon.pos.x = this.pos.x;
                this.polygon.pos.y = this.pos.y;
            }

            if(newDir != undefined)
                this.polygon.setAngle(newDir);
        }
    }

    setZValue(value){
        this.render_z = value;
        return this;
    }

    makePlayer(playerId){
        this.playerId = playerId;
        return this;
    }

    makeDontSerialize(){
        this.dontSerialize = true;
        return this;
    }

    makeSpeedChange(factor)
    {
        this.speedChange = factor;
        return this;
    }

    makeCollidableCircle(radius)
    {
        this.collisionMode = "circle";
        this.radius = radius;
        return this;
    }

    makeDontEnlistCollidable()
    {
        this.dontEnlistAsCollidable = true;
        return this;
    }

    makeCollidablePoly(polygon)
    {
        this.collisionMode = "poly";
        this.polygon = polygon;
        this.changePosDir(this.pos, this.dir);
        return this;
    }

    makeCollidableBox(width, height)
    {
        this.collisionMode = "poly";
        var box = new SAT.Box(new SAT.Vector(this.pos.x - width / 2, this.pos.y - height / 2), width, height);
        this.polygon = box.toPolygon();
        return this;
    }

    intersects(mapObject)
    {
        if(mapObject.collisionMode == undefined || this.collisionMode == undefined)
            return false;
        else
        {
            var response = new SAT.Response();

            //Circle
            if(this.collisionMode == "circle" && mapObject.collisionMode == "circle"){

                //console.log("Pos: " + this.pos.x + "#" + this.pos.y + " obj pos: " + mapObject.pos.x + "#" + mapObject.pos.y);
                //console.log((vMath.len(vMath.sub(this.pos, mapObject.pos))) + " | " + (this.radius + mapObject.radius));
                //console.log(vMath.len(vMath.sub(this.pos, mapObject.pos)) < this.radius + mapObject.radius);

                return vMath.len(vMath.sub(this.pos, mapObject.pos)) < this.radius + mapObject.radius;
            }
            if(this.collisionMode == "circle" && mapObject.collisionMode == "poly"){
                return SAT.testCirclePolygon(new SAT.Circle(new SAT.Vector(this.pos.x, this.pos.y), this.radius), mapObject.polygon, response);
            }

            //poly
            if(this.collisionMode == "poly" && mapObject.collisionMode == "poly"){
                return SAT.testPolygonPolygon(this.polygon, mapObject.polygon, response);
            }
            if(this.collisionMode == "poly" && mapObject.collisionMode == "circle"){
                return SAT.testCirclePolygon(new SAT.Circle(new SAT.Vector(mapObject.pos.x,mapObject.pos.y), mapObject.radius), this.polygon, response);
            }

            console.error("Error: Did not find a coparison method for collsion!");
        }
    }

    serialize()
    {
        var output = {id: this.id, pos: this.pos, dir: this.dir, texture: this.texture};
        if(this.collisionMode != undefined)
            output.collisionMode = this.collisionMode;

        if(this.collisionMode == "poly")
            output.polygon = this.polygon; 

        if(this.collisionMode == "circle")
            output.radius = this.radius;

        if(this.speedChange != undefined)
            output.speedChange = this.speedChange;

        if(this.projectile != undefined)
            output.projectile = this.projectile;

        if(this.render_z != undefined)
            output.render_z = this.render_z;

        if(this.dataObject != undefined){
            output.dataObject = this.dataObject.serialize();
        }

        if(this.playerId != undefined)
            output.playerId = this.playerId;

        if(this.dontSerialize != undefined && this.dontSerialize == true)
            throw new Error("This object should not be serialized!");

        return output; 
    }

    deserialize(input)
    {
        for(var key in input)
            if(key == "dataObject")
                this.dataObject = new DataObject().deserialize(input[key]);
            else
                this[key] = input[key];
        

        if(this.dataObject != undefined)
            this.setListeners();

        if(this.projectile != undefined)
            this.makeProjectile(this.projectile);

        return this;
    }
};