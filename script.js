let board = [];
let firstClick = true;
let defeatPending = false;
let gameOver = false;
let timer = 0;
let timerInterval = null;

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");

const infoToggle = document.getElementById("info-toggle");
const instructions = document.getElementById("instructions");
const beginBtn = document.getElementById("begin-btn");
const difficultySelect = document.getElementById("difficulty");
instructions.classList.add("hidden");
infoToggle.textContent = "ℹ️";

const difficultyDisplay = document.getElementById("difficulty-display");
const timeDisplay = document.getElementById("time");
timeDisplay.textContent = timer;

if (timeDisplay){
    timeDisplay.textContent = timer;
}
let currentDifficulty = null;

const difficulties = {
    Easy: {
        width: 9,
        height: 9,
        mines: 10
    },
    Intermediate: {
        width: 16,
        height: 16,
        mines: 40
    },
    Expert: {
        width: 30,
        height: 16,
        mines: 99
    }
};

beginBtn.addEventListener("click", startGame);

function startGame() {
    document.body.classList.remove("win", "lose");
    stopTimer();
    timer = 0;
    timeDisplay.textContent = timer;

    firstClick = true;
    defeatPending = false;
    gameOver = false;

    const selected = difficultySelect.value;
    currentDifficulty = difficulties[selected];

    difficultyDisplay.textContent = "Difficulty: " + selected;

    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    createBoard(currentDifficulty);
}

function createBoard(config) {
    const boardElement = document.getElementById("board");
    const maxHeight = window.innerHeight * 0.75;
    const tileSize = Math.max(18, Math.min(32, Math.floor(maxHeight / config.height)));

    boardElement.innerHTML = "";
    board = [];
    boardElement.style.gridTemplateColumns = `repeat(${config.width}, ${tileSize}px)`;

    for (let y = 0; y < config.height; y++) {
        let row = [];
        for (let x = 0; x < config.width; x++) {
            const tileElement = document.createElement("div");
            tileElement.classList.add("tile");
            tileElement.style.width = tileSize + "px";
            tileElement.style.height = tileSize + "px";
            tileElement.addEventListener("click", () => handleTileClick(x, y));
            tileElement.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                toggleFlag(x, y);
            });
            boardElement.appendChild(tileElement);

            const tile = {
                x: x,
                y: y,
                mine: false,
                revealed: false,
                flagged: false,
                adjacent: 0,
                element: tileElement
            };
            row.push(tile);
        }
        board.push(row);
    }
}

function handleTileClick(x, y) {
    if (defeatPending){
        endGame(false);
        return;
    }

    if (gameOver) return;

    const tile = board[y][x];

    if (tile.revealed || tile.flagged) return;
    if (firstClick) {
        generateMines(x, y);
        calculateNumbers();
        startTimer();
        firstClick = false;
    }
    revealTile(tile);
}

function toggleFlag(x, y) {
    if (gameOver || defeatPending) return;
    const tile = board[y][x];

    if (tile.revealed) return;

    tile.flagged = !tile.flagged;

    if (tile.flagged) {
        tile.element.textContent = "🚩";
    } else {
        tile.element.textContent = "";
    }
}

function generateMines(safeX, safeY) {
    let minesPlaced = 0;
    while (minesPlaced < currentDifficulty.mines) {
        const x = Math.floor(Math.random() * currentDifficulty.width);
        const y = Math.floor(Math.random() * currentDifficulty.height);

        const tile = board[y][x];
        if (tile.mine) continue;
        if (x === safeX && y === safeY) continue;

        tile.mine = true;
        minesPlaced++;
    }
}

function calculateNumbers() {
    for (let y = 0; y < currentDifficulty.height; y++) {
        for (let x = 0; x < currentDifficulty.width; x++) {
            const tile = board[y][x];
            if (tile.mine) continue;
            let count = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && ny >= 0 && nx < currentDifficulty.width && ny < currentDifficulty.height) {
                        if (board[ny][nx].mine) count++;
                    }
                }
            }
            tile.adjacent = count;
        }
    }
}

function revealTile(tile) {
    if (tile.revealed || tile.flagged) return;
    tile.revealed = true;
    tile.element.classList.add("revealed");
    if (tile.mine) {
        tile.element.classList.add("mine-hit");
        for (let row of board) {
            for (let t of row) {
                if (t.mine) {
                    t.element.textContent = "💣";
                    t.revealed = true;
                }
            }
        }
        stopTimer();
        defeatPending = true;
        return;
    }
    if (tile.adjacent > 0) {
        tile.element.textContent = tile.adjacent;
    } else {
        tile.element.textContent = "0";
        revealNeighbours(tile);
    }
    checkVictory();
}

function revealNeighbours(tile) {
    if (tile.adjacent !== 0) return;
    const dirs = [-1, 0, 1];
    for (let dy of dirs) {
        for (let dx of dirs) {
            if (dx === 0 && dy === 0) continue;
            const nx = tile.x + dx;
            const ny = tile.y + dy;
            if (nx >= 0 && ny >= 0 && nx < currentDifficulty.width && ny < currentDifficulty.height) {
                revealTile(board[ny][nx]);
            }
        }
    }
}

function startTimer() {
    timer = 0;
    timeDisplay.textContent = timer;

    timerInterval = setInterval(() => {
        timer++;
        timeDisplay.textContent = timer;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

const themeToggle = document.getElementById("theme-toggle");

let darkMode = false;

themeToggle.addEventListener("click", () => {

    darkMode = !darkMode;

    if (darkMode) {
        document.body.classList.add("dark");
        themeToggle.textContent = "🌙";
    } else {
        document.body.classList.remove("dark");
        themeToggle.textContent = "☀️";
    }

});

function endGame(win) {
    hideInfoButton();
    infoToggle.style.display = "none";
    stopTimer();

    gameScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    if (win) {
        document.body.classList.add("win");
    } else {
        document.body.classList.add("lose");
    }

    const resultTitle = document.getElementById("result-title");
    const resultDifficulty = document.getElementById("result-difficulty");
    const resultTime = document.getElementById("result-time");
    resultTitle.textContent = win ? "Victory!" : "Game Over!";
    resultTitle.style.color = win ? "#4CAF50" : "#F44336";
    resultDifficulty.textContent = "Difficulty: " + difficultyDisplay.textContent.replace("Difficulty: ", "");
    resultTime.textContent = "Time: " + timer + " seconds";

    gameOver = true;
}

function checkVictory() {
    let unrevealed = 0;
    for (let row of board) {
        for (let tile of row) {
            if (!tile.revealed && !tile.mine) {
                unrevealed++;
            }
        }
    }
    if (unrevealed === 0) {
        endGame(true);
    }
}

document.getElementById("restart-btn").addEventListener("click", () => {
    resultScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");

    document.body.classList.remove("win", "lose");

    showInfoButton();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
        if (!menuScreen.classList.contains("hidden")) return;
        resultScreen.classList.add("hidden");
        gameScreen.classList.add("hidden");
        menuScreen.classList.remove("hidden");
    }
});

infoToggle.addEventListener("click", () => {
    const isHidden = instructions.classList.contains("hidden");
    if (isHidden) {
        instructions.classList.remove("hidden");
        infoToggle.textContent = "❌";
    } else {
        instructions.classList.add("hidden");
        infoToggle.textContent = "ℹ️";
    }
});

function showInfoButton() {
    infoToggle.style.display = "block";
}

function hideInfoButton() {
    infoToggle.style.display = "none";
}

function createSpark(side) {
    const spark = document.createElement("div");
    spark.classList.add("spark");
    
    const y = Math.random() * window.innerHeight;

    spark.style.top = y + "px";
    spark.style.left = side === "left" ? (Math.random() * 20) + "px" : (window.innerWidth - Math.random() * 20) + "px";
    const size = Math.random() * 3 + 2;
    spark.style.width = size + "px";
    spark.style.height = size + "px";
    spark.style.opacity = Math.random() * 0.8 + 0.2;
    spark.style.boxShadow = "0 0 8px gold";

    document.body.appendChild(spark);
    const drift = (Math.random() * 200 +150) * (side === "left" ? 1 : -1);
    const duration = 1200 + (4-size) * 300;

    spark.animate([
        { transform: `translateX(0px)`, opacity: spark.style.opacity },
        { transform: `translateX(${drift}px)`, opacity: 0 }
    ], {
        duration: 1500 + Math.random() * 1000,
        easing: "ease-out"
    });


    setTimeout(() => spark.remove(), 2500);
}

setInterval(() => {
    for (let i = 0; i < 6; i++) {
        createSpark("left");
        createSpark("right");
    }
}, 300);