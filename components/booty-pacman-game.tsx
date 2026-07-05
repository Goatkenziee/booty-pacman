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
    score: 0,
    lives: 3,
    dotsLeft: 0,
    powerTimer: 0,
    frame: 0,
    level: 1,
    state: "playing" as "playing" | "won" | "lost",
  });

  const resetGame = useCallback(() => {
    const maze = MAZE_TEMPLATE.map((r) => r.split(""));
    let dots = 0;
    for (const row of maze) {
      for (const c of row) {
        if (c === "1" || c === "3") dots++;
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
      score: 0,
      lives: 3,
      dotsLeft: dots,
      powerTimer: 0,
      frame: 0,
      level: 1,
      state: "playing",
    };
    setScore(0);
    setLives(3);
    setGameState("playing");
    setLevel(1);
  }, []);

  const resetAfterDeath = useCallback(() => {
    const g = gameRef.current;
    g.player = { x: 14, y: 23, dir: "left", nextDir: null, mouthOpen: true };
    g.ghosts = [
      { x: 14, y: 11, color: GHOST_COLORS[0], dir: "left", frightened: false, eaten: false, homeX: 14, homeY: 11 },
      { x: 12, y: 11, color: GHOST_COLORS[1], dir: "right", frightened: false, eaten: false, homeX: 12, homeY: 11 },
      { x: 16, y: 11, color: GHOST_COLORS[2], dir: "left", frightened: false, eaten: false, homeX: 16, homeY: 11 },
      { x: 14, y: 13, color: GHOST_COLORS[3], dir: "up", frightened: false, eaten: false, homeX: 14, homeY: 13 },
    ];
    g.powerTimer = 0;
    g.state = "playing";
  }, []);

  const nextLevel = useCallback(() => {
    const g = gameRef.current;
    const maze = MAZE_TEMPLATE.map((r) => r.split(""));
    let dots = 0;
    for (const row of maze) {
      for (const c of row) {
        if (c === "1" || c === "3") dots++;
      }
    }
    g.maze = maze;
    g.dotsLeft = dots;
    g.level++;
    g.player = { x: 14, y: 23, dir: "left", nextDir: null, mouthOpen: true };
    g.ghosts = [
      { x: 14, y: 11, color: GHOST_COLORS[0], dir: "left", frightened: false, eaten: false, homeX: 14, homeY: 11 },
      { x: 12, y: 11, color: GHOST_COLORS[1], dir: "right", frightened: false, eaten: false, homeX: 12, homeY: 11 },
      { x: 16, y: 11, color: GHOST_COLORS[2], dir: "left", frightened: false, eaten: false, homeX: 16, homeY: 11 },
      { x: 14, y: 13, color: GHOST_COLORS[3], dir: "up", frightened: false, eaten: false, homeX: 14, homeY: 13 },
    ];
    g.powerTimer = 0;
    g.state = "playing";
    setLevel(g.level);
    setGameState("playing");
  }, []);

  const isWall = useCallback((x: number, y: number): boolean => {
    const g = gameRef.current;
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
    return g.maze[y][x] === "0";
  }, []);

  const canMove = useCallback(
    (x: number, y: number, dir: Dir): boolean => {
      if (!dir) return false;
      let nx = x;
      let ny = y;
      if (dir === "left") nx--;
      else if (dir === "right") nx++;
      else if (dir === "up") ny--;
      else if (dir === "down") ny++;

      // Tunnel wrap
      if (ny === 14 && nx < 0) return true;
      if (ny === 14 && nx >= COLS) return true;

      return !isWall(nx, ny);
    },
    [isWall]
  );

  const getOppositeDir = useCallback((dir: Dir): Dir => {
    if (dir === "left") return "right";
    if (dir === "right") return "left";
    if (dir === "up") return "down";
    if (dir === "down") return "up";
    return null;
  }, []);

  const movePlayer = useCallback(() => {
    const g = gameRef.current;
    const p = g.player;

    // Try next direction first
    if (p.nextDir && canMove(p.x, p.y, p.nextDir)) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }

    if (!canMove(p.x, p.y, p.dir)) return;

    if (p.dir === "left") p.x--;
    else if (p.dir === "right") p.x++;
    else if (p.dir === "up") p.y--;
    else if (p.dir === "down") p.y++;

    // Tunnel wrap
    if (p.y === 14 && p.x < 0) p.x = COLS - 1;
    if (p.y === 14 && p.x >= COLS) p.x = 0;

    // Eat dot
    const cell = g.maze[p.y][p.x];
    if (cell === "1") {
      g.maze[p.y][p.x] = "2";
      g.score += 10;
      g.dotsLeft--;
      setScore(g.score);
    } else if (cell === "3") {
      g.maze[p.y][p.x] = "2";
      g.score += 50;
      g.dotsLeft--;
      g.powerTimer = 300; // ~10 seconds
      setScore(g.score);
      // Frighten ghosts
      for (const ghost of g.ghosts) {
        if (!ghost.eaten) {
          ghost.frightened = true;
        }
      }
    }

    if (g.dotsLeft <= 0) {
      g.state = "won";
      setGameState("won");
    }
  }, [canMove]);

  const moveGhosts = useCallback(() => {
    const g = gameRef.current;
    const dirs: Dir[] = ["up", "down", "left", "right"];

    for (const ghost of g.ghosts) {
      if (ghost.eaten) {
        // Return to home
        const dx = ghost.homeX - ghost.x;
        const dy = ghost.homeY - ghost.y;
        if (Math.abs(dx) + Math.abs(dy) < 2) {
          ghost.x = ghost.homeX;
          ghost.y = ghost.homeY;
          ghost.eaten = false;
          ghost.frightened = false;
          continue;
        }
        const bestDir = dirs
          .filter((d) => canMove(ghost.x, ghost.y, d))
          .sort((a, b) => {
            const [ax, ay] = dirOffset(a);
            const [bx, by] = dirOffset(b);
            const da = Math.abs(ghost.x + ax - ghost.homeX) + Math.abs(ghost.y + ay - ghost.homeY);
            const db = Math.abs(ghost.x + bx - ghost.homeX) + Math.abs(ghost.y + by - ghost.homeY);
            return da - db;
          })[0];
        if (bestDir) {
          const [dx, dy] = dirOffset(bestDir);
          ghost.x += dx;
          ghost.y += dy;
        }
        continue;
      }

      const possible = dirs.filter((d) => {
        if (getOppositeDir(d) === ghost.dir) return false;
        return canMove(ghost.x, ghost.y, d);
      });

      // Ghosts prefer to move towards the player
      let chosen = ghost.dir;
      if (possible.length > 0) {
        const target = ghost.frightened
          ? { x: Math.random() * COLS, y: Math.random() * ROWS } // Random when frightened
          : { x: g.player.x, y: g.player.y };

        chosen = possible.sort((a, b) => {
          const [ax, ay] = dirOffset(a);
          const [bx, by] = dirOffset(b);
          const da = Math.abs(ghost.x + ax - target.x) + Math.abs(ghost.y + ay - target.y);
          const db = Math.abs(ghost.x + bx - target.x) + Math.abs(ghost.y + by - target.y);
          return ghost.frightened ? db - da : da - db; // Run away when frightened
        })[0];
      } else {
        // Dead end, try reverse
        const reverse = getOppositeDir(ghost.dir);
        if (reverse && canMove(ghost.x, ghost.y, reverse)) {
          chosen = reverse;
        }
      }

      ghost.dir = chosen;
      const [dx, dy] = dirOffset(chosen);
      ghost.x += dx;
      ghost.y += dy;

      // Tunnel wrap
      if (ghost.y === 14 && ghost.x < 0) ghost.x = COLS - 1;
      if (ghost.y === 14 && ghost.x >= COLS) ghost.x = 0;
    }
  }, [canMove, getOppositeDir]);

  const checkCollisions = useCallback(() => {
    const g = gameRef.current;
    for (const ghost of g.ghosts) {
      if (ghost.eaten) continue;
      if (Math.abs(ghost.x - g.player.x) < 1 && Math.abs(ghost.y - g.player.y) < 1) {
        if (ghost.frightened) {
          ghost.eaten = true;
          ghost.frightened = false;
          g.score += 200;
          setScore(g.score);
        } else {
          g.lives--;
          setLives(g.lives);
          if (g.lives <= 0) {
            g.state = "lost";
            setGameState("lost");
          } else {
            resetAfterDeath();
          }
          return;
        }
      }
    }
  }, [resetAfterDeath]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const gameLoop = () => {
      const g = gameRef.current;
      if (g.state !== "playing") {
        // Still render
        render(ctx);
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      tick++;

      // Player moves every 4 frames
      if (tick % 4 === 0) {
        g.player.mouthOpen = !g.player.mouthOpen;
        movePlayer();
      }

      // Ghosts move every 4 frames (slightly different timing)
      if (tick % 4 === 2) {
        moveGhosts();
        checkCollisions();
      }

      // Power timer
      if (g.powerTimer > 0) {
        g.powerTimer--;
        if (g.powerTimer <= 0) {
          for (const ghost of g.ghosts) {
            ghost.frightened = false;
          }
        }
      }

      g.frame++;
      render(ctx);
      animId = requestAnimationFrame(gameLoop);
    };

    const render = (ctx: CanvasRenderingContext2D) => {
      const g = gameRef.current;
      const w = COLS * TILE;
      const h = ROWS * TILE;

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      // Draw maze
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = g.maze[y][x];
          if (cell === "0") {
            // Wall - draw with rounded edges
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            ctx.strokeStyle = "#2a2a4e";
            ctx.lineWidth = 1;
            ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
          } else if (cell === "1") {
            // Dot
            ctx.fillStyle = "#ffb8c6";
            ctx.beginPath();
            ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === "3") {
            // Power pellet
            const pulse = Math.sin(g.frame * 0.1) * 1.5 + 4;
            ctx.fillStyle = "#ff69b4";
            ctx.beginPath();
            ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = "#ff69b4";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw ghosts
      for (const ghost of g.ghosts) {
        drawGhost(ctx, ghost.x, ghost.y, ghost.color, ghost.frightened, ghost.eaten, g.frame);
      }

      // Draw player (booty)
      drawBooty(ctx, g.player.x, g.player.y, g.player.dir, g.player.mouthOpen);

      // Score overlay
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, 0, w, 0);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [movePlayer, moveGhosts, checkCollisions]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (g.state !== "playing") return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (canMove(g.player.x, g.player.y, "up")) {
            g.player.dir = "up";
            g.player.nextDir = null;
          } else {
            g.player.nextDir = "up";
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (canMove(g.player.x, g.player.y, "down")) {
            g.player.dir = "down";
            g.player.nextDir = null;
          } else {
            g.player.nextDir = "down";
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (canMove(g.player.x, g.player.y, "left")) {
            g.player.dir = "left";
            g.player.nextDir = null;
          } else {
            g.player.nextDir = "left";
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (canMove(g.player.x, g.player.y, "right")) {
            g.player.dir = "right";
            g.player.nextDir = null;
          } else {
            g.player.nextDir = "right";
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canMove]);

  const restart = () => {
    resetGame();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Score bar */}
      <div className="flex w-full max-w-[560px] items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Score</span>
            <span className="text-lg font-bold text-purple-400">{score}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Level</span>
            <span className="text-lg font-bold text-pink-400">{level}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-lg">🍑</span>
          ))}
        </div>
      </div>

      {/* Game canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={COLS * TILE}
          height={ROWS * TILE}
          className="block"
          style={{ width: COLS * TILE * 1.2, height: ROWS * TILE * 1.2 }}
        />

        {/* Game over overlay */}
        {gameState === "lost" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="mb-4 text-6xl">💀</div>
            <h2 className="mb-2 text-3xl font-bold text-red-400">Game Over!</h2>
            <p className="mb-6 text-muted-foreground">Final Score: {score}</p>
            <ShimmerButton onClick={restart}>Play Again</ShimmerButton>
          </div>
        )}

        {/* Win overlay */}
        {gameState === "won" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-2 text-3xl font-bold text-green-400">You Win!</h2>
            <p className="mb-6 text-muted-foreground">Score: {score} | Level {level} Complete!</p>
            <ShimmerButton onClick={nextLevel}>Next Level</ShimmerButton>
          </div>
        )}
      </div>

      {/* Controls info */}
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>Arrow Keys = Move</span>
        <span className="text-white/20">|</span>
        <span>Eat dots to score</span>
        <span className="text-white/20">|</span>
        <span>Power pellets = 🍑 revenge!</span>
      </div>
    </div>
  );
}

function dirOffset(dir: Dir): [number, number] {
  if (dir === "left") return [-1, 0];
  if (dir === "right") return [1, 0];
  if (dir === "up") return [0, -1];
  if (dir === "down") return [0, 1];
  return [0, 0];
}
