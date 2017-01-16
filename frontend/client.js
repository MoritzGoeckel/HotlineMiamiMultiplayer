$(document).ready(function(){

    //Connect
    var socket = io.connect('http://localhost:2000');

    //The player
    var me;

    //The map
    var map = undefined;

    //Get welcome info for own player
    socket.on('welcome', function (data) {
        me = data;
        me.changes = [];

        //Send Update to the Server
        setInterval(function(){ 

            if(me.changes.length > 0)
            {
                var msg = {};
                for(var index in me.changes)
                {
                    var key = me.changes[index];
                    msg[key] = me[key];
                }
                me.changes = [];

                socket.emit("update", msg);
            }
        }, 1000 / 50);
    });

    var players = {};

    //Recieve full update for a player
    socket.on('player_full_info', function (data) {
        players[data.id] = data;
    });

    //Recieve update for a player
    socket.on('player_update', function (data) {    
        for(var key in data)
        {
            players[data.id][key] = data[key];           
        }
    });

    //The keyboard
    var keys = [];
    window.onkeyup = function(e) {keys[e.keyCode]=false;}
    window.onkeydown = function(e) {keys[e.keyCode]=true;}

    //The canvas
    var pixi = new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    var canvas = pixi.view;

    document.getElementById("content").appendChild(canvas);

    var render = new Renderer(players, map, pixi);

    //The mouse
    var mouse = {};

    canvas.addEventListener('mousemove', function(evt) {
        mouse.pos = getMousePos(canvas, evt);
    }, false);

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    //Logic loop
    setInterval(function(){
        updateGame(players, me, map, keys, mouse);
    }, 1000 / 100);

    //Render loop
    setInterval(function(){
        render.drawFrame(players, me, map);
    }, 1000 / 100);
});

//Todo: File too long