import { useEffect, useRef, useState, type PointerEvent as PointerEventR } from "react";

type BotId = "cpo" | "leadeng" | "designer" | "cloudflare" | "bizplan" | "article";
type Screen = "start" | "playing" | "over" | "win";

interface Bot {
  id: BotId;
  name: string;
  short: string;
  hue: string;
  ink: string;
  emoji: string;
  lines: string[];
}

const BOTS: Record<BotId, Bot> = {
  cpo: { id: "cpo", name: "CPO", short: "CPO", hue: "#7209B7", ink: "#B15CFF", emoji: "\u{1F9ED}", lines: ["Noted. Adding it to the roadmap. Somewhere.", "Finally, a problem worth prioritising."] },
  leadeng: { id: "leadeng", name: "Lead Eng", short: "Lead Eng", hue: "#4CC9F0", ink: "#4CC9F0", emoji: "\u{1F527}", lines: ["Works on my machine. Shipping it.", "Merged. Don't ask about the tests."] },
  designer: { id: "designer", name: "Designer", short: "Designer", hue: "#F72585", ink: "#FF6FAE", emoji: "\u{1F3A8}", lines: ["Moving it two pixels left. You're welcome.", "It needed more white space. It always does."] },
  cloudflare: { id: "cloudflare", name: "Cloudflare Ops", short: "CF Ops", hue: "#3DDC97", ink: "#3DDC97", emoji: "\u{1F6E1}\u{FE0F}", lines: ["Cached. Nobody will ever know.", "Traffic's fine. I'm watching it anyway."] },
  bizplan: { id: "bizplan", name: "Bizplan", short: "Bizplan", hue: "#FF8C42", ink: "#FF8C42", emoji: "\u{1F4C8}", lines: ["Big market. Small team. Let's go.", "I've drawn a chart. It goes up."] },
  article: { id: "article", name: "Article", short: "Article", hue: "#FFC145", ink: "#FFC145", emoji: "\u{1F4F0}", lines: ["Scheduled for 9am. Thought leadership incoming.", "That's a post. Possibly a thread."] },
};
const BOT_ORDER: BotId[] = ["cpo", "leadeng", "designer", "cloudflare", "bizplan", "article"];

interface TicketDef {
  text: string;
  bot: BotId;
  decoy?: boolean;
}

const TICKETS: TicketDef[] = [
  { text: "bot traffic spike, thousands of hits in 2 hours", bot: "cloudflare" },
  { text: "login page crashes on submit", bot: "leadeng" },
  { text: "proofread the copy on every page", bot: "article" },
  { text: "tests pass, but does it meet the success criteria?", bot: "cpo" },
  { text: "write up the problem, the user and what done looks like", bot: "cpo" },
  { text: "profile card is missing its badge", bot: "designer" },
  { text: "feature cards should sit in one neat row", bot: "designer" },
  { text: "database migration ready to apply", bot: "leadeng" },
  { text: "are we ready to launch?", bot: "cpo" },
  { text: "site is down, every page returns an error", bot: "cloudflare" },
  { text: "price the new plan", bot: "bizplan" },
  { text: "ad copy for the spring campaign", bot: "article" },
  { text: "site is slow under heavy traffic", bot: "cloudflare" },
  { text: "is this feature worth building?", bot: "cpo" },
  { text: "firewall flagged a spray of junk requests", bot: "cloudflare" },
  { text: "remove the heavy section dividers", bot: "designer" },
  { text: "fix broken signup button", bot: "leadeng" },
  { text: "worth paying for the bigger hosting plan yet?", bot: "bizplan" },
  { text: "schedule this week's social posts", bot: "article" },
  { text: "fix the failing nightly build", bot: "leadeng" },
  { text: "set up DNS for the new subdomain", bot: "cloudflare" },
  { text: "add a rate limit to the login page", bot: "cloudflare" },
  { text: "set cache headers on static files", bot: "cloudflare" },
  { text: "dependency update broke the tests", bot: "leadeng" },
  { text: "cleanup job deletes nothing, add a test", bot: "leadeng" },
  { text: "logo looks blurry", bot: "designer" },
  { text: "dark mode text is hard to read", bot: "designer" },
  { text: "should this feature ship before launch?", bot: "cpo" },
  { text: "write success criteria for the next feature", bot: "cpo" },
  { text: "is the cookie banner a launch blocker?", bot: "cpo" },
  { text: "how much should a team pay per month?", bot: "bizplan" },
  { text: "revenue forecast for next quarter", bot: "bizplan" },
  { text: "competitor scan of similar tools", bot: "bizplan" },
  { text: "write the launch blog post", bot: "article" },
  { text: "social thread about the launch", bot: "article" },
  { text: "newsletter for existing customers", bot: "article" },
  { text: "button looks off", bot: "designer", decoy: true },
  { text: "pages error out, fix the render code", bot: "leadeng", decoy: true },
  { text: "blog post about our new firewall rules", bot: "article", decoy: true },
  { text: "pricing page layout feels cramped", bot: "designer", decoy: true },
];

const TAGLINE = "The tickets won't route themselves. That's your job, Goose.";
const WRONG_LINES = ["That's not mine. Try reading the ticket.", "Wrong desk, Goose.", "I'll just leave this here for someone else.", "Bold choice. Wrong, but bold.", "Forwarding this back with a sigh."];
const OVER_LINES = ["The backlog won. It usually does.", "Tickets: lots. Shipped: not enough.", "Everyone's going home. Goose is staying late.", "That's a Monday problem now.", "Nothing shipped. Classic Friday."];
const EGG_LINES = ["I'll make a bot for that.", "Have you tried another bot?"];

interface Level {
  banner: string;
  name: string;
  sub: string;
  bots: number;
  spawn: number;
  fall: number;
  p1: number;
  decoys: boolean;
  burst: boolean;
  swap: boolean;
}

const LEVELS: Level[] = [
  { banner: "Level 1. Soft launch!", name: "Soft launch", sub: "4 inboxes. The stripe shows the bot.", bots: 4, spawn: 2.5, fall: 0.12, p1: 0, decoys: false, burst: false, swap: false },
  { banner: "Level 2. Doors open!", name: "Doors open", sub: "Bizplan and Article join. Watch for red P1s and decoys.", bots: 6, spawn: 1.6, fall: 0.15, p1: 0.15, decoys: true, burst: false, swap: false },
  { banner: "Level 3. Traffic surge!", name: "Traffic surge", sub: "Bursts every 30s, and the inboxes will swap.", bots: 6, spawn: 0.9, fall: 0.18, p1: 0.25, decoys: true, burst: true, swap: true },
];
const ROUTES_TO_CLEAR = 30;
const QUEUE_MAX = 10;
const OUTAGE_MAX = 3;

const C = {
  night: "#14121F",
  panel: "#1E1B2E",
  grid: "#2A2640",
  text: "#F5F3FF",
  text2: "#A39FBF",
  goose: "#FFF4D6",
  gooseShade: "#F1E2BA",
  beak: "#FF9F1C",
  ok: "#3DDC97",
  bad: "#FF4D6D",
  warn: "#FFC145",
  pink: "#F72585",
  ink: "#14121F",
  card: "#F5F3FF",
  cardId: "#6F6A90",
  overlay: "rgba(20,18,31,0.8)",
  shadow: "rgba(0,0,0,0.45)",
};
const FONT_H = '"Lilita One", "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif';
const FONT_UI = '"Space Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const FONT_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const BEST_KEY = "shipit-best-score";

interface Ticket {
  uid: number;
  num: number;
  text: string;
  bot: BotId;
  p1: boolean;
  pr: boolean;
  col: number;
  y: number;
  speed: number;
  phase: number;
}
interface Flyer {
  t: Ticket;
  x: number;
  y: number;
  tx: number;
  ty: number;
  age: number;
  dur: number;
  good: boolean;
  hint: boolean;
  wait: number;
}
interface Confetto {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
  w: number;
  h: number;
  age: number;
}
interface Popup {
  text: string;
  x: number;
  y: number;
  age: number;
  color: string;
  size: number;
}
interface Bubble {
  bot: BotId;
  text: string;
  age: number;
}
interface Toast {
  text: string;
  age: number;
  color: string;
}

interface Game {
  level: number;
  levelRoutes: number;
  levelMistakes: number;
  levelTime: number;
  time: number;
  score: number;
  streak: number;
  bestStreak: number;
  shipped: number;
  misrouted: number;
  dropped: number;
  queue: number;
  outages: number;
  tickets: Ticket[];
  held: Ticket | null;
  heldPerfect: boolean;
  gx: number;
  target: number | null;
  dir: number;
  walk: number;
  moving: boolean;
  spawnT: number;
  burstT: number;
  prT: number;
  swapAt: number;
  swapped: boolean;
  order: BotId[];
  autoUntil: number;
  autoCd: number;
  deck: TicketDef[];
  flyers: Flyer[];
  confetti: Confetto[];
  popups: Popup[];
  bubbles: Bubble[];
  toast: Toast | null;
  shake: number;
  qFlash: number;
  banner: number;
  bannerText: string;
  bannerSub: string;
  honk: number;
  bayFlash: number;
  bounce: Record<string, number>;
  nextUid: number;
  nextNum: number;
  over: boolean;
  overReason: string;
  cols: number;
}

interface Bay {
  x: number;
  y: number;
  w: number;
  h: number;
  pos: number;
}
interface Layout {
  W: number;
  H: number;
  mobile: boolean;
  hud: number;
  pad: number;
  bays: Bay[];
  cols: number;
  colW: number;
  topY: number;
  landY: number;
  railY: number;
  tw: number;
  th: number;
  qx: number;
  qy: number;
  qw: number;
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
function colsFor(n: number, mobile: boolean): number {
  return mobile ? Math.ceil(n / 2) : n;
}

function makeLayout(W: number, H: number, mobile: boolean, n: number): Layout {
  const pad = mobile ? 10 : 14;
  const hud = mobile ? 48 : 56;
  const gap = 8;
  const bays: Bay[] = [];
  const cols = colsFor(n, mobile);
  let baysTop: number;
  if (!mobile) {
    const bh = 96;
    const bw = (W - 2 * pad - (n - 1) * gap) / n;
    baysTop = H - pad - bh;
    for (let i = 0; i < n; i++) bays.push({ x: pad + i * (bw + gap), y: baysTop, w: bw, h: bh, pos: i });
  } else {
    const bh = 72;
    const bw = (W - 2 * pad - (cols - 1) * gap) / cols;
    baysTop = H - pad - 2 * bh - gap;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      bays.push({ x: pad + c * (bw + gap), y: baysTop + r * (bh + gap), w: bw, h: bh, pos: i });
    }
  }
  const railY = baysTop - 16;
  const colW = (W - 2 * pad) / cols;
  const th = 56;
  const tw = Math.min(120, colW - 10);
  const topY = hud + 4;
  const landY = railY - 50 - th / 2;
  const qw = mobile ? Math.min(110, W * 0.28) : 160;
  return { W, H, mobile, hud, pad, bays, cols, colW, topY, landY, railY, tw, th, qx: W - pad - 6 - qw, qy: mobile ? 30 : 34, qw };
}

function newGame(): Game {
  return {
    level: 0, levelRoutes: 0, levelMistakes: 0, levelTime: 0, time: 0,
    score: 0, streak: 0, bestStreak: 0, shipped: 0, misrouted: 0, dropped: 0,
    queue: 0, outages: 0, tickets: [], held: null, heldPerfect: false,
    gx: 0.5, target: null, dir: 1, walk: 0, moving: false,
    spawnT: 0.8, burstT: 20, prT: 40, swapAt: 12, swapped: false,
    order: BOT_ORDER.slice(0, LEVELS[0].bots), autoUntil: -1, autoCd: 0, deck: [],
    flyers: [], confetti: [], popups: [], bubbles: [], toast: null,
    shake: 0, qFlash: 0, banner: 0, bannerText: "", bannerSub: "", honk: 0, bayFlash: 0,
    bounce: {}, nextUid: 1, nextNum: 101, over: false, overReason: "", cols: 4,
  };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function ellipsize(ctx: CanvasRenderingContext2D, s: string, maxW: number): string {
  if (ctx.measureText(s).width <= maxW) return s;
  let t = s;
  while (t.length > 1 && ctx.measureText(t + "\u2026").width > maxW) t = t.slice(0, -1);
  return t.trimEnd() + "\u2026";
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width <= maxW || !cur) cur = test;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  const out = lines.slice(0, maxLines);
  if (lines.length > maxLines) out[maxLines - 1] = ellipsize(ctx, out[maxLines - 1] + "\u2026", maxW);
  return out.map((l: string) => ellipsize(ctx, l, maxW));
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

function drawGoose(ctx: CanvasRenderingContext2D, x: number, footY: number, s: number, dir: number, walk: number, moving: boolean): void {
  ctx.save();
  ctx.translate(x, footY);
  ctx.scale(s * dir, s);
  const step = moving ? Math.sin(walk) : 0;
  const bob = moving ? Math.abs(Math.sin(walk)) * 1.5 : 0;
  // legs and feet
  ctx.strokeStyle = C.beak;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(-4 + step * 3, -2);
  ctx.moveTo(5, -10);
  ctx.lineTo(5 - step * 3, -2);
  ctx.stroke();
  ctx.fillStyle = C.beak;
  ctx.beginPath();
  ctx.ellipse(-2 + step * 3, -1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(7 - step * 3, -1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(0, -bob);
  // tail
  ctx.fillStyle = C.goose;
  ctx.beginPath();
  ctx.moveTo(-15, -22);
  ctx.lineTo(-26, -29);
  ctx.lineTo(-20, -16);
  ctx.closePath();
  ctx.fill();
  // body
  ctx.beginPath();
  ctx.ellipse(0, -20, 19, 12, -0.08, 0, Math.PI * 2);
  ctx.fill();
  // wing
  ctx.fillStyle = C.gooseShade;
  ctx.beginPath();
  ctx.ellipse(-3, -21, 11, 6.5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  // neck
  ctx.fillStyle = C.goose;
  rr(ctx, 7, -46, 9, 26, 4.5);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(13, -46, 8, 0, Math.PI * 2);
  ctx.fill();
  // beak
  ctx.fillStyle = C.beak;
  ctx.beginPath();
  ctx.moveTo(19, -49);
  ctx.quadraticCurveTo(29, -46, 28, -44);
  ctx.lineTo(19, -42);
  ctx.closePath();
  ctx.fill();
  // eye
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(15, -48, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTicket(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, t: Ticket,
  o: { rot: number; sx: number; sy: number; flash: number; hint: boolean; alpha: number; time: number },
): void {
  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.translate(cx, cy);
  ctx.rotate(o.rot);
  ctx.scale(o.sx, o.sy);
  const x = -w / 2;
  const y = -h / 2;
  // sticker shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  rr(ctx, x, y + 4, w, h, 10);
  ctx.fill();
  if (t.p1) {
    ctx.shadowColor = C.bad;
    ctx.shadowBlur = 14 + 8 * Math.sin(o.time * 8);
  }
  ctx.fillStyle = o.flash > 0 ? C.bad : C.card;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (t.p1) {
    ctx.strokeStyle = C.bad;
    ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 10);
    ctx.stroke();
  }
  // stripe
  ctx.save();
  rr(ctx, x, y, w, h, 10);
  ctx.clip();
  ctx.fillStyle = o.hint ? BOTS[t.bot].hue : C.text2;
  ctx.fillRect(x, y, 6, h);
  ctx.restore();
  // top line
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  let ix = x + 12;
  if (o.hint) {
    ctx.font = "12px " + FONT_EMOJI;
    ctx.fillText(BOTS[t.bot].emoji, ix, y + 15);
    ix += 17;
  }
  ctx.fillStyle = o.flash > 0 ? C.ink : C.cardId;
  ctx.font = "500 11px " + FONT_UI;
  ctx.fillText("#" + t.num, ix, y + 15);
  if (t.p1) {
    ctx.fillStyle = o.flash > 0 ? C.ink : "#C9183B";
    ctx.font = "700 11px " + FONT_UI;
    ctx.textAlign = "right";
    ctx.fillText("P1", x + w - 8, y + 15);
    ctx.textAlign = "left";
  }
  ctx.fillStyle = C.ink;
  ctx.font = "700 12px " + FONT_UI;
  const lines = wrapLines(ctx, t.text, w - 20, 2);
  lines.forEach((l: string, i: number) => ctx.fillText(l, x + 12, y + 31 + i * 14));
  ctx.restore();
}

function drawPR(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(time * 5) * 0.08);
  ctx.shadowColor = C.ok;
  ctx.shadowBlur = 18 + 6 * Math.sin(time * 6);
  ctx.fillStyle = C.ok;
  rr(ctx, -36, -24, 72, 48, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.ink;
  ctx.font = "22px " + FONT_H;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PR \u2713", 0, -3);
  ctx.font = "700 9px " + FONT_UI;
  ctx.fillText("GREEN", 0, 15);
  ctx.restore();
}

function loadBest(mem: { v: number }): number {
  try {
    const v = window.localStorage.getItem(BEST_KEY);
    const n = v ? parseInt(v, 10) : 0;
    return Math.max(mem.v, isNaN(n) ? 0 : n);
  } catch (_e) {
    return mem.v;
  }
}
function saveBest(mem: { v: number }, v: number): void {
  mem.v = Math.max(mem.v, v);
  try {
    window.localStorage.setItem(BEST_KEY, String(mem.v));
  } catch (_e) {
    // storage unavailable, memory fallback only
  }
}

interface Summary {
  score: number;
  best: number;
  shipped: number;
  misrouted: number;
  bestStreak: number;
  line: string;
  reason: string;
  newBest: boolean;
}

const DARK = {
  text: { tertiary: C.text2 },
  font: { family: FONT_UI },
};

const CSS = `
.shipit-btn:focus-visible { outline: 3px solid ${C.warn}; outline-offset: 3px; }
.shipit-btn { cursor: pointer; }
@keyframes shipitBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes shipitFade { from { opacity: 0; } to { opacity: 1; } }
.shipit-bob { animation: shipitBob 1.4s ease-in-out infinite; }
.shipit-card { animation: shipitFade 0.25s ease-out; }
@media (prefers-reduced-motion: reduce) { .shipit-bob { animation: none; } }
`;

function GooseBadge() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = 96 * dpr;
    cv.height = 80 * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGoose(ctx, 44, 74, 1.25, 1, 0, false);
  }, []);
  return <canvas ref={ref} className="shipit-bob" style={{ width: 96, height: 80, display: "block", margin: "0 auto 8px" }} aria-hidden="true" />;
}

export default function ShipIt() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game>(newGame());
  const screenRef = useRef<Screen>("start");
  const memBest = useRef<{ v: number }>({ v: 0 });
  const dragRef = useRef<boolean>(false);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const reducedRef = useRef<boolean>(false);
  const [screen, setScreen] = useState<Screen>("start");
  const [best, setBest] = useState<number>(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const initialW = typeof window !== "undefined" ? Math.max(320, Math.min(960, window.innerWidth - 16)) : 960;
  const [width, setWidth] = useState<number>(initialW);
  const dimsRef = useRef<{ W: number; H: number; mobile: boolean }>({ W: 0, H: 0, mobile: false });
  const endRef = useRef<(won: boolean) => void>(() => undefined);
  const pointerApi = useRef<{ down: (x: number, y: number) => void; move: (x: number) => void; up: () => void } | null>(null);
  const timersRef = useRef<number[]>([]);
  const overlayAtRef = useRef<number>(0);

  const mobile = width < 900;
  const W = mobile ? Math.floor(width) : Math.min(960, Math.floor(width));
  const H = mobile ? Math.round(Math.min(Math.max(560, W * 1.7), 820)) : Math.round(W * 10 / 16);
  dimsRef.current = { W, H, mobile };

  const startGame = (): void => {
    if (screenRef.current === "playing") return;
    if (screenRef.current !== "start" && performance.now() - overlayAtRef.current < 700) return;
    timersRef.current.forEach((id: number) => window.clearTimeout(id));
    timersRef.current = [];
    keysRef.current = { left: false, right: false };
    dragRef.current = false;
    const g = newGame();
    g.cols = colsFor(LEVELS[0].bots, dimsRef.current.mobile);
    g.banner = 1.6;
    g.bannerText = LEVELS[0].banner;
    g.bannerSub = LEVELS[0].sub;
    gameRef.current = g;
    screenRef.current = "playing";
    setScreen("playing");
    setSummary(null);
    const cv = canvasRef.current;
    if (cv) cv.focus({ preventScroll: true });
  };
  const backToStart = (): void => {
    gameRef.current = newGame();
    screenRef.current = "start";
    setScreen("start");
  };
  const startRef = useRef<() => void>(startGame);
  startRef.current = startGame;

  endRef.current = (won: boolean): void => {
    if (screenRef.current !== "playing") return;
    overlayAtRef.current = performance.now();
    const g = gameRef.current;
    const prev = loadBest(memBest.current);
    saveBest(memBest.current, g.score);
    const b = Math.max(prev, g.score);
    setBest(b);
    setSummary({
      score: g.score, best: b, shipped: g.shipped, misrouted: g.misrouted, bestStreak: g.bestStreak,
      line: won ? "All 3 levels shipped. Somebody tell the boss." : pick(OVER_LINES),
      reason: g.overReason, newBest: g.score > prev && g.score > 0,
    });
    screenRef.current = won ? "win" : "over";
    setScreen(won ? "win" : "over");
  };

  // Fonts load from index.html. Best score and reduced motion stay here.
  useEffect(() => {
    setBest(loadBest(memBest.current));
    const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    reducedRef.current = !!(mq && mq.matches);
    const onMq = (): void => { reducedRef.current = !!(mq && mq.matches); };
    if (mq && mq.addEventListener) mq.addEventListener("change", onMq);
    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener("change", onMq);
      timersRef.current.forEach((id: number) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // measure
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = (): void => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // game loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let prevLay: { g: Game; top: number; land: number } | null = null;
    const scheduleEnd = (g: Game, won: boolean, ms: number): void => {
      const id = window.setTimeout(() => { if (gameRef.current === g) endRef.current(won); }, ms);
      timersRef.current.push(id);
    };

    const lay = (g: Game): Layout => {
      const d = dimsRef.current;
      return makeLayout(d.W, d.H, d.mobile, g.order.length);
    };
    const bayCenter = (L: Layout, pos: number): { x: number; y: number } => {
      const b = L.bays[pos];
      return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    };
    const colX = (L: Layout, col: number): number => L.pad + (col + 0.5) * L.colW;
    const gooseX = (L: Layout, g: Game): number => L.pad + g.gx * (L.W - 2 * L.pad);
    const gooseCol = (L: Layout, g: Game): number => Math.max(0, Math.min(L.cols - 1, Math.floor(g.gx * L.cols)));
    const heldPos = (L: Layout, g: Game): { x: number; y: number } => ({ x: gooseX(L, g), y: L.landY });

    const toast = (g: Game, text: string, color: string): void => {
      g.toast = { text, age: 0, color };
    };
    const shakeIt = (g: Game): void => {
      if (!reducedRef.current) g.shake = 0.25;
      g.qFlash = 0.45;
    };
    const checkOver = (g: Game): void => {
      if (g.over) return;
      if (g.queue >= QUEUE_MAX) {
        g.queue = QUEUE_MAX;
        g.over = true;
        g.overReason = "Queue overflowed at " + QUEUE_MAX + " tickets.";
      } else if (g.outages >= OUTAGE_MAX) {
        g.over = true;
        g.overReason = OUTAGE_MAX + " outages. Prod is having a day.";
      }
      if (g.over) scheduleEnd(g, false, 650);
    };
    const confettiBurst = (g: Game, L: Layout): void => {
      if (reducedRef.current) return;
      const colors = BOT_ORDER.map((b: BotId) => BOTS[b].hue);
      for (let i = 0; i < 80; i++) {
        g.confetti.push({ x: L.W / 2, y: L.hud, vx: rand(-320, 320), vy: rand(-380, -60), rot: rand(0, 6.28), vr: rand(-10, 10), color: pick(colors), w: rand(5, 9), h: rand(8, 14), age: 0 });
      }
    };

    const levelUp = (g: Game, L: Layout): void => {
      if (g.levelMistakes === 0) g.honk = 2.2;
      if (g.level >= LEVELS.length - 1) {
        g.over = true;
        g.overReason = "Shift complete.";
        confettiBurst(g, L);
        scheduleEnd(g, true, 900);
        return;
      }
      const oldCols = L.cols;
      g.level += 1;
      const lv = LEVELS[g.level];
      g.levelRoutes = 0;
      g.levelMistakes = 0;
      g.levelTime = 0;
      g.order = BOT_ORDER.slice(0, lv.bots);
      g.deck = [];
      const newCols = colsFor(lv.bots, dimsRef.current.mobile);
      g.tickets.forEach((t: Ticket) => {
        t.col = Math.min(newCols - 1, Math.floor(((t.col + 0.5) / oldCols) * newCols));
      });
      g.cols = newCols;
      g.banner = 1.6;
      g.bannerText = lv.banner;
      g.bannerSub = lv.sub;
      g.spawnT = 0.5;
      if (lv.burst) g.burstT = 20;
      if (lv.swap) {
        g.swapAt = rand(8, 16);
        g.swapped = false;
      }
      confettiBurst(g, L);
    };

    const route = (g: Game, L: Layout, t: Ticket, pos: number, from: { x: number; y: number }, perfect: boolean): void => {
      if (pos < 0 || pos >= g.order.length) return;
      const bot = g.order[pos];
      const c = bayCenter(L, pos);
      const hint = g.level === 0;
      if (bot === t.bot) {
        const mult = Math.min(4, 1 + Math.floor(g.streak / 5));
        const pts = ((t.p1 ? 200 : 100) + (perfect ? 50 : 0)) * mult;
        g.score += pts;
        g.streak += 1;
        g.bestStreak = Math.max(g.bestStreak, g.streak);
        g.shipped += 1;
        g.levelRoutes += 1;
        g.flyers.push({ t, x: from.x, y: from.y, tx: c.x, ty: c.y, age: 0, dur: 0.38, good: true, hint, wait: 0 });
        g.bubbles = g.bubbles.filter((b: Bubble) => b.bot !== bot);
        g.bubbles.push({ bot, text: pick(BOTS[bot].lines), age: 0 });
        g.popups.push({ text: "+" + pts + (perfect ? " perfect" : ""), x: c.x, y: L.bays[pos].y - 4, age: 0, color: perfect ? C.warn : C.ok, size: 16 });
        if (g.streak % 5 === 0) {
          const nm = Math.min(4, 1 + Math.floor(g.streak / 5));
          g.popups.push({ text: "+streak x" + nm, x: c.x, y: L.bays[pos].y - 30, age: 0, color: BOTS[bot].ink, size: 24 });
          g.bounce[bot] = 0.35;
        }
        if (g.levelRoutes >= ROUTES_TO_CLEAR) levelUp(g, L);
      } else {
        g.score = Math.max(0, g.score - 50);
        g.streak = 0;
        g.misrouted += 1;
        g.levelMistakes += 1;
        g.queue += 1;
        if (t.p1) g.outages += 1;
        g.flyers.push({ t, x: c.x, y: L.bays[pos].y - 10, tx: L.qx + L.qw / 2, ty: L.qy, age: 0, dur: 0.75, good: false, hint, wait: 0 });
        toast(g, BOTS[bot].name + ": " + pick(WRONG_LINES) + (t.p1 ? " P1 outage +1." : ""), C.bad);
        g.popups.push({ text: "-50", x: c.x, y: L.bays[pos].y - 4, age: 0, color: C.bad, size: 18 });
        shakeIt(g);
        checkOver(g);
      }
    };

    const routeHeld = (pos: number): void => {
      const g = gameRef.current;
      if (screenRef.current !== "playing" || g.over || g.banner > 0 || !g.held) return;
      const L = lay(g);
      if (pos >= g.order.length) return;
      const t = g.held;
      g.held = null;
      route(g, L, t, pos, heldPos(L, g), g.heldPerfect);
    };
    const spaceBay = (L: Layout, g: Game): number => gooseCol(L, g);

    const spawn = (g: Game, L: Layout, offset: number): void => {
      const lv = LEVELS[g.level];
      if (g.deck.length === 0) {
        const active = g.order;
        g.deck = shuffle(TICKETS.filter((d: TicketDef) => active.indexOf(d.bot) >= 0 && (lv.decoys || !d.decoy)));
      }
      const def = g.deck.pop();
      if (!def) return;
      const free: number[] = [];
      for (let c = 0; c < L.cols; c++) {
        const busy = g.tickets.some((t: Ticket) => t.col === c && t.y < L.topY + L.th * 1.3 - offset);
        if (!busy) free.push(c);
      }
      const col = free.length ? pick(free) : Math.floor(Math.random() * L.cols);
      const p1 = Math.random() < lv.p1;
      const playH = L.landY - L.topY;
      g.tickets.push({ uid: g.nextUid++, num: g.nextNum++, text: def.text, bot: def.bot, p1, pr: false, col, y: L.topY - L.th / 2 - offset, speed: lv.fall * playH * (p1 ? 1.5 : 1), phase: rand(0, 6.28) });
    };
    const spawnPR = (g: Game, L: Layout): void => {
      const lv = LEVELS[g.level];
      const playH = L.landY - L.topY;
      g.tickets.push({ uid: g.nextUid++, num: 0, text: "Green PR", bot: "leadeng", p1: false, pr: true, col: Math.floor(Math.random() * L.cols), y: L.topY - 24, speed: lv.fall * playH * 1.1, phase: 0 });
    };

    const update = (g: Game, L: Layout, dt: number): void => {
      // cosmetics always tick
      g.flyers.forEach((f: Flyer) => { f.age += dt; });
      g.flyers = g.flyers.filter((f: Flyer) => f.age < f.dur);
      g.confetti.forEach((p: Confetto) => {
        p.age += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      });
      g.confetti = g.confetti.filter((p: Confetto) => p.age < 1.5);
      g.popups.forEach((p: Popup) => { p.age += dt; p.y -= 34 * dt; });
      g.popups = g.popups.filter((p: Popup) => p.age < 1.1);
      g.bubbles.forEach((b: Bubble) => { b.age += dt; });
      g.bubbles = g.bubbles.filter((b: Bubble) => b.age < 2.2);
      if (g.toast) { g.toast.age += dt; if (g.toast.age > 2.4) g.toast = null; }
      g.shake = Math.max(0, g.shake - dt);
      g.qFlash = Math.max(0, g.qFlash - dt);
      g.honk = Math.max(0, g.honk - dt);
      g.bayFlash = Math.max(0, g.bayFlash - dt);
      Object.keys(g.bounce).forEach((k: string) => { g.bounce[k] = Math.max(0, g.bounce[k] - dt); });

      if (screenRef.current !== "playing" || g.over) return;
      if (g.banner > 0) { g.banner -= dt; return; }

      g.time += dt;
      g.levelTime += dt;
      const lv = LEVELS[g.level];

      // move goose
      const keys = keysRef.current;
      const kd = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      const before = g.gx;
      if (kd !== 0) {
        g.target = null;
        g.gx += kd * 1.15 * dt;
      } else if (g.target !== null) {
        g.gx += (g.target - g.gx) * Math.min(1, dt * 16);
        if (Math.abs(g.target - g.gx) < 0.002 && !dragRef.current) g.target = null;
      }
      g.gx = Math.max(0.02, Math.min(0.98, g.gx));
      const dx = g.gx - before;
      g.moving = Math.abs(dx) > 0.0004;
      if (g.moving) { g.dir = dx > 0 ? 1 : -1; g.walk += dt * 16; }

      // spawning
      g.spawnT -= dt;
      if (g.spawnT <= 0) { spawn(g, L, 0); g.spawnT += lv.spawn; }
      if (lv.burst) {
        g.burstT -= dt;
        if (g.burstT <= 0) {
          for (let i = 0; i < 5; i++) spawn(g, L, i * 64);
          toast(g, "Traffic surge! 5 tickets incoming.", C.warn);
          g.burstT += 30;
        }
      }
      if (lv.swap && !g.swapped && g.levelTime >= g.swapAt) {
        let next = shuffle(g.order);
        let tries = 0;
        while (next.filter((b: BotId, i: number) => b === g.order[i]).length > 2 && tries < 20) { next = shuffle(g.order); tries++; }
        g.order = next;
        g.swapped = true;
        g.bayFlash = 1;
        toast(g, "Inboxes swapped. Watch the labels.", C.warn);
      }
      g.prT -= dt;
      if (g.prT <= 0) { spawnPR(g, L); g.prT = rand(40, 50); }

      // fall
      g.tickets.forEach((t: Ticket) => { t.y += t.speed * dt; });

      // catch
      const gc = gooseCol(L, g);
      const inCol = g.tickets.filter((t: Ticket) => t.col === gc && t.y >= L.topY);
      const pr = inCol.find((t: Ticket) => t.pr);
      if (pr) {
        g.tickets = g.tickets.filter((t: Ticket) => t !== pr);
        g.autoUntil = g.time + 5;
        g.autoCd = 0;
        const drained = Math.min(3, g.queue);
        g.queue = Math.max(0, g.queue - 3);
        toast(g, "Dr Eggbot: " + pick(EGG_LINES) + " Green PR auto-routing for 5s." + (drained ? " Queue -" + drained + "." : ""), C.ok);
        g.popups.push({ text: "GREEN PR!", x: gooseX(L, g), y: L.railY - 70, age: 0, color: C.ok, size: 22 });
      }
      if (!g.held) {
        const cands = g.tickets.filter((t: Ticket) => t.col === gc && t.y >= L.topY && !t.pr);
        if (cands.length) {
          const t = cands.reduce((a: Ticket, b: Ticket) => (b.y > a.y ? b : a));
          g.tickets = g.tickets.filter((x: Ticket) => x !== t);
          g.held = t;
          g.heldPerfect = t.y < L.topY + (L.landY - L.topY) / 3;
          if (g.heldPerfect) g.popups.push({ text: "perfect catch", x: gooseX(L, g), y: L.landY - 40, age: 0, color: C.warn, size: 14 });
        }
      }

      // green pr auto routing
      if (g.time < g.autoUntil) {
        g.autoCd -= dt;
        if (g.autoCd <= 0) {
          if (g.held) {
            const t = g.held;
            g.held = null;
            route(g, L, t, g.order.indexOf(t.bot), heldPos(L, g), g.heldPerfect);
          } else {
            const vis = g.tickets.filter((t: Ticket) => !t.pr && t.y >= L.topY - L.th / 2);
            if (vis.length) {
              const t = vis.reduce((a: Ticket, b: Ticket) => (b.y > a.y ? b : a));
              g.tickets = g.tickets.filter((x: Ticket) => x !== t);
              route(g, L, t, g.order.indexOf(t.bot), { x: colX(L, t.col), y: t.y }, false);
            }
          }
          g.autoCd = 0.12;
        }
      }
      if (g.over) return;

      // drops
      const landed = g.tickets.filter((t: Ticket) => t.y >= L.landY);
      if (landed.length) {
        g.tickets = g.tickets.filter((t: Ticket) => t.y < L.landY);
        landed.forEach((t: Ticket) => {
          if (t.pr) return;
          g.queue += 1;
          g.dropped += 1;
          g.levelMistakes += 1;
          g.flyers.push({ t, x: colX(L, t.col), y: t.y, tx: L.qx + L.qw / 2, ty: L.qy, age: 0, dur: 0.75, good: false, hint: g.level === 0, wait: 0 });
          g.popups.push({ text: "+1 queue", x: colX(L, t.col), y: t.y - 20, age: 0, color: C.bad, size: 15 });
        });
        if (landed.some((t: Ticket) => !t.pr)) { shakeIt(g); checkOver(g); }
      }
    };

    const draw = (ctx: CanvasRenderingContext2D, g: Game, L: Layout): void => {
      const { W, H } = L;
      const tm = performance.now() / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (g.shake > 0) {
        const k = Math.pow(g.shake / 0.25, 2) * 6;
        ctx.translate(rand(-k, k), rand(-k, k));
      }
      // board
      ctx.fillStyle = C.night;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.fillStyle = C.panel;
      rr(ctx, 0, 0, W, H, 24);
      ctx.fill();
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 40; x < W; x += 40) { ctx.moveTo(x + 0.5, L.hud); ctx.lineTo(x + 0.5, H); }
      for (let y = L.hud + 40; y < H; y += 40) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
      ctx.stroke();
      // column guides
      ctx.fillStyle = "rgba(42,38,64,0.35)";
      for (let c = 0; c < L.cols; c += 2) ctx.fillRect(L.pad + c * L.colW, L.hud, L.colW, L.railY - L.hud);

      // HUD
      ctx.fillStyle = C.night;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(0, 0, W, L.hud);
      ctx.globalAlpha = 1;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = (L.mobile ? 24 : 28) + "px " + FONT_H;
      const scoreStr = g.score.toLocaleString("en-GB");
      ctx.fillText(scoreStr, L.pad + 6, L.hud / 2 + 1);
      const sw = ctx.measureText(scoreStr).width;
      const mult = Math.min(4, 1 + Math.floor(g.streak / 5));
      ctx.font = "700 " + (L.mobile ? 12 : 14) + "px " + FONT_UI;
      ctx.fillStyle = mult > 1 ? C.warn : C.text2;
      ctx.fillText("x" + mult, L.pad + 12 + sw, L.hud / 2 + 2);
      // level centre
      ctx.textAlign = "center";
      ctx.fillStyle = C.text;
      ctx.font = "700 " + (L.mobile ? 12 : 14) + "px " + FONT_UI;
      const lv = LEVELS[g.level];
      ctx.fillText(L.mobile ? "Level " + (g.level + 1) : "Level " + (g.level + 1) + ". " + lv.name, W / 2, L.hud / 2 - 8);
      ctx.fillStyle = C.text2;
      ctx.font = "500 " + (L.mobile ? 11 : 12) + "px " + FONT_UI;
      let sub = g.levelRoutes + "/" + ROUTES_TO_CLEAR + " shipped";
      if (g.time < g.autoUntil) sub = "Green PR " + Math.ceil(g.autoUntil - g.time) + "s";
      ctx.fillText(sub, W / 2, L.hud / 2 + 9);
      // queue meter
      const frac = g.queue / QUEUE_MAX;
      const qcol = frac >= 0.8 ? C.bad : frac >= 0.5 ? C.warn : C.ok;
      ctx.textAlign = "left";
      ctx.font = "700 11px " + FONT_UI;
      ctx.fillStyle = g.qFlash > 0 ? C.bad : C.text2;
      ctx.fillText("QUEUE " + g.queue + "/" + QUEUE_MAX, L.qx, L.qy - 14);
      // outages
      ctx.textAlign = "right";
      for (let i = 0; i < OUTAGE_MAX; i++) {
        const ox = L.qx + L.qw - i * 13 - 5;
        ctx.beginPath();
        ctx.arc(ox, L.qy - 14, 4.5, 0, Math.PI * 2);
        if (OUTAGE_MAX - 1 - i < g.outages) { ctx.fillStyle = C.bad; ctx.fill(); } else { ctx.strokeStyle = C.text2; ctx.lineWidth = 1.5; ctx.stroke(); }
      }
      if (!L.mobile) {
        ctx.font = "700 11px " + FONT_UI;
        ctx.fillStyle = g.outages > 0 ? C.bad : C.text2;
        ctx.fillText("OUTAGES", L.qx + L.qw - 3 * 13 - 4, L.qy - 14);
      }
      const pulse = frac > 0.8 ? 0.6 + 0.4 * Math.abs(Math.sin(tm * 6)) : 1;
      ctx.fillStyle = C.grid;
      rr(ctx, L.qx, L.qy - 6, L.qw, 12, 6);
      ctx.fill();
      if (g.queue > 0) {
        ctx.globalAlpha = pulse;
        ctx.fillStyle = qcol;
        rr(ctx, L.qx, L.qy - 6, Math.max(12, L.qw * frac), 12, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (g.qFlash > 0) {
        ctx.strokeStyle = C.bad;
        ctx.lineWidth = 2;
        rr(ctx, L.qx - 2, L.qy - 8, L.qw + 4, 16, 8);
        ctx.stroke();
      }

      // bays
      const gc = gooseCol(L, g);
      const hoverPos = g.held ? spaceBay(L, g) : -1;
      L.bays.forEach((b: Bay, i: number) => {
        const bot = BOTS[g.order[i]];
        ctx.save();
        if (i === hoverPos) { ctx.shadowColor = bot.hue; ctx.shadowBlur = 24; }
        ctx.fillStyle = C.panel;
        rr(ctx, b.x, b.y, b.w, b.h, 14);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = i === hoverPos ? bot.hue : C.grid;
        ctx.lineWidth = 1;
        rr(ctx, b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, 14);
        ctx.stroke();
        ctx.save();
        rr(ctx, b.x, b.y, b.w, b.h, 14);
        ctx.clip();
        ctx.fillStyle = bot.hue;
        ctx.fillRect(b.x, b.y, b.w, 3);
        if (g.bayFlash > 0) {
          ctx.globalAlpha = 0.35 * Math.abs(Math.sin(g.bayFlash * 10));
          ctx.fillStyle = C.warn;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        const cx = b.x + b.w / 2;
        const r = L.mobile ? 17 : 22;
        const cy = b.y + (L.mobile ? 8 : 12) + r;
        const bs = 1 + (g.bounce[bot.id] || 0) / 0.35 * 0.3;
        ctx.fillStyle = hexA(bot.hue, 0.2);
        ctx.beginPath();
        ctx.arc(cx, cy, r * bs, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = Math.round((L.mobile ? 18 : 22) * bs) + "px " + FONT_EMOJI;
        ctx.fillText(bot.emoji, cx, cy + 1);
        ctx.font = "700 12px " + FONT_UI;
        const sp = "0.08em";
        const ctxAny = ctx as unknown as { letterSpacing?: string };
        if ("letterSpacing" in ctx) ctxAny.letterSpacing = sp;
        let label = bot.name.toUpperCase();
        if (ctx.measureText(label).width > b.w - 26) label = bot.short.toUpperCase();
        ctx.fillStyle = C.text;
        ctx.fillText(label, cx, b.y + b.h - (L.mobile ? 13 : 18));
        if ("letterSpacing" in ctx) ctxAny.letterSpacing = "0px";
        // key number
        ctx.font = "700 11px " + FONT_UI;
        ctx.fillStyle = C.text2;
        ctx.textAlign = "left";
        ctx.fillText(String(i + 1), b.x + 9, b.y + 14);
      });

      // falling tickets (clip below HUD)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, L.hud, W, H - L.hud);
      ctx.clip();
      // perfect zone hint
      const third = L.topY + (L.landY - L.topY) / 3;
      ctx.strokeStyle = hexA(C.warn, 0.18);
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(L.pad, third);
      ctx.lineTo(W - L.pad, third);
      ctx.stroke();
      ctx.setLineDash([]);
      g.tickets.forEach((t: Ticket) => {
        const x = colX(L, t.col);
        if (t.pr) { drawPR(ctx, x, t.y, tm); return; }
        drawTicket(ctx, x, t.y, L.tw, L.th, t, { rot: reducedRef.current ? 0 : (Math.sin(tm * 2.2 + t.phase) * 4 * Math.PI) / 180, sx: 1, sy: 1, flash: 0, hint: g.level === 0, alpha: 1, time: tm });
      });
      ctx.restore();

      // rail and goose
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(L.pad + 4, L.railY + 2);
      ctx.lineTo(W - L.pad - 4, L.railY + 2);
      ctx.stroke();
      const gxp = gooseX(L, g);
      // column marker
      ctx.fillStyle = hexA(C.warn, 0.08);
      ctx.fillRect(L.pad + gc * L.colW, L.hud, L.colW, L.railY - L.hud);
      drawGoose(ctx, gxp, L.railY, L.mobile ? 0.95 : 1.05, g.dir, g.walk, g.moving);
      if (g.held) {
        drawTicket(ctx, gxp, L.landY, L.tw, L.th, g.held, { rot: 0, sx: 1.05, sy: 1.05, flash: 0, hint: g.level === 0, alpha: 1, time: tm });
      }
      if (g.time < g.autoUntil) {
        ctx.strokeStyle = hexA(C.ok, 0.6 + 0.4 * Math.sin(tm * 10));
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gxp, L.railY - 24, 34, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (g.honk > 0) {
        ctx.font = "20px " + FONT_H;
        ctx.textAlign = "center";
        ctx.fillStyle = C.warn;
        ctx.fillText("HONK! \u{1F4E2}", gxp, L.landY - 46 - (2.2 - g.honk) * 10);
      }

      // flyers
      g.flyers.forEach((f: Flyer) => {
        const p = Math.min(1, f.age / f.dur);
        if (f.good) {
          const sq = p < 0.25;
          const mp = sq ? 0 : (p - 0.25) / 0.75;
          const e = mp * mp;
          const x = f.x + (f.tx - f.x) * e;
          const y = f.y + (f.ty - f.y) * e;
          const s = sq ? 1 : 1 - 0.6 * e;
          drawTicket(ctx, x, y, L.tw, L.th, f.t, { rot: 0, sx: sq ? 1.2 : s, sy: sq ? 0.8 : s, flash: 0, hint: f.hint, alpha: 1 - 0.6 * e, time: tm });
        } else {
          const shakeP = 0.45;
          if (p < shakeP) {
            const k = reducedRef.current ? 0 : Math.sin(p * 60) * 5;
            drawTicket(ctx, f.x + k, f.y, L.tw, L.th, f.t, { rot: 0, sx: 1, sy: 1, flash: Math.sin(p * 40) > 0 ? 1 : 0, hint: f.hint, alpha: 1, time: tm });
          } else {
            const e = (p - shakeP) / (1 - shakeP);
            const x = f.x + (f.tx - f.x) * e;
            const y = f.y + (f.ty - f.y) * e;
            drawTicket(ctx, x, y, L.tw, L.th, f.t, { rot: e * 0.6, sx: 1 - 0.8 * e, sy: 1 - 0.8 * e, flash: 1, hint: f.hint, alpha: 1 - 0.5 * e, time: tm });
          }
        }
      });

      // speech bubbles
      g.bubbles.forEach((bb: Bubble) => {
        const pos = g.order.indexOf(bb.bot);
        if (pos < 0) return;
        const b = L.bays[pos];
        const a = bb.age < 0.15 ? bb.age / 0.15 : bb.age > 1.9 ? Math.max(0, (2.2 - bb.age) / 0.3) : 1;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = "700 12px " + FONT_UI;
        const maxW = Math.min(200, Math.max(120, b.w + 30));
        const lines = wrapLines(ctx, bb.text, maxW - 20, 3);
        const lw = Math.max(...lines.map((l: string) => ctx.measureText(l).width)) + 20;
        const bh = lines.length * 15 + 26;
        const cx = b.x + b.w / 2;
        let bx = cx - lw / 2;
        bx = Math.max(6, Math.min(W - 6 - lw, bx));
        const by = b.y - 12 - bh - (1 - a) * 6;
        ctx.fillStyle = C.card;
        rr(ctx, bx, by, lw, bh, 12);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 7, by + bh - 1);
        ctx.lineTo(cx + 7, by + bh - 1);
        ctx.lineTo(cx, by + bh + 8);
        ctx.closePath();
        ctx.fill();
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = "700 10px " + FONT_UI;
        ctx.fillStyle = bb.bot === "cpo" ? "#7209B7" : bb.bot === "designer" ? "#C01468" : "#4A4566";
        ctx.fillText(BOTS[bb.bot].name.toUpperCase(), bx + 10, by + 15);
        ctx.font = "700 12px " + FONT_UI;
        ctx.fillStyle = C.ink;
        lines.forEach((l: string, i: number) => ctx.fillText(l, bx + 10, by + 31 + i * 15));
        ctx.restore();
      });

      // popups
      g.popups.forEach((p: Popup) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.age / 1.1);
        ctx.font = p.size + "px " + FONT_H;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillText(p.text, p.x, p.y + 2);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });

      // held caption
      if (g.held) {
        ctx.font = "700 13px " + FONT_UI;
        const label = "Holding #" + g.held.num + (g.held.p1 ? " P1" : "") + ": " + g.held.text;
        const capW = Math.min(W - 24, ctx.measureText(label).width + 28);
        const cx = W / 2;
        const cy = L.hud + 16;
        ctx.fillStyle = hexA(C.night, 0.92);
        rr(ctx, cx - capW / 2, cy - 13, capW, 26, 13);
        ctx.fill();
        ctx.strokeStyle = g.held.p1 ? C.bad : C.grid;
        ctx.lineWidth = 1;
        rr(ctx, cx - capW / 2, cy - 13, capW, 26, 13);
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ellipsize(ctx, label, capW - 24), cx, cy + 1);
      }

      // toast
      if (g.toast) {
        const tt = g.toast;
        const a = tt.age < 0.15 ? tt.age / 0.15 : tt.age > 2.0 ? Math.max(0, (2.4 - tt.age) / 0.4) : 1;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = "700 13px " + FONT_UI;
        const maxW = Math.min(W - 32, 460);
        const lines = wrapLines(ctx, tt.text, maxW - 36, 3);
        const lw = Math.max(...lines.map((l: string) => ctx.measureText(l).width)) + 36;
        const th = lines.length * 17 + 18;
        const tx = W / 2 - lw / 2;
        const ty = L.hud + 40;
        ctx.fillStyle = C.grid;
        rr(ctx, tx, ty, lw, th, 14);
        ctx.fill();
        ctx.fillStyle = tt.color;
        rr(ctx, tx, ty, 6, th, 3);
        ctx.fill();
        ctx.fillStyle = C.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        lines.forEach((l: string, i: number) => ctx.fillText(l, tx + 20, ty + 22 + i * 17));
        ctx.restore();
      }

      // confetti
      g.confetti.forEach((p: Confetto) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.age / 1.5);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      // level banner
      if (screenRef.current === "playing" && g.banner > 0) {
        const el = 1.6 - g.banner;
        const a = el < 0.2 ? el / 0.2 : g.banner < 0.3 ? g.banner / 0.3 : 1;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = hexA(C.night, 0.6);
        ctx.fillRect(0, H / 2 - 70, W, 130);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fs = L.mobile ? 32 : 44;
        ctx.font = fs + "px " + FONT_H;
        const scl = reducedRef.current ? 1 : 1 + Math.max(0, 0.2 - el) * 1.2;
        ctx.translate(W / 2, H / 2 - 18);
        ctx.scale(scl, scl);
        ctx.fillStyle = C.pink;
        ctx.fillText(g.bannerText, 0, 4);
        ctx.fillStyle = C.text;
        ctx.fillText(g.bannerText, 0, 0);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = a;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "500 " + (L.mobile ? 13 : 15) + "px " + FONT_UI;
        ctx.fillStyle = C.text;
        const sl = wrapLines(ctx, g.bannerSub, W - 40, 2);
        sl.forEach((l: string, i: number) => ctx.fillText(l, W / 2, H / 2 + 26 + i * 18));
        ctx.restore();
      }
      ctx.restore();
    };

    const frame = (now: number): void => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const cv = canvasRef.current;
      const g = gameRef.current;
      const d = dimsRef.current;
      if (cv && d.W > 0) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const pw = Math.round(d.W * dpr);
        const ph = Math.round(d.H * dpr);
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        const newCols = colsFor(g.order.length, d.mobile);
        const L = makeLayout(d.W, d.H, d.mobile, g.order.length);
        const P = prevLay;
        if (P && P.g === g && (P.top !== L.topY || P.land !== L.landY)) {
          const oldSpan = P.land - P.top;
          const k = oldSpan > 0 ? (L.landY - L.topY) / oldSpan : 1;
          g.tickets.forEach((t: Ticket) => { t.y = L.topY + (t.y - P.top) * k; t.speed *= k; });
        }
        if (g.cols !== newCols && g.cols > 0) {
          const oc = g.cols;
          g.tickets.forEach((t: Ticket) => { t.col = Math.floor(((t.col + 0.5) / oc) * newCols); });
        }
        g.cols = newCols;
        g.tickets.forEach((t: Ticket) => { t.col = Math.max(0, Math.min(newCols - 1, t.col)); });
        prevLay = { g, top: L.topY, land: L.landY };
        update(g, L, dt);
        const ctx = cv.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          draw(ctx, g, L);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKeyDown = (e: KeyboardEvent): void => {
      const tgt = e.target as HTMLElement | null;
      const onButton = !!tgt && tgt.tagName === "BUTTON";
      const k = e.key;
      if (screenRef.current !== "playing" && e.repeat && (k === "Enter" || k === " " || k === "Spacebar")) { e.preventDefault(); return; }
      if (k === "Enter") {
        if (screenRef.current !== "playing" && !onButton) { e.preventDefault(); startRef.current(); }
        return;
      }
      if (screenRef.current !== "playing") return;
      if (k === "ArrowLeft" || k === "a" || k === "A") { keysRef.current.left = true; e.preventDefault(); }
      else if (k === "ArrowRight" || k === "d" || k === "D") { keysRef.current.right = true; e.preventDefault(); }
      else if (k === " " || k === "Spacebar" || k === "ArrowDown") {
        e.preventDefault();
        if (e.repeat) return;
        const g = gameRef.current;
        routeHeld(spaceBay(lay(g), g));
      } else if (k >= "1" && k <= "6" && k.length === 1) {
        e.preventDefault();
        routeHeld(parseInt(k, 10) - 1);
      }
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") keysRef.current.left = false;
      if (k === "ArrowRight" || k === "d" || k === "D") keysRef.current.right = false;
    };
    const onBlur = (): void => { keysRef.current.left = false; keysRef.current.right = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    // expose for pointer handlers
    pointerApi.current = {
      down: (x: number, y: number): void => {
        const g = gameRef.current;
        if (screenRef.current !== "playing" || g.over) return;
        const L = lay(g);
        const bay = L.bays.find((b: Bay) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
        if (bay) {
          if (g.held) routeHeld(bay.pos);
          else {
            const col = L.mobile ? bay.pos % L.cols : bay.pos;
            g.target = (col + 0.5) / L.cols;
          }
          return;
        }
        dragRef.current = true;
        g.target = Math.max(0, Math.min(1, (x - L.pad) / (L.W - 2 * L.pad)));
      },
      move: (x: number): void => {
        if (!dragRef.current) return;
        const g = gameRef.current;
        const L = lay(g);
        g.target = Math.max(0, Math.min(1, (x - L.pad) / (L.W - 2 * L.pad)));
      },
      up: (): void => { dragRef.current = false; },
    };
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const local = (cx: number, cy: number): { x: number; y: number } => {
    const cv = canvasRef.current;
    if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  };

  const cardW = Math.min(420, W - 32);
  const btnPrimary = {
    height: 56, borderRadius: 999, border: "none", background: C.warn, color: C.ink,
    fontFamily: FONT_H, fontSize: 22, padding: "0 32px", minWidth: 200,
  };
  const btnText = {
    height: 48, border: "none", background: "transparent", color: C.text2,
    fontFamily: FONT_UI, fontWeight: 700, fontSize: 15, padding: "0 16px", borderRadius: 12,
  };
  const overWon = screen === "win";

  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <style>{CSS}</style>
      <div style={{ position: "relative", width: W, height: H, margin: "0 auto", borderRadius: 24, overflow: "hidden", background: C.night }}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label="Ship It! game board. Arrow keys move Goose, Space or 1 to 6 routes the held ticket."
          style={{ width: W, height: H, display: "block", touchAction: "none", outline: "none", userSelect: "none" }}
          onPointerDown={(e: PointerEventR<HTMLCanvasElement>) => { const p = local(e.clientX, e.clientY); if (pointerApi.current) pointerApi.current.down(p.x, p.y); }}
          onPointerMove={(e: PointerEventR<HTMLCanvasElement>) => { const p = local(e.clientX, e.clientY); if (pointerApi.current) pointerApi.current.move(p.x); }}
          onPointerUp={() => { if (pointerApi.current) pointerApi.current.up(); }}
          onPointerCancel={() => { if (pointerApi.current) pointerApi.current.up(); }}
          onPointerLeave={() => { if (pointerApi.current) pointerApi.current.up(); }}
        />
        {screen !== "playing" && (
          <div style={{ position: "absolute", inset: 0, background: C.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box", overflowY: "auto" }}>
            <div className="shipit-card" style={{ width: cardW, background: C.panel, borderRadius: 24, padding: 32, boxSizing: "border-box", textAlign: "center", color: C.text, fontFamily: FONT_UI, boxShadow: "0 12px 40px " + C.shadow }}>
              {screen === "start" && (
                <div>
                  <GooseBadge />
                  <div style={{ fontFamily: FONT_H, fontSize: mobile ? 44 : 64, lineHeight: 1.05, textShadow: "0 4px 0 " + C.pink, marginBottom: 12 }}>Ship It!</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Route every ticket before the queue overflows.</div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: C.text2, marginBottom: 20 }}>{TAGLINE}</div>
                  <button className="shipit-btn" style={btnPrimary} autoFocus onClick={() => startGame()}>Start shift</button>
                  <div style={{ fontWeight: 500, fontSize: 13, color: C.text2, marginTop: 16, lineHeight: 1.5 }}>Arrow keys or drag to move. Space or 1 to 6 or tap a lane to drop.</div>
                  <div style={{ fontWeight: 500, fontSize: 12, color: C.text2, marginTop: 8, lineHeight: 1.5 }}>Stand under a ticket to catch it. Red P1s misrouted cause outages, 3 ends the shift. Catch the Green PR for 5s of auto-routing.</div>
                  {best > 0 && <div style={{ fontWeight: 700, fontSize: 13, color: C.warn, marginTop: 10 }}>Best: {best.toLocaleString("en-GB")}</div>}
                </div>
              )}
              {(screen === "over" || screen === "win") && summary && (
                <div>
                  <div style={{ fontFamily: FONT_H, fontSize: mobile ? 34 : 44, lineHeight: 1.05, color: overWon ? C.ok : C.bad, marginBottom: 10 }}>{overWon ? "Ship status: READY" : "Ship status: NOT READY"}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{summary.line}</div>
                  <div style={{ fontWeight: 500, fontSize: 12, color: C.text2, marginBottom: 14 }}>{overWon ? "Shift complete. All 3 levels cleared." : summary.reason + " A quiet day is not a blocker. Overflow is."}</div>
                  <div style={{ fontFamily: FONT_H, fontSize: 56, lineHeight: 1, color: C.text }}>{summary.score.toLocaleString("en-GB")}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: summary.newBest ? C.warn : C.text2, marginTop: 6 }}>{summary.newBest ? "New best!" : "Best: " + summary.best.toLocaleString("en-GB")}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, margin: "18px 0 22px" }}>
                    {[["Shipped", summary.shipped], ["Misrouted", summary.misrouted], ["Best streak", summary.bestStreak]].map((s: (string | number)[]) => (
                      <div key={String(s[0])} style={{ background: C.grid, borderRadius: 14, padding: "8px 14px", minWidth: 84 }}>
                        <div style={{ fontFamily: FONT_H, fontSize: 22 }}>{s[1]}</div>
                        <div style={{ fontWeight: 700, fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s[0]}</div>
                      </div>
                    ))}
                  </div>
                  <button className="shipit-btn" style={btnPrimary} autoFocus onClick={() => startGame()}>Run it back</button>
                  <div style={{ marginTop: 8 }}>
                    <button className="shipit-btn" style={btnText} onClick={() => backToStart()}>Back to start</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: DARK.text.tertiary, fontFamily: DARK.font.family }}>
        Made on Forge Friday by CPO (rules), designer (look), replies (lines) and Goose (build).
      </div>
    </div>
  );
}


