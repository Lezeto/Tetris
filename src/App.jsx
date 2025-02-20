import React, { useState, useEffect, useCallback, useRef } from "react";
import "./app.css";

const ROWS = 20;
const COLS = 10;
const EMPTY_CELL = 0;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: "cyan" },
  J: { shape: [[2, 0, 0], [2, 2, 2]], color: "blue" },
  L: { shape: [[0, 0, 3], [3, 3, 3]], color: "orange" },
  O: { shape: [[4, 4], [4, 4]], color: "yellow" },
  S: { shape: [[0, 5, 5], [5, 5, 0]], color: "green" },
  T: { shape: [[0, 6, 0], [6, 6, 6]], color: "purple" },
  Z: { shape: [[7, 7, 0], [0, 7, 7]], color: "red" },
};

const getRandomTetromino = () => {
  const keys = Object.keys(TETROMINOES);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOES[key], type: key, position: { row: 0, col: Math.floor(COLS / 2) - 1 } };
};

const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_CELL));

const App = () => {
  const [board, setBoard] = useState(createBoard);
  const [tetromino, setTetromino] = useState(getRandomTetromino());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef(null);

  const isValidMove = (board, tetromino, newPos) => {
    return tetromino.shape.every((row, r) =>
      row.every((cell, c) => {
        if (cell === 0) return true;
        const newRow = newPos.row + r;
        const newCol = newPos.col + c;
        return newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === EMPTY_CELL;
      })
    );
  };

  const mergeBoard = (board, tetromino) => {
    const newBoard = board.map(row => [...row]);
    tetromino.shape.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell !== 0) {
          newBoard[tetromino.position.row + r][tetromino.position.col + c] = cell;
        }
      })
    );
    return newBoard;
  };

  const clearLines = (board) => {
    const newBoard = board.filter(row => row.some(cell => cell === EMPTY_CELL));
    const clearedLines = ROWS - newBoard.length;
    if (clearedLines > 0) {
      setScore(prev => prev + clearedLines * 100); // Score increases by 100 per cleared line
      while (newBoard.length < ROWS) {
        newBoard.unshift(Array(COLS).fill(EMPTY_CELL));
      }
    }
    return newBoard;
  };

  const moveDown = useCallback(() => {
    setTetromino(prevTetromino => {
      const newPos = { row: prevTetromino.position.row + 1, col: prevTetromino.position.col };
      if (!isValidMove(board, prevTetromino, newPos)) {
        const newBoard = clearLines(mergeBoard(board, prevTetromino));
        setBoard(newBoard);
        const newTetromino = getRandomTetromino();
        if (!isValidMove(newBoard, newTetromino, newTetromino.position)) {
          setGameOver(true);
          return prevTetromino;
        }
        return newTetromino;
      }
      return { ...prevTetromino, position: newPos };
    });
  }, [board]);

  const handleKeyPress = useCallback(
    event => {
      if (gameOver) return;
      setTetromino(prev => {
        const { key } = event;
        let newPos = { ...prev.position };

        if (key === "ArrowLeft") newPos.col--;
        if (key === "ArrowRight") newPos.col++;
        if (key === "ArrowDown") {
          moveDown();
          return prev;
        }
        if (key === "ArrowUp") {
          const rotated = prev.shape[0].map((_, i) => prev.shape.map(row => row[i])).reverse();
          if (isValidMove(board, { ...prev, shape: rotated }, newPos)) {
            return { ...prev, shape: rotated };
          }
          return prev;
        }

        return isValidMove(board, prev, newPos) ? { ...prev, position: newPos } : prev;
      });
    },
    [board, gameOver, moveDown]
  );

  useEffect(() => {
    const handleKeyDown = event => handleKeyPress(event);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  useEffect(() => {
    intervalRef.current = setInterval(moveDown, 500);
    return () => clearInterval(intervalRef.current);
  }, [moveDown]);

  const resetGame = () => {
    setBoard(createBoard());
    setTetromino(getRandomTetromino());
    setScore(0);
    setGameOver(false);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    tetromino.shape.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell !== 0) {
          const newRow = tetromino.position.row + r;
          const newCol = tetromino.position.col + c;
          if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
            displayBoard[newRow][newCol] = cell;
          }
        }
      })
    );

    return displayBoard;
  };

  return (
    <div className="tetris-container">
      <h1>Tetris</h1>
      <p>Score: {score}</p>
      {gameOver && <p className="game-over">Game Over</p>}
      <button className="new-game-btn" onClick={resetGame}>New Game</button>
      <div className="board">
        {renderBoard().map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`cell ${cell ? `cell-${cell}` : ""}`}></div>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
