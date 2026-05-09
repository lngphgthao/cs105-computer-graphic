let score = 0;
let isGameOver = false;

export function addScore(value) {
    score += value;
}

export function getScore() {
    return score;
}

export function setGameOver(state) {
    isGameOver = state;
}

export function getGameOver() {
    return isGameOver;
}

export function resetGame() {
    score = 0;
    isGameOver = false;
}