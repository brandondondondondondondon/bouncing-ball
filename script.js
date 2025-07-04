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

const ballListContainer = document.getElementById('ball-list-container');
const ballListTable = document.getElementById('ball-list').getElementsByTagName('tbody')[0];

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

function handleBallCollisions() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BALL_RADIUS * 2) {
        // Simple elastic collision
        // Normalize
        const nx = dx / dist;
        const ny = dy / dist;
        // Relative velocity
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        // Velocity along normal
        const vn = dvx * nx + dvy * ny;
        if (vn < 0) {
          // Exchange velocity along normal
          const impulse = (2 * vn) / 2; // mass = 1 for both
          a.vx += impulse * nx;
          a.vy += impulse * ny;
          b.vx -= impulse * nx;
          b.vy -= impulse * ny;
        }
        // Separate balls
        const overlap = BALL_RADIUS * 2 - dist;
        a.x -= nx * overlap / 2;
        a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2;
        b.y += ny * overlap / 2;
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
  animationId = requestAnimationFrame(animate);
}

addBallBtn.addEventListener('click', () => {
  const x = parseFloat(xInput.value);
  const y = parseFloat(yInput.value);
  const vx = parseFloat(vxInput.value);
  const vy = parseFloat(vyInput.value);
  const color = colorInput.value || randomColor();
  if (editingIndex !== null) {
    // Update existing ball
    balls[editingIndex] = createBall(x, y, vx, vy, color);
    editingIndex = null;
    addBallBtn.textContent = 'Add Ball';
  } else {
    balls.push(createBall(x, y, vx, vy, color));
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
});

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
  balls = JSON.parse(JSON.stringify(initialBalls));
  for (const ball of balls) ball.trail = [];
  editingIndex = null;
  addBallBtn.textContent = 'Add Ball';
  updateBallListUI();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawAllBalls();
});

// Draw initial state
ctx.clearRect(0, 0, WIDTH, HEIGHT);
drawAllBalls();
updateBallListUI();
