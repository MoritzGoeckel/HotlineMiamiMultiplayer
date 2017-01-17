module.exports = class Player{
    constructor(id, pos, dir, socket)
    {
        this.id = id;
        this.pos = pos;
        this.dir = dir;
        this.socket = socket;
        this.changes = [];
    }

    serialize()
    {
        return {id:this.id, pos:this.pos, dir:this.dir};
    }
}