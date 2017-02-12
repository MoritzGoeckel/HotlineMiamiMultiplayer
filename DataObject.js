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
                
                if(this.changeListener[key] != undefined)
                    for(let i in this.changeListener[key]){
                        this.changeListener[key][i](key, value);
                    }
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
            this.changeListener[key] = [];

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

            if(this.changeListener[key] != undefined)
                for(let i in this.changeListener[key]){
                    this.changeListener[key][i](key, msg[key]);
                }
        }
    }

    serialize(){
        let output = {};

        output.id = this.id;
        output.owner = this.owner;
        output.internal = this.internal;

        return output;
    }

    deserialize(input){
        this.id = input.id;
        this.owner = input.owner;
        this.internal = input.internal;

        return this;
    }
}