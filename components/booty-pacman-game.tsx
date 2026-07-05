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
    player: { x: 14, y: 23, dir: "left" as Dir, nextDir: null as Dir | null, mouthOpen: true },
    ghosts: [] as Ghost[],
    score: 0,
    lives: 3,
    level: 1,
    dotsTotal: 0,
    dotsEaten: 0,
    animFrame: 0,
    mouthTimer: 0,
    frightenedTimer: 0,
    gameState: "playing" as "playing" | "won" | "lost",
  });

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.maze = MAZE_TEMPLATE.map((r) => r.split(""));
    g.player = { x: 14, y: 23, dir: "left", nextDir: null, mouthOpen: true };
    g.ghosts = [
      { x: 14, y: 11, color: GHOST_COLORS[0], dir: "left", frightened: false, eaten: false, homeX: 14, homeY: 11 },
      { x: 12, y: 11, color: GHOST_COLORS[1], dir: "right", frightened: false, eaten: false, homeX: 12, homeY: 11 },
      { x: 16, y: 11, color: GHOST_COLORS[2], dir: "left", frightened: false, eaten: false, homeX: 16, homeY: 11 },
      { x: 14, y: 9, color: GHOST_COLORS[3], dir: "up", frightened: false, eaten: false, homeX: 14, homeY: 9 },
    ];
    g.score = 0;
    g.lives = 3;
    g.level = 1;
    g.dotsTotal = 0;
    g.dotsEaten = 0;
    g.animFrame = 0;
    g.mouthTimer = 0;
    g.frightenedTimer = 0;
    g.gameState = "playing";

    // Count dots
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (g.maze[r][c] === "1" || g.maze[r][c] === "3") g.dotsTotal++;
      }
    }

    setScore(0);
    setLives(3);
    setGameState("playing");
    setLevel(1);
  }, []);

  const isWalkable = useCallback((maze: string[][], x: number, y: number) => {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    return maze[y][x] !== "0";
  }, []);

  const moveGhost = useCallback((ghost: Ghost, maze: string[][], player: { x: number; y: number }, frame: number) => {
    if (ghost.eaten) {
      // Move back to home
      const dx = ghost.homeX - ghost.x;
      const dy = ghost.homeY - ghost.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        ghost.x += dx > 0 ? 1 : -1;
      } else if (dy !== 0) {
        ghost.y += dy > 0 ? 1 : -1;
      }
      if (ghost.x === ghost.homeX && ghost.y === ghost.homeY) {
        ghost.eaten = false;
        ghost.frightened = false;
      }
      return;
    }

    const dirs: Dir[] = ["up", "down", "left", "right"];
    const opposites: Record<string, Dir> = { up: "down", down: "up", left: "right", right: "left" };

    // Try to move toward player (or random if frightened)
    let possible: Dir[] = [];
    for (const d of dirs) {
      if (d === opposites[ghost.dir || "right"]) continue;
      let nx = ghost.x;
      let ny = ghost.y;
      if (d === "up") ny--;
      else if (d === "down") ny++;
      else if (d === "left") nx--;
      else if (d === "right") nx++;
      if (isWalkable(maze, nx, ny)) possible.push(d);
    }

    if (possible.length === 0) {
      // Reverse direction
      ghost.dir = opposites[ghost.dir || "right"];
      if (ghost.dir === "up") ghost.y--;
      else if (ghost.dir === "down") ghost.y++;
      else if (ghost.dir === "left") ghost.x--;
      else if (ghost.dir === "right") ghost.x++;
      return;
    }

    if (ghost.frightened) {
      ghost.dir = possible[Math.floor(Math.random() * possible.length)];
    } else {
      // Chase player
      let best = possible[0];
      let bestDist = Infinity;
      for (const d of possible) {
        let nx = ghost.x;
        let ny = ghost.y;
        if (d === "up") ny--;
        else if (d === "down") ny++;
        else if (d === "left") nx--;
        else if (d === "right") nx++;
        const dist = Math.abs(nx - player.x) + Math.abs(ny - player.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = d;
        }
      }
      ghost.dir = best;
    }

    if (ghost.dir === "up") ghost.y--;
    else if (ghost.dir === "down") ghost.y++;
    else if (ghost.dir === "left") ghost.x--;
    else if (ghost.dir === "right") ghost.x++;
  }, [isWalkable]);

  const gameLoop = useCallback(() => {
    const g = gameRef.current;
    if (g.gameState !== "playing") return;

    g.animFrame++;
    g.mouthTimer++;
    if (g.mouthTimer > 8) {
      g.player.mouthOpen = !g.player.mouthOpen;
      g.mouthTimer = 0;
    }

    // Handle player input (nextDir)
    if (g.player.nextDir) {
      let nx = g.player.x;
      let ny = g.player.y;
      if (g.player.nextDir === "up") ny--;
      else if (g.player.nextDir === "down") ny++;
      else if (g.player.nextDir === "left") nx--;
      else if (g.player.nextDir === "right") nx++;
      if (isWalkable(g.maze, nx, ny)) {
        g.player.dir = g.player.nextDir;
        g.player.nextDir = null;
      }
    }

    // Move player
    let px = g.player.x;
    let py = g.player.y;
    if (g.player.dir === "up") py--;
    else if (g.player.dir === "down") py++;
    else if (g.player.dir === "left") px--;
    else if (g.player.dir === "right") px++;

    if (isWalkable(g.maze, px, py)) {
      g.player.x = px;
      g.player.y = py;
    }

    // Eat dot
    const cell = g.maze[g.player.y][g.player.x];
    if (cell === "1") {
      g.maze[g.player.y][g.player.x] = "2";
      g.score += 10;
      g.dotsEaten++;
      setScore(g.score);
    } else if (cell === "3") {
      g.maze[g.player.y][g.player.x] = "2";
      g.score += 50;
      g.dotsEaten++;
      g.frightenedTimer = 300;
      for (const ghost of g.ghosts) {
        if (!ghost.eaten) ghost.frightened = true;
      }
      setScore(g.score);
    }

    // Frightened timer
    if (g.frightenedTimer > 0) {
      g.frightenedTimer--;
      if (g.frightenedTimer === 0) {
        for (const ghost of g.ghosts) ghost.frightened = false;
      }
    }

    // Move ghosts (every other frame)
    if (g.animFrame % 4 === 0) {
      for (const ghost of g.ghosts) {
        moveGhost(ghost, g.maze, g.player, g.animFrame);
      }
    }

    // Check collisions
    for (const ghost of g.ghosts) {
      if (ghost.x === g.player.x && ghost.y === g.player.y) {
        if (ghost.frightened && !ghost.eaten) {
          ghost.eaten = true;
          ghost.frightened = false;
          g.score += 200;
          setScore(g.score);
        } else if (!ghost.eaten) {
          g.lives--;
          setLives(g.lives);
          if (g.lives <= 0) {
            g.gameState = "lost";
            setGameState("lost");
            return;
          }
          // Reset positions
          g.player.x = 14;
          g.player.y = 23;
          g.player.dir = "left";
          for (const gh of g.ghosts) {
            gh.x = gh.homeX;
            gh.y = gh.homeY;
            gh.frightened = false;
            gh.eaten = false;
          }
          g.frightenedTimer = 0;
        }
      }
    }

    // Win check
    if (g.dotsEaten >= g.dotsTotal) {
      g.gameState = "won";
      setGameState("won");
      return;
    }

    requestAnimationFrame(gameLoop);
  }, [isWalkable, moveGhost]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gameRef.current;

    // Clear
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = g.maze[r][c];
        const x = c * TILE;
        const y = r * TILE;
        if (cell === "0") {
          ctx.fillStyle = "#2121de";
          ctx.fillRect(x, y, TILE, TILE);
          // Inner dark
          ctx.fillStyle = "#000";
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        } else if (cell === "1") {
          ctx.fillStyle = "#ffb8ae";
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === "3") {
          ctx.fillStyle = "#ffb8ae";
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw ghosts
    for (const ghost of g.ghosts) {
      drawGhost(ctx, ghost.x, ghost.y, ghost.color, ghost.frightened, ghost.eaten, g.animFrame);
    }

    // Draw player (booty)
    drawBooty(ctx, g.player.x, g.player.y, g.player.dir, g.player.mouthOpen);

    requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    initGame();

    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (g.gameState !== "playing") return;
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); g.player.nextDir = "up"; break;
        case "ArrowDown": e.preventDefault(); g.player.nextDir = "down"; break;
        case "ArrowLeft": e.preventDefault(); g.player.nextDir = "left"; break;
        case "ArrowRight": e.preventDefault(); g.player.nextDir = "right"; break;
      }
    };
    window.addEventListener("keydown", handleKey);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = COLS * TILE;
      canvas.height = ROWS * TILE;
    }

    // Start loops
    requestAnimationFrame(gameLoop);
    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [initGame, gameLoop, draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="flex w-full max-w-[560px] items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Score:</span>
            <span className="font-mono text-lg font-bold text-purple-400">{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Level:</span>
            <span className="font-mono font-bold">{level}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-lg">🍑</span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg border border-white/10"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/80 backdrop-blur-sm">
            <div className="text-5xl">{gameState === "won" ? "🎉" : "💀"}</div>
            <h2 className="text-2xl font-bold">
              {gameState === "won" ? "You Won!" : "Game Over"}
            </h2>
            <p className="text-muted-foreground">
              {gameState === "won"
                ? `All dots eaten! Score: ${score}`
                : `Final score: ${score}`}
            </p>
            <ShimmerButton onClick={initGame}>Play Again</ShimmerButton>
          </div>
        )}
      </div>
    </div>
  );
}
