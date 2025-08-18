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

  canvasRect: {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  },

  wordSearchGrid: {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  },

  catBulletSpawnTimer: 0,
  catBullets: [] as {
    x: number;
    y: number;
    angle: number;
  }[],
};

export let state = structuredClone(initState);

// TEST BULLET

export function reset() {
  state = structuredClone(initState);
  const { grid: newGrid, wordsUsed: newWordsUsed } = generateWordSearch();
  state.grid = newGrid;
  state.wordsToFind = newWordsUsed;
}
