jQuery(function () {
    var socket = io();
    showLoader();
    socket.emit('start');
    var ruoli = []
    // start
    socket.on('start', function (data) {
        in_game = false;
        jQuery('#type').val(data ? 'join' : 'create');
        jQuery('#game').val(data ? 'ENTRA' : 'CREA');
        loadPage("#splash");
    });

    // game_locked
    socket.on('locked_game', function (data) {
        loadPage("#locked");
    });

    // request
    jQuery('#game').on('click', function () {
        var nickname = jQuery('#nickname').val();
        if (!nickname) {
            showMessage('Nome obbligatorio!', 'bg-error');
        } else {
            showLoader();
            socket.emit(jQuery('#type').val() + '_game', nickname);
        }
        return false;
    });

    // stop game
    jQuery('#stop').on('click', function () {
        var nickname = jQuery('#nickname').val();
        socket.emit('stop', nickname);
    });

    // create game
    socket.on('create_game', function (data) {
        console.log("» create_game [" + data + "]");
        jQuery('#type').val('join');
        jQuery('#game').val('ENTRA');
        loadPage("#splash");
    });

    // nickname already in use
    socket.on('already_in_game', function (data) {
        console.log("» already in game");
        showMessage('Utente [' + data + '] gi&agrave; utilizzato!', 'bg-error');
    });

    // join game
    socket.on('join_game', function (data) {
        console.log("» join_game");
        var nickname = jQuery('#nickname').val();
        jQuery('#players').empty();
        jQuery.each(data, function (i, e) {
            jQuery('#players').append(
                jQuery('<li></li>').addClass((e === nickname) ?
                    'bg-success' : '').text(e));
        });
        in_game = true;
        loadPage("#lobby");
        showLoader();
    });

    // refresh lobby
    socket.on('refresh_game', function (data) {
        if (true) { //var in_game
            console.log("» refresh_game");
            var nickname = jQuery('#nickname').val();
            jQuery('#players').empty();
            jQuery.each(data, function (i, e) {
                jQuery('#players').append(
                    jQuery('<li></li>').addClass((e === nickname) ?
                        'bg-success' : '').text(e));
            });
        }
    });

    // start game
    socket.on('start_game', function (data) {
        console.log("» start_game");
        var nickname = jQuery('#nickname').val();
        jQuery('#master').text("Narratore : " + data.master);
        jQuery.each(data.players, function (i, e) {
            if (e == data.master) {} else {
                jQuery('#foe').append(
                    jQuery('<li></li>').addClass((e === nickname) ?
                        'bg-success' : '').text(e));
            }
        });
        console.debug("» data » " + data);
        if (data.ismaster) {
            masterView()
        }
        loadPage("#board");
    });

    // end game
    socket.on('end_game', function (data) {
        console.log("» end_game");
        showLoader();
        socket.emit('start');
        showMessage('Numero minimo di partecipanti [' +
            data + '] non raggiunto!', 'bg-warning');
    });

    // stop game
    socket.on('stop_game', function (data) {
        console.log("» stop_game");
        jQuery('#foe').text("");
        masterHidden();
        showLoader();
        socket.emit('start');
        showMessage('Partita terminata!', 'bg-success');
    });


    //init game
    socket.on('init_game', function (data) {
        console.log("» init_game");
        var nickname = jQuery('#nickname').val();
        if (nickname == data) {
            console.log("» init_game " + nickname + " d asd as " + data);
            jQuery('#init').show();
        }
    });

    // inziaio game
    jQuery('#init').on('click', function () {
        socket.emit('gameStart');
    });

    //Generate 
    jQuery('#generate').on('click', function () {
        console.log("generateRuoli")
        controllCheckboxRuoli();
        //$("#ruoli").text(ruoli)
        //socket.emit('generateRuoli');
    });

    //admin Page
    jQuery('#resetAdmin').on('click', function () {
        socket.emit('AdminReset');
    });


    /*Funzione */
    function controllCheckboxRuoli() {
        var ruoli = []


        var numLupi = $('#numLupo').val()
        ruoli.push(numLupi)


        if ($('#Investigatore').is(":checked")) {
            ruoli.push("Investigatore")
        }
        if ($('#Puttana').is(":checked")) {
            ruoli.push("Puttana")
        }
        if ($('#Cittadino_Maledetto').is(":checked")) {
            ruoli.push("Cittadino_Maledetto")
        }
        if ($('#Pistolero').is(":checked")) {
            ruoli.push("Pistolero")
        }
        if ($('#Cupido').is(":checked")) {
            ruoli.push("Cupido")
        }
        if ($('#Cittadino_Normale').is(":checked")) {
            ruoli.push("Cittadino Normale")
        }








        socket.emit("generateRuoli", ruoli);
    }



});

var in_game = false;

// show loader
function showLoader() {
    $("#progress").removeClass("hidden");
}

// hide loader
function loadPage(page) {
    $("#progress").addClass("hidden");
    $(".app-panel").addClass("hidden");
    $(page).removeClass("hidden");
}

// show alert message
function showMessage(msg, status) {
    $("#message").html(msg).removeClass("hidden").addClass(status);
    setTimeout(hideMessage, 6000);
}

// hide alert message
function hideMessage() {
    $("#message").html("").removeClass().addClass("alert hidden");
}


//master view on
function masterView() {
    jQuery('#stop').show();
    jQuery('#generate').show();
    jQuery('#init').hide();
    $("#ruoli").removeClass("d-none")
}

//master view off
function masterHidden() {
    jQuery('#stop').hide();
    jQuery('#generate').hide();
    jQuery('#init').hide();
    $("#ruoli").addClass("d-none")
}