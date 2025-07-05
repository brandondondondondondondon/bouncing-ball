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
const sizeInput = document.getElementById('ball-size');
const elasticityInput = document.getElementById('ball-elasticity');
const massInput = document.getElementById('ball-mass');

const BALL_RADIUS = 20;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.7;
const DAMPING = 0.8;
let TRAIL_LENGTH = 80; // Longer trail
const TRAIL_WIDTH = 6; // Skinnier trail

const ballListContainer = document.getElementById('ball-list-container');
const ballListTable = document.getElementById('ball-list').getElementsByTagName('tbody')[0];

function randomColor() {
  return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
}

function createBall(x, y, vx, vy, color, size, elasticity, mass) {
  return {
    x, y, vx, vy, color,
    size: size || 20,
    elasticity: elasticity !== undefined ? elasticity : 0.8,
    mass: mass !== undefined ? mass : 1,
    trail: [] // Array of {x, y, alpha}
  };
}

let balls = [createBall(100, 100, 2, 2, '#ff5252', 20, 0.8, 1)];
let initialBalls = JSON.parse(JSON.stringify(balls));
let running = false;
let paused = false;
let animationId = null;
let editingIndex = null;

function updateBallListUI() {
  ballListTable.innerHTML = '';
  balls.forEach((ball, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${Math.round(ball.x)}</td>
      <td>${Math.round(ball.y)}</td>
      <td>${ball.vx}</td>
      <td>${ball.vy}</td>
      <td><span style="display:inline-block;width:20px;height:20px;background:${ball.color};border-radius:50%;border:1px solid #ccc;"></span></td>
      <td>${ball.size}</td>
      <td>${ball.elasticity}</td>
      <td>${ball.mass}</td>
      <td>
        <button class="edit-btn" data-idx="${i}">Edit</button>
        <button class="remove-btn" data-idx="${i}">Remove</button>
      </td>
    `;
    ballListTable.appendChild(row);
  });
  // Add event listeners for edit/remove
  ballListTable.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      editBall(idx);
    });
  });
  ballListTable.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      removeBall(idx);
    });
  });
}

function editBall(idx) {
  const ball = balls[idx];
  xInput.value = ball.x;
  yInput.value = ball.y;
  vxInput.value = ball.vx;
  vyInput.value = ball.vy;
  colorInput.value = ball.color;
  sizeInput.value = ball.size;
  elasticityInput.value = ball.elasticity;
  massInput.value = ball.mass;
  editingIndex = idx;
  addBallBtn.textContent = 'Update Ball';
}

function removeBall(idx) {
  balls.splice(idx, 1);
  initialBalls = JSON.parse(JSON.stringify(balls));
  updateBallListUI();
  drawAllBalls();
}

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
  ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
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
  if (ball.y + ball.size > HEIGHT) {
    ball.y = HEIGHT - ball.size;
    ball.vy *= -ball.elasticity;
  }
  // Bounce off ceiling
  if (ball.y - ball.size < 0) {
    ball.y = ball.size;
    ball.vy *= -ball.elasticity;
  }
  // Bounce off right wall
  if (ball.x + ball.size > WIDTH) {
    ball.x = WIDTH - ball.size;
    ball.vx *= -ball.elasticity;
  }
  // Bounce off left wall
  if (ball.x - ball.size < 0) {
    ball.x = ball.size;
    ball.vx *= -ball.elasticity;
  }

  // Add to trail
  ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 0.5 });
  if (ball.trail.length > TRAIL_LENGTH) ball.trail.pop();
  // Fade trail
  for (let i = 0; i < ball.trail.length; i++) {
    ball.trail[i].alpha *= 0.95;
  }
}

function blendColors(colorA, colorB) {
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16)
    ];
  }
  function rgbToHex([r, g, b]) {
    return (
      '#' +
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0')
    );
  }
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  // Compute color distance
  const dist = Math.sqrt(
    Math.pow(rgbA[0] - rgbB[0], 2) +
    Math.pow(rgbA[1] - rgbB[1], 2) +
    Math.pow(rgbA[2] - rgbB[2], 2)
  );
  let blended;
  if (dist < 40) {
    // If colors are close, blend exactly
    blended = [
      Math.round((rgbA[0] + rgbB[0]) / 2),
      Math.round((rgbA[1] + rgbB[1]) / 2),
      Math.round((rgbA[2] + rgbB[2]) / 2)
    ];
  } else {
    // Otherwise, add randomness
    blended = [
      Math.max(0, Math.min(255, Math.round((rgbA[0] + rgbB[0]) / 2 + randomInRange(-20, 20)))),
      Math.max(0, Math.min(255, Math.round((rgbA[1] + rgbB[1]) / 2 + randomInRange(-20, 20)))),
      Math.max(0, Math.min(255, Math.round((rgbA[2] + rgbB[2]) / 2 + randomInRange(-20, 20))))
    ];
  }
  return rgbToHex(blended);
}

function handleBallCollisions() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < a.size + b.size) {
        // Elastic collision with mass
        const nx = dx / dist;
        const ny = dy / dist;
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const vn = dvx * nx + dvy * ny;
        if (vn < 0) {
          // Calculate impulse with both masses and average elasticity
          const e = (a.elasticity + b.elasticity) / 2;
          const impulse = (-(1 + e) * vn) / (1 / a.mass + 1 / b.mass);
          a.vx -= (impulse * nx) / a.mass;
          a.vy -= (impulse * ny) / a.mass;
          b.vx += (impulse * nx) / b.mass;
          b.vy += (impulse * ny) / b.mass;
        }
        // Separate balls
        const overlap = a.size + b.size - dist;
        a.x -= nx * overlap * (b.mass / (a.mass + b.mass));
        a.y -= ny * overlap * (b.mass / (a.mass + b.mass));
        b.x += nx * overlap * (a.mass / (a.mass + b.mass));
        b.y += ny * overlap * (a.mass / (a.mass + b.mass));
        // Blend colors on collision
        const blended = blendColors(a.color, b.color);
        a.color = blended;
        b.color = blended;
      }
    }
  }
}

function animate() {
  if (!running || paused) return;
  ctx.fillStyle = 'rgba(34,34,34,0.15)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (const ball of balls) {
    drawBall(ball);
  }
  for (const ball of balls) {
    updateBall(ball);
  }
  handleBallCollisions();
  // Slow down animation: 30 FPS (about 33ms per frame)
  setTimeout(() => {
    animationId = requestAnimationFrame(animate);
  }, 33);
}

function drawAllBalls() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  for (const ball of balls) {
    drawBall(ball);
  }
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomBallProps() {
  // Wider bounds for more chaos
  const size = randomInRange(10, 40); // 10-40 px
  const elasticity = randomInRange(0.4, 0.99); // 0.4-0.99
  const mass = randomInRange(0.3, 2.5); // 0.3-2.5
  return { size, elasticity, mass };
}

function onAddBallClick() {
  // Prefer random position, top area, but allow more spread for chaos
  const size = parseFloat(sizeInput.value);
  const x = randomInRange(size + 5, WIDTH - size - 5);
  const y = randomInRange(size + 5, HEIGHT * randomInRange(0.05, 0.4)); // Top 5%-40% of canvas
  const vx = randomInRange(-10, 10); // More chaotic velocity
  const vy = randomInRange(-10, 10);
  let color = colorInput.value;
  let elasticity = parseFloat(elasticityInput.value);
  let mass = parseFloat(massInput.value);

  // If user hasn't changed the default values, randomize them
  let useRandom = false;
  if (
    sizeInput.value == 20 &&
    elasticityInput.value == 0.8 &&
    massInput.value == 1 &&
    colorInput.value == '#ff5252' &&
    editingIndex === null
  ) {
    useRandom = true;
    const rand = getRandomBallProps();
    color = randomColor();
    elasticity = rand.elasticity;
    mass = rand.mass;
    sizeInput.value = rand.size.toFixed(1);
    elasticityInput.value = elasticity.toFixed(2);
    massInput.value = mass.toFixed(2);
    colorInput.value = color;
  }

  if (editingIndex !== null) {
    // For editing, use the form values
    const editX = parseFloat(xInput.value);
    const editY = parseFloat(yInput.value);
    balls[editingIndex] = createBall(editX, editY, vx, vy, color, size, elasticity, mass);
    editingIndex = null;
    addBallBtn.textContent = 'Add Ball';
  } else {
    balls.push(createBall(x, y, vx, vy, color, size, elasticity, mass));
  }
  initialBalls = JSON.parse(JSON.stringify(balls));
  updateBallListUI();
  drawAllBalls();
  // Reset form
  xInput.value = 100;
  yInput.value = 100;
  vxInput.value = 2;
  vyInput.value = 2;
  colorInput.value = '#ff5252';
  sizeInput.value = 20;
  elasticityInput.value = 0.8;
  massInput.value = 1;
}

function onStartClick() {
  // Reset all trails
  for (const ball of balls) ball.trail = [];
  running = true;
  paused = false;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  animate();
}

function onPauseClick() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  if (!paused) {
    animate();
  } else {
    cancelAnimationFrame(animationId);
  }
}

function onResetClick() {
  running = false;
  paused = false;
  pauseBtn.textContent = 'Pause';
  balls = JSON.parse(JSON.stringify(initialBalls));
  for (const ball of balls) ball.trail = [];
  editingIndex = null;
  addBallBtn.textContent = 'Add Ball';
  updateBallListUI();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawAllBalls();
}

function onCanvasClick() {
  // Shake all balls: add a random velocity boost
  for (const ball of balls) {
    ball.vx += randomInRange(-10, 10);
    ball.vy += randomInRange(-10, 10);
  }
}

function onKeyDown(e) {
  if (e.key === 'a' || e.key === 'A') {
    // Add a random ball with more chaos
    const rand = getRandomBallProps();
    const x = randomInRange(rand.size + 5, WIDTH - rand.size - 5);
    const y = randomInRange(rand.size + 5, HEIGHT * randomInRange(0.05, 0.4));
    const vx = randomInRange(-10, 10);
    const vy = randomInRange(-10, 10);
    const color = randomColor();
    balls.push(createBall(x, y, vx, vy, color, rand.size, rand.elasticity, rand.mass));
    initialBalls = JSON.parse(JSON.stringify(balls));
    updateBallListUI();
    drawAllBalls();
  }
}

addBallBtn.addEventListener('click', onAddBallClick);
startBtn.addEventListener('click', onStartClick);
pauseBtn.addEventListener('click', onPauseClick);
resetBtn.addEventListener('click', onResetClick);
canvas.addEventListener('click', onCanvasClick);
document.addEventListener('keydown', onKeyDown);

// Draw initial state
ctx.clearRect(0, 0, WIDTH, HEIGHT);
drawAllBalls();
updateBallListUI();
