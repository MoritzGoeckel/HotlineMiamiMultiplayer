module.exports = class{
    constructor(owner, id)
    {
        this.id = id;
        this.owner = owner;
        this.internal = {};
        this.changeListener = {};
    }

    setAsOwner(yourId, key, value){
        if(this.owner == yourId)
        {
            if(this.internal[key] != value){
                this.internal[key] = value;
                this.changes[key] = true;
                for(let listener in this.changeListener[key])
                    listener(value);
            }
        }
        else
            throw new Error("You are not the owner!");
    }

    get(key)
    {
        return this.internal[key];
    }

    setOnChangeListener(key, callback){
        if(this.changeListener[key] == undefined)
            this.changeListener = [];

        this.changeListener[key].push(callback);
    }

    getUpdateMessage(){
        let output = {};
        for(let key in this.changes){
            output[key] = this.internal[key];
        }

        this.changes = {};
        return output;
    }

    applyUpdateMessage(msg){
        for(let key in msg){
            this.internal[key] = msg[key];
            for(let listener in this.changeListener[key])
                listener(msg[key]);
        }
    }
}