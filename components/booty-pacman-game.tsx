"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TILE = 20;
const COLS = 28;
const ROWS = 31;

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

  let angle = 0;
  if (dir === "right") angle = 0;
  else if (dir === "down") angle = Math.PI / 2;
  else if (dir === "left") angle = Math.PI;
  else if (dir === "up") angle = -Math.PI / 2;
  ctx.rotate(angle);

  const cheekR = r * 0.55;
  const spread = r * 0.3;

  ctx.beginPath();
  ctx.arc(-spread, 0, cheekR, 0, Math.PI * 2);
  ctx.fillStyle = "#FFB6C1";
  ctx.fill();
  ctx.strokeStyle = "#FF69B4";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(spread, 0, cheekR, 0, Math.PI * 2);
  ctx.fillStyle = "#FFB6C1";
  ctx.fill();
  ctx.strokeStyle = "#FF69B4";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, -cheekR * 0.6);
  ctx.quadraticCurveTo(0, -cheekR * 0.2, 2, -cheekR * 0.6);
  ctx.strokeStyle = "#FF69B4";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (mouthOpen) {
    ctx.beginPath();
    ctx.arc(0, cheekR * 0.3, cheekR * 0.4, 0, Math.PI);
    ctx.fillStyle = "#FF1493";
    ctx.fill();
  }

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

  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.lineTo(r, r * 0.6);
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
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 4, 3, 0, Math.PI);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-3, -2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3, -2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
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
    dots: 0,
    totalDots: 0,
    frame: 0,
    animId: 0,
    moveCounter: 0,
    frightenedTimer: 0,
  });

  const initGhosts = useCallback((): Ghost[] => {
    return GHOST_COLORS.map((color, i) => ({
      x: 13 + i,
      y: 11,
      color,
      dir: "up" as Dir,
      frightened: false,
      eaten: false,
      homeX: 13 + i,
      homeY: 11,
    }));
  }, []);

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.maze = MAZE_TEMPLATE.map((r) => r.split(""));
    g.player = { x: 14, y: 23, dir: "left", nextDir: null, mouthOpen: true };
    g.ghosts = initGhosts();
    g.dots = 0;
    g.totalDots = 0;
    g.frightenedTimer = 0;
    g.moveCounter = 0;

    let total = 0;
    for (const row of g.maze) {
      for (const cell of row) {
        if (cell === "1" || cell === "3") total++;
      }
    }
    g.totalDots = total;
  }, [initGhosts]);

  useEffect(() => {
    initGame();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = COLS * TILE;
    const H = ROWS * TILE;
    canvas.width = W;
    canvas.height = H;

    const g = gameRef.current;

    const isWalkable = (x: number, y: number): boolean => {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
      return g.maze[y][x] !== "0";
    };

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": g.player.nextDir = "up"; break;
        case "ArrowDown": g.player.nextDir = "down"; break;
        case "ArrowLeft": g.player.nextDir = "left"; break;
        case "ArrowRight": g.player.nextDir = "right"; break;
      }
    };
    window.addEventListener("keydown", handleKey);

    const gameLoop = () => {
      g.frame++;
      g.moveCounter++;

      if (g.frightenedTimer > 0) {
        g.frightenedTimer--;
        if (g.frightenedTimer === 0) {
          g.ghosts.forEach((gh) => { gh.frightened = false; });
        }
      }

      // Move every 8 frames (slows down the game)
      if (g.moveCounter % 8 === 0) {
        const p = g.player;

        // Try next direction first
        if (p.nextDir) {
          let nx = p.x, ny = p.y;
          if (p.nextDir === "left") nx--;
          else if (p.nextDir === "right") nx++;
          else if (p.nextDir === "up") ny--;
          else if (p.nextDir === "down") ny++;
          if (isWalkable(nx, ny)) {
            p.dir = p.nextDir;
            p.nextDir = null;
          }
        }

        // Move in current direction
        let nx = p.x, ny = p.y;
        if (p.dir === "left") nx--;
        else if (p.dir === "right") nx++;
        else if (p.dir === "up") ny--;
        else if (p.dir === "down") ny++;

        // Tunnel wrap
        if (nx < 0 && p.dir === "left") nx = COLS - 1;
        else if (nx >= COLS && p.dir === "right") nx = 0;

        if (isWalkable(nx, ny)) {
          p.x = nx;
          p.y = ny;
        }

        // Eat dot
        const cell = g.maze[p.y][p.x];
        if (cell === "1") {
          g.maze[p.y][p.x] = "2";
          g.dots++;
          setScore((s) => s + 10);
        } else if (cell === "3") {
          g.maze[p.y][p.x] = "2";
          g.dots++;
          setScore((s) => s + 50);
          g.frightenedTimer = 200;
          g.ghosts.forEach((gh) => {
            gh.frightened = true;
            if (gh.eaten) {
              gh.eaten = false;
              gh.x = gh.homeX;
              gh.y = gh.homeY;
            }
          });
        }

        // Move ghosts
        g.ghosts.forEach((gh) => {
          if (gh.eaten) {
            // Move toward home
            const dx = gh.homeX - gh.x;
            const dy = gh.homeY - gh.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              gh.x += dx > 0 ? 1 : -1;
            } else if (dy !== 0) {
              gh.y += dy > 0 ? 1 : -1;
            }
            if (gh.x === gh.homeX && gh.y === gh.homeY) {
              gh.eaten = false;
            }
            return;
          }

          const dirs: Dir[] = ["up", "down", "left", "right"];
          const possible: Dir[] = [];
          for (const d of dirs) {
            let tx = gh.x, ty = gh.y;
            if (d === "left") tx--;
            else if (d === "right") tx++;
            else if (d === "up") ty--;
            else if (d === "down") ty++;
            // Don't reverse
            if (isWalkable(tx, ty) && !(d === "up" && gh.dir === "down") && !(d === "down" && gh.dir === "up") && !(d === "left" && gh.dir === "right") && !(d === "right" && gh.dir === "left")) {
              possible.push(d);
            }
          }

          if (possible.length > 0) {
            if (gh.frightened) {
              gh.dir = possible[Math.floor(Math.random() * possible.length)];
            } else {
              // Chase player
              let bestDist = Infinity;
              let bestDir = possible[0];
              for (const d of possible) {
                let tx = gh.x, ty = gh.y;
                if (d === "left") tx--;
                else if (d === "right") tx++;
                else if (d === "up") ty--;
                else if (d === "down") ty++;
                const dist = Math.abs(tx - p.x) + Math.abs(ty - p.y);
                if (dist < bestDist) {
                  bestDist = dist;
                  bestDir = d;
                }
              }
              gh.dir = bestDir;
            }
          }

          if (gh.dir === "left") gh.x--;
          else if (gh.dir === "right") gh.x++;
          else if (gh.dir === "up") gh.y--;
          else if (gh.dir === "down") gh.y++;

          // Tunnel wrap
          if (gh.x < 0) gh.x = COLS - 1;
          if (gh.x >= COLS) gh.x = 0;
        });

        // Check collisions
        for (const gh of g.ghosts) {
          if (gh.eaten) continue;
          if (gh.x === p.x && gh.y === p.y) {
            if (gh.frightened) {
              gh.eaten = true;
              setScore((s) => s + 200);
            } else {
              setLives((l) => {
                const newLives = l - 1;
                if (newLives <= 0) {
                  setGameState("lost");
                }
                return newLives;
              });
              // Reset positions
              p.x = 14;
              p.y = 23;
              p.dir = "left";
              gh.x = gh.homeX;
              gh.y = gh.homeY;
            }
          }
        }

        // Check win
        if (g.dots >= g.totalDots) {
          setGameState("won");
        }
      }

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Maze
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cell = g.maze[row][col];
          const x = col * TILE;
          const y = row * TILE;

          if (cell === "0") {
            ctx.fillStyle = "#1a1a3e";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = "#2a2a5e";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, TILE, TILE);
          } else if (cell === "1") {
            ctx.fillStyle = "#ffb8c6";
            ctx.beginPath();
            ctx.arc(x + TILE / 2, y + TILE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === "3") {
            ctx.fillStyle = "#ff69b4";
            ctx.beginPath();
            ctx.arc(x + TILE / 2, y + TILE / 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(255,105,180,0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x + TILE / 2, y + TILE / 2, 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // Ghosts
      g.ghosts.forEach((gh) => {
        drawGhost(ctx, gh.x, gh.y, gh.color, gh.frightened, gh.eaten, g.frame);
      });

      // Player
      drawBooty(ctx, g.player.x, g.player.y, g.player.dir, g.frame % 20 < 10);

      g.animId = requestAnimationFrame(gameLoop);
    };

    g.animId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(g.animId);
    };
  }, [initGame]);

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setGameState("playing");
    initGame();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[560px]">
        <div className="text-sm text-muted-foreground">
          Score: <span className="text-foreground font-bold">{score}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Level: <span className="text-foreground font-bold">{level}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Lives: <span className="text-foreground font-bold">{lives}</span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg border border-white/10"
          style={{ imageRendering: "pixelated" }}
        />
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="text-center">
              <div className="text-3xl mb-2">{gameState === "won" ? "🎉" : "💀"}</div>
              <h2 className="text-2xl font-bold mb-2">
                {gameState === "won" ? "You Won!" : "Game Over"}
              </h2>
              <p className="text-muted-foreground mb-4">Score: {score}</p>
              <button
                onClick={handleRestart}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}