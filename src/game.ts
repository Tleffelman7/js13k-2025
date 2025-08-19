import { state, reset } from "./state";
import { gridCellSize, gridSize, catBulletConstants } from "./constants";

const HITBOX_DEBUG = false

export function update(dt: number, canvasRect: DOMRect) {
  const gameOver =
    state.wordsToFind.length === 0 || state.playerAlive === false;
  if (gameOver && state.mouse.leftButtonDown === true) {
    reset();
  }
  if (!state.playerAlive) {
    return
  }

  const wordSearchWidth = gridSize * gridCellSize;
  const wordSearchHeight = wordSearchWidth;
  const wordSearchGrid = {
    width: wordSearchWidth,
    height: wordSearchHeight,
    x: (canvasRect.width - wordSearchWidth) / 2,
    y: (canvasRect.height - wordSearchHeight) / 2,
  };
  state.wordSearchGrid = wordSearchGrid;

  const enemySpawnPerimeterWidth = wordSearchWidth * 1.5;
  const enemySpawnPerimeterHeight = wordSearchHeight * 1.5;
  const enemySpawnPerimeter = {
    width: enemySpawnPerimeterWidth,
    height: enemySpawnPerimeterHeight,
    x: (canvasRect.width - enemySpawnPerimeterWidth) / 2,
    y: (canvasRect.height - enemySpawnPerimeterHeight) / 2,
  };
  state.enemySpawnPerimeter = enemySpawnPerimeter;

  const enemyActiveAreaWidth = enemySpawnPerimeterWidth + catBulletConstants.radius * 2;
  const enemyActiveAreaHeight = enemySpawnPerimeterHeight + catBulletConstants.radius * 2;
  const enemyActiveArea = {
    width: enemyActiveAreaWidth,
    height: enemyActiveAreaHeight,
    x: (canvasRect.width - enemyActiveAreaWidth) / 2,
    y: (canvasRect.height - enemyActiveAreaHeight) / 2,
  };
  state.enemyActiveArea = enemyActiveArea;

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
  }

  state.catBulletSpawnTimer += dt;
  const timePerCatBullet = 500 / catBulletConstants.spawnHz;
  while (state.catBulletSpawnTimer >= timePerCatBullet && state.playerAlive) {
    let xAxis = Math.random() > .5
    let spawnX = 0
    let spawnY = 0
    if (xAxis) {
      spawnX =
        Math.random() * state.enemyActiveArea.width +
        state.enemyActiveArea.x
      spawnY =
        Math.round(Math.random()) * state.enemyActiveArea.height +
        state.enemyActiveArea.y
    } else {
      spawnX =
        Math.round(Math.random()) * state.enemyActiveArea.width +
        state.enemyActiveArea.x
      spawnY =
        Math.random() * state.enemyActiveArea.height +
        state.enemyActiveArea.y
    }
    const angleToCenter =
      Math.atan2(
        canvasRect.height / 2 - spawnY,
        canvasRect.width / 2 - spawnX,
      );

    const offsetAmount = Math.PI / 8;
    state.catBullets.push({
      x: spawnX, y: spawnY,
      angle: angleToCenter + ((Math.random() - .5) * 2) * offsetAmount,
    });
    state.catBulletSpawnTimer -= timePerCatBullet;
  }

  state.catBullets.forEach((bullet) => {
    const bulletOutOfActiveArea =
      bullet.x < state.enemyActiveArea.x ||
      bullet.x > state.enemyActiveArea.x + state.enemyActiveArea.width ||
      bullet.y < state.enemyActiveArea.y ||
      bullet.y > state.enemyActiveArea.y + state.enemyActiveArea.height;
    if (bulletOutOfActiveArea) {
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

  // clamp mouse
  state.mouse.x = Math.max(
    state.enemySpawnPerimeter.x,
    Math.min(
      state.mouse.x,
      state.enemySpawnPerimeter.x + state.enemySpawnPerimeter.width,
    ),
  );
  state.mouse.y = Math.max(
    state.enemySpawnPerimeter.y,
    Math.min(
      state.mouse.y,
      state.enemySpawnPerimeter.y + state.enemySpawnPerimeter.height,
    ),
  );
}

export function draw(ctx: CanvasRenderingContext2D) {
  const textColor = "gold"

  const fontSize = .75 * gridCellSize;
  const font = "Arial";
  ctx.font = fontSize + "px " + font;

  const backgroundColor = "#6F4E37"
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);

  ctx.strokeStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = textColor;
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const xPos = x * gridCellSize;
      const yPos = y * gridCellSize;
      // ctx.strokeRect(
      //   xPos + state.wordSearchGrid.x,
      //   yPos + state.wordSearchGrid.y,
      //   gridCellSize,
      //   gridCellSize,
      // );

      const letter = state.grid[y][x];
      ctx.fillText(
        letter,
        xPos + state.wordSearchGrid.x + gridCellSize / 2,
        yPos + state.wordSearchGrid.y + gridCellSize / 2,
      );
    }
  }

  ctx.lineWidth = 5
  ctx.strokeStyle = "orange"
  ctx.strokeRect(
    state.enemySpawnPerimeter.x,
    state.enemySpawnPerimeter.y,
    state.enemySpawnPerimeter.width,
    state.enemySpawnPerimeter.height,
  )

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
  ctx.fillStyle = textColor;
  const textToPrint = [...state.wordsToFind];
  const margin = fontSize * .5;
  for (let i = 0; i < textToPrint.length; i++) {
    const word = textToPrint[i];
    ctx.fillText(
      word,
      margin,
      fontSize * i + margin,
    );
  }


  ctx.save()
  ctx.beginPath();
  ctx.rect(
    state.enemySpawnPerimeter.x,
    state.enemySpawnPerimeter.y,
    state.enemySpawnPerimeter.width,
    state.enemySpawnPerimeter.height,
  )

  {
    ctx.clip();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${catBulletConstants.radius * 3}px ${font}`;
    state.catBullets.forEach((bullet) => {
      ctx.save()
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(bullet.angle + Math.PI);
      ctx.fillText('🐈‍⬛', 0, 0)
      ctx.restore()
    })
    if (HITBOX_DEBUG) {
      ctx.save()
      ctx.globalAlpha = 0.5;
      state.catBullets.forEach((bullet) => {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(
          bullet.x,
          bullet.y,
          catBulletConstants.radius,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.closePath();
      })
      ctx.restore()
    }
  }

  // draw cursor
  // ctx.fillStyle = "purple"
  // ctx.beginPath();
  // ctx.arc(
  //   state.mouse.x,
  //   state.mouse.y,
  //   gridCellSize / 2,
  //   0,
  //   Math.PI * 2,
  // );
  // ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${30}px ${font}`;
  ctx.fillText(
    "🐭",
    state.mouse.x,
    state.mouse.y,
  )

  if (state.wordsToFind.length === 0) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);

    ctx.strokeStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.fillText(
      "Congratulations!, Click to play again",
      state.canvasRect.width / 2,
      state.canvasRect.height / 2,
    );
  }

  if (state.playerAlive === false) {
    ctx.fillStyle = backgroundColor;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.fillText(
      "Game Over!, Click to play again",
      state.canvasRect.width / 2,
      state.canvasRect.height / 2,
    );
  }
}
