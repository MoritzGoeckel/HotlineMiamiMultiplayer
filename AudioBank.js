module.exports = class{

    constructor(audiofiles){
        this.bank = {};
        for(let a in audiofiles){
            this.bank[audiofiles[a]] = new Audio("sounds/" + audiofiles[a] + ".wav");
        }
    }

    play(id, vol){
        let sound = this.bank[id].cloneNode();
        
        if(vol != undefined)
            sound.volume = vol;

        sound.play();
    }

}