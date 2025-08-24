const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("reset");
const newRoundButton = document.getElementById("newRound");

const modeSelect = document.getElementById("mode");
const difficultySelect = document.getElementById("difficulty");
const themeSelect = document.getElementById("theme");

const player1ScoreEl = document.getElementById("player1Score");
const player2ScoreEl = document.getElementById("player2Score");
const drawScoreEl = document.getElementById("drawScore");

let board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let mode = "bot";

let scores = { p1: 0, p2: 0, draw: 0 };

// 🎵 efek suara
const clickSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3");
const winSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3");

// 🎉 confetti canvas
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;
let confettiParticles = [];

// Buat papan
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
  if (board[idx] === "" && !gameOver) {
    board[idx] = currentPlayer;
    clickSound.play();
    updateBoard();

    if (checkWinner(board, currentPlayer)) {
      endGame(`${getPlayerName(currentPlayer)} menang!`, currentPlayer);
      return;
    }
    if (isDraw()) {
      endGame("⚖️ Seri!", "draw");
      return;
    }

    // Ganti giliran
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusElement.textContent = "Giliran " + getPlayerName(currentPlayer);

    // Jika mode bot & giliran bot
    if (mode === "bot" && currentPlayer === "O") {
      setTimeout(botMove, 500);
    }
  }
}

// Bot gerak
function botMove() {
  const difficulty = difficultySelect.value;
  let move;

  if (difficulty === "easy") {
    move = randomMove();
  } else if (difficulty === "medium") {
    move = findBestMove(board, "O") ?? randomMove();
  } else {
    move = minimax(board, "O").index;
  }

  board[move] = "O";
  clickSound.play();
  updateBoard();

  if (checkWinner(board, "O")) {
    endGame("🤖 Bot menang!", "O");
    return;
  }
  if (isDraw()) {
    endGame("⚖️ Seri!", "draw");
    return;
  }

  currentPlayer = "X";
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

function endGame(message, winner) {
  statusElement.textContent = message;
  gameOver = true;
  winSound.play();

  if (winner === "X") scores.p1++;
  else if (winner === "O") scores.p2++;
  else scores.draw++;

  updateScore();

  // highlight pattern
  if (winner !== "draw") {
    const pattern = getWinnerPattern(board, winner);
    if (pattern) {
      pattern.forEach(idx => {
        document.querySelectorAll(".cell")[idx].classList.add("winner");
      });
    }
    startConfetti();
  }
}

function updateScore() {
  player1ScoreEl.textContent = scores.p1;
  player2ScoreEl.textContent = scores.p2;
  drawScoreEl.textContent = scores.draw;
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

  if (checkWinner(newBoard, "X")) return {score: -10};
  if (checkWinner(newBoard, "O")) return {score: 10};
  if (availSpots.length === 0) return {score: 0};

  const moves = [];
  for (let spot of availSpots) {
    const move = { index: spot };
    newBoard[spot] = player;

    if (player === "O") {
      move.score = minimax(newBoard, "X").score;
    } else {
      move.score = minimax(newBoard, "O").score;
    }
    newBoard[spot] = "";
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -Infinity;
    moves.forEach((m,i)=>{ if(m.score > bestScore){ bestScore=m.score; bestMove=i; } });
  } else {
    let bestScore = Infinity;
    moves.forEach((m,i)=>{ if(m.score < bestScore){ bestScore=m.score; bestMove=i; } });
  }
  return moves[bestMove];
}

// Reset game (tapi skor tetap)
newRoundButton.addEventListener("click", () => {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  statusElement.textContent = "Giliran " + getPlayerName(currentPlayer);
  createBoard();
  stopConfetti();

  if (mode === "bot" && currentPlayer === "O") {
    setTimeout(botMove, 500);
  }
});

// Reset semua skor
resetButton.addEventListener("click", () => {
  scores = { p1: 0, p2: 0, draw: 0 };
  updateScore();
  newRoundButton.click();
});

// Mode change
modeSelect.addEventListener("change", () => {
  mode = modeSelect.value;
  newRoundButton.click();
});

// Tema change
themeSelect.addEventListener("change", () => {
  document.body.className = themeSelect.value;
});

// Utility
function getPlayerName(symbol) {
  if (mode === "pvp") {
    return symbol === "X" ? "Player 1" : "Player 2";
  } else {
    return symbol === "X" ? "Kamu" : "Bot";
  }
}

// 🎉 Confetti
function startConfetti() {
  confettiParticles = [];
  for (let i=0;i<150;i++) {
    confettiParticles.push({
      x: Math.random()*confettiCanvas.width,
      y: Math.random()*confettiCanvas.height - confettiCanvas.height,
      r: Math.random()*6+4,
      d: Math.random()*20+10,
      color: `hsl(${Math.random()*360},100%,50%)`,
      tilt: Math.floor(Math.random()*10)-10
    });
  }
  requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiParticles.forEach(p=>{
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2,true);
    ctx.fill();
  });
  updateConfetti();
  if (gameOver) requestAnimationFrame(drawConfetti);
}

function updateConfetti() {
  confettiParticles.forEach(p=>{
    p.y += Math.cos(p.d)+p.r/2;
    p.x += Math.sin(p.d);
    if (p.y > confettiCanvas.height) {
      p.y = -10;
      p.x = Math.random()*confettiCanvas.width;
    }
  });
}

function stopConfetti() {
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiParticles = [];
}

// Init
createBoard();
statusElement.textContent = "Pilih mode dan mulai permainan!";
