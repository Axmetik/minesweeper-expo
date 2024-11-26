import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Button } from 'react-native';

type Cell = {
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

const BOARD_SIZE = 10;
const MINES_COUNT = 10;

// Board creation
const createBoard = (): Cell[][] => {
  // blank board
  const board: Cell[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      isMine: false,
      isOpen: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  ); 

  // mines placing
  let minesPlaced = 0;
  while (minesPlaced < MINES_COUNT) {
    const row = Math.floor(Math.random() * BOARD_SIZE);
    const col = Math.floor(Math.random() * BOARD_SIZE);

    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  } 

  // count of adjacent cells for each cell
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col].isMine) {
        const adjacentCells = getAdjacentCells(board, row, col);
        board[row][col].adjacentMines = adjacentCells.filter(cell => cell.isMine).length;
      }
    }
  } 

  return board;
};

// func to count adjacent cells for each cell
const getAdjacentCells = (board: Cell[][], row: number, col: number): Cell[] => {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  return directions
    .map(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        return board[newRow][newCol];
      }
      return null;
    })
    .filter(cell => cell !== null) as Cell[];
};  

// Timer formatting function
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// application component
const App = () => {
  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [showAllMines, setShowAllMines] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // timer increment
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  // cell reveal function
  const openCell = (row: number, col: number) => {
    if (isGameOver || isGameWon || board[row][col].isOpen || board[row][col].isFlagged) return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    openCellRecursive(newBoard, row, col);

    if (newBoard[row][col].isMine) {
      setIsGameOver(true);
      setShowAllMines(true);
      setIsTimerActive(false);
      } else if (checkWin(newBoard)) {
      setIsGameWon(true);
      setIsTimerActive(false);
    }

    setBoard(newBoard);
  };

  // reveal blank cells in bulk
  const openCellRecursive = (board: Cell[][], row: number, col: number) => {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    if (board[row][col].isOpen || board[row][col].isMine) return;

    board[row][col].isOpen = true;

    if (board[row][col].adjacentMines === 0) {
      const neighbors = getAdjacentCells(board, row, col);
      neighbors.forEach((_, index) => {
        const nr = row + (neighbors[index] ? 1 : 0);
        const nc = col + (neighbors[index] ? 1 : 0);
        openCellRecursive(board, nr, nc);
      });
    }
  };

  // check win function
  const checkWin = (board: Cell[][]): boolean => {
    for (let row of board) {
      for (let cell of row) {
        if (!cell.isMine && !cell.isOpen) {
          return false;
        }
      }
    }
    return true;
  };

  // restart game function
  const restartGame = () => {
    setBoard(createBoard());
    setIsGameOver(false);
    setIsGameWon(false);
    setShowAllMines(false);
    setTimer(0);
    setIsTimerActive(true);
  };

  // view of component
  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>Time: {formatTime(timer)}</Text>
      {board.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <TouchableOpacity
              key={colIndex}
              style={[
                styles.cell,
                cell.isOpen && { backgroundColor: cell.isMine ? 'red' : 'lightgrey' },
              ]}
              onPress={() => openCell(rowIndex, colIndex)}
              disabled={isGameOver || isGameWon}
            >
              {cell.isOpen && cell.isMine && <Text style={styles.mineText}>💣</Text>}
              {(showAllMines && cell.isMine) && <Text style={styles.mineText}>💣</Text>}
              {cell.isOpen && !cell.isMine && cell.adjacentMines > 0 && (
                <Text style={[styles.numberText, getNumberStyle(cell.adjacentMines)]}>
                  {cell.adjacentMines}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
      
      {(isGameOver || isGameWon) && (
        <View style={styles.messageContainer}>
          {isGameWon ? (
            <Text style={styles.messageText}>Congratulations! You won!</Text>
          ) : (
            <Text style={styles.messageText}>Game Over! Try again</Text>
          )}
          <Button title="Restart Game" onPress={restartGame} />
        </View>
      )}
    </View>
  );
};

// options of coloring numbers. depends on amount of mines around cell
const getNumberStyle = (num: number) => {
  switch (num) {
    case 1:
      return { color: 'blue' };
    case 2:
      return { color: 'green' };
    case 3:
      return { color: 'red' };
    case 4:
      return { color: 'darkblue' };
    case 5:
      return { color: 'darkred' };
    case 6:
      return { color: 'turquoise' };
    case 7:
      return { color: 'black' };
    case 8:
      return { color: 'gray' };
    default:
      return {};
  }
};

// styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  timerText: {
    fontSize: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'green',
    margin: 1,
  },
  mineText: {
    color: 'black',
    fontWeight: 'bold',
  },
  numberText: {
    fontWeight: 'bold',
  },
  messageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

export default App;
