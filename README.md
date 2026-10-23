# Ship It!

Ship It! is a short arcade game. You play as Goose on a night shift, catching falling tickets and dropping them into the right bot inbox before the queue overflows.

## How to play

**Desktop**

- Left and Right arrow keys, or A and D, move Goose.
- Space, Down arrow, or the number keys 1 to 6 drop the ticket you are holding into a lane.
- Enter starts a shift, or starts another one, when focus is not already on a button.

**Mobile**

- Drag anywhere on the board to move Goose.
- Tap a lane to drop the ticket you are holding.
- Tap Start shift to begin. After a game, tap Run it back or Back to start.

Stand under a ticket to catch it. Catching one in the top third of the board is a perfect catch. A red P1 sent to the wrong desk causes an outage, and three outages end the shift. A queue of 10 also ends the shift. Catch the green PR for 5 seconds of auto-routing.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static files are written to `dist`.

## Deploy

Import this repo on Vercel and use the Vite preset. Set the build command to `npm run build` and the output directory to `dist`. This is a plain static Vite build, so no extra Vercel config is required.
