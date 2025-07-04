const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const addBallBtn = document.getElementById('add-ball-btn');

const xInput = document.getElementById('ball-x');
const yInput = document.getElementById('ball-y');
const vxInput = document.getElementById('vel-x');
const vyInput = document.getElementById('vel-y');
const colorInput = document.getElementById('ball-color');

const BALL_RADIUS = 20;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.25;
const DAMPING = 0.8;
const TRAIL_LENGTH = 40; // Number of trail points to keep
const TRAIL_WIDTH = 6; // Skinnier trail

function randomColor() {
  return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
}

function createBall(x, y, vx, vy, color) {
  return {
    x, y, vx, vy, color,
    trail: [] // Array of {x, y, alpha}
  };
}

let balls = [createBall(100, 100, 2, 2, '#ff5252')];
let initialBalls = JSON.parse(JSON.stringify(balls));
let running = false;
let paused = false;
let animationId = null;

function drawBall(ball) {
  // Draw trail
  for (let i = 0; i < ball.trail.length; i++) {
    const t = ball.trail[i];
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.beginPath();
    ctx.arc(t.x, t.y, TRAIL_WIDTH, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.restore();
  }
  // Draw ball
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function updateBall(ball) {
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

  // Add to trail
  ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 0.5 });
  if (ball.trail.length > TRAIL_LENGTH) ball.trail.pop();
  // Fade trail
  for (let i = 0; i < ball.trail.length; i++) {
    ball.trail[i].alpha *= 0.95;
  }
}

function animate() {
  if (!running || paused) return;
  ctx.fillStyle = 'rgba(34,34,34,0.15)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (const ball of balls) {
    drawBall(ball);
    updateBall(ball);
  }
  animationId = requestAnimationFrame(animate);
}

addBallBtn.addEventListener('click', () => {
  const x = parseFloat(xInput.value);
  const y = parseFloat(yInput.value);
  const vx = parseFloat(vxInput.value);
  const vy = parseFloat(vyInput.value);
  const color = colorInput.value || randomColor();
  balls.push(createBall(x, y, vx, vy, color));
  initialBalls = JSON.parse(JSON.stringify(balls));
  drawAllBalls();
});

function drawAllBalls() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  for (const ball of balls) {
    drawBall(ball);
  }
}

startBtn.addEventListener('click', () => {
  // Reset all trails
  for (const ball of balls) ball.trail = [];
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
  // Deep copy initial balls
  balls = JSON.parse(JSON.stringify(initialBalls));
  for (const ball of balls) ball.trail = [];
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawAllBalls();
});

// Draw initial state
ctx.clearRect(0, 0, WIDTH, HEIGHT);
drawAllBalls();
