var SAT = require('sat');
var vMath = require("./VectorMath.js");

module.exports = class MapObject{

    constructor(pos, dir, id, texture)
    {
        this.pos = pos;
        this.id = id;
        this.dir = dir;
        this.texture = texture;
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

    makeCollidableCircle(radius)
    {
        this.collisionMode = "circle";
        this.radius = radius;
    }

    makeCollidablePoly(polygon)
    {
        this.collisionMode = "poly";
        this.polygon = polygon;
        this.changePosDir(this.pos, this.dir);
    }

    makeCollidableBox(width, height)
    {
        this.collisionMode = "poly";
        var box = new SAT.Box(new SAT.Vector(this.pos.x, this.pos.y), width, height);
        this.collision = box.toPolygon();
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
            output.polygon = this.radius;

        return output; 
    }

    deserialize(input)
    {
        for(var key in input)
            this[key] = input[key];
    }
};