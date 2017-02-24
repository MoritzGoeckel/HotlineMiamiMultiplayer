var vMath = require("./VectorMath.js");
var MapObject = require("./MapObject.js");

module.exports = class Map{
    constructor(){
        this.objects = {};
        this.collidableIds = {};
    }

    setRemoveObjectListener(callback){
        this.removeObjectListener = callback;
    }

    removeObject(id)
    {
        if(this.removeObjectListener != undefined){
            this.removeObjectListener(this.objects[id]);
        }

        delete this.objects[id];
        
        if(this.collidableIds[id] != undefined)
            delete this.collidableIds[id];
    }

    addObject(obj){ //Todo: Subtree?
        if(this.objects[obj.id] == undefined)
            this.objects[obj.id] = obj;
        else
            console.error("Error: obj already in map!");

        if(obj.collisionMode != undefined)
            this.collidableIds[obj.id] = true;
    }

    getObject(id)
    {
        return this.objects[id];
    }

    getObjectsNear(pos, radius)
    {
        var output = [];
        for(var key in this.objects)
        {
            if(vMath.len(vMath.sub(this.objects[key].pos, pos)) < radius)
                output.push(this.objects[key]);
        }

        return output;
    }

    getCollidablesNear(pos, radius)
    {
        var output = [];
        for(var key in this.collidableIds)
        {
            if(vMath.len(vMath.sub(this.objects[key].pos, pos)) < radius)
                output.push(this.objects[key]);
        }

        return output;
    }

    checkCollision(obj, radius)
    {
        var candidates = this.getCollidablesNear(obj.pos, radius); //Todo: Set Radius
        var result = [];
        candidates.forEach(function(candidate){
            if(candidate.id != obj.id && obj.intersects(candidate))
                result.push(candidate);
        });

        if(result.length == 0)
            return false;
        else
            return result;
    }

    printInfo()
    {
        console.log(this.serialize());
    }

    serialize()
    {
        let output = {deserializeFunction:"map", data:[]};
        for(var key in this.objects)
        {
            if(this.objects[key].dontSerialize != true)
                output.data.push(this.objects[key].serialize());
        }

        return output;
    }

    updateDeserializer(deserializer){
        deserializer["map"] = function(input)
        {
            let output = new Map();
            input.forEach(function(value){
                var obj = new MapObject();
                obj.deserialize(value);

                output.addObject(obj);
            });

            return output;
        };

        return deserializer;
    }
}