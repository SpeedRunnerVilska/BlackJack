  // App.tsx

  import { useState, useEffect } from "react";

  type Card = {
    suit: string;
    value: string;
  };

  type Hand = {
    cards: Card[];
    finished: boolean;
    bet: number;
  };

  const suits = ["♠", "♥", "♦", "♣"];

  const values = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];

  function createDeck(): Card[] {
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push({
          suit,
          value,
        });
      }
    }

    return shuffle(deck);
  }

  function shuffle(deck: Card[]) {
    return [...deck].sort(() => Math.random() - 0.5);
  }

  function getCardValue(card: Card) {
    if (["J", "Q", "K"].includes(card.value))
      return 10;

    if (card.value === "A") return 11;

    return parseInt(card.value);
  }

  function calculateHand(cards: Card[]) {
    let total = 0;

    let aces = 0;

    for (const card of cards) {
      total += getCardValue(card);

      if (card.value === "A") aces++;
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  export default function App() {


    const [deck, setDeck] = useState<Card[]>([]);

    // Asettaa kokoa ikkunalle
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    function checkAutoFinishHands(updatedHands: Hand[]) {
    // Tarkistaa että käsi on ohi
    const newHands = [...updatedHands];

    let allFinished = true;

    for (const hand of newHands) {
      const total = calculateHand(hand.cards);

      if (total >= 21) {
        hand.finished = true;
      }

      if (!hand.finished) {
        allFinished = false;
      }
    }

    setHands(newHands);

    if (allFinished) {
      dealerTurn(newHands);
      return true;
    }

    return false;
  }

    const [dealerCards, setDealerCards] =
      useState<Card[]>([]);

    const [hands, setHands] = useState<Hand[]>(
      []
    );

    const [activeHand, setActiveHand] =
      useState(0);

    const [money, setMoney] = useState(1000);

    const [betAmount, setBetAmount] =
      useState(100);

    const [message, setMessage] = useState("");

    const [gameStarted, setGameStarted] =
      useState(false);

    const [gameOver, setGameOver] =
      useState(false);

    const [revealDealer, setRevealDealer] =
      useState(false);

    function drawCard(currentDeck: Card[]) {
      const newDeck = [...currentDeck];

      const card = newDeck.pop()!;

      return {
        card,
        newDeck,
      };
    }

    function startGame() {
      // Aloittaa uudenpelin
      if (money < betAmount) return;

      let newDeck = createDeck();

      const p1 = drawCard(newDeck);
      newDeck = p1.newDeck;

      const d1 = drawCard(newDeck);
      newDeck = d1.newDeck;

      const p2 = drawCard(newDeck);
      newDeck = p2.newDeck;

      const d2 = drawCard(newDeck);
      newDeck = d2.newDeck;

      const playerCards = [p1.card, p2.card];

      setDeck(newDeck);

      setDealerCards([d1.card, d2.card]);

      setHands([
        {
          cards: playerCards,
          finished:
            calculateHand(playerCards) === 21,
          bet: betAmount,
        },
      ]);

      setMoney((m) => m - betAmount);

      setGameStarted(true);

      setRevealDealer(false);

      setGameOver(false);

      setMessage("");

      setActiveHand(0);

      // Automaattisesti Pysyy Blackjackillä
      if (calculateHand(playerCards) === 21) {
        setTimeout(() => {
          dealerTurn([
            {
              cards: playerCards,
              finished: true,
              bet: betAmount,
            },
          ]);
        }, 400);
      }
    }

    function nextHand(updatedHands: Hand[]) {
      const next = updatedHands.findIndex(
        (h) => !h.finished
      );

      if (next !== -1) {
        setActiveHand(next);

        return;
      }

      dealerTurn(updatedHands);
    }

    function hit() {
      // Antaa Pelaajalle Extra Kortin Ja Lyö
      if (gameOver) return;

      const currentHands = [...hands];

      const hand = currentHands[activeHand];

      if (!hand || hand.finished) {
        return;
      }

      const currentTotal = calculateHand(
        hand.cards
      );

      // Estää lyönnin 21 jälkeen
      if (currentTotal >= 21) {
        hand.finished = true;

        setHands(currentHands);

        nextHand(currentHands);

        return;
      }

      const draw = drawCard(deck);

      hand.cards.push(draw.card);

      setDeck(draw.newDeck);

      const newTotal = calculateHand(
        hand.cards
      );

      // Automaattisesti häviää jos kortit ovat 22 / yli
      if (newTotal > 21) {
        hand.finished = true;

        setHands(currentHands);

        setMessage(
          `Hand ${activeHand + 1} busted with ${newTotal}`
        );

        nextHand(currentHands);

        return;
      }

      // Automaattisesti pysyy kun summa on 21
      if (newTotal === 21) {
        hand.finished = true;

        setHands(currentHands);

        setMessage(
          `Hand ${activeHand + 1} stands on 21`
        );

        nextHand(currentHands);

        return;
      }

      setHands(currentHands);
    }

    function stand() {
      // Seisoo kun painaa Stand Nappia
      if (gameOver) return;

      const currentHands = [...hands];

      currentHands[activeHand].finished =
        true;

      setHands(currentHands);

      nextHand(currentHands);
    }

    function doubleDown() {
      // Tuplaa Panoksen Ja Antaa Extra Kortin
      if (gameOver) return;

      const currentHands = [...hands];

      const hand = currentHands[activeHand];

      if (!hand) return;

      if (money < hand.bet) return;

      setMoney((m) => m - hand.bet);

      hand.bet *= 2;

      const draw = drawCard(deck);

      hand.cards.push(draw.card);

      const total = calculateHand(
        hand.cards
      );

      hand.finished = true;

      setDeck(draw.newDeck);

      setHands(currentHands);

      if (total > 21) {
        setMessage(
          `Hand ${activeHand + 1} busted with ${total}`
        );
      } else if (total === 21) {
        setMessage(
          `Hand ${activeHand + 1} stands on 21`
        );
      }

      nextHand(currentHands);
    }

    function split() {
    // Jakaa Sama pariset kortit
    if (gameOver) return;

    const currentHands = [...hands];

    const hand = currentHands[activeHand];

    if (!hand) return;

    if (
      hand.cards.length !== 2 ||
      getCardValue(hand.cards[0]) !==
        getCardValue(hand.cards[1])
    ) {
      return;
    }

    if (money < hand.bet) return;

    setMoney((m) => m - hand.bet);

    let newDeck = [...deck];

    const hand1: Hand = {
      cards: [hand.cards[0]],
      finished: false,
      bet: hand.bet,
    };

    const hand2: Hand = {
      cards: [hand.cards[1]],
      finished: false,
      bet: hand.bet,
    };

    const draw1 = drawCard(newDeck);
    newDeck = draw1.newDeck;

    const draw2 = drawCard(newDeck);
    newDeck = draw2.newDeck;

    hand1.cards.push(draw1.card);

    hand2.cards.push(draw2.card);

    const total1 = calculateHand(hand1.cards);
    const total2 = calculateHand(hand2.cards);

    // Automaattinen seisoo kortissa 21 tai tappio
    if (total1 >= 21) {
      hand1.finished = true;
    }

    if (total2 >= 21) {
      hand2.finished = true;
    }

    currentHands.splice(
      activeHand,
      1,
      hand1,
      hand2
    );

    setHands(currentHands);

    setDeck(newDeck);

    if (hand1.finished && hand2.finished) {
      dealerTurn(currentHands);
      return;
    }

    nextHand(currentHands);
  }

    function dealerTurn(playerHands: Hand[]) {
      // Antaa Dealerille Vuoron
      setRevealDealer(true);

      let newDealer = [...dealerCards];

      let newDeck = [...deck];

      while (calculateHand(newDealer) < 17) {
        const draw = drawCard(newDeck);

        newDealer.push(draw.card);

        newDeck = draw.newDeck;
      }

      setDealerCards(newDealer);

      setDeck(newDeck);

      const dealerTotal =
        calculateHand(newDealer);

      const dealerBust = dealerTotal > 21;

      let winnings = 0;

      playerHands.forEach((hand) => {
        const total = calculateHand(
          hand.cards
        );

        // Pelaaja Häviää
        if (total > 21) return;

        // Dealer Häviää
        if (dealerBust) {
          winnings += hand.bet * 2;
          return;
        }

        // Normaali vertailu
        if (total > dealerTotal) {
          winnings += hand.bet * 2;
        } else if (total === dealerTotal) {
          winnings += hand.bet;
        }
      });

      setMoney((m) => m + winnings);

      setGameOver(true);

      if (dealerBust) {
        setMessage(
          `Dealer busted with ${dealerTotal}! You won $${winnings}`
        );
      } else {
        setMessage(
          winnings > 0
            ? `You won $${winnings}`
            : `Dealer wins with ${dealerTotal}`
        );
      }
    }


    function renderCard(
      card: Card,
      index: number
    ) {
      // Renderaa Kortit
      return (
        <div
          key={index}
          style={{
            width: windowWidth < 600 ? 56 : 72,
            height: windowWidth < 600 ? 80 : 104,
            borderRadius: 8,
            background: "#f4f1ea",
            color: ["♥", "♦"].includes(
              card.suit
            )
              ? "#bb2d2d"
              : "#1b1b1b",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: 10,
            fontSize: windowWidth < 600 ? 16 : 22,
            fontWeight: 700,
            border:
              "1px solid rgba(0,0,0,0.15)",
            boxShadow:
              "0 2px 5px rgba(0,0,0,0.18)",
            animation: "deal 0.18s ease",
          }}
        >
          {card.value}
          {card.suit}
        </div>
      );
    }

    const currentHand = hands[activeHand];

    const canSplit =
      currentHand &&
      currentHand.cards.length === 2 &&
      getCardValue(currentHand.cards[0]) ===
        getCardValue(currentHand.cards[1]);

    const controlsDisabled =
      gameOver || !gameStarted;



    const casinoButton = {
      height: windowWidth < 900 ? 56 : 68,
      borderRadius: 10,
      border: "1px solid #2a323b",
      background: "#1a2027",
      color: "#f1f1f1",
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: 1,
    };

    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: windowWidth < 900 ? "column" : "row",
          background: "#0b1310",
          color: "white",
          fontFamily:
            "Inter, system-ui, sans-serif",
        }}
      >
        <style>
  {`
    * {
      box-sizing: border-box;
    }

    html,
    body,
    #root {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      overflow-x: hidden;
      background: #0b1310;
      font-family: Inter, system-ui, sans-serif;
    }

    body {
      overflow-y: auto;
    }

    button {
      transition:
        background 0.15s ease,
        border-color 0.15s ease,
        opacity 0.15s ease,
        transform 0.1s ease;
    }

    button:hover:enabled {
      background: #222a33 !important;
      border-color: #3a4552 !important;
    }

    button:active:enabled {
      transform: translateY(1px);
    }

    button:disabled {
      cursor: not-allowed !important;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type="number"] {
      -moz-appearance: textfield;
    }

    @keyframes deal {
      from {
        transform: translateY(-10px) scale(0.95);
        opacity: 0;
      }

      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    /* TABLET */

    @media (max-width: 900px) {
      h1 {
        font-size: 22px !important;
      }

      h2 {
        font-size: 18px !important;
      }

      button {
        min-height: 56px;
      }
    }

    /* MOBILE */

    @media (max-width: 600px) {
      h1 {
        font-size: 20px !important;
      }

      h2 {
        font-size: 16px !important;
      }

      button {
        font-size: 13px !important;
        min-height: 50px;
      }

      input {
        font-size: 18px !important;
      }
    }

    /* SMALL PHONES */

    @media (max-width: 420px) {
      h1 {
        font-size: 18px !important;
      }

      h2 {
        font-size: 15px !important;
      }

      button {
        font-size: 12px !important;
        min-height: 46px;
      }
    }
  `}
</style>

        {/* SIDEBAR - VASTAAVA */}

        <div
          style={{
            width: windowWidth < 900 ? "100%" : 285,
            minWidth: windowWidth < 900 ? "auto" : 285,
            height: windowWidth < 900 ? "auto" : "100vh",
            maxHeight: windowWidth < 900 ? "none" : "100vh",
            padding: 16,
            background: "#12161b",
            borderRight: windowWidth < 900 ? "none" : "1px solid #20262d",
            borderBottom: windowWidth < 900 ? "1px solid #20262d" : "none",
            display: "flex",
            flexDirection: "column",
            overflowY: windowWidth < 900 ? "visible" : "auto",
          }}
        >
          <div
            style={{
              paddingBottom: 18,
              marginBottom: 18,
              borderBottom:
                "1px solid #20262d",
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                color: "#7e8a97",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Balance
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#f4f4f4",
                letterSpacing: -1,
              }}
            >
              ${money}
            </div>
          </div>

          <div
            style={{
              marginBottom: 18,
              padding: windowWidth < 900 ? 12 : 16,
              borderRadius: 10,
              background: "#171c22",
              border: "1px solid #232a32",
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#7e8a97",
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              Bet Amount
            </div>

            <input
              type="number"
              value={betAmount}
              onChange={(e) =>
                setBetAmount(
                  Number(e.target.value)
                )
              }
              // Tyylistää
              style={{
                width: "100%",
                height: 52,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid #2a323b",
                background: "#0f1317",
                color: "#f3f3f3",
                fontSize: 22,
                fontWeight: 500,
                outline: "none",
                marginBottom: 14,
              }}
            />

            <button
              onClick={startGame}
              disabled={
                gameStarted && !gameOver
              }
              style={{
                width: "100%",
                height: 48,
                borderRadius: 8,
                border: "none",
                background: "#2b6de0",
                color: "white",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 0.3,
                cursor:
                  gameStarted && !gameOver
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  gameStarted && !gameOver
                    ? 0.5
                    : 1,
              }}
            >
              Place Bet
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                windowWidth < 900 ? "1fr 1fr 1fr 1fr" : "1fr 1fr",
              gap: 10,
            }}
          >
            <button
              onClick={hit}
              disabled={controlsDisabled}
              style={{
                ...casinoButton,
                opacity:
                  controlsDisabled ? 0.35 : 1,
                cursor: controlsDisabled
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              HIT
            </button>

            <button
              onClick={stand}
              disabled={controlsDisabled}
              style={{
                ...casinoButton,
                opacity:
                  controlsDisabled ? 0.35 : 1,
                cursor: controlsDisabled
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              STAND
            </button>

            <button
              onClick={split}
              disabled={
                !canSplit || controlsDisabled
              }
              style={{
                ...casinoButton,
                opacity:
                  !canSplit ||
                  controlsDisabled
                    ? 0.35
                    : 1,
                cursor:
                  !canSplit ||
                  controlsDisabled
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              SPLIT
            </button>

            <button
              onClick={doubleDown}
              disabled={controlsDisabled}
              style={{
                ...casinoButton,
                opacity:
                  controlsDisabled ? 0.35 : 1,
                cursor: controlsDisabled
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              DOUBLE
            </button>
          </div>

          <div
            style={{
              marginTop: "auto",
              paddingTop: 18,
              borderTop:
                "1px solid #20262d",
              display: "flex",
              flexDirection: windowWidth < 900 ? "row" : "column",
              gap: windowWidth < 900 ? 24 : 8,
              color: "#6f7b88",
              fontSize: 13,
            }}
          >
            {/* TODO: Add custom info display here */}
            <div>
              Hands: {hands.length}
            </div>

            <div>
              Deck: {deck.length} cards
            </div>
          </div>
        </div>

        {/* GAME AREA - RESPONSIVE */}

        <div
          style={{
            flex: 1,
            height: windowWidth < 900 ? "auto" : "100vh",
            overflowY: "auto",
            padding: windowWidth < 600 ? 16 : 36,
            background:
              "radial-gradient(circle at center, #1d5a39 0%, #123826 75%)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 70,
              borderRadius: "50%",
              border:
                "2px solid rgba(255,255,255,0.05)",
              pointerEvents: "none",
            }}
          />

          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 14,
                letterSpacing: -0.5,
              }}
            >
              Dealer
            </h1>

            <div
              style={{
                display: "flex",
                gap: 14,
              }}
            >
              {dealerCards.map(
                (card, index) => {
                  // Paljastaa Dealerin Kortit
                  if (
                    !revealDealer &&
                    index === 1
                  ) {
                    return (
                      <div
                        key={index}
                        style={{
                          width: windowWidth < 600 ? 56 : 72,
                          height: windowWidth < 600 ? 80 : 104,
                          borderRadius: 8,
                          background: "#1e4f8f",
                          border:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                    );
                  }

                  return renderCard(card, index);
                }
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {hands.map((hand, i) => (
              <div
                key={i}
                style={{
                  padding: windowWidth < 600 ? 12 : 20,
                  borderRadius: 12,
                  border:
                    activeHand === i &&
                    !gameOver
                      ? "1px solid #c6a85b"
                      : "1px solid rgba(255,255,255,0.05)",
                  background:
                    "rgba(0,0,0,0.16)",
                  backdropFilter: "blur(3px)",
                  maxWidth: "100%",
                }}
              >
                <h2
                  style={{
                    fontSize: windowWidth < 600 ? 16 : 20,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  Hand {i + 1} -{" "}
                  {calculateHand(hand.cards)}
                </h2>

                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  {hand.cards.map(renderCard)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: windowWidth < 600 ? 18 : 24,
              fontWeight: 600,
              color:
                message.includes("won")
                  ? "#7dff9d"
                  : "#f1f1f1",
            }}
          >
            {message}
          </div>
        </div>
      </div>
    );
  }