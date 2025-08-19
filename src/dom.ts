export const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

// canvas should capture mouse
canvas.style.touchAction = "none";
canvas.style.userSelect = "none";
