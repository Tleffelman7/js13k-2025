import { canvas } from "./dom.ts";
import { state } from "./state.ts";

canvas.onmousemove = (e) => {
  const canvasRect = canvas.getBoundingClientRect();

  if (document.pointerLockElement === canvas) {
    const dx = e.movementX;
    const dy = e.movementY;
    state.mouse.x += dx;
    state.mouse.y += dy;
    // use dx, dy to rotate camera
  } else {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
  }
};

canvas.onpointerdown = (e) => {
  if (e.button !== 0) return; // Only handle left button
  state.mouse.leftButtonDown = true;

  // capture mouse
  canvas.requestPointerLock()
};


canvas.onpointerup = (e) => {
  if (e.button !== 0) return; // Only handle left button
  state.mouse.leftButtonDown = false;
};
