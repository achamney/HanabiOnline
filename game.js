
var gamestate = {
    deck: [],
    center: {},
    discards: [],
    players: [],
    log: [],
    curPlayerName: "",
    time: 8,
    lives: 3
}, myPlayer;
window.onload = function () {
    $("#newName").keyup(function (event) {
        if (event.keyCode === 13) {
            $("#addButton").click();
        }
    });
    $("#myName").keyup(function (event) {
        if (event.keyCode === 13) {
            $("#joinButton").click();
        }
    });
}
function addName() {
    var newName = get('newName');
    gamestate.players.push({ cards: [], name: newName.value });
    get("main").innerHTML += `${newName.value}<br>`;
    newName.value = "";
}
async function joinGame() {
    window.gamestate = await netService.getGameState();
    var myPlayerName = get("myName").value;
    var fetchedPlayer = gamestate.players.filter(p => p.name == myPlayerName)[0];
    if (!fetchedPlayer) {
        alert("Cannot Find Player, Refresh and Try Again");
        return;
    }
    myPlayer = clone(fetchedPlayer);

    drawGameState();
    watchGameState();
}
function makeGameState() {
    var numfreq = [3, 2, 2, 2, 1];
    var colorInd = ["red", "orange", "green", "blue", "purple"];
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
            for (var k = 0; k < numfreq[i]; k++) {
                gamestate.deck.push({ num: i + 1, color: colorInd[j] });
            }
        }
    }
    for (var i = 0; i < 10; i++) {
        gamestate.deck.sort((a, b) => { return Math.random() * 3 - 1; });
    }
    myPlayer = clone(gamestate.players[0]);
    gamestate.curPlayerName = myPlayer.name;
    var numCardsToDraw = gamestate.players.length < 4 ? 5 : 4;
    for (var i = 0; i < numCardsToDraw; i++) {
        for (var player of gamestate.players) {
            var card = gamestate.deck.pop();
            player.cards.push(card);
        }
    }
    netService.setGameState(gamestate);
    drawGameState();

    watchGameState();
}
function watchGameState() {
    window.setInterval(async function () {
        if (gamestate.curPlayerName != myPlayer.name) {
            window.gamestate = await netService.getGameState();
            drawGameState();
        }
    }, 2000);
}
function drawGameState() {
    var main = get("main");
    main.innerHTML = "";
    make("span", main, "hud").innerHTML = `Time: ${gamestate.time} Lives: ${gamestate.lives}`;
    var center = makesq("div", main, "block centerboard", "160px", "120px", "590px", "340px");
    for (var i = 0; i < gamestate.deck.length; i++) {
        var card = gamestate.deck[i];
        makeCard(card, center, i * 0.5 + 450, (i * -1) + 120, false);
    }
    myPlayer.cardDoms = [];
    var translatePos = [{ x: "250px", y: "500px", rot: 0 },
    { x: "-100px", y: "200px", rot: "90deg" },
    { x: "250px", y: 0, rot: "180deg" },
    { x: "600px", y: "200px", rot: "270deg" }];
    var startInd = gamestate.players.indexOf(gamestate.players.filter(p => p.name == myPlayer.name)[0]);
    for (var i = 0; i < gamestate.players.length; i++) {
        var player = gamestate.players[startInd];
        var playerBoard = makesq("div", main, "block playerboard", 0, 0, "400px", "120px");
        if (player.name == gamestate.curPlayerName) {
            playerBoard.style["background-color"] = "#FFA";
        }
        make("span", playerBoard, "playerName").innerHTML = player.name;
        playerBoard.style.transform = `translate(${translatePos[i].x},${translatePos[i].y}) rotate(${translatePos[i].rot})`

        for (var j = 0; j < player.cards.length; j++) {
            var pcard = player.cards[j];
            var pcarddom = makeCard(pcard, playerBoard, j * 70, 0, player.name != myPlayer.name);
            pcarddom.card = pcard;
            if (player.name == myPlayer.name) {
                myPlayer.cardDoms.push(pcarddom);
                pcarddom.onclick = clickPlayerCard;
            } else {
                pcarddom.onclick = clickTeamCard.bind(player);
            }
        }
        startInd++;
        if (startInd == gamestate.players.length) {
            startInd = 0;
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
    var logBody = makesq("div", main, "block playerboard", "1100px", "100px", "150px", "440px");
    for (var log of gamestate.log) {
        logBody.innerHTML += `${log}<br>`;
    }
}
function clickPlayerCard() {
    for (var card of myPlayer.cardDoms) {
        card.selected = false;
        card.style.outline = "none";
    }
    this.selected = true;
    this.style.outline = "4px solid blue";
}
function clickTeamCard() {
    var modal = get("myModal");
    modal.style.display = "block";
    window.clueData = deepClone(this);
    drawClueCards();
}
function playCard() {
    var carddom = myPlayer.cardDoms.filter(a => a.selected)[0];
    if (!carddom) {
        return;
    }
    var gsPlayer = gamestate.players.filter(p => p.name == myPlayer.name)[0];
    gsPlayer.cards.splice(gsPlayer.cards.indexOf(carddom.card), 1);
    gamestate.center[carddom.card.color] = gamestate.center[carddom.card.color] || [];
    var centerGroup = gamestate.center[carddom.card.color];
    if ((centerGroup.length == 0 && carddom.card.num == 1)
        || (centerGroup.length > 0 && centerGroup[centerGroup.length - 1].num == carddom.card.num - 1)) {
        centerGroup.push(carddom.card);
        gamestate.log.push(`${myPlayer.name} plays ${carddom.card.color} ${carddom.card.num}`);
    } else {
        gamestate.discards.push(carddom.card);
        gamestate.lives--;
        gamestate.log.push(`${myPlayer.name} erroneously plays ${carddom.card.color} ${carddom.card.num}`);
    }
    drawAndAdvanceTurn();
}
function discardCard() {
    var carddom = myPlayer.cardDoms.filter(a => a.selected)[0];
    if (!carddom) {
        return;
    }
    var gsPlayer = gamestate.players.filter(p => p.name == myPlayer.name)[0];
    gsPlayer.cards.splice(gsPlayer.cards.indexOf(carddom.card), 1);
    gamestate.discards.push(carddom.card);
    gamestate.log.push(`${myPlayer.name} discards ${carddom.card.color} ${carddom.card.num}`);
    gamestate.time++;

    drawAndAdvanceTurn();
}
function drawAndAdvanceTurn() {
    window.setTimeout(function () {
        var newCard = gamestate.deck.pop();
        var gsPlayer = gamestate.players.filter(p => p.name == myPlayer.name)[0];
        gsPlayer.cards.push(newCard);
        advanceTurn();
        netService.setGameState(gamestate);
    }, 1000);
    drawGameState();
}
function advanceTurn() {
    var newPlayerInd = gamestate.players.indexOf(gamestate.players.filter(p => p.name == gamestate.curPlayerName)[0]) + 1;
    if (newPlayerInd == gamestate.players.length) {
        newPlayerInd = 0;
    }
    gamestate.curPlayerName = gamestate.players[newPlayerInd].name;

    drawGameState();
}
function drawClueCards() {
    var parent = get("modaltext");
    clear(parent);

    for (var i = 0; i < clueData.cards.length; i++) {
        var card = clueData.cards[i];
        makeCard(card, parent, 100 + i * 70, 50, true);
    }
    for (var i = 0; i < clueData.cards.length; i++) {
        var card = clueData.cards[i];
        makeCard(card, parent, 100 + i * 70, 200, false);
    }
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
function clueColor(color) {
    var playerInd = gamestate.players.indexOf(gamestate.players.filter(p => p.name == clueData.name)[0]);
    clueData = deepClone(gamestate.players[playerInd]);
    var matchingCards = clueData.cards.filter(c => c.color == color);
    for (var card of matchingCards) {
        card.clueColor = color;
    }
    myPlayer.cluedNumber = "";
    myPlayer.cluedColor = color;
    drawClueCards();
}
function clueNumber(number) {
    var playerInd = gamestate.players.indexOf(gamestate.players.filter(p => p.name == clueData.name)[0]);
    clueData = deepClone(gamestate.players[playerInd]);
    var matchingCards = clueData.cards.filter(c => c.num == number);
    for (var card of matchingCards) {
        card.clueNumber = number;
    }
    myPlayer.cluedColor = "";
    myPlayer.cluedNumber = number;
    drawClueCards();
}
function sendClue() {
    if (gamestate.time == 0) {
        return;
    }
    gamestate.time--;
    var playerInd = gamestate.players.indexOf(gamestate.players.filter(p => p.name == clueData.name)[0]);
    gamestate.players[playerInd] = clueData;
    get("myModal").style.display = "none";
    gamestate.log.push(`${myPlayer.name} clues ${clueData.name} ${myPlayer.cluedColor}${myPlayer.cluedNumber}`);
    advanceTurn();
    netService.setGameState(gamestate);
}
window.setupModal = function (id) {
    var modal = document.getElementById(id);
    // Get the <span> element that closes the modal
    var span = $(modal).find(".close")[0];
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    document.addEventListener("click", function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
}
setupModal("myModal");