import { gridSize } from "./constants";

const answers = [
  "cheddar",
  "gouda",
  "swiss",
  "parmesan",
  "brie",
  "mozzarella",
  "feta",
  "provolone",
  "camembert",
  "ricotta",
];

// return 15 x 15 grid
export function generateWordSearch(): {
  grid: string[][];
  wordsUsed: string[];
} {
  const wordsWeWantToCreate = 5;
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    const row = [];
    for (let j = 0; j < gridSize; j++) {
      row.push(" ");
    }
    grid.push(row);
  }

  let wordsCreated = 0;
  const directions = [
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: 1, y: 1 }, // down-right
    { x: 1, y: -1 }, // up-right
  ];
  const wordsUsed: string[] = [];

  const remainingWordsToChooseFrom = answers.slice();

  while (wordsCreated < wordsWeWantToCreate) {
    // attempt putting a word somewhere
    const wordToPlace =
      remainingWordsToChooseFrom[
        Math.floor(Math.random() * remainingWordsToChooseFrom.length)
      ];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const startX = Math.floor(Math.random() * gridSize);
    const startY = Math.floor(Math.random() * gridSize);

    if (dir.x > 0) {
      // make sure we have enough room
      if (startX + wordToPlace.length > gridSize) {
        // cant fit, so try again!
        continue;
      }
    }

    if (dir.y > 0) {
      // make sure we have enough room
      if (startY + wordToPlace.length > gridSize) {
        // cant fit, so try again!
        continue;
      }
    }

    if (dir.y < 0) {
      // make sure we have enough room
      if (startY - wordToPlace.length < 0) {
        continue;
      }
    }

    // make sure every position of the word is still " "
    // otherwise, we hit a word and shouldn't place it
    let foundProblematicLetter = false;
    for (let i = 0; i < wordToPlace.length; i++) {
      const x = startX + i * dir.x;
      const y = startY + i * dir.y;
      if (grid[y][x] !== " " && grid[y][x] !== wordToPlace[i]) {
        foundProblematicLetter = true;
        continue;
      }
    }
    if (foundProblematicLetter) {
      // we hit a word, so try again!
      continue;
    }

    // if we got here, we can place the word
    for (let i = 0; i < wordToPlace.length; i++) {
      const x = startX + i * dir.x;
      const y = startY + i * dir.y;
      grid[y][x] = wordToPlace[i];
    }

    wordsCreated++;
    remainingWordsToChooseFrom.splice(
      remainingWordsToChooseFrom.indexOf(wordToPlace),
      1,
    );
    wordsUsed.push(wordToPlace);
  }

  // fill every " " with random char
  const chars = "abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === " ") {
        grid[i][j] = chars[Math.floor(Math.random() * chars.length)];
      }
    }
  }

  return {
    grid,
    wordsUsed,
  };
}
