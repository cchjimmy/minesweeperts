var TileStates = /* @__PURE__ */ ((TileStates2) => {
  TileStates2[TileStates2["bomb"] = 1] = "bomb";
  TileStates2[TileStates2["flag"] = 2] = "flag";
  TileStates2[TileStates2["mask"] = 4] = "mask";
  return TileStates2;
})(TileStates || {});
function clearState(gameState, value, width, height) {
  gameState.length = width * height;
  gameState.fill(value);
}
function randomizeState(gameState, bombCount) {
  for (let i = 0, l = gameState.length; i < l; i++) {
    const chance = bombCount / (l - i);
    if (Math.random() > chance && !(gameState[i] & 1 /* bomb */)) continue;
    gameState[i] |= 1 /* bomb */;
    bombCount--;
  }
}
function resize(canvas) {
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
function calculateNums(gameState, numbers, width, height) {
  for (let i = 0; i < height; i++) {
    const index = i * width;
    let top = +!!(gameState[index - width] & 1 /* bomb */);
    let mid = +!!(gameState[index] & 1 /* bomb */);
    let bot = +!!(gameState[index + width] & 1 /* bomb */);
    for (let j = 0; j < width; j++) {
      const index2 = j + i * width;
      if (j < width - 1) {
        top += +!!(gameState[index2 + 1 - width] & 1 /* bomb */);
        mid += +!!(gameState[index2 + 1] & 1 /* bomb */);
        bot += +!!(gameState[index2 + 1 + width] & 1 /* bomb */);
      }
      numbers[index2] = top + mid + bot;
      if (j > 0) {
        top -= +!!(gameState[index2 - width - 1] & 1 /* bomb */);
        mid -= +!!(gameState[index2 - 1] & 1 /* bomb */);
        bot -= +!!(gameState[index2 + width - 1] & 1 /* bomb */);
      }
    }
  }
}
function updateMask(game, index) {
  const indices = fillIndices(game.numbers, game.width, game.height, index, 0);
  for (let i = 0, l = indices.length; i < l; i++) {
    game.gameState[indices[i]] &= ~4 /* mask */;
  }
}
function fillIndices(numbers, width, height, index, target = numbers[index], indices = []) {
  indices.push(index);
  if (numbers[index] != target) return indices;
  for (let layer = index - width; layer <= index + width; layer += width) {
    for (let offset = -1; offset <= 1; offset++) {
      if (indices.includes(layer + offset) || Math.floor((layer + offset) / width) != Math.floor(layer / width))
        continue;
      fillIndices(numbers, width, height, layer + offset, target, indices);
    }
  }
  return indices;
}
function msToTimeFormat(ms) {
  return new Date(ms).toISOString().substring(11, 11 + 8);
}
function randomRange(max = 1, min = 0) {
  return Math.random() * (max - min) + min;
}
function initGame(ctx, game) {
  ctx.canvas.width = game.width * game.cellSize, ctx.canvas.height = game.height * game.cellSize;
  game.colors.bomb = game.colors.numbers = "red";
  game.colors.tileEdge = `rgb(${randomRange(255, 0)},${randomRange(255, 0)},${randomRange(255, 0)})`;
  game.colors.tile = `rgb(${randomRange(255, 0)},${randomRange(255, 0)},${randomRange(255, 0)})`;
  clearState(game.gameState, 4 /* mask */, game.width, game.height);
  clearState(game.numbers, 0, game.width, game.height);
  randomizeState(game.gameState, game.bombCount);
  calculateNums(game.gameState, game.numbers, game.width, game.height);
  drawGame(ctx, game);
}
function drawGame(ctx, game) {
  const old = ctx.fillStyle;
  const offset = 0.1;
  const padding = 0.2;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < game.height; i++) {
    for (let j = 0; j < game.width; j++) {
      const index = j + i * game.width;
      if (game.gameState[index] & 4 /* mask */) {
        ctx.fillStyle = game.colors.tileEdge;
        ctx.fillRect(
          j * game.cellSize,
          i * game.cellSize,
          game.cellSize,
          game.cellSize
        );
        ctx.fillStyle = game.colors.tile;
        ctx.fillRect(
          j * game.cellSize + padding,
          i * game.cellSize + padding,
          game.cellSize - padding * 2,
          game.cellSize - padding * 2
        );
        if (game.gameState[index] & 2 /* flag */) {
          ctx.fillStyle = "white";
          ctx.fillText(
            "F",
            (j + offset) * game.cellSize,
            (i + 1 - offset) * game.cellSize,
            game.cellSize
          );
        }
      } else if (game.gameState[index] & 1 /* bomb */) {
        ctx.fillStyle = game.colors.bomb;
        ctx.fillRect(
          j * game.cellSize,
          i * game.cellSize,
          game.cellSize,
          game.cellSize
        );
      } else {
        if (game.numbers[index] == 0) continue;
        ctx.fillStyle = game.colors.numbers;
        ctx.fillText(
          game.numbers[index].toString(),
          (j + offset) * game.cellSize,
          (i + 1 - offset) * game.cellSize,
          game.cellSize
        );
      }
    }
  }
  ctx.fillStyle = old;
}
function retrieveFormData(form, game) {
  game.bombCount = parseInt(
    form.elements.namedItem("bombCount").value
  );
  game.width = parseInt(
    form.elements.namedItem("width").value
  );
  game.height = parseInt(
    form.elements.namedItem("height").value
  );
}
globalThis.window.onload = () => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const form = document.querySelector("form");
  if (!form) return;
  const flagToggle = document.querySelector("#flag-toggle");
  if (!flagToggle) return;
  const contentBox = document.querySelector(".content");
  if (!contentBox) return;
  const flagCountSpan = document.querySelector(
    "#flag-count"
  );
  if (!flagCountSpan) return;
  const Game = {
    gameState: [],
    numbers: [],
    width: 20,
    height: 20,
    bombCount: 20,
    cellSize: 10,
    colors: { tileEdge: "green", tile: "grey", bomb: "red", numbers: "red" }
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
      Game.gameState[selectedIndex] ^= 2 /* flag */;
      drawGame(ctx, Game);
    }
    if ((Game.gameState[selectedIndex] & 2 /* flag */) == 0 && !flagMode) {
      updateMask(Game, selectedIndex);
      const exploded = !!(Game.gameState[selectedIndex] & 1 /* bomb */);
      const solved = Game.gameState.reduce((p, c) => p += +!!(c & 4 /* mask */), 0) == Game.bombCount;
      if (exploded || solved) {
        gameEnded = true;
        for (let i = 0, l = Game.gameState.length; i < l; i++) {
          Game.gameState[i] &= ~4 /* mask */;
        }
        const status = document.querySelector("#status");
        if (!status) return;
        const frontString = exploded ? "BOOM! Time wasted: " : "SOLVED! Solve time: ";
        status.innerHTML = `${frontString} ${msToTimeFormat(performance.now() - now)}`;
        if (solved && !exploded)
          Game.colors.bomb = Game.colors.numbers = "green";
      }
      drawGame(ctx, Game);
    }
    flagCountSpan.innerHTML = Game.gameState.reduce(
      (p, c) => p += +!!((c & (2 /* flag */ | 4 /* mask */)) == (2 /* flag */ | 4 /* mask */)),
      0
    ).toString();
  };
};
