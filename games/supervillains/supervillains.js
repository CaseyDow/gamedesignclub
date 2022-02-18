let DECK = {"C1": ['Free Spring', 'Common', 'Spring a single trap in a machine', 'It is your turn'],
            "C2": ['Hand Limit', 'Common', "Discard a card from an opponent's hand", 'The target has five or more cards'],
            "C3": ['Arbitrary Punishment', 'Common', "Discard a card from an opponent's hand", 'The target has three or more machines'],
            "C4": ['Revenge', 'Common', "Discard a card from an opponent's hand", 'Your cards activate a condition'],
            "C5": ['Voodoo', 'Common', "Discard a card from an opponent's hand", 'You discard a card'],
            "C6": ['Shield', 'Common', 'Block the trap from discarding', 'You are forced to discard a card or machine'],
            "C7": ['Nope', 'Common', 'Block the ability from activating', 'A common trap activates'],
            "C8": ['One Up', 'Common', 'Draw a card', 'An opponent draws'],
            "C9": ['Replenish', 'Common', 'Draw a card', 'You activate a trap'],
            "R1": ['Surprise Spring', 'Rare', 'Spring a single trap in a machine', 'Any trap activates'],
            "R2": ['Hand Control', 'Rare', "Discard a card from an opponent's hand", 'The target has three or more cards'],
            "R3": ['Comeback', 'Rare', "Discard an opponent's machine", 'The target has more machines than you'],
            "R4": ['Trample', 'Rare', "Discard an opponent's machine", 'The target has less cards than you'],
            "R5": ['Freeze', 'Rare', "Skip an opponent's next turn", 'The target activates two or more traps in a turn'],
            "R6": ['Afraid', 'Rare', "Skip an opponent's next turn", 'The target has two or more machines'],
            "R7": ['Springy', 'Rare', 'Draw a card', 'You spring a card'],
            "E1": ['Resources', 'Epic', 'Draw a card', 'You have three or more cards'],
            "E2": ['Recovery', 'Epic', 'Draw two cards', 'You have less than three cards'],
            "E3": ['Constrain', 'Epic', "Discard an opponent's hand to three cards", 'The target has five or more cards'],
            "E4": ['Extortion', 'Epic', "Steal a card from an opponent's hand", 'The target has more cards than you'],
            "E5": ['Support', 'Epic', 'Draw two cards', 'An opponent activates three or more traps in a turn'],
            "M1": ['Golden Spring', 'Mythic', 'Spring up to three traps in a single machine', 'Any trap activates'],
            "M2": ['Lifeline', 'Mythic', 'Draw three cards', 'You run out of cards'],
            "M3": ['Vengence', 'Mythic', "Discard two cards from an opponent's hand", 'The target draws'],}
let AMT = {"C":3, "R":2, "E":2, "M":1}
let CLR = {"Common":"~c84", "Rare":"~684", "Epic":"~489", "Mythic":"~659"}

let gameId;
let hand = -1;
let players = [];
let deck = [];

let message = function(event) {
  if (event.message.startsWith("SV")) {
    setUpGame(event.message.slice(3));
    log("Game Successfully Set Up");
    log("> Game ID: " + gameId);
    log("> Players: " + players.length);
    log("Enter a username: <h>;;username;;</h>");
  } else if (event.message.startsWith("Join")) {
    let data = event.message.slice(4).split(";");
    let h = parseInt(data[0]);
    players[h].online = true;
    players[h].name = data[1];
    if (!players[h].joined) {
      players[h].joined = true;
      players[h].draw(4, false);
      if (hand == h) {
        log(data[1], "<h>;;username;;</h>");
        updateHand();
        updateStacks();
      }
    }
    log(data[1] + " joined the game. (Player " + (h + 1) + ", " + countPlayers() + "/" + players.length + ")");
    let strPlayers = "";
    for (let i = 0; i < players.length; i++) {
      if (players[i].online) {
        strPlayers += players[i].desc() + "<br>";
      }
    }
    log(strPlayers.slice(0, -4), "all", "players");
  } else if (event.message.startsWith("Draw")) {
    let data = event.message.slice(4).split(";");
    players[parseInt(event.message.slice(4))].draw(parseInt(data[1]));
    updateHand();
  } else if (event.message.startsWith("Play")) {
    let data = event.message.slice(4).split(";");
    let h = parseInt(data[0]);
    let newCard = players[h].hand.splice(players[h].index(data[1]), 1)[0];
    players[h].stacks[parseInt(data[2]) - 1].push(newCard);
    newCard.updatePos(h, parseInt(data[2]) - 1);
    if (h == hand) {
      log("You played " + DECK[newCard.card[0]][0] + " into Stack " + data[2] + "!");
    } else {
      log(players[h].name + " played a card into Stack " + data[2] + "!");
    }
    updateHand();
    updateStacks();
  } else if (event.message.startsWith("Chat")) {
    let data = event.message.slice(4).split(";");
    if (data.length > 1) {
      log("[" + players[parseInt(data[0])].name + "]: " + data[1]);
    } else {
      log("~aaa[Spectator]: " + data[0]);
    }
  } else if (event.message.startsWith("Sprg")) {
    let data = event.message.slice(4).split(";");
    players[parseInt(data[0])].stacks[parseInt(data[1])].splice(parseInt(data[2]), 1)[0].spring(parseInt(data[0]));
  } else if (event.message.startsWith("Stel")) {
    let data = event.message.slice(4).split(";");
    let took = parseInt(data[0]);
    let gone = parseInt(data[1]);
    let newCard = players[gone].hand.splice(parseInt(data[2]), 1)[0];
    players[took].hand.push(newCard);
    newCard.updatePos(took, -1);
    if (took == hand) {
      log("You stole " + DECK[newCard.card[0]][0] + " from " + players[gone].name + "!");
      updateHand();
    } else if (gone == hand) {
      log(players[took].name + " stole " + DECK[newCard.card[0]][0] + " from you!");
      updateHand();
    } else {
      log(players[took].name + " stole a card from " + players[gone].name + "!");
    }
  } else if (event.message.startsWith("Dscd")) {
    let data = event.message.slice(4).split(";");
    let took = parseInt(data[0]);
    let gone = parseInt(data[1]);
    let newCard = players[gone].hand.splice(parseInt(data[2]), 1)[0];
    if (took == hand) {
      log("You discarded " + DECK[newCard.card[0]][0] + " from " + players[gone].name + "'s hand!");
      if (gone == hand) {
        updateHand();
      }
    } else if (gone == hand) {
      log(players[took].name + " discarded " + DECK[newCard.card[0]][0] + " from your hand!");
      updateHand();
    } else {
      log(players[took].name + " discarded " + DECK[newCard.card[0]][0] + " from " + players[gone].name + "'s hand!");
    }
  } else if (event.message.startsWith("Cler")) {
    let data = event.message.slice(4).split(";");
    let str = "";
    if (parseInt(data[0]) == hand) {
      str += "<details><summary>You cleared Stack " + (parseInt(data[1]) + 1) + "!</summary>";
    } else {
      str += players[parse(data[0])].name + " cleared Stack " + (parseInt(data[1]) + 1) + "!";
    }
    let stack = players[parseInt(data[0])].stacks[parseInt(data[1])]
    for (let i = stack.length - 1; i >= 0; i--) {
      stack[i].hand = -1;
      str += stack.pop().desc();
    }
    log(str + "</details>");
    if (parseInt(data[0]) == hand) {
      updateStacks();
    }
  } else if (event.message.startsWith("Leve")) {
    let h = parseInt(event.message.slice(4));
    let player = players[h];
    player.online = false;
    log(player.name + " left the game. (Player " + (h + 1) + ", " + countPlayers() + "/" + players.length + ")");
    let strPlayers = "";
    for (let i = 0; i < players.length; i++) {
      if (players[i].online) {
        strPlayers += players[i].desc() + "<br>";
      }
    }
    log(strPlayers.slice(0, -4), "all", "players");
  } else {
    log(event.message);
  }
};

function search(e) {
  if(event.key === "Enter") {
    let val = e.value;
    let cmd = val.toLowerCase();
    e.value = null;

    if (gameId == null) {
      if (cmd.startsWith("start ") && cmd.length > 6 && !isNaN(cmd.slice(6))) {
        send(makeDeck() + ";" + cmd.slice(6));
      } else if (cmd.startsWith("join ") && cmd.length > 5 && !isNaN(cmd.slice(5))) {
        gameId = cmd.slice(5);
        pubnub.subscribe({
          channels: ['SV' + gameId],
          withPresence: true
        });
      } else {
        log("Please use 'Start [#]' or 'Join [###]' to begin.");
      }
    } else if (hand < 0) {
      if (cmd.includes(";")) {
        log("You can not use ';' in your name!");
      } else {
        for (let i = 0; i < players.length; i++) {
          if (!players[i].online) {
            hand = i;
            break;
          }
        }
        if (hand < 0) {
          if (val == "") {
            log("~f00Please input a message to send!");
          } else if (val.includes(";")) {
            log("~f00You can not use ';' in chat messages!");
          } else {
            send("Chat" + val);
          }
        } else {
          send("Join" + hand + ";" + val);
        }
      }
    } else {
      switch (cmd.split(" ")[0]) {
        case "play": return cmdPlay(cmd);
        case "draw": return cmdDraw(cmd);
        case "info": return cmdInfo(cmd);
        case "spring": return cmdSpring(cmd);
        case "steal": return cmdSteal(cmd);
        case "clear": return cmdClear(cmd);
        case "discard": return cmdDiscard(cmd);
        default: chat(val);
      }
    }
  }
}

function cmdPlay(cmd) {
  let c = cmd.split(" ");
  if (c.length != 3) {
    log("~f00Invalid Usage! 'Play [ID] [Stack]'");
  } else {
    let id = c[1].toUpperCase();
    let stack = parseInt(c[2]);
    if (isNaN(stack) || stack < 1 || stack > 3) {
      log("~f00You selected an invalid stack number!");
    } else if (players[hand].hasCard(id)) {
      send("Play" + hand + ";" + id + ";" + stack);
    } else {
      log("~f00You do not have that card in your hand!");
    }
  }
}

function cmdDraw(cmd) {
  let num = 1
  if (cmd.split(" ").length > 1) {
    let temp = parseInt(cmd.split(" ")[1])
    if (!isNaN(temp) && temp < 10) {
      num = temp;
    }
  }
  send("Draw" + hand + ";" + num);
}

function cmdInfo(cmd) {
  let c = cmd.split(" ");
  if (c.length != 2 || isNaN(c[1])) {
    log("~f00Invalid Usage! 'Info [Player]'");
    return;
  }
  let p = parseInt(c[1]) - 1;
  if (p < 0 || p > players.length - 1) {
    log("~f00Please enter a valid player 1 - " + players.length + "!");
    return;
  }
  let m = "\n" + players[p].name + ": ";
  m += " [" + players[p].hand.length + " Cards]";
  for (let i = 1; i <= players[p].stacks.length; i++) {
    m += "\nStack " + i + ": " + players[p].stacks[i - 1].length + " Cards";
    if (players[p].stacks[i - 1].length > 0) {
      let card = DECK[players[p].stacks[i - 1][0].card[0]];
      m += players[p].stacks[i - 1][0].desc();
    }
  }
  log(m);
}

function cmdSpring(cmd) {
  let c = cmd.split(" ");
  if (c.length != 2) {
    log("~f00Invalid Usage! 'Spring [ID]'");
  } else {
    let id = c[1].toUpperCase();
    for (let i = 0; i < players[hand].stacks.length; i++) {
      let stack = players[hand].stacks[i];
      for (let j = 0; j < stack.length; j++) {
        let card = stack[j];
        if (card.id == id) {
          send("Sprg" + hand + ";" + i + ";" + j);
          return;
        }
      }
    }
    log("~f00You do not have not played that card into your stacks!");
  }
}

function cmdSteal(cmd) {
  let c = cmd.split(" ");
  if (c.length != 2) {
    log("~f00Invalid Usage! 'Steal [Player]'");
  } else {
    let gone = parseInt(c[1]) - 1;
    if (gone == hand) {
      log("~f00You can not steal from yourself!");
    } else if (gone >= players.length || gone < 0) {
      log("~f00Invalid player!");
    } else if (players[gone].hand.length > 0) {
      let rand = Math.floor(Math.random() * players[gone].hand.length);
      send("Stel" + hand + ";" + gone + ";" + rand);
    } else {
      log("~f00That player does not have any cards in their hand!");
    }
  }
}

function cmdClear(cmd) {
  let c = cmd.split(" ");
  if (c.length != 2) {
    log("~f00Invalid Usage! 'Clear [#]'");
  } else {
    let stack = parseInt(c[1]) - 1;
    if (stack < 0 || stack >= players[hand].stacks.length) {
      log("~f00Invalid stack number!");
    } else {
      send("Cler" + hand + ";" + stack)
    }
  }
}

function cmdDiscard(cmd) {
  let c = cmd.split(" ");
  if (c.length != 2) {
    log("~f00Invalid Usage! 'Steal [Player]'");
  } else {
    let gone = parseInt(c[1]) - 1;
    if (gone >= players.length || gone < 0) {
      log("~f00Invalid player!");
    } else if (players[gone].hand.length > 0) {
      let rand = Math.floor(Math.random() * players[gone].hand.length);
      send("Dscd" + hand + ";" + gone + ";" + rand);
    } else {
      log("~f00That player does not have any cards in their hand!");
    }
  }
}

function chat(e) {
  if (e == "") {
    log("~f00Please input a message to send!");
  } else if (e.includes(";")) {
    log("~f00You can not use ';' in chat messages!");
  } else {
    send("Chat" + hand + ";" + e);
  }
}

function updateHand() {
  let h = "Your Hand:";
  for (let i = 0; i < players[hand].hand.length; i++) {
    h += players[hand].hand[i].desc();
  }
  log(h, "all", "hand");
}

function updateStacks() {
  let s = "Your Stacks:";
  for (let j = 1; j <= players[hand].stacks.length; j++) {
    s += "\nStack " + j + ": [" + players[hand].stacks[j - 1].length + " Cards]";
    s += "<a onClick=\"a('stack', " + (j - 1) + ");\" style=\"cursor: pointer; cursor: hand;\"> [~800Clear~000]</a>";
    for (let i = 0; i < players[hand].stacks[j - 1].length; i++) {
      s += players[hand].stacks[j - 1][i].desc();
    }
  }
  log(s, "all", "stacks");
}

function shuffle(arr) {
  let curIndex = arr.length, tempValue, randIndex;
  while (0 != curIndex) {
    randIndex = Math.floor(Math.random() * curIndex);
    curIndex -= 1;
    tempValue = arr[curIndex];
    arr[curIndex] = arr[randIndex];
    arr[randIndex] = tempValue;
  }
  return arr;
}

function makeDeck() {
  let deck = [];
  for (let t in DECK) {
    for (let i = 1; i <= AMT[t.slice(0, 1)]; i++) {
      deck.push([t, i]);
    }
  }
  deck = shuffle(deck);
  let strDeck = "SV:";
  for (let i = 0; i < deck.length; i++) {
    strDeck += deck[i][0] + "," + deck[i][1] + ";";
  }
  return strDeck;
}

function log(text, replace="", log="") {
  let docLog = document.getElementById("log");
  if (log != "") {
    docLog = document.getElementById(log);
  }
  text = text.replaceAll("\n", "<br>").split("~");
  let newText = text.splice(0, 1);
  for (let i = 0; i < text.length; i += 2) {
    text.splice(i + 1, 0, text[i].slice(3));
    newText += "<font color='#" + text[i].slice(0, 3) + "'>" + text[i + 1] + "</font>";
  }
  if (replace == "") {
    docLog.innerHTML += newText + "<br>";
  } else if (replace == "all") {
    docLog.innerHTML = newText;
  } else {
    docLog.innerHTML = docLog.innerHTML.replaceAll(replace, newText);
  }
  docLog.scrollTop = docLog.scrollHeight;
}

class Card {
  constructor(c, n) {
    this.card = [c, n];
    this.id = c + n;
    this.hand = -1;
    this.stack = -1;
  }

  desc() {
    let card = DECK[this.card[0]];
    let str = "\n<details><summary>> " + card[0] + " [" + CLR[card[1]] + card[1] + "~000] " + this.id;
    if (this.hand == hand) {
      if (this.stack > -1) {
        str += "<a onClick=\"a('" + this.id + "', 1);\" style=\"cursor: pointer; cursor: hand;\"> [~080Spring~000]</a>";
      } else {
        str += " [~080Play:";
        str += "<a onClick=\"a('" + this.id + "', 1);\" style=\"cursor: pointer; cursor: hand;\"> 1</a>";
        str += "<a onClick=\"a('" + this.id + "', 2);\" style=\"cursor: pointer; cursor: hand;\"> 2</a>";
        str += "<a onClick=\"a('" + this.id + "', 3);\" style=\"cursor: pointer; cursor: hand;\"> 3</a>~000]";
      }
    }
    str += "</summary>\n- Condition: " + card[3] + "\n- Ability: " + card[2] + "</details>";
    return str;
  }

  spring(p) {
    let player = players[p];
    let msg = "<details><summary>";
    let card = DECK[this.card[0]]
    if (p == hand) {
      msg += "You sprung " + CLR[card[1]] + card[0] + "~000!";
      updateStacks();
    } else {
      msg += player.name + " sprung " + CLR[card[1]] + card[0] + "~000!";
    }
    log(msg + "</summary>\n- Condition: " + card[3] + "\n- Ability: " + card[2] + "</details>");
  }

  updatePos(hand, stack) {
    this.hand = hand;
    this.stack = stack;
  }

}

function a(id, stack="") {
  if (id == "stack") {
    send("Cler" + hand + ";" + stack);
    return;
  }
  if (players[hand].index(id) > -1 && stack != "") {
    send("Play" + hand + ";" + id + ";" + stack)
    return;
  }
  for (let i = 0; i < players[hand].stacks.length; i++) {
    let stack = players[hand].stacks[i];
    for (let j = 0; j < stack.length; j++) {
      if (stack[j].id == id) {
        send("Sprg" + hand + ";" + i + ";" + j);
        return;
      }
    }
  }
  log("~f00You no longer have this card!");
}

class Player {
  constructor(id, name) {
    this.name = name;
    this.online = false;
    this.joined = false;
    this.hand = [];
    this.stacks = [[], [], []];
    this.id = id;
  }

  hasCard(id) {
    let found = false;
    for (let i = 0; i < this.hand.length; i++) {
      if (id == this.hand[i].id) {
        found = true;
        break;
      }
    }
    return found;
  }

  index(id) {
    for (let i = 0; i < players[hand].hand.length; i++) {
      if (id == this.hand[i].id) {
        return i;
      }
    }
    return -1;
  }

  draw(amt, msg=true) {
    for (let i = 0; i < amt; i++) {
      let card = deck.pop();
      this.hand.push(card);
      card.updatePos(this.id, -1);
    }
    if (msg) {
      log(this.name + " drew from the deck! (" + amt + " Card" + (amt > 1 ? "s" : "") + ")");
    }
  }

  desc() {
    let str = this.id + 1 + ") " + this.name;
    str += "<a onClick=\"cmdInfo('info " + (this.id + 1) + "');\" style=\"cursor: pointer; cursor: hand;\"> [~d90Info~000]</a>";
    if (this.id == hand) {
      str += "<a onClick=\"cmdDraw('draw 1');\" style=\"cursor: pointer; cursor: hand;\"> [~0a4Draw~000]</a>";
    } else {
      str += "<a onClick=\"cmdSteal('steal " + (this.id + 1) + "');\" style=\"cursor: pointer; cursor: hand;\"> [~e20Steal~000]</a>";
    }
    str += "<a onClick=\"cmdDiscard('discard " + (this.id + 1) + "');\" style=\"cursor: pointer; cursor: hand;\"> [~800Discard~000]</a>";
    return str
  }

}

function setUpGame(data) {
  data = data.split(";;");
  for (let i = 1; i <= parseInt(data[1]); i++) {
    players.push(new Player(i - 1, "Player " + i));
  }
  let lisDeck = data[0].split(";").map(function(x) {
    return x.split(",");
  });
  for (let i = 0; i < lisDeck.length; i++) {
    deck.push(new Card(lisDeck[i][0], lisDeck[i][1]));
  }

}

function countPlayers() {
  let a = 0;
  for (let i = 0; i < players.length; i++) {
    if (players[i].online) {
      a++;
    }
  }
  return a;
}

const pubnub = new PubNub({
  publishKey: 'pub-c-6d5bcb69-9b5e-4028-8d71-16d663175bc2',
  subscribeKey: 'sub-c-0253bc9a-906b-11ec-918e-02d5075437d9',
  uuid: "uuid"
});

pubnub.addListener({
  message: function(event) {
    message(event);
  },
  status: function(event) {
    checkHistory(event);
  }
});

async function checkHistory(event) {
  let history;
  try {
    history = await pubnub.history({
      channel: event.affectedChannels[0],
      count: 100,
      stringifiedTimeToken: true,
    });
  } catch (status) {
    console.log(status);
  }
  for (let i = 0; i < history.messages.length; i++) {
    setTimeout(function() {
      message(new Object({ message: history.messages[i].entry }));
    }, 20 * i);
  }

}

async function findUnusedChannel(i, digits) {
  let id = Math.floor(Math.random() * 9 * 10**digits) + 10**(digits - 1) + "";
  let history;
  try {
    history = await pubnub.history({
      channel: "SV" + id,
      count: 1,
    });
  } catch (status) {
    console.log(status);
  }
  if (history.messages.length > 0) {
    if (i > 10) {
      digits += 1;
      i = -1;
    }
    return findUnusedChannel(i + 1, digits);
  } else {
    gameId = id;
    return id;
  }
}

async function send(message) {
  if (gameId == null) {
    pubnub.subscribe({
      channels: ["SV" + await findUnusedChannel(0, 2)],
      withPresence: true
    });
  }

  pubnub.publish({
    channel: "SV" + gameId,
    message: message
  }, function(status, response) {
    if (status.error) {
      console.log(status)
    }
  });
}

window.onbeforeunload = function() {
  if (gameId != null && hand > -1) {
    send("Leve" + hand);
  }
};
