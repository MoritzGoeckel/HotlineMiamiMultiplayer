var socket = io.connect('http://localhost:2000');

var me;

//Get welcome info for own player
socket.on('welcome', function (data) {
    me = data;
    me.changes = [];

    console.log("welcome");
    console.log(data);
});

var players = {};

//Recieve full update for a player
socket.on('player_full_info', function (data) {
    players[data.id] = data;
    
    console.log("player_full_info");
    console.log(data);
});

//Recieve update for a player
socket.on('player_update', function (data) {    
    for(var key in data)
    {
        players[data.id][key] = data[key];           
    }

    console.log("player_update");
    console.log(data);
});

//Send Update to the Server
setInterval(function(){ 

    if(me.changes.length > 0)
    {
        var msg = {};
        for(var index in me.changes)
        {
            var key = me.changes[index];

            console.log(me[key]);
            msg[key] = me[key];
        }
        me.changes = [];

        socket.emit("update", msg);
    }
}, 1000 / 50);

//Test for change of values
function change()
{
    me.dir = Math.random() * 50;
    me.changes.push("dir");
}