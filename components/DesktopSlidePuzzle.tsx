import React, { useState, useEffect, useCallback } from 'react';

interface Tile {
  id: string;
  color: string;
  matched: boolean;
}

interface SelectedTile {
  row: number;
  col: number;
  id: string;
}

interface ScoreAnimation {
  points: number;
  matchCount: number;
  combo: number;
  timestamp: number;
}

type GameMode = 'endless' | 'timeattack' | 'movechallenge';

interface GameState {
  mode: GameMode;
  timeLeft: number;
  movesLeft: number;
  targetScore: number;
  isGameOver: boolean;
  isGameWon: boolean;
}

const DesktopSlidePuzzle = () => {
  const [grid, setGrid] = useState<(Tile | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedTiles, setSelectedTiles] = useState<SelectedTile[]>([]);
  const [animatingTiles, setAnimatingTiles] = useState(new Set<string>());
  const [scoreAnimation, setScoreAnimation] = useState<ScoreAnimation | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [cyberMode, setCyberMode] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    mode: 'endless',
    timeLeft: 180, // 3分
    movesLeft: 50,
    targetScore: 5000,
    isGameOver: false,
    isGameWon: false
  });

  const GRID_SIZE = 8;

  // パステル調で気持ちの良い色パレット
  const NORMAL_COLORS = [
    '#3B82F6', // 明るい青
    '#EF4444', // 鮮やかな赤
    '#10B981', // エメラルドグリーン
    '#F59E0B', // 温かいオレンジ
    '#8B5CF6', // 優雅な紫
    '#EC4899', // 愛らしいピンク
    '#06B6D4', // 明るいシアン
    '#84CC16', // 生き生きとしたライム
  ];

  // サイバーモード用ネオンカラー 🔥
  const CYBER_COLORS = [
    '#00FFFF', // エレクトリックシアン
    '#FF0080', // ホットピンク
    '#00FF41', // ネオングリーン
    '#FF4500', // エレクトリックオレンジ
    '#8A2BE2', // ブルーバイオレット
    '#FFFF00', // エレクトリックイエロー
    '#FF1493', // ディープピンク
    '#00CED1', // ダークターコイズ
  ];

  const COLORS = cyberMode ? CYBER_COLORS : NORMAL_COLORS;

  // ゲームモードを開始
  const startGame = useCallback((mode: GameMode) => {
    const newGrid: (Tile | null)[][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const row: (Tile | null)[] = [];
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

    // ゲームモード設定
    setGameState({
      mode,
      timeLeft: mode === 'timeattack' ? 180 : 0,
      movesLeft: mode === 'movechallenge' ? 50 : 0,
      targetScore: mode === 'timeattack' ? 5000 : mode === 'movechallenge' ? 3000 : 0,
      isGameOver: false,
      isGameWon: false
    });
  }, []);

  // タイマー処理
  useEffect(() => {
    if (gameStarted && gameState.mode === 'timeattack' && gameState.timeLeft > 0 && !gameState.isGameOver && !gameState.isGameWon) {
      const timer = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            return { ...prev, timeLeft: 0, isGameOver: true };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameState.mode, gameState.timeLeft, gameState.isGameOver, gameState.isGameWon]);

  // ゲームクリア・ゲームオーバー判定
  useEffect(() => {
    if (!gameStarted || gameState.isGameOver || gameState.isGameWon) return;

    if (gameState.mode === 'timeattack') {
      if (score >= gameState.targetScore) {
        setGameState(prev => ({ ...prev, isGameWon: true }));
        playSound('combo'); // 勝利音
      } else if (gameState.timeLeft <= 0) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
      }
    } else if (gameState.mode === 'movechallenge') {
      if (score >= gameState.targetScore) {
        setGameState(prev => ({ ...prev, isGameWon: true }));
        playSound('combo');
      } else if (moves >= 50) {
        setGameState(prev => ({ ...prev, isGameOver: true, movesLeft: 0 }));
      } else {
        setGameState(prev => ({ ...prev, movesLeft: 50 - moves }));
      }
    }
  }, [score, moves, gameState, gameStarted]);

  // グリッドを初期化（後方互換性のため残す）
  const initializeGrid = useCallback(() => startGame('endless'), [startGame]);

  // 効果音を再生
  const playSound = (type: 'match' | 'combo' | 'slide') => {
    try {
      const audio = new Audio();
      switch (type) {
        case 'match':
          // 消去音 - 高めの澄んだ音
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEASAAAEAIAABAAAAACAAEAAGF0YQoGAACBhYqHbF1fdJitrJBhNjVgodDbq2EcBj+a2/LDciUDQxtf2dhGPEIFRa29m9JKQEP7Gp3wP3Zg/ZdT5+7jqe8LxGb0RXHm8AZKCAsHVJCqm3Og';
          break;
        case 'combo':
          // コンボ音 - 明るい和音
          audio.src = 'data:audio/wav;base64,UklGRj4DAABXQVZFZm10IBAAAAABAAEAESsAAIhYAQACABAAZGF0YQoGAACBhYqHbF1fdJitrJBhNjVgodDbq2EcBj+a2/LDciUD';
          break;
        case 'slide':
          // スライド音 - 短いクリック音
          audio.src = 'data:audio/wav;base64,UklGRi4CAABXQVZFZm10IBAAAAABAAEAESsAAGjvAAACABAAZGF0YWoBAACBhYqHbF1fdJitrJBhNjVgodDbq2EcBj+a2/LDciUD';
          break;
      }
      audio.volume = 0.3;
      audio.play().catch(() => {}); // エラーは無視
    } catch (error) {
      // 音声再生エラーは無視
    }
  };

  // スコア演出を追加
  const addScore = (points, matchCount) => {
    const bonus = comboCount > 0 ? comboCount * 50 : 0;
    const totalPoints = points + bonus;

    // 効果音再生
    if (comboCount > 0) {
      playSound('combo');
    } else {
      playSound('match');
    }

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
  const applyGravity = useCallback((inputGrid: (Tile | null)[][]) => {
    const newGrid = inputGrid.map(row => [...row]);
    
    // 各列に対して重力を適用
    for (let col = 0; col < GRID_SIZE; col++) {
      // 下から上に向かってタイルを詰める
      let writePos = GRID_SIZE - 1;
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const currentTile = newGrid[row][col];
        if (currentTile !== null) {
          if (writePos !== row) {
            newGrid[writePos][col] = {
              id: `${writePos}-${col}`,
              color: currentTile.color,
              matched: currentTile.matched
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

    const newGrid = grid.map(row => row.map(cell => cell ? ({ ...cell }) : null)) as (Tile | null)[][];
    let totalMatches = 0;
    let hasMatches = false;
    let matchGroups: number[] = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const currentTile = newGrid[i][j];
        if (currentTile && !currentTile.matched) {
          const connected = findConnectedTiles(i, j, currentTile.color);
          if (connected.length >= 3) {
            connected.forEach(({ row, col }) => {
              const tileToMatch = newGrid[row][col];
              if (tileToMatch) {
                tileToMatch.matched = true;
              }
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
      const matchedTileIds = new Set<string>();
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          const tile = newGrid[i][j];
          if (tile && tile.matched) {
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
            const tile = newGrid[i][j];
            if (tile && tile.matched) {
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
      playSound('slide'); // スライド音を再生
      slideColors(firstTile, { row, col }, direction);
      setSelectedTiles([]);
      setMoves(prev => prev + 1);
    }
  };

  // 色をスライドする
  const slideColors = (from: any, to: any, direction: string) => {
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
    const colors: string[] = [];
    let currentRow = startRow;
    let currentCol = startCol;
    
    while (true) {
      const currentTileColor = newGrid[currentRow][currentCol];
      if (currentTileColor) {
        colors.push(currentTileColor.color);
      }
      if (currentRow === endRow && currentCol === endCol) break;
      currentRow += stepRow;
      currentCol += stepCol;
    }

    if (colors.length > 1) {
      // 最後の色を最初に移動
      const lastColor = colors.pop();
      if (lastColor) {
        colors.unshift(lastColor);
      }

      // 新しい色を配置
      currentRow = startRow;
      currentCol = startCol;
      let colorIndex = 0;
      
      while (true) {
        const targetTile = newGrid[currentRow][currentCol];
        if (targetTile && colorIndex < colors.length) {
          targetTile.color = colors[colorIndex];
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
    <div className={`min-h-screen p-8 transition-all duration-1000 ${
      cyberMode
        ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className={`text-5xl font-bold mb-6 transition-all duration-500 ${
              cyberMode
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 animate-pulse drop-shadow-[0_0_10px_#00FFFF]'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent'
            }`}>
              {cyberMode ? '⚡ CYBER CASCADE ⚡' : 'Color Cascade ✨'}
            </h1>
          </div>

          {/* サイバーモード切り替えボタン */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setCyberMode(!cyberMode)}
              className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                cyberMode
                  ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-black shadow-[0_0_20px_#00FFFF] hover:shadow-[0_0_30px_#FF00FF]'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:scale-105'
              }`}
            >
              {cyberMode ? '🌈 ノーマルモード' : '🔥 サイバーモード'}
            </button>
          </div>
          
          <div className="flex justify-center items-center gap-8 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-4 min-w-[120px]">
              <div className="text-sm text-slate-600 mb-1">スコア</div>
              <div className="text-2xl font-bold text-slate-800">{score.toLocaleString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4 min-w-[120px]">
              <div className="text-sm text-slate-600 mb-1">
                {gameState.mode === 'movechallenge' ? '残り手数' : '手数'}
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {gameState.mode === 'movechallenge' ? gameState.movesLeft : moves}
              </div>
            </div>

            {gameState.mode === 'timeattack' && (
              <div className={`rounded-lg shadow-lg p-4 min-w-[120px] ${
                gameState.timeLeft <= 30 ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' : 'bg-blue-500'
              }`}>
                <div className="text-sm text-white mb-1">残り時間</div>
                <div className="text-2xl font-bold text-white">
                  {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}

            {gameState.mode !== 'endless' && (
              <div className="bg-purple-500 rounded-lg shadow-lg p-4 min-w-[120px]">
                <div className="text-sm text-white mb-1">目標スコア</div>
                <div className="text-2xl font-bold text-white">{gameState.targetScore.toLocaleString()}</div>
              </div>
            )}

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
            <div className="text-center space-y-6">
              <div className="text-lg text-slate-600 mb-8">モードを選択してください</div>

              <div className="grid gap-4 max-w-2xl">
                <button
                  onClick={() => startGame('endless')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-xl hover:scale-105 transition-all duration-200"
                >
                  🌊 エンドレスモード
                  <div className="text-sm opacity-90 mt-1">制限なしでのんびりプレイ</div>
                </button>

                <button
                  onClick={() => startGame('timeattack')}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-xl hover:scale-105 transition-all duration-200"
                >
                  ⏰ タイムアタック
                  <div className="text-sm opacity-90 mt-1">3分で5000点を目指せ！</div>
                </button>

                <button
                  onClick={() => startGame('movechallenge')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-xl hover:scale-105 transition-all duration-200"
                >
                  🎯 ムーブチャレンジ
                  <div className="text-sm opacity-90 mt-1">50手で3000点にチャレンジ</div>
                </button>
              </div>
            </div>
          ) : gameState.isGameOver || gameState.isGameWon ? (
            <div className="text-center space-y-6">
              <div className={`text-6xl mb-4 ${gameState.isGameWon ? 'text-green-500' : 'text-red-500'}`}>
                {gameState.isGameWon ? '🎉' : '😔'}
              </div>
              <h2 className={`text-4xl font-bold mb-4 ${gameState.isGameWon ? 'text-green-600' : 'text-red-600'}`}>
                {gameState.isGameWon ? 'ゲームクリア！' : 'ゲームオーバー'}
              </h2>
              <div className="text-2xl text-slate-700 mb-6">
                最終スコア: {score.toLocaleString()}点
              </div>
              <button
                onClick={() => setGameStarted(false)}
                className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:scale-105 transition-all duration-200"
              >
                もう一度プレイ
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
                        ${tile && animatingTiles.has(tile.id) ? 'animate-pulse scale-110 brightness-125' : ''}
                        ${!tile ? 'bg-transparent' : ''}
                      `}
                      style={{
                        backgroundColor: tile ? tile.color : 'transparent',
                        boxShadow: tile && animatingTiles.has(tile.id)
                          ? cyberMode
                            ? `0 0 40px ${tile.color}, 0 0 80px ${tile.color}, 0 0 120px ${tile.color}, inset 0 0 30px ${tile.color}88`
                            : `0 0 30px ${tile.color}aa, 0 0 60px ${tile.color}66, inset 0 0 20px ${tile.color}44`
                          : cyberMode && tile
                            ? `0 0 15px ${tile.color}66, inset 0 0 10px ${tile.color}33`
                            : undefined,
                        transform: tile && animatingTiles.has(tile.id)
                          ? cyberMode
                            ? `scale(1.2) rotate(10deg)`
                            : `scale(1.1) rotate(5deg)`
                          : undefined,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: cyberMode && tile ? `2px solid ${tile.color}88` : undefined,
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