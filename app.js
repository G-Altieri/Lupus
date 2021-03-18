// create app
const express = require("express");
var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent');

const min_players = 1;
const timeout = 50000; //non lo uso, era presente nel template game per startare la partita
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

        //Se il giocatore e l host chiudo la sessione
        if (socket.name == game_started) {
            cleanStatus();
            socket.emit('stop_game');
            socket.broadcast.emit('stop_game');
        }

        //Rimuovo il socket uscente dal array dei socket
        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);
        
        //Rimuovo il giocatore uscito dai players
        var k = players.indexOf(socket.name);
        players.splice(k, 1);
       
        //Aggiorno
        socket.broadcast.emit('refresh_game', players);


    });

    /*Generazione Ruoli */
    socket.on('generateRuoli', function (data) {
        contRuoli(data);
    });

    function contRuoli(x) {


        // console.log("Numero dei ruoli "+x)

        //Assegno per ogni valore di ruolo un ruolo stringa
        //Ruolo Lupo
        for (let i = 0; i < x[0]; i++) {
            ruoli.push("Lupo")
        }

        //Ruolo Investigatore
        for (let i = 0; i < x[1]; i++) {
            ruoli.push("Investigatore")
        }

        //Ruolo Puttana
        for (let i = 0; i < x[2]; i++) {
            ruoli.push("Puttana")
        }

        //Ruolo Cittadino Maledetto
        for (let i = 0; i < x[3]; i++) {
            ruoli.push("Cittadino Maledetto")
        }

        //Ruolo Pistolero
        for (let i = 0; i < x[4]; i++) {
            ruoli.push("Pistolero")
        }

        //Ruolo Cupido
        for (let i = 0; i < x[5]; i++) {
            ruoli.push("Cupido")
        }

        //Ruolo Cittadino Normale
        for (let i = 0; i < x[6]; i++) {
            ruoli.push("Cittadino Normale")
        }

        //Conto il numero di ruoli e li controllo con i player
        //Conto il numero di ruoli
        var num = 0
        for (let i = 0; i < x.length; i++) {
            num += Number(x[i])
            //  console.log("num "+num+" x "+x[1])
        }

        //Conto il numero di player e tolgo il narratore ovvero una persona
        var n_player = players.length - 1

        // console.log("Numero ruoli " + num + " numero player " + n_player + " Ruoli: " + ruoli)

        if (num == n_player) {
            //se sono uguali assegna i ruoli
            assegnaRuoli()
        } else {
            //senno errore e ripulisco arrai dei ruoli per la prossima generazione
            socket.emit("ErrorRuoli", n_player);
            ruoli = []
        }

    }


    //Assegnazione Ruoli
    function assegnaRuoli() {

        var playerRuoli = [] //Varibile che associera ruoli e player
        var number = []; //Varibile per randomizare univocamente

        //Generazione numeri random
        while (number.length < ruoli.length) {
            var r = Math.floor(Math.random() * ruoli.length);
            if (number.indexOf(r) === -1) number.push(r);
        }


        //Associo Player e ruoli, inizio da i=1 perche salto il narratore
        for (let i = 1; i < players.length; i++) {

            playerRuoli.push(players[i]);

            //console.log(Math.floor(Math.random() * ruoli.length))

            var k = ruoli[number[i - 1]]

            playerRuoli.push(k);


        }

        //console.log("Player con Ruoli "+playerRuoli)

        socket.emit("ReceiverRuoli", playerRuoli)
        socket.broadcast.emit("ReceiverRuoli", playerRuoli)

        ruoli = []

    }



});



// start server
var PORT = process.env.PORT || 80;
server.listen(PORT);