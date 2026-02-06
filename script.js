const words = [
  "太阳", "海豚", "火锅", "跑步机", "樱花", "机器人", "钢琴", "火箭", "汉堡", "图书馆",
  "灯塔", "冰淇淋", "滑板", "西瓜", "风筝", "宇航员", "雪人", "雨伞", "相机", "灯泡"
];

const canvas = document.querySelector("#draw-board");
const ctx = canvas.getContext("2d");
const colorPicker = document.querySelector("#color-picker");
const brushSize = document.querySelector("#brush-size");
const brushValue = document.querySelector("#brush-value");
const clearButton = document.querySelector("#clear-canvas");
const hintButton = document.querySelector("#hint");
const newRoundButton = document.querySelector("#new-round");
const wordEl = document.querySelector("#current-word");
const timerEl = document.querySelector("#timer");
const scoreEl = document.querySelector("#score");
const guessForm = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess-input");
const guessMessage = document.querySelector("#guess-message");
const guessHistory = document.querySelector("#guess-history");

let drawing = false;
let currentWord = "";
let score = 0;
let countdown = 60;
let timerId = null;
let roundActive = false;

const drawingState = {
  strokes: [],
  lastPoint: null
};

const setCanvasScale = () => {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  redrawCanvas();
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const redrawCanvas = () => {
  clearCanvas();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawingState.strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });
};

const getPointerPosition = (event) => {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
};

const startDrawing = (event) => {
  drawing = true;
  const point = getPointerPosition(event);
  drawingState.lastPoint = point;
  const stroke = {
    color: colorPicker.value,
    size: Number(brushSize.value),
    points: [point]
  };
  drawingState.strokes.push(stroke);
};

const draw = (event) => {
  if (!drawing) return;
  const point = getPointerPosition(event);
  const stroke = drawingState.strokes[drawingState.strokes.length - 1];
  stroke.points.push(point);

  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(drawingState.lastPoint.x, drawingState.lastPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  drawingState.lastPoint = point;
};

const stopDrawing = () => {
  drawing = false;
  drawingState.lastPoint = null;
};

const updateBrush = () => {
  brushValue.textContent = `${brushSize.value}px`;
};

const resetRound = () => {
  currentWord = words[Math.floor(Math.random() * words.length)];
  wordEl.textContent = currentWord;
  guessHistory.innerHTML = "";
  guessMessage.textContent = "";
  guessMessage.classList.remove("success");
  countdown = 60;
  timerEl.textContent = countdown;
  roundActive = true;
  if (timerId) {
    clearInterval(timerId);
  }
  timerId = setInterval(() => {
    countdown -= 1;
    timerEl.textContent = countdown;
    if (countdown <= 0) {
      endRound("时间到！可以开始新局啦。", false);
    }
  }, 1000);
};

const endRound = (message, success) => {
  clearInterval(timerId);
  timerId = null;
  roundActive = false;
  guessMessage.textContent = message;
  guessMessage.classList.toggle("success", success);
};

const addHistory = (guess, isCorrect) => {
  const item = document.createElement("li");
  item.innerHTML = `
    <span>${guess}</span>
    <span class="tag">${isCorrect ? "正确" : "未猜中"}</span>
  `;
  guessHistory.prepend(item);
};

const handleGuess = (event) => {
  event.preventDefault();
  if (!roundActive) {
    guessMessage.textContent = currentWord ? "本局已结束，请开始新局。" : "请先开始新局。";
    guessMessage.classList.remove("success");
    return;
  }
  const guess = guessInput.value.trim();
  if (!guess) return;
  const isCorrect = guess === currentWord;
  addHistory(guess, isCorrect);
  if (isCorrect) {
    score += 10 + countdown;
    scoreEl.textContent = score;
    endRound("太棒了！猜对啦！", true);
  } else {
    guessMessage.textContent = "再试试看～";
    guessMessage.classList.remove("success");
  }
  guessInput.value = "";
};

const giveHint = () => {
  if (!roundActive) {
    guessMessage.textContent = currentWord ? "本局已结束，请开始新局。" : "请先开始新局。";
    guessMessage.classList.remove("success");
    return;
  }
  const hintLength = Math.max(1, Math.floor(currentWord.length / 2));
  const hint = `${currentWord.slice(0, hintLength)}${"*".repeat(currentWord.length - hintLength)}`;
  guessMessage.textContent = `提示：${hint}`;
  guessMessage.classList.remove("success");
};

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  startDrawing(event);
});
canvas.addEventListener("touchmove", (event) => {
  event.preventDefault();
  draw(event);
});
canvas.addEventListener("touchend", stopDrawing);

clearButton.addEventListener("click", () => {
  drawingState.strokes = [];
  clearCanvas();
});

hintButton.addEventListener("click", giveHint);
newRoundButton.addEventListener("click", () => {
  drawingState.strokes = [];
  clearCanvas();
  resetRound();
});

brushSize.addEventListener("input", updateBrush);
guessForm.addEventListener("submit", handleGuess);

window.addEventListener("resize", () => {
  setCanvasScale();
});

updateBrush();
setCanvasScale();
clearCanvas();
