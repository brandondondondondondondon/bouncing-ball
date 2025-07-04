const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

const xInput = document.getElementById('ball-x');
const yInput = document.getElementById('ball-y');
const vxInput = document.getElementById('vel-x');
const vyInput = document.getElementById('vel-y');

const BALL_RADIUS = 20;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.25;
const DAMPING = 0.8;

let initialState = { x: 100, y: 100, vx: 2, vy: 2 };
let ball = { ...initialState };
let running = false;
let paused = false;
let animationId = null;

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#ff5252';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function updateBall() {
  ball.vy += GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Bounce off floor
  if (ball.y + BALL_RADIUS > HEIGHT) {
    ball.y = HEIGHT - BALL_RADIUS;
    ball.vy *= -DAMPING;
  }
  // Bounce off ceiling
  if (ball.y - BALL_RADIUS < 0) {
    ball.y = BALL_RADIUS;
    ball.vy *= -DAMPING;
  }
  // Bounce off right wall
  if (ball.x + BALL_RADIUS > WIDTH) {
    ball.x = WIDTH - BALL_RADIUS;
    ball.vx *= -DAMPING;
  }
  // Bounce off left wall
  if (ball.x - BALL_RADIUS < 0) {
    ball.x = BALL_RADIUS;
    ball.vx *= -DAMPING;
  }
}

function animate() {
  if (!running || paused) return;
  // Trail effect: draw a semi-transparent rectangle over the canvas
  ctx.fillStyle = 'rgba(34,34,34,0.2)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBall();
  updateBall();
  animationId = requestAnimationFrame(animate);
}

startBtn.addEventListener('click', () => {
  ball.x = parseFloat(xInput.value);
  ball.y = parseFloat(yInput.value);
  ball.vx = parseFloat(vxInput.value);
  ball.vy = parseFloat(vyInput.value);
  initialState = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy };
  running = true;
  paused = false;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  animate();
});

pauseBtn.addEventListener('click', () => {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  if (!paused) {
    animate();
  } else {
    cancelAnimationFrame(animationId);
  }
});

resetBtn.addEventListener('click', () => {
  running = false;
  paused = false;
  pauseBtn.textContent = 'Pause';
  ball = { ...initialState };
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBall();
});

// Draw initial ball
ctx.clearRect(0, 0, WIDTH, HEIGHT);
drawBall();
