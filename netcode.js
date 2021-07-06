window.netService = {
    getGameState: function () { },
    setGameState: function (gs, callback) { }
}

function JsonBoxyService() {
    var MASTERURL = "https://jsonboxy.herokuapp.com/box_03a837fafb9b3a080800/";
    var mainGame = "60e1101dae31770015131f92";
    this.setGameState = function (gamestate, callback) {
        $.ajax({
            url: MASTERURL+mainGame,
            type: "PUT",
            data: JSON.stringify(gamestate),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var uri = data["_id"];
                console.log(uri);
                if (callback)
                    callback();
            }
        });
    }
    this.getGameState = async function() {
        return await $.get(MASTERURL+mainGame);
    }
    this.makeNewGame = function() {
        $.ajax({
            url: MASTERURL,
            type: "PUT",
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var uri = data["_id"];
                console.log(uri);
            }
        });
    }
}

window.netService = new MockNetService();/*JsonBoxyService();*/

function MockNetService() {
    this.getGameState = function () {
        if (gamestate.curPlayerName != myPlayer.name) {
            var player = gamestate.players.filter(p => p.name == gamestate.curPlayerName)[0];
            if (gamestate.time > 0) {
                var clueCard = gamestate.players[0].cards[0],
                    clueType = "clueColor",
                    clueDereference = "color",
                    cardInd = 0;
                while (clueCard[clueType]) {
                    if (clueType == "clueColor") {
                        clueType = "clueNumber";
                        clueDereference = "num";
                    } else {
                        clueType = "clueColor";
                        clueDereference = "color";
                        cardInd++;
                        if (cardInd == 4) {
                            break;
                        }
                        clueCard = gamestate.players[0].cards[cardInd];
                    }
                }
                for (var card of gamestate.players[0].cards) {
                    if (card[clueType] == clueCard[clueType]) {
                        card[clueType] = card[clueDereference];
                    }
                }
                gamestate.time--;
                advanceTurn();
            } else {
                var discardCard = player.cards[0];
                discardThisCard(discardCard);
            }
            
        }
        return gamestate;
    }
    this.setGameState = function () {

    }
}