"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const TILE = 20;
const COLS = 28;
const ROWS = 31;

// Classic Pac-Man maze layout (0=wall, 1=dot, 2=empty, 3=power pellet)
const MAZE_TEMPLATE = [
  "0000000000000000000000000000",
  "0111111111111000111111111110",
  "0100001000001000100000100000",
  "0300001000001000100000100030",
  "0100001000001000100000100000",
  "0111111111111111111111111110",
  "0100001000100000010001000010",
  "0100001000100000010001000010",
  "0111111000111111100011111110",
  "0000001000100000010001000000",
  "0000001000100000010001000000",
  "0000001000111111100010000000",
  "0000001000100000010000000000",
  "0000001000100000010000000000",
  "0000001111100000111110000000",
  "0000001000100000010000000000",
  "0000001000100000010000000000",
  "0000001000111111100010000000",
  "0000001000100000010001000000",
  "0000001000100000010001000000",
  "0111111111111111111111111110",
  "0100001000100000010001000010",
  "0100001000100000010001000010",
  "0311111000111111100011111130",
  "0000001000100000010001000000",
  "0000001000100000010001000000",
  "0000001000100000010001000000",
  "0000001111111111111110000000",
  "0000001000000000000010000000",
  "0000001000000000000010000000",
  "0000001000000000000010000000",
];

type Dir = "up" | "down" | "left" | "right" | null;

interface Pos {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  color: string;
  dir: Dir;
  frightened: boolean;
  eaten: boolean;
  homeX: number;
  homeY: number;
}

const GHOST_COLORS = ["#ff0000", "#ffb8ff", "#00ffff", "#ffb852"];

function drawBooty(ctx: CanvasRenderingContext2D, x: number, y: number, dir: Dir, mouthOpen: boolean) {
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;
  const r = TILE / 2 - 1;

  ctx.save();
  ctx.translate(cx, cy);

  // Rotate based on direction
  let angle = 0;
  if (dir === "right") angle = 0;
  else if (dir === "down") angle = Math.PI / 2;
  else if (dir === "left") angle = Math.PI;
  else if (dir === "up") angle = -Math.PI / 2;
  ctx.rotate(angle);

  // Draw booty (two cheeks)
  const cheekR = r * 0.55;
  const spread = r * 0.3;

  // Left cheek
  ctx.beginPath();
  ctx.arc(-spread, 0, cheekR, 0, Math.PI * 2);
  ctx.fillStyle = "#FFB6C1";
  ctx.fill();
  ctx.strokeStyle = "#FF69B4";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Right cheek
  ctx.beginPath();
  ctx.arc(spread, 0, cheekR, 0, Math.PI * 2);
  ctx.fillStyle = "#FFB6C1";
  ctx.fill();
  ctx.strokeStyle = "#FF69B4";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Crease between cheeks
  ctx.beginPath();
  ctx.moveTo(-2, -cheekR * 0.6);
  ctx.quadraticCurveTo(0, -cheekR * 0.2, 2, -cheekR * 0.6);
  ctx.strokeStyle = "#FF69B4";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Mouth (the "eating" part) - between the cheeks
  if (mouthOpen) {
    ctx.beginPath();
    ctx.arc(0, cheekR * 0.3, cheekR * 0.4, 0, Math.PI);
    ctx.fillStyle = "#FF1493";
    ctx.fill();
  }

  // Small highlight on each cheek
  ctx.beginPath();
  ctx.arc(-spread - cheekR * 0.2, -cheekR * 0.3, cheekR * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(spread - cheekR * 0.2, -cheekR * 0.3, cheekR * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();

  ctx.restore();
}

function drawGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  frightened: boolean,
  eaten: boolean,
  frame: number
) {
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;
  const r = TILE / 2 - 1;

  ctx.save();
  ctx.translate(cx, cy);

  if (eaten) {
    // Draw just eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-3 + (frame % 2 === 0 ? 1 : -1), -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 + (frame % 2 === 0 ? 1 : -1), -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const bodyColor = frightened ? "#2121de" : color;

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.lineTo(r, r * 0.6);
  // Wavy bottom
  const wave = Math.sin(frame * 0.2) * 2;
  for (let i = 0; i < 3; i++) {
    const wx = r - (i * r * 2) / 3;
    const wy = r * 0.6 + wave * (i % 2 === 0 ? 1 : -1);
    ctx.quadraticCurveTo(wx - r / 3, wy + 3, wx - r / 3, r * 0.6);
  }
  ctx.closePath();
  ctx.fillStyle = bodyColor;
  ctx.fill();

  if (frightened) {
    // Scared face
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    // Wavy mouth
    ctx.beginPath();
    ctx.arc(0, 4, 3, 0, Math.PI);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-3, -2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3, -2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = "#0000ff";
    const pOff = frame % 2 === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.arc(-3 + pOff, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 + pOff, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function BootyPacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [level, setLevel] = useState(1);

  const gameRef = useRef({
    maze: MAZE_TEMPLATE.map((r) => r.split("")),
    player: { x: 14, y: 23, dir: "left" as Dir, nextDir: null as Dir, mouthOpen: true },
    ghosts: [] as Ghost[],
    dotsLeft: 0,
    animFrame: 0,
    moveCounter: 0,
    frightenedTimer: 0,
    ghostEatCombo: 0,
  });

  const initGame = useCallback(() => {
    const maze = MAZE_TEMPLATE.map((r) => r.split(""));
    let dots = 0;
    for (const row of maze) {
      for (const cell of row) {
        if (cell === "1" || cell === "3") dots++;
      }
    }

    const ghosts: Ghost[] = [
      { x: 14, y: 11, color: GHOST_COLORS[0], dir: "left", frightened: false, eaten: false, homeX: 14, homeY: 11 },
      { x: 12, y: 11, color: GHOST_COLORS[1], dir: "right", frightened: false, eaten: false, homeX: 12, homeY: 11 },
      { x: 16, y: 11, color: GHOST_COLORS[2], dir: "left", frightened: false, eaten: false, homeX: 16, homeY: 11 },
      { x: 14, y: 13, color: GHOST_COLORS[3], dir: "up", frightened: false, eaten: false, homeX: 14, homeY: 13 },
    ];

    gameRef.current = {
      maze,
      player: { x: 14, y: 23, dir: "left", nextDir: null, mouthOpen: true },
      ghosts,
      dotsLeft: dots,
      animFrame: 0,
      moveCounter: 0,
      frightenedTimer: 0,
      ghostEatCombo: 0,
    };

    setScore(0);
    setLives(3);
    setGameState("playing");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const isWalkable = useCallback((x: number, y: number, maze: string[][]) => {
    // Tunnel wrap
    if (y === 14) {
      if (x < 0) return true;
      if (x >= COLS) return true;
    }
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    return maze[y][x] !== "0";
  }, []);

  const getNextPos = useCallback((x: number, y: number, dir: Dir): Pos => {
    switch (dir) {
      case "up": return { x, y: y - 1 };
      case "down": return { x, y: y + 1 };
      case "left": return { x: x - 1, y };
      case "right": return { x: x + 1, y };
      default: return { x, y };
    }
  }, []);

  const getAvailableDirs = useCallback((x: number, y: number, maze: string[][], currentDir: Dir): Dir[] => {
    const dirs: Dir[] = ["up", "down", "left", "right"];
    return dirs.filter((d) => {
      if (d === currentDir) return false;
      if (d === "up" && currentDir === "down") return false;
      if (d === "down" && currentDir === "up") return false;
      if (d === "left" && currentDir === "right") return false;
      if (d === "right" && currentDir === "left") return false;
      const next = getNextPos(x, y, d);
      return isWalkable(next.x, next.y, maze);
    });
  }, [getNextPos, isWalkable]);

  const updateGhosts = useCallback((maze: string[][], ghosts: Ghost[], player: Pos, frame: number) => {
    for (const ghost of ghosts) {
      if (ghost.eaten) {
        // Move back to home
        const dx = ghost.homeX - ghost.x;
        const dy = ghost.homeY - ghost.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          const nx = ghost.x + (dx > 0 ? 1 : -1);
          if (isWalkable(nx, ghost.y, maze)) { ghost.x = nx; continue; }
        }
        const ny = ghost.y + (dy > 0 ? 1 : -1);
        if (isWalkable(ghost.x, ny, maze)) { ghost.y = ny; continue; }
        // If stuck, just teleport
        if (ghost.x === ghost.homeX && ghost.y === ghost.homeY) {
          ghost.eaten = false;
          ghost.frightened = false;
        }
        continue;
      }

      // Random movement
      const available = getAvailableDirs(ghost.x, ghost.y, maze, ghost.dir!);
      
      // Occasionally try to chase player
      if (Math.random() < 0.3 && !ghost.frightened) {
        const dirs: Dir[] = ["up", "down", "left", "right"];
        let bestDir = ghost.dir;
        let bestDist = Infinity;
        for (const d of dirs) {
          const next = getNextPos(ghost.x, ghost.y, d);
          if (isWalkable(next.x, next.y, maze)) {
            const dist = Math.abs(next.x - player.x) + Math.abs(next.y - player.y);
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = d;
            }
          }
        }
        ghost.dir = bestDir;
      } else if (available.length > 0) {
        ghost.dir = available[Math.floor(Math.random() * available.length)];
      }

      const next = getNextPos(ghost.x, ghost.y, ghost.dir);
      
      // Tunnel wrap
      if (ghost.y === 14) {
        if (next.x < 0) { ghost.x = COLS - 1; continue; }
        if (next.x >= COLS) { ghost.x = 0; continue; }
      }

      if (isWalkable(next.x, next.y, maze)) {
        ghost.x = next.x;
        ghost.y = next.y;
      } else {
        // Try another direction
        const altDirs = available.filter((d) => d !== ghost.dir);
        if (altDirs.length > 0) {
          ghost.dir = altDirs[Math.floor(Math.random() * altDirs.length)];
          const altNext = getNextPos(ghost.x, ghost.y, ghost.dir);
          if (isWalkable(altNext.x, altNext.y, maze)) {
            ghost.x = altNext.x;
            ghost.y = altNext.y;
          }
        }
      }
    }
  }, [getNextPos, isWalkable, getAvailableDirs]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const game = gameRef.current;
    let animationId: number;

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      switch (e.key) {
        case "ArrowUp": game.player.nextDir = "up"; break;
        case "ArrowDown": game.player.nextDir = "down"; break;
        case "ArrowLeft": game.player.nextDir = "left"; break;
        case "ArrowRight": game.player.nextDir = "right"; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const gameLoop = () => {
      game.animFrame++;
      game.moveCounter++;

      // Mouth animation
      game.player.mouthOpen = Math.floor(game.animFrame / 5) % 2 === 0;

      // Move player every 8 frames
      if (game.moveCounter % 8 === 0) {
        // Try next direction first
        if (game.player.nextDir) {
          const next = getNextPos(game.player.x, game.player.y, game.player.nextDir);
          if (isWalkable(next.x, next.y, game.maze)) {
            game.player.dir = game.player.nextDir;
            game.player.nextDir = null;
          }
        }

        const next = getNextPos(game.player.x, game.player.y, game.player.dir);

        // Tunnel wrap
        if (game.player.y === 14) {
          if (next.x < 0) { game.player.x = COLS - 1; }
          else if (next.x >= COLS) { game.player.x = 0; }
          else if (isWalkable(next.x, next.y, game.maze)) {
            game.player.x = next.x;
            game.player.y = next.y;
          }
        } else if (isWalkable(next.x, next.y, game.maze)) {
          game.player.x = next.x;
          game.player.y = next.y;
        }

        // Eat dot
        const cell = game.maze[game.player.y][game.player.x];
        if (cell === "1") {
          game.maze[game.player.y][game.player.x] = "2";
          game.dotsLeft--;
          setScore((s) => s + 10);
        } else if (cell === "3") {
          game.maze[game.player.y][game.player.x] = "2";
          game.dotsLeft--;
          game.frightenedTimer = 300;
          game.ghostEatCombo = 0;
          for (const ghost of game.ghosts) {
            ghost.frightened = true;
          }
          setScore((s) => s + 50);
        }

        // Move ghosts every 10 frames
        if (game.moveCounter % 10 === 0) {
          updateGhosts(game.maze, game.ghosts, { x: game.player.x, y: game.player.y }, game.animFrame);
        }

        // Check ghost collisions
        for (const ghost of game.ghosts) {
          if (ghost.x === game.player.x && ghost.y === game.player.y) {
            if (ghost.frightened && !ghost.eaten) {
              ghost.eaten = true;
              ghost.frightened = false;
              game.ghostEatCombo++;
              setScore((s) => s + 200 * game.ghostEatCombo);
            } else if (!ghost.eaten) {
              setLives((l) => {
                if (l - 1 <= 0) {
                  setGameState("lost");
                }
                return l - 1;
              });
              // Reset positions
              game.player.x = 14;
              game.player.y = 23;
              game.player.dir = "left";
              break;
            }
          }
        }

        // Frightened timer
        if (game.frightenedTimer > 0) {
          game.frightenedTimer--;
          if (game.frightenedTimer === 0) {
            for (const ghost of game.ghosts) {
              ghost.frightened = false;
            }
          }
        }

        // Win check
        if (game.dotsLeft <= 0) {
          setGameState("won");
        }
      }

      // Draw
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);

      // Draw maze
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = game.maze[y][x];
          if (cell === "0") {
            ctx.fillStyle = "#2121de";
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          } else if (cell === "1") {
            ctx.fillStyle = "#ffb8ae";
            ctx.beginPath();
            ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === "3") {
            ctx.fillStyle = "#ffb8ae";
            ctx.beginPath();
            ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw ghosts
      for (const ghost of game.ghosts) {
        drawGhost(ctx, ghost.x, ghost.y, ghost.color, ghost.frightened, ghost.eaten, game.animFrame);
      }

      // Draw player (booty)
      drawBooty(ctx, game.player.x, game.player.y, game.player.dir, game.player.mouthOpen);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [gameState, getNextPos, isWalkable, updateGhosts]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[560px]">
        <div className="text-sm text-muted-foreground">
          Score: <span className="font-bold text-foreground">{score}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Lives: <span className="font-bold text-foreground">{'🍑'.repeat(lives)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Level: <span className="font-bold text-foreground">{level}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={COLS * TILE}
        height={ROWS * TILE}
        className="rounded-lg border border-white/10"
        style={{ imageRendering: "pixelated" }}
      />

      {gameState === "won" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-bold text-green-400">You won! All dots eaten! 🍑</p>
          <ShimmerButton
            onClick={() => {
              setLevel((l) => l + 1);
              initGame();
            }}
          >
            Next Level
          </ShimmerButton>
        </div>
      )}

      {gameState === "lost" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-bold text-red-400">Game Over! 👻</p>
          <ShimmerButton onClick={initGame}>Play Again</ShimmerButton>
        </div>
      )}
    </div>
  );
}
