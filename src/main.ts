enum TileStates {
  bomb = 1 << 0,
  flag = 1 << 1,
  mask = 1 << 2,
}
function clearState(
  gameState: number[],
  value: number,
  width: number,
  height: number,
) {
  gameState.length = width * height;
  gameState.fill(value);
}
function randomizeState(gameState: number[], bombCount: number) {
  for (let i = 0, l = gameState.length; i < l; i++) {
    const chance = bombCount / (l - i);
    if (Math.random() > chance && !(gameState[i] & TileStates.bomb)) continue;
    gameState[i] |= TileStates.bomb;
    bombCount--;
  }
}
function resize(canvas: HTMLCanvasElement) {
  if (canvas.width / canvas.height > innerWidth / innerHeight) {
    canvas.style.width = "100%";
    canvas.style.height = "";
    document.body.style.flexDirection = "column";
  } else {
    canvas.style.width = "";
    canvas.style.height = "100%";
    document.body.style.flexDirection = "row";
  }
}
function calculateNums(
  gameState: number[],
  numbers: number[],
  width: number,
  height: number,
) {
  for (let i = 0; i < height; i++) {
    const index = i * width;
    let top = +!!(gameState[index - width] & TileStates.bomb);
    let mid = +!!(gameState[index] & TileStates.bomb);
    let bot = +!!(gameState[index + width] & TileStates.bomb);
    for (let j = 0; j < width; j++) {
      const index = j + i * width;
      if (j < width - 1) {
        top += +!!(gameState[index + 1 - width] & TileStates.bomb);
        mid += +!!(gameState[index + 1] & TileStates.bomb);
        bot += +!!(gameState[index + 1 + width] & TileStates.bomb);
      }
      numbers[index] = top + mid + bot;
      if (j > 0) {
        top -= +!!(gameState[index - width - 1] & TileStates.bomb);
        mid -= +!!(gameState[index - 1] & TileStates.bomb);
        bot -= +!!(gameState[index + width - 1] & TileStates.bomb);
      }
    }
  }
}
function updateMask(game: Game, index: number) {
  const indices = fillIndices(game.numbers, game.width, game.height, index, 0);
  for (let i = 0, l = indices.length; i < l; i++) {
    game.gameState[indices[i]] &= ~TileStates.mask;
  }
}
function fillIndices(
  numbers: number[],
  width: number,
  height: number,
  index: number,
  target: number = numbers[index],
  indices: number[] = [],
): number[] {
  indices.push(index);
  if (numbers[index] != target) return indices;
  for (let layer = index - width; layer <= index + width; layer += width) {
    for (let offset = -1; offset <= 1; offset++) {
      if (
        indices.includes(layer + offset) ||
        Math.floor((layer + offset) / width) != Math.floor(layer / width)
      )
        continue;
      fillIndices(numbers, width, height, layer + offset, target, indices);
    }
  }
  return indices;
}
function msToTimeFormat(ms: number): string {
  return new Date(ms).toISOString().substring(11, 11 + 8);
}
function randomRange(max = 1, min = 0): number {
  return Math.random() * (max - min) + min;
}
function initGame(ctx: CanvasRenderingContext2D, game: Game) {
  ((ctx.canvas.width = game.width * game.cellSize),
    (ctx.canvas.height = game.height * game.cellSize));
  game.colors.bomb = game.colors.numbers = "red";
  game.colors.tileEdge = `rgb(${randomRange(255, 0)},${randomRange(255, 0)},${randomRange(255, 0)})`;
  game.colors.tile = `rgb(${randomRange(255, 0)},${randomRange(255, 0)},${randomRange(255, 0)})`;
  clearState(game.gameState, TileStates.mask, game.width, game.height);
  clearState(game.numbers, 0, game.width, game.height);
  randomizeState(game.gameState, game.bombCount);
  calculateNums(game.gameState, game.numbers, game.width, game.height);
  drawGame(ctx, game);
}
function drawGame(ctx: CanvasRenderingContext2D, game: Game) {
  const old = ctx.fillStyle;
  const offset = 0.1;
  const padding = 0.2;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < game.height; i++) {
    for (let j = 0; j < game.width; j++) {
      const index = j + i * game.width;
      if (game.gameState[index] & TileStates.mask) {
        ctx.fillStyle = game.colors.tileEdge;
        ctx.fillRect(
          j * game.cellSize,
          i * game.cellSize,
          game.cellSize,
          game.cellSize,
        );
        ctx.fillStyle = game.colors.tile;
        ctx.fillRect(
          j * game.cellSize + padding,
          i * game.cellSize + padding,
          game.cellSize - padding * 2,
          game.cellSize - padding * 2,
        );
        if (game.gameState[index] & TileStates.flag) {
          ctx.fillStyle = "white";
          ctx.fillText(
            "F",
            (j + offset) * game.cellSize,
            (i + 1 - offset) * game.cellSize,
            game.cellSize,
          );
        }
      } else if (game.gameState[index] & TileStates.bomb) {
        ctx.fillStyle = game.colors.bomb;
        ctx.fillRect(
          j * game.cellSize,
          i * game.cellSize,
          game.cellSize,
          game.cellSize,
        );
      } else {
        if (game.numbers[index] == 0) continue;
        ctx.fillStyle = game.colors.numbers;
        ctx.fillText(
          game.numbers[index].toString(),
          (j + offset) * game.cellSize,
          (i + 1 - offset) * game.cellSize,
          game.cellSize,
        );
      }
    }
  }
  ctx.fillStyle = old;
}
type Game = {
  gameState: number[];
  numbers: number[];
  width: number;
  height: number;
  bombCount: number;
  cellSize: number;
  colors: { tileEdge: string; tile: string; bomb: string; numbers: string };
};
function retrieveFormData(form: HTMLFormElement, game: Game) {
  game.bombCount = parseInt(
    (form.elements.namedItem("bombCount") as HTMLInputElement).value,
  );
  game.width = parseInt(
    (form.elements.namedItem("width") as HTMLInputElement).value,
  );
  game.height = parseInt(
    (form.elements.namedItem("height") as HTMLInputElement).value,
  );
}
globalThis.window.onload = () => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const form = document.querySelector("form");
  if (!form) return;
  const flagToggle = document.querySelector("#flag-toggle") as HTMLInputElement;
  if (!flagToggle) return;
  const contentBox = document.querySelector(".content");
  if (!contentBox) return;

  const Game: Game = {
    gameState: [],
    numbers: [],
    width: 20,
    height: 20,
    bombCount: 20,
    cellSize: 10,
    colors: { tileEdge: "green", tile: "grey", bomb: "red", numbers: "red" },
  };
  let now = performance.now();
  let gameEnded = false;
  let flagMode = flagToggle.checked;
  retrieveFormData(form, Game);
  initGame(ctx, Game);
  resize(canvas);

  globalThis.onresize = () => resize(canvas);

  form.onsubmit = (e) => {
    e.preventDefault();
    retrieveFormData(form, Game);
    initGame(ctx, Game);
    resize(canvas);
    now = performance.now();
    gameEnded = false;
  };

  flagToggle.onclick = () => {
    flagMode = flagToggle.checked;
  };

  globalThis.onpointerdown = (e) => {
    if (e.target != canvas || gameEnded) return;
    const rect = canvas.getBoundingClientRect();
    let x = e.x - rect.left;
    let y = e.y - rect.top;
    const contentRect = contentBox.getBoundingClientRect();
    if (canvas.width / canvas.height > contentRect.width / contentRect.height) {
      x *= canvas.width / contentRect.width;
      y *= canvas.width / contentRect.width;
    } else {
      x *= canvas.height / contentRect.height;
      y *= canvas.height / contentRect.height;
    }
    x /= Game.cellSize;
    y /= Game.cellSize;
    x = Math.floor(x);
    y = Math.floor(y);
    const selectedIndex = x + y * Game.width;
    if (flagMode) {
      Game.gameState[selectedIndex] ^= TileStates.flag;
      drawGame(ctx, Game);
      return;
    }
    if (Game.gameState[selectedIndex] & TileStates.flag) return;
    updateMask(Game, selectedIndex);
    const exploded = !!(Game.gameState[selectedIndex] & TileStates.bomb);
    const solved =
      Game.gameState.reduce((p, c) => (p += +!!(c & TileStates.mask)), 0) ==
      Game.bombCount;
    if (exploded || solved) {
      gameEnded = true;
      for (let i = 0, l = Game.gameState.length; i < l; i++) {
        Game.gameState[i] &= ~TileStates.mask;
      }
      const status = document.querySelector("#status");
      if (!status) return;
      const frontString = exploded
        ? "BOOM! Time wasted: "
        : "SOLVED! Solve time: ";
      status.innerHTML = `${frontString} ${msToTimeFormat(performance.now() - now)}`;
      if (solved && !exploded) Game.colors.bomb = Game.colors.numbers = "green";
    }
    drawGame(ctx, Game);
  };
};
