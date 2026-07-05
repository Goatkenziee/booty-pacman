"use client";

import { BootyPacmanGame } from "@/components/booty-pacman-game";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ArrowLeft, Gamepad2, Music, VolumeX } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  if (!gameStarted) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              Booty Pacman
            </div>
            <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
              <a className="transition hover:text-foreground" href="#">How to Play</a>
              <a className="transition hover:text-foreground" href="#">Leaderboard</a>
            </nav>
            <ShimmerButton onClick={() => setGameStarted(true)}>
              <Gamepad2 className="mr-2 h-4 w-4" />
              Play Now
            </ShimmerButton>
          </div>
        </header>

        <main className="container flex flex-1 flex-col items-center justify-center py-20">
          <div className="mesh-gradient pointer-events-none absolute inset-0" />

          <div className="animate-fade-up relative z-10 flex flex-col items-center text-center">
            <div className="mb-8 text-7xl">🍑</div>
            <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-7xl">
              Booty{" "}
              <span className="text-gradient">Pacman</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-muted-foreground">
              The classic arcade game gets a cheeky makeover. Guide the booty through the maze, 
              gobble up dots, and avoid those pesky ghosts. It's a whole new kind of booty chase!
            </p>
            <div className="flex gap-4">
              <ShimmerButton onClick={() => setGameStarted(true)}>
                <Gamepad2 className="mr-2 h-4 w-4" />
                Start Game
              </ShimmerButton>
              <button
                onClick={() => setSoundOn(!soundOn)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-transparent px-6 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {soundOn ? <Music className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                {soundOn ? "Sound On" : "Muted"}
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="mb-2 text-3xl">🍑</div>
                <h3 className="mb-1 font-semibold">Booty Power</h3>
                <p className="text-sm text-muted-foreground">Move with arrow keys</p>
              </div>
              <div>
                <div className="mb-2 text-3xl">👻</div>
                <h3 className="mb-1 font-semibold">Ghosts</h3>
                <p className="text-sm text-muted-foreground">Avoid at all costs</p>
              </div>
              <div>
                <div className="mb-2 text-3xl">⭐</div>
                <h3 className="mb-1 font-semibold">Power Pellets</h3>
                <p className="text-sm text-muted-foreground">Turn the tables!</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-white/10 py-6 text-center text-sm text-muted-foreground">
          Built with cheeky vibes on YouMe
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <button onClick={() => setGameStarted(false)} className="flex items-center gap-2 text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              Booty Pacman
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Use <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-xs">←↑↓→</kbd> to move</span>
            <button
              onClick={() => setSoundOn(!soundOn)}
              className="rounded-lg p-2 transition hover:bg-white/10"
            >
              {soundOn ? <Music className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="container flex flex-1 items-center justify-center py-8">
        <BootyPacmanGame />
      </main>
    </div>
  );
}
