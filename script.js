const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("reset");
const difficultySelect = document.getElementById("difficulty");
const symbolSelect = document.getElementById("symbol");

const playerScoreEl = document.getElementById("playerScore");
const botScoreEl = document.getElementById("botScore");
const drawScoreEl = document.getElementById("drawScore");

let board = Array(9).fill("");
let playerSymbol = "X";
let botSymbol = "O";
let currentPlayer = "X";
let gameOver = false;

let playerScore = 0, botScore = 0, drawScore = 0;

// Buat board
function createBoard() {
  boardElement.innerHTML = "";
  board.forEach((_, i) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleCellClick);
    boardElement.appendChild(cell);
  });
}

// Klik player
function handleCellClick(e) {
  const idx = e.target.dataset.index;
  if (board[idx] === "" && !gameOver && currentPlayer === playerSymbol) {
    board[idx] = playerSymbol;
    updateBoard();
    if (checkWinner(board, playerSymbol)) {
      endGame("Kamu menang!", "player", getWinnerPattern(board, playerSymbol));
      return;
    }
    if (isDraw()) {
      endGame("Seri!", "draw");
      return;
    }
    currentPlayer = botSymbol;
    statusElement.textContent = "Giliran Bot...";
    setTimeout(botMove, 500);
  }
}

// Bot move
function botMove() {
  const difficulty = difficultySelect.value;
  let move;

  if (difficulty === "easy") {
    move = randomMove();
  } else if (difficulty === "medium") {
    move = findBestMove(board, botSymbol) ?? randomMove();
  } else {
    move = minimax(board, botSymbol).index;
  }

  board[move] = botSymbol;
  updateBoard();

  if (checkWinner(board, botSymbol)) {
    endGame("Bot menang!", "bot", getWinnerPattern(board, botSymbol));
    return;
  }
  if (isDraw()) {
    endGame("Seri!", "draw");
    return;
  }

  currentPlayer = playerSymbol;
  statusElement.textContent = "Giliran Kamu";
}

function updateBoard() {
  document.querySelectorAll(".cell").forEach((cell, i) => {
    cell.textContent = board[i];
    cell.classList.remove("winner");
  });
}

function randomMove() {
  const available = board.map((v,i)=> v===""?i:null).filter(v=>v!==null);
  return available[Math.floor(Math.random()*available.length)];
}

function checkWinner(b, player) {
  return getWinnerPattern(b, player) !== null;
}

function getWinnerPattern(b, player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let pattern of winPatterns) {
    if (pattern.every(idx => b[idx] === player)) return pattern;
  }
  return null;
}

function isDraw() {
  return board.every(cell => cell !== "");
}

function endGame(message, winner, pattern=null) {
  statusElement.textContent = message;
  gameOver = true;

  if (pattern) {
    pattern.forEach(idx => {
      document.querySelectorAll(".cell")[idx].classList.add("winner");
    });
  }

  if (winner === "player") playerScore++;
  else if (winner === "bot") botScore++;
  else drawScore++;

  updateScore();
}

function updateScore() {
  playerScoreEl.textContent = playerScore;
  botScoreEl.textContent = botScore;
  drawScoreEl.textContent = drawScore;
}

// Cari langkah menang cepat
function findBestMove(b, player) {
  for (let i=0;i<9;i++) {
    if (b[i] === "") {
      b[i] = player;
      if (checkWinner(b, player)) {
        b[i] = "";
        return i;
      }
      b[i] = "";
    }
  }
  return null;
}

// Minimax
function minimax(newBoard, player) {
  const availSpots = newBoard.map((v,i)=> v===""?i:null).filter(v=>v!==null);

  if (checkWinner(newBoard, playerSymbol)) return {score: -10};
  if (checkWinner(newBoard, botSymbol)) return {score: 10};
  if (availSpots.length === 0) return {score: 0};

  const moves = [];

  for (let spot of availSpots) {
    const move = { index: spot };
    newBoard[spot] = player;

    if (player === botSymbol) {
      move.score = minimax(newBoard, playerSymbol).score;
    } else {
      move.score = minimax(newBoard, botSymbol).score;
    }

    newBoard[spot] = "";
    moves.push(move);
  }

  let bestMove;
  if (player === botSymbol) {
    let bestScore = -Infinity;
    for (let i=0;i<moves.length;i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i=0;i<moves.length;i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }
  return moves[bestMove];
}

// Reset
resetButton.addEventListener("click", () => {
  playerSymbol = symbolSelect.value;
  botSymbol = playerSymbol === "X" ? "O" : "X";
  currentPlayer = "X";
  board = Array(9).fill("");
  gameOver = false;
  statusElement.textContent = "Giliran " + (currentPlayer === playerSymbol ? "Kamu" : "Bot");
  createBoard();

  if (currentPlayer === botSymbol) {
    setTimeout(botMove, 500);
  }
});

// Init
createBoard();
