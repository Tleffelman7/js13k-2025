import "./style.css";
import { state } from "./state.ts";
import "./input.ts";
import { gridSize, gridCellSize } from "./constants.ts";
import { canvas } from "./dom.ts";
import { update, draw } from "./game.ts";

function raf() {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");

  const canvasRect = canvas.getBoundingClientRect();
  canvas.width = canvasRect.width * devicePixelRatio;
  canvas.height = canvasRect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  state.canvasRect = canvasRect;

  const wordSearchWidth = gridSize * gridCellSize;
  const wordSearchHeight = wordSearchWidth;
  const wordSearchGrid = {
    width: wordSearchWidth,
    height: wordSearchHeight,
    x: (canvasRect.width - wordSearchWidth) / 2,
    y: (canvasRect.height - wordSearchHeight) / 2,
  };
  state.wordSearchGrid = wordSearchGrid;

  update();
  draw(ctx);

  requestAnimationFrame(raf);
}

raf();
