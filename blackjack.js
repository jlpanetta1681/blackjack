var blackjack = {
  // DEBUG MODE
  debug : true,

  // FLAG COLLECTION - HTML REFERENCES
  hdstand : null, // dealer stand
  hdpoints : null, // dealer points
  hdhand : null, // dealer hand
  hpstand : null, // player stand
  hppoints : null, // player points
  hphand : null, // player hand
  hstart : null, // start game
  hmove : null, // hit or stand

  // FLAG COLLECTION - GAME
  deck : [], // The current deck of cards
  dealer : [], // The dealer's current hand
  player : [], // The player's current hand
  dpoints : 0, // The dealer's current points
  ppoints : 0, // The player's current points
  safety : 17, // Computer will stand on or past this point
  dstand : false, // Dealer decided to stand
  pstand : false, // Player decided to stand

  init : function () {
  // init() : initialize game

    // (A) GET HTML ELEMENTS
    blackjack.hdstand = document.getElementById("dealer-stand");
    blackjack.hdpoints = document.getElementById("dealer-points");
    blackjack.hdhand = document.getElementById("dealer-cards");
    blackjack.hpstand = document.getElementById("player-stand");
    blackjack.hppoints = document.getElementById("player-points");
    blackjack.hphand = document.getElementById("player-cards");
    blackjack.hstart = document.getElementById("player-start");
    blackjack.hmove = document.getElementById("player-move");

    // (B) ATTACH ONCLICK EVENTS
    document.getElementById("play-start").addEventListener("click", blackjack.start);
    document.getElementById("play-hit").addEventListener("click", blackjack.hit);
    document.getElementById("play-stand").addEventListener("click", blackjack.stand);

    // (DEBUG) READY
    if (blackjack.debug) { console.log("Game initialized - Ready"); }
  },

  start : function () {
  // start() : start a new game

    // (A) RESET POINTS, HANDS, AND DECK
    blackjack.deck = [];
    blackjack.dealer = [];
    blackjack.player = [];
    blackjack.dpoints = 0;
    blackjack.ppoints = 0;
    blackjack.dstand = false;
    blackjack.pstand = false;
    blackjack.hpstand.classList.add("ninja");
    blackjack.hdstand.classList.add("ninja");
    blackjack.hdpoints.innerHTML = "?";
    blackjack.hppoints.innerHTML = 0;
    blackjack.hdhand.innerHTML = "";
    blackjack.hphand.innerHTML = "";

    // (B) SET CARDS IN ORDER
    for (let i=0; i<4; i++) {
      for (let j=1; j<14; j++) {
        blackjack.deck.push({
          // Shape
          // 0 = Heart
          // 1 = Diamond
          // 2 = Club
          // 3 = Spade
          s : i,
          // Number
          // 1 = Ace
          // 2 to 10 = As-it-is
          // 11 = Jack
          // 12 = Queen
          // 13 = King
          n : j
        });
      }
    }

    // (C) RANDOM SHUFFLE DECK - FISHER-YATES ALGO
    // https://medium.com/@nitinpatel_20236/how-to-shuffle-correctly-shuffle-an-array-in-javascript-15ea3f84bfb
    for (let i=blackjack.deck.length - 1; i>0; i--) {
      let j = Math.floor(Math.random() * i);
      let temp = blackjack.deck[i];
      blackjack.deck[i] = blackjack.deck[j];
      blackjack.deck[j] = temp;
    }

    // (DEBUG) SHOW RESHUFFLED DECK
    if (blackjack.debug) {
      console.log("Deck reshuffled");
      console.table(blackjack.deck);
    }

    // (D) UPDATE GAME INTERFACE
    blackjack.hstart.classList.add("ninja");
    blackjack.hmove.classList.remove("ninja");
    
    // (E) DRAW FIRST 2 CARDS
    blackjack.draw(0);
    blackjack.draw(1);
    blackjack.draw(0);
    blackjack.draw(1);
    blackjack.points(0);
    blackjack.points(1);

    // (F) ANY LUCKY WINNERS?
    blackjack.check();
  },

  draw : function (target) {
  // draw() : draw a card
  // PARAM target : 0 for player, 1 for dealer

    // (A) TAKE LAST CARD OFF THE DECK
    var card = blackjack.deck.pop();

    // (B) CARD SYMBOLS & NUMBER
    var symbol = ["&hearts;", "&diams;", "&clubs;", "&spades;"],
        number = card.n;
    if (card.n==1) { number = "A"; }
    if (card.n==11) { number = "J"; }
    if (card.n==12) { number = "Q"; }
    if (card.n==13) { number = "K"; }

    // (C) DRAW CARD HTML
    var drawing = document.createElement("div");
    drawing.classList.add("card");

    // Exception - Hide the first dealer card
    if (target && blackjack.dealer.length==0) {
      var dealerFirstFront = document.createElement("div"),
          dealerFirstBack = document.createElement("div");
      dealerFirstFront.innerHTML = number + symbol[card.s];
      dealerFirstBack.innerHTML = "[HIDDEN]";
      dealerFirstFront.id = "dealer-first-f";
      dealerFirstBack.id = "dealer-first-b";
      dealerFirstFront.classList.add("ninja");
      drawing.appendChild(dealerFirstFront);
      drawing.appendChild(dealerFirstBack);
    } else {
      drawing.innerHTML = number + symbol[card.s];
    }

    // (D) ASSIGN CARD
    if (target) {
      blackjack.dealer.push(card);
      blackjack.hdhand.appendChild(drawing);
    } else {
      blackjack.player.push(card);
      blackjack.hphand.appendChild(drawing);
    }

    // (DEBUG) LOG DRAWN CARD
    if (blackjack.debug) {
      console.log((target ? "Dealer" : "Player") + " has drawn - " + number + " " + symbol[card.s]);
    }
  },

  points : function (target) {
  // points() : calculate and update points
  // PARAM target : 0 for player, 1 for dealer

    // (A) RUN THROUGH CARDS
    // Take cards 1-10 at face value
    // J, Q, K at 10 points
    // Don't calculate aces yet - They can either be 1 or 11
    var aces = 0, points = 0;
    for (let i of (target ? blackjack.dealer : blackjack.player)) {
      if (i.n == 1) { aces++; }
      else if (i.n>=11 && i.n<=13) { points += 10; }
      else { points += i.n; }
    }

    // (B) CALCULATE IF THERE ARE ACES
    // Note - Can have multiple aces
    if (aces!=0) {
      // Calculate all possible points
      var minmax = [];
      for (let elevens=0; elevens<=aces; elevens++) {
        let calc = points + (elevens * 11) + (aces-elevens * 1);
        minmax.push(calc);
      }

      // Take safest highest score
      points = minmax[0];
      for (let i of minmax) {
        if (i > points && i <= 21) { points = i; }
      }
    }

    // (C) UPDATE POINTS
    if (target) {
      blackjack.dpoints = points;
    } else {
      blackjack.ppoints = points;
      blackjack.hppoints.innerHTML = points;
    }

    // (DEBUG) SCORE
    if (blackjack.debug) {
      console.log((target?"Dealer":"Player") + " total points - " + points);
    }
  },

  check : function () {
  // check() : check for winners (and losers)

    // (A) FLAGS
    var winner = null, // 0 for player, 1 for dealer, 2 for a tie
        message = "";

    // (B) BLACKJACK - WIN ON FIRST ROUND
    if (blackjack.player.length==2 && blackjack.dealer.length==2) {
      // Tie
      if (blackjack.ppoints==21 && blackjack.dpoints==21) {
        winner = 2;
        message = "It's a tie with Blackjacks";
      }
      // Player wins
      if (winner==null && blackjack.ppoints==21) {
        winner = 0;
        message = "Player wins with a Blackjack!";
      }
      // Dealer wins
      if (winner==null && blackjack.dpoints==21) {
        winner = 1;
        message = "Dealer wins with a Blackjack!";
      }
    }

    // (C) WHO GONE BUST?
    if (winner == null) {
      // Player gone bust
      if (blackjack.ppoints>21) {
        winner = 1;
        message = "Player has gone bust - Dealer wins!";
      }
      // Dealer gone bust
      if (blackjack.dpoints>21) {
        winner = 0;
        message = "Dealer has gone bust - Player wins!";
      }
    }

    // (D) POINTS CHECK - ON ALL PLAYERS STAND ONLY
    if (winner == null && blackjack.dstand && blackjack.pstand) {
      // Dealer has more points
      if (blackjack.dpoints > blackjack.ppoints) {
        winner = 1;
        message = "Dealer wins with " + blackjack.dpoints + " points!";
      }
      // Player has more points
      else if (blackjack.dpoints < blackjack.ppoints) {
        winner = 0;
        message = "Player wins with " + blackjack.ppoints + " points!";
      }
      // Tie
      else {
        winner = 2;
        message = "It's a tie.";
      }
    }

    // (E) IF WE HAVE A WINNER
    if (winner != null) {
      // Show dealer hand and score
      blackjack.hdpoints.innerHTML = blackjack.dpoints;
      document.getElementById("dealer-first-b").classList.add("ninja");
      document.getElementById("dealer-first-f").classList.remove("ninja");

      // Reset interface
      blackjack.hmove.classList.add("ninja");
      blackjack.hstart.classList.remove("ninja");

      // Winner is...
      alert(message);
    }

    return winner;
  },

  doHit : function (target) {
  // doHit() : process draw card
  // PARAM target : 0 for player, 1 for dealer

    // (A) DRAW A NEW CARD
    blackjack.draw(target);
    blackjack.points(target);

    // (B) AUTO-STAND ON 21 POINTS
    if (target==0 && blackjack.ppoints==21 && !blackjack.pstand) {
      blackjack.doStand(0);
    }
    if (target==1 && blackjack.dpoints==21 && !blackjack.dstand) {
      blackjack.doStand(1);
    }
  },

  doStand : function (target) {
  // doStand() : set stand
  // PARAM target : 0 for player, 1 for dealer

    if (target) {
      blackjack.dstand = true;
      blackjack.hdstand.classList.remove("ninja");
    } else {
      blackjack.pstand = true;
      blackjack.hpstand.classList.remove("ninja");
    }
  },

  hit : function () {
  // hit() : player decides to hit

    // (A) PLAYER DRAW CARD
    blackjack.doHit(0);
    
    // (B) GOT WINNER OR LOSER?
    var winner = blackjack.check();

    // (C) COMPUTER MOVE
    if (winner==null && !blackjack.dstand) { 
      blackjack.ai(); 
    }
  },

  stand : function () {
  // stand() : player decides to stand

    // (A) UPDATE STAND FLAG
    blackjack.doStand(0);

    // (B) END GAME OR LET COMPUTER KEEP GOING?
    var winner = null;
    if (blackjack.pstand && blackjack.dstand) {
      winner = blackjack.check();
    }
    if (winner==null) { blackjack.ai(); }
  },

  ai : function () {
  // ai() : "smart" computer move

    // (A) STAND ON SAFETY LIMIT
    if (blackjack.dpoints >= blackjack.safety) {
      blackjack.doStand(1);
    }

    // (B) ELSE DRAW ANOTHER CARD
    else {
      blackjack.doHit(1);
    }

    // (C) GOT WINNER OR LOSER?
    // Computer will continue to draw more cards if player did stand
    var winner = blackjack.check();
    if (winner == null && blackjack.pstand) { blackjack.ai(); }
  }
};

// Init game on page load
window.addEventListener("load", blackjack.init);