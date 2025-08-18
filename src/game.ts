import { state, reset } from "./state";
import { gridCellSize, gridSize, catBulletConstants } from "./constants";

export function update(dt: number) {
  const gameOver =
    state.wordsToFind.length === 0 || state.playerAlive === false;
  if (gameOver && state.mouse.leftButtonDown === true) {
    reset();
  }
  const mouseOverGridX =
    state.mouse.x >= state.wordSearchGrid.x &&
    state.mouse.x <= state.wordSearchGrid.x + state.wordSearchGrid.width;
  const mouseOverGridY =
    state.mouse.y >= state.wordSearchGrid.y &&
    state.mouse.y <= state.wordSearchGrid.y + state.wordSearchGrid.height;

  if (mouseOverGridX && mouseOverGridY) {
    const gridX = Math.floor(
      (state.mouse.x - state.wordSearchGrid.x) / gridCellSize,
    );
    const gridY = Math.floor(
      (state.mouse.y - state.wordSearchGrid.y) / gridCellSize,
    );

    // handle mouse logic
    if (!state.selection.selecting && state.playerAlive) {
      if (state.mouse.leftButtonDown) {
        state.selection.selecting = true;
        state.selection.start = { x: gridX, y: gridY };
        state.selection.end = { x: gridX, y: gridY };
      }
    } else {
      // we are selecting
      if (state.mouse.leftButtonDown) {
        const start = state.selection.start;
        const dx = gridX - start.x;
        const dy = gridY - start.y;
        const oneDirection = dx == 0 || dy == 0;
        const hasSlopeOfOne = Math.abs(dx) === Math.abs(dy);
        if (oneDirection || hasSlopeOfOne) {
          state.selection.end = { x: gridX, y: gridY };
        }
      } else {
        // todo: ATTEMPT SUBMITTING WORD
        {
          const letters = [] as string[];
          const dx = Math.sign(state.selection.end.x - state.selection.start.x);
          const dy = Math.sign(state.selection.end.y - state.selection.start.y);
          const selectionLength = Math.max(
            Math.abs(state.selection.end.x - state.selection.start.x),
            Math.abs(state.selection.end.y - state.selection.start.y),
          );
          for (let i = 0; i <= selectionLength; i++) {
            const x = state.selection.start.x + dx * i;
            const y = state.selection.start.y + dy * i;
            if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
              continue; // out of bounds
            }
            letters.push(state.grid[y][x]);
          }
          const wordForwards = letters.join("");
          const wordBackwards = letters.reverse().join("");

          const foundWord = state.wordsToFind.find(
            (word) => word === wordForwards || word === wordBackwards,
          );
          if (foundWord) {
            // add to found words
            state.foundWordLines.push({
              start: { x: state.selection.start.x, y: state.selection.start.y },
              end: { x: state.selection.end.x, y: state.selection.end.y },
            });

            // remove from words used
            const index = state.wordsToFind.indexOf(foundWord);
            if (index > -1) {
              state.wordsToFind.splice(index, 1);
            }
          }
        }
        state.selection.selecting = false;
      }
    }

    const gameOver =
      state.wordsToFind.length === 0 || state.playerAlive === false;
    if (gameOver && state.mouse.leftButtonDown === true) {
      reset();
    }
  }

  state.catBulletSpawnTimer += dt;
  const timePerCatBullet = 500 / catBulletConstants.spawnHz;
  while (state.catBulletSpawnTimer >= timePerCatBullet && state.playerAlive) {
    state.catBullets.push({
      x:
        Math.round(Math.random()) * state.wordSearchGrid.width +
        state.wordSearchGrid.x,
      y:
        Math.round(Math.random()) * state.wordSearchGrid.height +
        state.wordSearchGrid.y,
      angle: Math.random() * Math.PI * 2,
    });
    state.catBulletSpawnTimer -= timePerCatBullet;
  }

  state.catBullets.forEach((bullet) => {
    const bulletOffScreen =
      bullet.x < state.wordSearchGrid.x ||
      bullet.x > state.wordSearchGrid.x + state.wordSearchGrid.width ||
      bullet.y < state.wordSearchGrid.y ||
      bullet.y > state.wordSearchGrid.y + state.wordSearchGrid.height;
    if (bulletOffScreen) {
      state.catBullets.splice(state.catBullets.indexOf(bullet), 1);
    }
  });

  state.catBullets.forEach((bullet) => {
    bullet.x +=
      (Math.cos(bullet.angle) * catBulletConstants.speed * dt) / (1000 / 60);
    bullet.y +=
      (Math.sin(bullet.angle) * catBulletConstants.speed * dt) / (1000 / 60);
  });

  const bulletTouchesMouse = state.catBullets.some((bullet) => {
    const dx = bullet.x - state.mouse.x;
    const dy = bullet.y - state.mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < catBulletConstants.radius;
  });
  if (bulletTouchesMouse) {
    state.playerAlive = false;
  }
}

export function draw(ctx: CanvasRenderingContext2D) {
  const fontSize = 15;
  const font = "Arial";
  ctx.font = fontSize + "px " + font;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);

  ctx.strokeStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "black";
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const xPos = x * gridCellSize;
      const yPos = y * gridCellSize;
      ctx.strokeRect(
        xPos + state.wordSearchGrid.x,
        yPos + state.wordSearchGrid.y,
        gridCellSize,
        gridCellSize,
      );

      const letter = state.grid[y][x];
      ctx.fillText(
        letter,
        xPos + state.wordSearchGrid.x + gridCellSize / 2,
        yPos + state.wordSearchGrid.y + gridCellSize / 2,
      );
    }
  }

  // DRAW SELECTION LINE
  const currentlySelectingColor = "blue";
  const foundSelectionColor = "yellow";
  {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = currentlySelectingColor;
    ctx.lineCap = "round";
    ctx.lineWidth = gridCellSize;

    if (state.selection.selecting) {
      const startX =
        state.wordSearchGrid.x +
        state.selection.start.x * gridCellSize +
        gridCellSize / 2;
      const startY =
        state.wordSearchGrid.y +
        state.selection.start.y * gridCellSize +
        gridCellSize / 2;
      const endX =
        state.wordSearchGrid.x +
        state.selection.end.x * gridCellSize +
        gridCellSize / 2;
      const endY =
        state.wordSearchGrid.y +
        state.selection.end.y * gridCellSize +
        gridCellSize / 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    for (let i = 0; i < state.foundWordLines.length; i++) {
      const line = state.foundWordLines[i];
      ctx.strokeStyle = foundSelectionColor;
      ctx.beginPath();
      ctx.moveTo(
        state.wordSearchGrid.x + line.start.x * gridCellSize + gridCellSize / 2,
        state.wordSearchGrid.y + line.start.y * gridCellSize + gridCellSize / 2,
      );
      ctx.lineTo(
        state.wordSearchGrid.x + line.end.x * gridCellSize + gridCellSize / 2,
        state.wordSearchGrid.y + line.end.y * gridCellSize + gridCellSize / 2,
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "black";
  const textToPrint = ["WORDS TO FIND:", ...state.wordsToFind];
  const xMargin = 5;
  for (let i = 0; i < textToPrint.length; i++) {
    const word = textToPrint[i];
    ctx.fillText(
      word,
      state.wordSearchGrid.x + state.wordSearchGrid.width + xMargin,
      fontSize * i + state.wordSearchGrid.y,
    );
  }
  for (let i = 0; i < state.catBullets.length; i++) {
    const bullet = state.catBullets[i];
    ctx.fillStyle = "red";
    if (
      bullet.x > state.wordSearchGrid.x &&
      bullet.x < state.wordSearchGrid.x + state.wordSearchGrid.width &&
      bullet.y > state.wordSearchGrid.y &&
      bullet.y < state.wordSearchGrid.y + state.wordSearchGrid.height
    ) {
      ctx.beginPath();
      ctx.roundRect(
        bullet.x,
        bullet.y,
        catBulletConstants.radius * 2,
        catBulletConstants.radius * 2,
        10,
      );
      ctx.fill();
      ctx.closePath();
    }
  }

  if (state.wordsToFind.length === 0) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);

    ctx.strokeStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.fillText(
      "Congratulations!, Click to play again",
      state.canvasRect.width / 2,
      state.canvasRect.height / 2,
    );
  }
  if (state.playerAlive === false) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);

    ctx.strokeStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.fillText(
      "Game Over!, Click to play again",
      state.canvasRect.width / 2,
      state.canvasRect.height / 2,
    );
  }
}
