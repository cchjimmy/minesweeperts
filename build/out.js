var States = /* @__PURE__ */ ((States2) => {
  States2[States2["bomb"] = 1] = "bomb";
  States2[States2["clear"] = 0] = "clear";
  return States2;
})(States || {});
function clearState(gameState, value, width, height) {
  gameState.length = width * height;
  gameState.fill(value);
}
function randomizeState(gameState, bombCount) {
  for (let i = 0, l = gameState.length; i < l; i++) {
    const chance = bombCount / (l - i);
    if (Math.random() > chance && !gameState[i]) continue;
    gameState[i] = 1 /* bomb */;
    bombCount--;
  }
}
function drawState(ctx, gameState, numbers, width, height, cellSize) {
  const old = ctx.fillStyle;
  const offset = 0.1;
  ctx.fillStyle = "red";
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const index = j + i * width;
      if (!gameState[index]) {
        if (numbers[index] == 0) continue;
        ctx.fillText(
          numbers[index].toString(),
          (j + offset) * cellSize,
          (i + 1 - offset) * cellSize,
          cellSize
        );
      } else {
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }
  ctx.fillStyle = old;
}
function resize(canvas) {
  if (canvas.width / canvas.height > innerWidth / innerHeight) {
    canvas.style.width = "100%";
    canvas.style.height = "";
  } else {
    canvas.style.width = "";
    canvas.style.height = "100%";
  }
}
function calculateNums(gameState, numbers, width, height) {
  for (let i = 0; i < height; i++) {
    const index = i * width;
    let top = +!!gameState[index - width];
    let mid = +!!gameState[index];
    let bot = +!!gameState[index + width];
    for (let j = 0; j < width; j++) {
      const index2 = j + i * width;
      if (j < width - 1) {
        top += +!!gameState[index2 + 1 - width];
        mid += +!!gameState[index2 + 1];
        bot += +!!gameState[index2 + 1 + width];
      }
      numbers[index2] = top + mid + bot;
      if (j > 0) {
        top -= +!!gameState[index2 - width - 1];
        mid -= +!!gameState[index2 - 1];
        bot -= +!!gameState[index2 + width - 1];
      }
    }
  }
}
function drawMask(ctx, mask, width, height, cellSize) {
  const old = ctx.fillStyle;
  const padding = 0.1;
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const index = j + i * width;
      if (mask[index]) continue;
      ctx.fillStyle = "green";
      ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      ctx.fillStyle = "grey";
      ctx.fillRect(
        j * cellSize + padding,
        i * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2
      );
    }
  }
  ctx.fillStyle = old;
}
function updateMask(game, index) {
  const indices = fillIndices(game.numbers, game.width, game.height, index, 0);
  for (let i = 0, l = indices.length; i < l; i++) {
    game.mask[indices[i]] = 1;
  }
}
function fillIndices(numbers, width, height, index, target = numbers[index], indices = []) {
  indices.push(index);
  if (numbers[index] != target) return indices;
  for (let layers = index - width; layers <= index + width; layers += width) {
    for (let offset = -1; offset <= 1; offset++) {
      if (!indices.includes(layers + offset) && Math.floor((layers + offset) / width) == Math.floor(layers / width)) {
        fillIndices(numbers, width, height, layers + offset, target, indices);
      }
    }
  }
  return indices;
}
function msToTimeFormat(ms) {
  return new Date(ms).toISOString().substring(11, 11 + 8);
}
function initGame(ctx, game) {
  ctx.canvas.width = game.width * game.cellSize, ctx.canvas.height = game.height * game.cellSize;
  clearState(game.gameState, 0 /* clear */, game.width, game.height);
  clearState(game.numbers, 0, game.width, game.height);
  clearState(game.mask, 0, game.width, game.height);
  randomizeState(game.gameState, game.bombCount);
  calculateNums(game.gameState, game.numbers, game.width, game.height);
  drawGame(ctx, game);
}
function drawGame(ctx, game) {
  drawState(
    ctx,
    game.gameState,
    game.numbers,
    game.width,
    game.height,
    game.cellSize
  );
  drawMask(ctx, game.mask, game.width, game.height, game.cellSize);
}
const Game = {
  gameState: [],
  numbers: [],
  mask: [],
  width: 20,
  height: 20,
  bombCount: 20,
  cellSize: 10
};
function retrieveFormData(form, game) {
  if (!form) return;
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
  globalThis.onresize = () => resize(canvas);
  retrieveFormData(form, Game);
  initGame(ctx, Game);
  let now = performance.now();
  form.onsubmit = (e) => {
    e.preventDefault();
    retrieveFormData(form, Game);
    initGame(ctx, Game);
    now = performance.now();
  };
  resize(canvas);
  globalThis.onpointerdown = (e) => {
    const rect = canvas.getBoundingClientRect();
    let x = e.x - rect.left;
    let y = e.y - rect.top;
    if (canvas.width / canvas.height > innerWidth / innerHeight) {
      x *= canvas.width / innerWidth;
      y *= canvas.width / innerWidth;
    } else {
      x *= canvas.height / innerHeight;
      y *= canvas.height / innerHeight;
    }
    x /= Game.cellSize;
    y /= Game.cellSize;
    x = Math.floor(x);
    y = Math.floor(y);
    const selectedIndex = x + y * Game.width;
    updateMask(Game, selectedIndex);
    if (Game.gameState[selectedIndex]) {
      Game.mask.fill(1);
      console.log(
        `BOOM! Time wasted: ${msToTimeFormat(performance.now() - now)}`
      );
      const status = document.querySelector("#status");
      if (!status) return;
      status.innerHTML = `BOOM! Time wasted: ${msToTimeFormat(performance.now() - now)}`;
    }
    if (Game.mask.reduce((p, c) => p += +(c == 0), 0) == Game.bombCount) {
      console.log(
        `SOLVED! Solve time: ${msToTimeFormat(performance.now() - now)}`
      );
      const status = document.querySelector("#status");
      if (!status) return;
      status.innerHTML = `SOLVED! Solve time: ${msToTimeFormat(performance.now() - now)}`;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGame(ctx, Game);
  };
};
