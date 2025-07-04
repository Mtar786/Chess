const boardElement = document.getElementById("chessboard");
const statusText = document.getElementById("status");

const PIECES = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙"
};

let board = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

let selected = null;
let turn = "white";
let whiteCanCastleKingside = true;
let whiteCanCastleQueenside = true;
let blackCanCastleKingside = true;
let blackCanCastleQueenside = true;

function drawBoard() {
  boardElement.innerHTML = "";
  const validMoves = selected ? getValidMoves(...selected) : [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.className = "square " + ((row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;

      if (board[row][col]) {
        square.textContent = PIECES[board[row][col]];
      }

      if (selected && selected[0] === row && selected[1] === col) {
        square.classList.add("selected");
      }

      if (validMoves.some(([r, c]) => r === row && c === col)) {
        square.classList.add("valid-move");
      }

      square.addEventListener("click", handleClick);
      boardElement.appendChild(square);
    }
  }
}

function handleClick(e) {
  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);
  const piece = board[row][col];

  if (selected) {
    const [fromRow, fromCol] = selected;
    const movingPiece = board[fromRow][fromCol];

    if (isLegalMove(fromRow, fromCol, row, col, movingPiece)) {
      const captured = board[row][col];
      board[row][col] = movingPiece;
      board[fromRow][fromCol] = "";

      if (movingPiece === "K") {
        whiteCanCastleKingside = whiteCanCastleQueenside = false;
        if (fromRow === 7 && fromCol === 4 && row === 7 && col === 6) {
          board[7][7] = ""; board[7][5] = "R";
        } else if (row === 7 && col === 2) {
          board[7][0] = ""; board[7][3] = "R";
        }
      }
      if (movingPiece === "k") {
        blackCanCastleKingside = blackCanCastleQueenside = false;
        if (fromRow === 0 && fromCol === 4 && row === 0 && col === 6) {
          board[0][7] = ""; board[0][5] = "r";
        } else if (row === 0 && col === 2) {
          board[0][0] = ""; board[0][3] = "r";
        }
      }

      if (movingPiece === "R") {
        if (fromRow === 7 && fromCol === 0) whiteCanCastleQueenside = false;
        if (fromRow === 7 && fromCol === 7) whiteCanCastleKingside = false;
      }
      if (movingPiece === "r") {
        if (fromRow === 0 && fromCol === 0) blackCanCastleQueenside = false;
        if (fromRow === 0 && fromCol === 7) blackCanCastleKingside = false;
      }

      if (movingPiece.toLowerCase() === "p" && (row === 0 || row === 7)) {
        let promoted = prompt("Promote to (q, r, b, n):", "q");
        if (!["q", "r", "b", "n"].includes(promoted)) promoted = "q";
        board[row][col] = turn === "white" ? promoted.toUpperCase() : promoted;
      }

      turn = turn === "white" ? "black" : "white";
      statusText.textContent = `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s turn`;

      const enemy = turn;
      if (isKingInCheck(enemy)) {
        if (!hasLegalMoves(enemy)) {
          alert(`${turn === "white" ? "Black" : "White"} wins by checkmate!`);
          statusText.textContent = `${turn === "white" ? "Black" : "White"} wins by checkmate!`;
        } else {
          statusText.textContent = `${enemy.charAt(0).toUpperCase() + enemy.slice(1)} is in check`;
        }
      } else if (!hasLegalMoves(enemy)) {
        alert("Stalemate!");
        statusText.textContent = "Draw by stalemate";
      }

      selected = null;
      drawBoard();
    } else {
      selected = null;
      drawBoard();
    }
  } else {
    if (piece && ((turn === "white" && piece === piece.toUpperCase()) ||
                  (turn === "black" && piece === piece.toLowerCase()))) {
      selected = [row, col];
      drawBoard(); // draw immediately after selecting
    }
  }
}

function isLegalMove(fromRow, fromCol, toRow, toCol, piece) {
  const dx = toCol - fromCol;
  const dy = toRow - fromRow;
  const dest = board[toRow][toCol];
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const dir = piece === piece.toUpperCase() ? -1 : 1;

  if (dest && ((piece === piece.toUpperCase() && dest === dest.toUpperCase()) ||
               (piece === piece.toLowerCase() && dest === dest.toLowerCase()))) {
    return false;
  }

  if (piece === "K" && fromRow === 7 && fromCol === 4) {
    if (toRow === 7 && toCol === 6 && whiteCanCastleKingside &&
        board[7][5] === "" && board[7][6] === "") return true;
    if (toRow === 7 && toCol === 2 && whiteCanCastleQueenside &&
        board[7][1] === "" && board[7][2] === "" && board[7][3] === "") return true;
  }

  if (piece === "k" && fromRow === 0 && fromCol === 4) {
    if (toRow === 0 && toCol === 6 && blackCanCastleKingside &&
        board[0][5] === "" && board[0][6] === "") return true;
    if (toRow === 0 && toCol === 2 && blackCanCastleQueenside &&
        board[0][1] === "" && board[0][2] === "" && board[0][3] === "") return true;
  }

  switch (piece.toLowerCase()) {
    case "p":
      if (dx === 0 && dest === "") {
        if (dy === dir) return true;
        if ((fromRow === 1 && dir === 1 || fromRow === 6 && dir === -1) &&
            dy === 2 * dir && board[fromRow + dir][fromCol] === "") return true;
      }
      if (absDx === 1 && dy === dir && dest !== "") return true;
      return false;
    case "r":
      return (dx === 0 || dy === 0) && clearPath(fromRow, fromCol, toRow, toCol);
    case "n":
      return (absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2);
    case "b":
      return absDx === absDy && clearPath(fromRow, fromCol, toRow, toCol);
    case "q":
      return (dx === 0 || dy === 0 || absDx === absDy) && clearPath(fromRow, fromCol, toRow, toCol);
    case "k":
      return absDx <= 1 && absDy <= 1;
    default:
      return false;
  }
}

function clearPath(fromRow, fromCol, toRow, toCol) {
  const dx = Math.sign(toCol - fromCol);
  const dy = Math.sign(toRow - fromRow);
  let r = fromRow + dy, c = fromCol + dx;
  while (r !== toRow || c !== toCol) {
    if (board[r][c] !== "") return false;
    r += dy;
    c += dx;
  }
  return true;
}

function isKingInCheck(color) {
  const king = color === "white" ? "K" : "k";
  let kingRow = -1, kingCol = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) {
        kingRow = r; kingCol = c;
        break;
      }
    }
  }

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const attacker = board[r][c];
      if (attacker && ((color === "white" && attacker === attacker.toLowerCase()) ||
                       (color === "black" && attacker === attacker.toUpperCase()))) {
        if (isLegalMove(r, c, kingRow, kingCol, attacker)) {
          return true;
        }
      }
    }
  }
  return false;
}

function hasLegalMoves(color) {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let c1 = 0; c1 < 8; c1++) {
      const piece = board[r1][c1];
      if (!piece) continue;
      if ((color === "white" && piece === piece.toUpperCase()) ||
          (color === "black" && piece === piece.toLowerCase())) {
        for (let r2 = 0; r2 < 8; r2++) {
          for (let c2 = 0; c2 < 8; c2++) {
            const backupTo = board[r2][c2];
            const backupFrom = board[r1][c1];
            if (isLegalMove(r1, c1, r2, c2, piece)) {
              board[r2][c2] = piece;
              board[r1][c1] = "";
              const inCheck = isKingInCheck(color);
              board[r1][c1] = backupFrom;
              board[r2][c2] = backupTo;
              if (!inCheck) return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function getValidMoves(fromRow, fromCol) {
  const moves = [];
  const piece = board[fromRow][fromCol];
  if (!piece) return moves;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isLegalMove(fromRow, fromCol, r, c, piece)) {
        const tempTo = board[r][c];
        board[r][c] = piece;
        board[fromRow][fromCol] = "";
        const safe = !isKingInCheck(turn);
        board[fromRow][fromCol] = piece;
        board[r][c] = tempTo;
        if (safe) moves.push([r, c]);
      }
    }
  }
  return moves;
}

drawBoard();
