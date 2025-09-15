import React, { useState, useEffect, useCallback } from 'react';

const DesktopSlidePuzzle = () => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [animatingTiles, setAnimatingTiles] = useState(new Set());
  const [scoreAnimation, setScoreAnimation] = useState(null);
  const [comboCount, setComboCount] = useState(0);

  const GRID_SIZE = 8;
  // 落ち着いた色合いで視認性の高いパレット
  const COLORS = [
    '#2563EB', // 深い青
    '#DC2626', // 深い赤  
    '#059669', // 深い緑
    '#D97706', // 深いオレンジ
    '#7C3AED', // 深い紫
    '#DB2777', // 深いピンク
    '#0891B2', // 深いシアン
    '#65A30D', // 深いライム
  ];

  // グリッドを初期化
  const initializeGrid = useCallback(() => {
    const newGrid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        row.push({
          id: `${i}-${j}`,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          matched: false
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setScore(0);
    setMoves(0);
    setSelectedTiles([]);
    setComboCount(0);
    setGameStarted(true);
  }, []);

  // スコア演出を追加
  const addScore = (points, matchCount) => {
    const bonus = comboCount > 0 ? comboCount * 50 : 0;
    const totalPoints = points + bonus;
    
    setScore(prev => prev + totalPoints);
    setScoreAnimation({
      points: totalPoints,
      matchCount,
      combo: comboCount,
      timestamp: Date.now()
    });
    
    // アニメーションを3秒後にクリア
    setTimeout(() => {
      setScoreAnimation(null);
    }, 3000);
  };

  // タイルをスライドする方向を計算
  const getSlideDirection = (fromPos, toPos) => {
    const rowDiff = toPos.row - fromPos.row;
    const colDiff = toPos.col - fromPos.col;
    
    if (Math.abs(rowDiff) > Math.abs(colDiff)) {
      return rowDiff > 0 ? 'down' : 'up';
    } else {
      return colDiff > 0 ? 'right' : 'left';
    }
  };

  // 連続する同色タイルを見つける
  const findConnectedTiles = (startRow, startCol, color, visited = new Set()) => {
    const key = `${startRow}-${startCol}`;
    if (visited.has(key) || 
        startRow < 0 || startRow >= GRID_SIZE || 
        startCol < 0 || startCol >= GRID_SIZE ||
        !grid[startRow]?.[startCol] ||
        grid[startRow][startCol].color !== color ||
        grid[startRow][startCol].matched) {
      return [];
    }

    visited.add(key);
    const connected = [{ row: startRow, col: startCol }];

    // 4方向をチェック
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    directions.forEach(([dr, dc]) => {
      connected.push(...findConnectedTiles(startRow + dr, startCol + dc, color, visited));
    });

    return connected;
  };

  // タイルを落下させる
  const applyGravity = useCallback((inputGrid) => {
    const newGrid = inputGrid.map(row => [...row]);
    
    // 各列に対して重力を適用
    for (let col = 0; col < GRID_SIZE; col++) {
      // 下から上に向かってタイルを詰める
      let writePos = GRID_SIZE - 1;
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col] !== null) {
          if (writePos !== row) {
            newGrid[writePos][col] = {
              ...newGrid[row][col],
              id: `${writePos}-${col}`
            };
            newGrid[row][col] = null;
          }
          writePos--;
        }
      }
      
      // 空いた上部に新しいタイルを追加
      for (let row = 0; row <= writePos; row++) {
        newGrid[row][col] = {
          id: `${row}-${col}`,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          matched: false
        };
      }
    }
    
    return newGrid;
  }, []);

  // マッチをチェックして処理
  const checkMatches = useCallback(() => {
    if (!grid.length) return;

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    let totalMatches = 0;
    let hasMatches = false;
    let matchGroups = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j] && !newGrid[i][j].matched) {
          const connected = findConnectedTiles(i, j, newGrid[i][j].color);
          if (connected.length >= 3) {
            connected.forEach(({ row, col }) => {
              newGrid[row][col].matched = true;
            });
            totalMatches += connected.length;
            matchGroups.push(connected.length);
            hasMatches = true;
          }
        }
      }
    }

    if (hasMatches) {
      // コンボカウントを増加
      setComboCount(prev => prev + 1);
      
      // スコア演出を追加
      addScore(totalMatches * 10, matchGroups.length);
      
      // 消去演出用のタイルをマーク
      const matchedTileIds = new Set();
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (newGrid[i][j] && newGrid[i][j].matched) {
            matchedTileIds.add(`${i}-${j}`);
          }
        }
      }
      setAnimatingTiles(matchedTileIds);

      // 消去演出後にタイルを削除して重力を適用
      setTimeout(() => {
        // マッチしたタイルを削除
        for (let i = 0; i < GRID_SIZE; i++) {
          for (let j = 0; j < GRID_SIZE; j++) {
            if (newGrid[i][j] && newGrid[i][j].matched) {
              newGrid[i][j] = null;
            }
          }
        }
        
        // 重力を適用
        const droppedGrid = applyGravity(newGrid);
        setGrid(droppedGrid);
        setAnimatingTiles(new Set());
      }, 600);
    } else {
      // マッチがなければコンボリセット
      setComboCount(0);
    }
  }, [grid, applyGravity, comboCount]);

  // タイル選択処理
  const handleTileSelect = (row, col) => {
    if (!gameStarted || animatingTiles.size > 0 || !grid[row][col]) return;

    const tileId = `${row}-${col}`;
    
    if (selectedTiles.length === 0) {
      setSelectedTiles([{ row, col, id: tileId }]);
    } else if (selectedTiles.length === 1) {
      const firstTile = selectedTiles[0];
      if (firstTile.row === row && firstTile.col === col) {
        setSelectedTiles([]);
        return;
      }

      // スライド処理
      const direction = getSlideDirection(firstTile, { row, col });
      slideColors(firstTile, { row, col }, direction);
      setSelectedTiles([]);
      setMoves(prev => prev + 1);
    }
  };

  // 色をスライドする
  const slideColors = (from, to, direction) => {
    const newGrid = grid.map(row => row.map(cell => cell ? { ...cell } : null));
    
    let startRow, endRow, startCol, endCol, stepRow, stepCol;
    
    switch (direction) {
      case 'right':
        startRow = from.row;
        endRow = to.row;
        startCol = Math.min(from.col, to.col);
        endCol = Math.max(from.col, to.col);
        stepRow = 0;
        stepCol = 1;
        break;
      case 'left':
        startRow = from.row;
        endRow = to.row;
        startCol = Math.max(from.col, to.col);
        endCol = Math.min(from.col, to.col);
        stepRow = 0;
        stepCol = -1;
        break;
      case 'down':
        startRow = Math.min(from.row, to.row);
        endRow = Math.max(from.row, to.row);
        startCol = from.col;
        endCol = to.col;
        stepRow = 1;
        stepCol = 0;
        break;
      case 'up':
        startRow = Math.max(from.row, to.row);
        endRow = Math.min(from.row, to.row);
        startCol = from.col;
        endCol = to.col;
        stepRow = -1;
        stepCol = 0;
        break;
    }

    // 色を一つずつシフト（nullタイルをスキップ）
    const colors = [];
    let currentRow = startRow;
    let currentCol = startCol;
    
    while (true) {
      if (newGrid[currentRow][currentCol]) {
        colors.push(newGrid[currentRow][currentCol].color);
      }
      if (currentRow === endRow && currentCol === endCol) break;
      currentRow += stepRow;
      currentCol += stepCol;
    }

    if (colors.length > 1) {
      // 最後の色を最初に移動
      const lastColor = colors.pop();
      colors.unshift(lastColor);

      // 新しい色を配置
      currentRow = startRow;
      currentCol = startCol;
      let colorIndex = 0;
      
      while (true) {
        if (newGrid[currentRow][currentCol] && colorIndex < colors.length) {
          newGrid[currentRow][currentCol].color = colors[colorIndex];
          colorIndex++;
        }
        if (currentRow === endRow && currentCol === endCol) break;
        currentRow += stepRow;
        currentCol += stepCol;
      }
    }

    setGrid(newGrid);
  };

  useEffect(() => {
    if (gameStarted && grid.length > 0) {
      const timer = setTimeout(() => {
        checkMatches();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [grid, gameStarted, checkMatches]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-6">Slide Puzzle Pro</h1>
          
          <div className="flex justify-center items-center gap-8 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-4 min-w-[120px]">
              <div className="text-sm text-slate-600 mb-1">スコア</div>
              <div className="text-2xl font-bold text-slate-800">{score.toLocaleString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4 min-w-[120px]">
              <div className="text-sm text-slate-600 mb-1">手数</div>
              <div className="text-2xl font-bold text-slate-800">{moves}</div>
            </div>
            
            {comboCount > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-4 min-w-[120px] animate-pulse">
                <div className="text-sm text-white mb-1">コンボ</div>
                <div className="text-2xl font-bold text-white">{comboCount}x</div>
              </div>
            )}
          </div>

          {/* スコア演出 */}
          {scoreAnimation && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full shadow-2xl">
                <div className="text-2xl font-bold">+{scoreAnimation.points}</div>
                {scoreAnimation.combo > 0 && (
                  <div className="text-sm">コンボ x{scoreAnimation.combo}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {/* ゲームボード */}
          {!gameStarted ? (
            <div className="text-center">
              <button
                onClick={initializeGrid}
                className="bg-slate-800 text-white px-12 py-6 rounded-xl text-xl font-bold shadow-xl hover:bg-slate-700 hover:scale-105 transition-all duration-200"
              >
                ゲーム開始
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xl p-6">
              <div className="grid grid-cols-8 gap-3" style={{ width: 'fit-content' }}>
                {grid.map((row, rowIndex) =>
                  row.map((tile, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => tile && handleTileSelect(rowIndex, colIndex)}
                      className={`
                        w-12 h-12 rounded-lg border-2 transition-all duration-300 transform relative
                        ${tile ? (
                          selectedTiles.some(t => t.row === rowIndex && t.col === colIndex)
                            ? 'border-slate-800 scale-110 shadow-xl ring-4 ring-slate-300'
                            : 'border-slate-200 hover:scale-105 hover:shadow-md'
                        ) : 'border-transparent'}
                        ${tile && animatingTiles.has(tile.id) ? 'animate-ping scale-125' : ''}
                        ${!tile ? 'bg-transparent' : ''}
                      `}
                      style={{ 
                        backgroundColor: tile ? tile.color : 'transparent',
                        boxShadow: tile && animatingTiles.has(tile.id) 
                          ? `0 0 20px ${tile.color}80, 0 0 40px ${tile.color}40` 
                          : undefined
                      }}
                      disabled={animatingTiles.size > 0 || !tile}
                    >
                      {/* 選択状態のハイライト */}
                      {tile && selectedTiles.some(t => t.row === rowIndex && t.col === colIndex) && (
                        <div className="absolute inset-0 bg-white bg-opacity-30 rounded-lg"></div>
                      )}
                    </button>
                  ))
                )}
              </div>
              
              {/* 説明とリセット */}
              <div className="mt-6 text-center">
                <div className="bg-slate-50 rounded-lg p-4 text-slate-700 text-sm mb-4">
                  <p className="mb-2">🎯 2つのタイルを選択してスライド操作</p>
                  <p>同色3つ以上の連結で消去・得点獲得</p>
                </div>
                <button
                  onClick={initializeGrid}
                  className="bg-slate-600 text-white px-8 py-3 rounded-lg text-sm hover:bg-slate-700 transition-colors shadow-md"
                >
                  新しいゲーム
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopSlidePuzzle;