// create app
const express = require("express");
var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent');

const min_players = 1;
const timeout = 50000;
var game_started = false;
var players = [];
var timeoutObj = false;
var game_locked = false;

var allClients = [];

var ruoli = []


// public files
app.use(express.static('public'));

// socket.io
io.sockets.on('connection', function (socket, nickname) {
    allClients.push(socket);


    // start
    socket.on('start', function () {
        if (game_locked) {
            socket.emit('locked_game', game_started);
        } else {
            socket.emit('start', game_started);
        }
    });

    // create game
    socket.on('create_game', function (nickname) {
        if (!game_started) {
            game_started = ent.encode(nickname);
            socket.name = game_started
            // console.log("creatore "+socket.name);
            players.push(ent.encode(nickname));
            //  timeoutObj = setTimeout(updateStatus, timeout); funzione a tempo, non mi piaceva
            socket.emit('join_game', players);
            socket.emit("init_game", game_started);
        } else {
            socket.emit('create_game', game_started);
        }
        socket.broadcast.emit('create_game', game_started);
    });

    // join game
    socket.on('join_game', function (nickname) {
        if (-1 === players.indexOf(nickname)) {
            players.push(ent.encode(nickname));
            socket.name = nickname
            // console.log("join "+socket.name);
            socket.emit('join_game', players);
            socket.broadcast.emit('refresh_game', players);
        } else {
            socket.emit('already_in_game', ent.encode(nickname));
        }
    });


    //game Start
    socket.on('gameStart', function (data) {
        updateStatus();
    });

    // stop game
    socket.on('stop', function (nickname) {
        if (game_started === nickname) {
            cleanStatus();
            socket.emit('stop_game');
            socket.broadcast.emit('stop_game');
        }
    });

    // clean status
    function cleanStatus() {
        game_started = false;
        players = [];
        timeoutObj = false;
        game_locked = false;
    }

    // update status
    function updateStatus() {
        if (players.length >= min_players) {
            game_locked = true;
            socket.emit('start_game', {
                ismaster: true,
                master: game_started,
                players: players,
            });
            socket.broadcast.emit('start_game', {
                ismaster: false,
                master: game_started,
                players: players
            });
        } else {
            cleanStatus();
            socket.emit('end_game', min_players);
            socket.broadcast.emit('end_game', min_players);
        }
    }



    /*Admin Page*/
    socket.on('AdminReset', function (data) {
        cleanStatus();
        socket.emit('stop_game');
        socket.broadcast.emit('stop_game');
    });

    /*Disconessione di un utente*/
    socket.on('disconnect', function (data) {
        //console.log('Got disconnect! '+socket.name);

        if (socket.name == game_started) {
            cleanStatus();
            socket.emit('stop_game');
            socket.broadcast.emit('stop_game');
        }


        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);
        //console.log(players)
        var k = players.indexOf(socket.name);
        players.splice(k, 1);
        //console.log(players)
        socket.broadcast.emit('refresh_game', players);

        // players
        // socket.broadcast.emit('refresh_game', players);
    });

    /*Generazione Ruoli */
    socket.on('generateRuoli', function (data) {
        // console.log("Ruolo : " + data);
        contRuoli(data);
    });

    function contRuoli(x) {

        for (let i = 0; i < x[0]; i++) {
            ruoli.push("Lupo")
        }

        for (let i = 1; i < x.length; i++) {
            ruoli.push(x[i])
        }


        // console.log("Ruoli "+ruoli)


        var num = Number(x[0]) + (x.length - 1)
        var n_player = players.length - 1
        //console.log("Numero Ruoli " + num)

        if ( /*num == n_player*/ true) {
            assegnaRuoli()
        } else {
            socket.emit("ErrorRuoli", n_player);
            ruoli = []
        }

    }


    //Assegnazione Ruoli
    function assegnaRuoli() {

        var playerRuoli = []

        var number = []

        for (let index = 0; index < ruoli.length; index++) {
            number.push(index);
        }




        var number = [];
        while (number.length < ruoli.length) {
            var r = Math.floor(Math.random() * ruoli.length) + 1;
            if (number.indexOf(r) === -1) number.push(r);
        }
        console.log(number)
        
        for (let i = 1; i < players.length; i++) {

            playerRuoli.push(players[i]);

            //console.log(Math.floor(Math.random() * ruoli.length))
            
            var k = ruoli[number[i-1]]
            if(k == null){
                playerRuoli.push("Lupo");
            }else{
                playerRuoli.push(k);
            }

        }

        socket.emit("ReceiverRuoli", playerRuoli)
        socket.broadcast.emit("ReceiverRuoli", playerRuoli)

        ruoli = []

    }



});



// start server
var PORT = process.env.PORT || 80;
server.listen(PORT);