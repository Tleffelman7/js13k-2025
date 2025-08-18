import { canvas } from "./dom.ts";
import { state } from "./state.ts";

canvas.onmousemove = (e) => {
  const canvasRect = canvas.getBoundingClientRect();
  state.mouse.x = e.clientX - canvasRect.left;
  state.mouse.y = e.clientY - canvasRect.top;
};

canvas.onpointerdown = (e) => {
  if (e.button !== 0) return; // Only handle left button
  state.mouse.leftButtonDown = true;
};

canvas.onpointerup = (e) => {
  if (e.button !== 0) return; // Only handle left button
  state.mouse.leftButtonDown = false;
};
