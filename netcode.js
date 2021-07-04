window.netService = {
    getGameState: function () { },
    setGameState: function (gs) { }
}

window.netService = new MockNetService();

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
            } else {
                var discardCard = player.cards[0];
                player.cards.splice(discardCard, 1);
                gamestate.discards.push(discardCard);
                gamestate.log.push(`${player.name} discards ${discardCard.color} ${discardCard.num}`);
                
                var newCard = gamestate.deck.pop();
                player.cards.push(newCard);
                gamestate.time++;
            }
            
            advanceTurn();
        }
        return gamestate;
    }
    this.setGameState = function () {

    }
}