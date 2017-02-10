module.exports = class Player{
    constructor(id, socket)
    {
        this.id = id;
        this.socket = socket;
        this.ownedObjects = {};
    }

    addOwnedObject(name, id)
    {
        this.ownedObjects[name] = id;
        this.sendToClient();
    }

    getOwnedObject(name){
        return this.ownedObjects[name];
    }

    removeOwnedObject(name)
    {
        delete this.ownedObjects[name];
        this.sendToClient();
    }

    sendToClient()
    {
        this.socket.emit("you_player_info", {id:this.id, owned:this.ownedObjects});
    }

    sendToOthers()
    {
        this.socket.broadcast.emit("player_info", {id:this.id});
    }

    sendObject(id, obj)
    {
        this.socket.emit("set", {id:id, obj:obj});
    }

    sendUpdate(obj)
    {
        this.socket.emit("update", obj);
    }
}