import { generateWordSearch } from "./word-search";

const wordSearchResult = generateWordSearch();
const initState = {
  grid: wordSearchResult.grid,
  wordsToFind: wordSearchResult.wordsUsed,
  mouse: {
    x: 0,
    y: 0,
    leftButtonDown: false,
  },
  playerAlive: true,
  selection: {
    selecting: false,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
  },

  foundWordLines: [] as {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }[],

  canvasRect: createRect(),
  wordSearchGrid: createRect(),
  enemySpawnPerimeter: createRect(),
  enemyActiveArea: createRect(),

  catBulletSpawnTimer: 0,
  catBullets: [] as {
    x: number;
    y: number;
    angle: number;
  }[],
};

function createRect() {
  return {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  };
}

export let state = structuredClone(initState);

export function reset() {
  const oldMouse = state.mouse;
  state = structuredClone(initState);
  const { grid: newGrid, wordsUsed: newWordsUsed } = generateWordSearch();
  state.grid = newGrid;
  state.wordsToFind = newWordsUsed;
  state.mouse = oldMouse;
}
