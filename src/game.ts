import { state, reset } from "./state";
import { gridCellSize, gridSize, catBulletConstants } from "./constants";
import { playLoseSound, playWordFoundSound } from "./sound";
import * as Particles from "./particles";

const HITBOX_DEBUG = false

export function update(dt: number, canvasRect: DOMRect) {
  // rect calculations
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

  // approach screenshake to 0
  state.shakeAmount = state.shakeAmount * (1.0 - (dt * .005));

  Particles.update(state.particles, dt);
  const gameOver =
    state.wordsToFind.length === 0 || state.playerAlive === false;
  if (gameOver && state.mouse.leftButtonDown === true) {
    reset();
  }
  if (gameOver) {
    return
  }

  if (!state.gameStarted) {
    if (state.mouse.leftButtonDown) {
      state.gameStarted = true;
    } else {
      return
    }
  }


  const { onGrid, x: gridX, y: gridY } =
    gridPos();

  // handle mouse logic
  if (!state.selection.selecting && onGrid) {
    if (state.mouse.leftButtonDown) {
      state.selection.selecting = true;
      state.selection.start = { x: gridX, y: gridY };
      state.selection.end = { x: gridX, y: gridY };
    }
  } else {
    if (state.mouse.leftButtonDown && onGrid) {
      const start = state.selection.start;
      const dx = gridX - start.x;
      const dy = gridY - start.y;
      const oneDirection = dx == 0 || dy == 0;
      const hasSlopeOfOne = Math.abs(dx) === Math.abs(dy);
      if (oneDirection || hasSlopeOfOne) {
        state.selection.end = { x: gridX, y: gridY };
      }
    }
  }

  if (state.selection.selecting && !state.mouse.leftButtonDown) {
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
      playWordFoundSound();

      const lineDist =
        Math.hypot(
          state.selection.end.x - state.selection.start.x,
          state.selection.end.y - state.selection.start.y,
        )
      const particleAmount = Math.round(lineDist * 4)
      for (let i = 0; i < particleAmount; i++) {
        const t = i / particleAmount;
        const x =
          state.wordSearchGrid.x +
          state.selection.start.x * gridCellSize +
          gridCellSize / 2 +
          (state.selection.end.x - state.selection.start.x) * t * gridCellSize;
        const y =
          state.wordSearchGrid.y +
          state.selection.start.y * gridCellSize +
          gridCellSize / 2 +
          (state.selection.end.y - state.selection.start.y) * t * gridCellSize;

        Particles.addParticle(
          state.particles,
          x,
          y,
          (Math.random() - 0.5),
          (Math.random() - 0.5),
          1000, // lifetime
        );
      }
    }
    state.selection.selecting = false;
  }

  state.catBulletSpawnTimer += dt;
  const timePerCatBullet = 500 / catBulletConstants.spawnHz;
  while (state.catBulletSpawnTimer >= timePerCatBullet && state.playerAlive) {
    let xAxis = Math.random() > .5
    let spawnX, spawnY = 0
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
    // play death sound
    playLoseSound()
    state.shakeAmount = 1.0
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
  const gridMouse = gridPos()

  const fontSize = .75 * gridCellSize;
  const font = "Arial";
  ctx.font = fontSize + "px " + font;

  const backgroundColor = "#6F4Ecc"
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);

  // screen shake
  ctx.save()
  ctx.translate(
    Math.sin(performance.now() * .033) * 10 * state.shakeAmount,
    Math.cos(performance.now() * .03) * 10 * state.shakeAmount,
  )

  {
    ctx.strokeStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const xPos = x * gridCellSize;
        const yPos = y * gridCellSize;

        ctx.save()
        const letter = state.grid[y][x];
        ctx.translate(
          xPos + state.wordSearchGrid.x + gridCellSize / 2,
          yPos + state.wordSearchGrid.y + gridCellSize / 2,
        )
        if (gridMouse.x === x && gridMouse.y === y) {
          ctx.save()
          ctx.fillStyle = "white";
          ctx.globalAlpha = .2
          ctx.fillRect(
            -gridCellSize / 2,
            -gridCellSize / 2,
            gridCellSize,
            gridCellSize,
          )
          ctx.restore()
          ctx.scale(1.2, 1.2)
        }
        ctx.rotate(Math.sin((performance.now() + (x + y) * 100) * .003) * .1)
        ctx.translate(
          Math.sin((performance.now() + (x + y) * 100) * .005) * .25,
          Math.cos((performance.now() + (x + y) * 100) * .005) * .25,
        )
        ctx.fillText(
          letter, 0, 0
        );
        ctx.restore()
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

    Particles.draw(
      ctx,
      state.particles,
    );

    // DRAW SELECTION LINE
    const currentlySelectingColor = "#faa";
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

    if (state.gameStarted) {
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

    }


    ctx.save()
    ctx.beginPath();
    ctx.rect(
      state.enemySpawnPerimeter.x,
      state.enemySpawnPerimeter.y,
      state.enemySpawnPerimeter.width,
      state.enemySpawnPerimeter.height,
    )

    if (!state.gameStarted) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        state.enemySpawnPerimeter.x,
        state.enemySpawnPerimeter.y,
        state.enemySpawnPerimeter.width,
        state.enemySpawnPerimeter.height,
      )

      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = [
        "Find the words & dodge the cats!",
        "Click to start",
      ]

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        ctx.fillText(
          line,
          state.enemySpawnPerimeter.x + state.enemySpawnPerimeter.width / 2,
          state.enemySpawnPerimeter.y + state.enemySpawnPerimeter.height / 2
          + (i * fontSize * 1.5) - lines.length * fontSize / 2,
        );
      }

    }

    {
      ctx.clip();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${catBulletConstants.radius * 3}px ${font}`;
      state.catBullets.forEach((bullet) => {
        ctx.save()
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(bullet.angle + Math.PI
          + Math.sin(performance.now() * .01) * .2
        );
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
    ctx.save()
    ctx.globalAlpha = .9
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${30}px ${font}`;
    ctx.translate(
      state.mouse.x,
      state.mouse.y,
    )
    ctx.rotate(Math.sin(performance.now() * .01) * .1);
    ctx.fillText(
      "🐭", 0, 0
    )
    ctx.restore()

    if (state.wordsToFind.length === 0) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);

      ctx.strokeStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = textColor;
      ctx.fillText(
        "Congratulations! Click to play again",
        state.canvasRect.width / 2,
        state.canvasRect.height / 2,
      );
    }

    if (state.playerAlive === false) {
      ctx.fillStyle = backgroundColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(0, 0, state.canvasRect.width, state.canvasRect.height);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = textColor;
      ctx.fillText(
        "Game over! Click to try again",
        state.canvasRect.width / 2,
        state.canvasRect.height / 2,
      );
    }

  }
  ctx.restore()
}

function gridPos(): {
  onGrid: boolean;
  x: number;
  y: number;
} {
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
    return {
      onGrid: true,
      x: gridX,
      y: gridY,
    };
  }
  return {
    onGrid: false,
    x: -1,
    y: -1,
  };
}
