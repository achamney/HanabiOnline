
var gamestate = {
    deck: [],
    center: {},
    discards: [],
    players: [],
    time: 8,
    lives: 3
}, curPlayer;
window.onload = function () {
    var numfreq = [3, 2, 2, 2, 1];
    var colorInd = ["red", "#fa3", "green", "blue", "purple"];
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
            for (var k = 0; k < numfreq[i]; k++) {
                gamestate.deck.push({ num: i + 1, color: colorInd[j] });
            }
        }
    }
    gamestate.deck.sort((a, b) => { return b.num - a.num/*Math.random() * 3 - 1*/; });
    gamestate.players.push({ cards: [], name: "Austin" });
    curPlayer = clone(gamestate.players[0]);
    gamestate.players.push({ cards: [], name: "Lisa" });
    gamestate.players.push({ cards: [], name: "Kai" });
    gamestate.players.push({ cards: [], name: "Vesa" });
    for (var i = 0; i < 4; i++) {
        for (var player of gamestate.players) {
            var card = gamestate.deck.pop();
            player.cards.push(card);
        }
    }
    drawGameState();
}
function drawGameState() {
    var main = get("main");
    main.innerHTML = "";
    make("span" ,main, "hud").innerHTML = `Time: ${gamestate.time} Lives: ${gamestate.lives}`;
    var center = makesq("div", main, "block centerboard", "20%", "20%", "60%", "60%");
    for (var i = 0; i < gamestate.deck.length; i++) {
        var card = gamestate.deck[i];
        makeCard(card, center, i * 0.5 + 450, (i * -1) + 120, false);
    }
    curPlayer.cardDoms = [];
    var translatePos = [{ x: "250px", y: "500px", rot: 0 },
    { x: "-100px", y: "200px", rot: "90deg" },
    { x: "250px", y: 0, rot: "180deg" },
    { x: "600px", y: "200px", rot: "270deg" }];
    for (var i = 0; i < gamestate.players.length; i++) {
        var player = gamestate.players[i];
        var playerBoard = makesq("div", main, "block playerboard", 0, 0, "400px", "120px");
        playerBoard.style.transform = `translate(${translatePos[i].x},${translatePos[i].y}) rotate(${translatePos[i].rot})`

        for (var j = 0; j < player.cards.length; j++) {
            var pcard = player.cards[j];
            var pcarddom = makeCard(pcard, playerBoard, j * 70, 0, true/* player.name != curPlayer.name*/);
            pcarddom.card = pcard;
            //if (player.name == curPlayer.name) {
            curPlayer.cardDoms.push(pcarddom);
            pcarddom.onclick = clickPlayerCard;
            //}
        }
    }
    var centerCount = 0;
    for (var color in gamestate.center) {
        var centerGroup = gamestate.center[color];

        for (var j = 0; j < centerGroup.length; j++) {
            var card = centerGroup[j];
            makeCard(card, main, j * 2 + 80 * centerCount + 200, 250, true);
        }
        centerCount++;
    }

    for (var i = 0; i < gamestate.discards.length; i++) {
        var card = gamestate.discards[i];
        makeCard(card, main, 890, 150 + i * 25, true);
    }
}
function clickPlayerCard() {
    for (var card of curPlayer.cardDoms) {
        card.selected = false;
        card.style.outline = "none";
    }
    this.selected = true;
    this.style.outline = "4px solid blue";
}
function playCard() {
    var carddom = curPlayer.cardDoms.filter(a => a.selected)[0];
    if (!carddom) {
        return;
    }
    curPlayer.cards.splice(curPlayer.cards.indexOf(carddom.card), 1);
    gamestate.center[carddom.card.color] = gamestate.center[carddom.card.color] || [];
    var centerGroup = gamestate.center[carddom.card.color];
    if ((centerGroup.length == 0 && carddom.card.num == 1)
        || (centerGroup.length > 0 &&centerGroup[centerGroup.length - 1].num == carddom.card.num - 1)) {
        centerGroup.push(carddom.card);
    } else {
        gamestate.discards.push(carddom.card);
        gamestate.lives --;
    }
    drawAndAdvanceTurn();
}
function discardCard() {
    var carddom = curPlayer.cardDoms.filter(a => a.selected)[0];
    if (!carddom) {
        return;
    }
    curPlayer.cards.splice(carddom.card, 1);
    gamestate.discards.push(carddom.card);
    gamestate.time++;

    drawAndAdvanceTurn();
}
function drawAndAdvanceTurn() {
    window.setTimeout(function () {
        var newCard = gamestate.deck.pop();
        curPlayer.cards.push(newCard);
        var newPlayerInd = gamestate.players.indexOf(gamestate.players.filter(p => p.name == curPlayer.name)[0]) + 1;
        if (newPlayerInd == gamestate.players.length) {
            newPlayerInd = 0;
        }
        curPlayer = clone(gamestate.players[newPlayerInd]);
        drawGameState();
    }, 1000);
    drawGameState();
}
function makeCard(card, parent, left, top, visible) {
    var carddom = make("div", parent, "block card");
    carddom.style.transform = `translate(${left}px,${top}px)`;
    if (visible) {
        carddom.style.border = "3px solid " + card.color;
        carddom.style.color = card.color;

        carddom.innerHTML = card.num;
        var upNum = make("div", carddom, "upnumber");
        upNum.innerHTML = card.num;
    } else {
        var col = card.clueColor ? card.clueColor : "black";
        carddom.style.color = col;
        carddom.style.border = "3px solid " + col;
        if (card.clueNumber) {
            carddom.innerHTML = card.clueNumber;
            var upNum = make("div", carddom, "upnumber");
            upNum.innerHTML = card.clueNumber;
        }

    }
    return carddom;
}