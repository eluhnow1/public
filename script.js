// Sound Manager
const collisionSound = new Audio('pipe.mp3');
const SOUND_POOL_SIZE = 5;
const soundPool = Array.from({ length: SOUND_POOL_SIZE }, () => {
  const audio = new Audio('pipe.mp3');
  audio.volume = 0.3;
  return audio;
});
let currentSound = 0;

function playCollisionSound() {
  // 5% chance to play sound
  if (Math.random() < 0.05) {
    soundPool[currentSound].currentTime = 0;
    soundPool[currentSound].play();
    currentSound = (currentSound + 1) % SOUND_POOL_SIZE;
  }
}

// Drawing settings
let currentColor = '#FFFFFF';
let lineWidth = 2;

// Create controls
const controlsContainer = document.createElement('div');
controlsContainer.className = 'controls-container';

// Color controls
const colorGroup = document.createElement('div');
colorGroup.className = 'control-group';
const colorLabel = document.createElement('div');
colorLabel.className = 'control-label';
colorLabel.textContent = 'Color:';
colorGroup.appendChild(colorLabel);

const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
colors.forEach(color => {
  const button = document.createElement('div');
  button.className = 'color-button' + (color === currentColor ? ' active' : '');
  button.style.backgroundColor = color;
  button.addEventListener('click', () => {
    document.querySelectorAll('.color-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentColor = color;
  });
  colorGroup.appendChild(button);
});

// Line width controls
const widthGroup = document.createElement('div');
widthGroup.className = 'control-group';
const widthLabel = document.createElement('div');
widthLabel.className = 'control-label';
widthLabel.textContent = 'Width:';
widthGroup.appendChild(widthLabel);

const widthSlider = document.createElement('input');
widthSlider.type = 'range';
widthSlider.id = 'line-width-slider';
widthSlider.min = '1';
widthSlider.max = '20';
widthSlider.value = lineWidth;

const currentWidthDisplay = document.createElement('div');
currentWidthDisplay.id = 'current-width';
currentWidthDisplay.textContent = lineWidth;

widthSlider.addEventListener('input', (e) => {
  lineWidth = parseInt(e.target.value);
  currentWidthDisplay.textContent = lineWidth;
});

widthGroup.appendChild(widthSlider);
widthGroup.appendChild(currentWidthDisplay);

// Add all controls to container
controlsContainer.appendChild(colorGroup);
controlsContainer.appendChild(widthGroup);
document.body.appendChild(controlsContainer);

const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clear-button');
const trailCanvas = document.getElementById('trail-canvas');
const trailCtx = trailCanvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  trailCanvas.width = window.innerWidth;
  trailCanvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let lines = [];

function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.clientX, e.clientY];
}

function stopDrawing() {
  isDrawing = false;
}

function draw(e) {
  if (!isDrawing) return;
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.clientX, e.clientY);
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  lines.push({
    x1: lastX,
    y1: lastY,
    x2: e.clientX,
    y2: e.clientY,
    color: currentColor,
    width: lineWidth
  });
  
  [lastX, lastY] = [e.clientX, e.clientY];
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines = [];
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
clearButton.addEventListener('click', clearCanvas);

const ASTEROID_SIZE = 40;
const ASTEROID_COUNT = 10;
const asteroids = [];

class Asteroid {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'asteroid';
    document.body.appendChild(this.element);
    
    do {
      this.x = Math.random() * (window.innerWidth - ASTEROID_SIZE);
      this.y = Math.random() * (window.innerHeight - ASTEROID_SIZE);
    } while (this.checkOverlap());
    
    const speed = 2;
    const angle = Math.random() * Math.PI * 2;
    this.dx = Math.cos(angle) * speed;
    this.dy = Math.sin(angle) * speed;
    
    this.trail = [];
    this.updatePosition();
    this.updateRotation();
  }

  checkOverlap() {
    for (let asteroid of asteroids) {
      const dx = this.x - asteroid.x;
      const dy = this.y - asteroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < ASTEROID_SIZE) return true;
    }
    return false;
  }

  updatePosition() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }

  updateRotation() {
    const angle = Math.atan2(this.dy, this.dx);
    const degrees = angle * (180 / Math.PI);
    this.element.style.transform = `rotate(${degrees}deg)`;
  }

  move() {
    let newX = this.x + this.dx;
    let newY = this.y + this.dy;
    let collisionOccurred = false;

    // Wall collisions
    if (newX + ASTEROID_SIZE > window.innerWidth || newX < 0) {
      this.dx = -this.dx;
      newX = this.x + this.dx;
      collisionOccurred = true;
    }
    if (newY + ASTEROID_SIZE > window.innerHeight || newY < 0) {
      this.dy = -this.dy;
      newY = this.y + this.dy;
      collisionOccurred = true;
    }

    // Line collisions
    for (let line of lines) {
      if (this.lineCircleCollision(line, newX + ASTEROID_SIZE/2, newY + ASTEROID_SIZE/2, ASTEROID_SIZE/2)) {
        const nx = line.y2 - line.y1;
        const ny = line.x1 - line.x2;
        const length = Math.sqrt(nx * nx + ny * ny);
        const unitNormal = {x: nx / length, y: ny / length};
        
        const dotProduct = this.dx * unitNormal.x + this.dy * unitNormal.y;
        this.dx -= 2 * dotProduct * unitNormal.x;
        this.dy -= 2 * dotProduct * unitNormal.y;
        
        newX = this.x + this.dx;
        newY = this.y + this.dy;
        collisionOccurred = true;
        break;
      }
    }

    // Asteroid-to-asteroid collisions
    for (let asteroid of asteroids) {
      if (asteroid === this) continue;
      const dx = newX - asteroid.x;
      const dy = newY - asteroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < ASTEROID_SIZE) {
        // Collision detected, calculate new velocities
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        // Rotate velocities
        const vx1 = this.dx * cos + this.dy * sin;
        const vy1 = this.dy * cos - this.dx * sin;
        const vx2 = asteroid.dx * cos + asteroid.dy * sin;
        const vy2 = asteroid.dy * cos - asteroid.dx * sin;

        // Swap velocities
        [this.dx, asteroid.dx] = [vx2 * cos - vy1 * sin, vx1 * cos - vy2 * sin];
        [this.dy, asteroid.dy] = [vy1 * cos + vx2 * sin, vy2 * cos + vx1 * sin];

        // Move asteroids apart to prevent sticking
        const overlap = ASTEROID_SIZE - distance;
        newX += overlap * cos / 2;
        newY += overlap * sin / 2;
        asteroid.x -= overlap * cos / 2;
        asteroid.y -= overlap * sin / 2;
        asteroid.updatePosition();
        asteroid.updateRotation();
        collisionOccurred = true;
        break;
      }
    }

    // Play sound if collision occurred
    if (collisionOccurred) {
      playCollisionSound();
    }

    this.trail.unshift({ x: this.x + ASTEROID_SIZE / 2, y: this.y + ASTEROID_SIZE / 2, life: 60 });
    if (this.trail.length > 60) {
      this.trail.pop();
    }

    this.x = newX;
    this.y = newY;
    this.updatePosition();
    this.updateRotation();
  }

  drawTrail() {
    for (let i = 0; i < this.trail.length; i++) {
      const particle = this.trail[i];
      const opacity = particle.life / 20;
      const size = 5 * opacity;
      trailCtx.beginPath();
      trailCtx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      trailCtx.fillStyle = `rgba(255, ${Math.floor(165 * opacity)}, 0, ${opacity})`;
      trailCtx.fill();
      particle.life--;
    }
    this.trail = this.trail.filter(particle => particle.life > 0);
  }

  lineCircleCollision(line, cx, cy, r) {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const dot = ((cx - line.x1) * dx + (cy - line.y1) * dy) / (len * len);
    const closestX = line.x1 + dot * dx;
    const closestY = line.y1 + dot * dy;
    
    if (dot < 0 || dot > 1) {
      return false;
    }
    
    const distX = closestX - cx;
    const distY = closestY - cy;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    return distance <= r;
  }
}

for (let i = 0; i < ASTEROID_COUNT; i++) {
  asteroids.push(new Asteroid());
}

function animateAsteroids() {
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  for (let asteroid of asteroids) {
    asteroid.move();
    asteroid.drawTrail();
  }
  requestAnimationFrame(animateAsteroids);
}

animateAsteroids();

// Background animation
const bgCanvas = document.getElementById('background-canvas');
const bgCtx = bgCanvas.getContext('2d');

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

resizeBgCanvas();
window.addEventListener('resize', resizeBgCanvas);

const particles = [];
const particleCount = 100;

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * bgCanvas.width;
    this.y = Math.random() * bgCanvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * 1 - 0.5;
    this.life = Math.random() * 100 + 50;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;

    if (this.life <= 0 || this.x < 0 || this.x > bgCanvas.width || this.y < 0 || this.y > bgCanvas.height) {
      this.reset();
    }
  }

  draw() {
    bgCtx.fillStyle = `rgba(255, 255, 255, ${this.life / 100})`;
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    bgCtx.closePath();
    bgCtx.fill();
  }
}

function initParticles() {
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function animateParticles() {
  bgCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  for (let particle of particles) {
    particle.update();
    particle.draw();
  }
  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();