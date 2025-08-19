import "./style.css";
import { state } from "./state.ts";
import "./input.ts";
import { canvas } from "./dom.ts";
import { update, draw } from "./game.ts";

let prevTime = performance.now();
function raf() {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");

  const canvasRect = canvas.getBoundingClientRect();
  canvas.width = canvasRect.width * devicePixelRatio;
  canvas.height = canvasRect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  state.canvasRect = canvasRect;

  {
    const now = performance.now();
    const dt = now - prevTime;
    prevTime = now;
    update(dt, canvasRect);
  }
  draw(ctx);

  requestAnimationFrame(raf);
}

raf();
