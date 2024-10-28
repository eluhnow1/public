// Replace the import statement with this
const db = firebase.firestore();

// Settings document reference
const settingsRef = db.collection('lineSettings').doc('userSettings');


// Sound Manager
const collisionSound = new Audio('boom.mp3');
const SOUND_POOL_SIZE = 5;
const soundPool = Array.from({ length: SOUND_POOL_SIZE }, () => {
  const audio = new Audio('boom.mp3');
  audio.volume = 0.3;
  return audio;
});
let currentSound = 0;

function playCollisionSound() {
    soundPool[currentSound].currentTime = 0;
    soundPool[currentSound].play();
    currentSound = (currentSound + 1) % SOUND_POOL_SIZE;
}

// Particle explosion system
class ExplosionParticle {
  constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const speed = Math.random() * 8 + 2; // Particles shoot out at different speeds
      const angle = Math.random() * Math.PI * 2; // Random directions
      this.dx = Math.cos(angle) * speed;
      this.dy = Math.sin(angle) * speed;
      this.life = 1.0; // Start at full life
      this.color = color || `hsl(${Math.random() * 60 + 15}, 100%, 60%)`; // Orange/yellow range
      this.size = Math.random() * 4 + 2;
  }

  update() {
      this.x += this.dx;
      this.dy += 0.2; // Gravity effect
      this.y += this.dy;
      this.life -= 0.02; // Fade out
      this.size *= 0.96; // Shrink
      return this.life > 0;
  }

  draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace('1.0', this.life);
      ctx.fill();
      
      // Optional: Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color.replace('1.0', this.life * 0.5);
      ctx.fill();
      ctx.shadowBlur = 0;
  }
}

// Add to your global variables
let explosionParticles = [];

// Add this function to create explosions
function createExplosion(x, y, velocity) {
  const particleCount = Math.floor(Math.abs(velocity) * 5) + 20; // More particles for faster collisions
  const baseColor = `hsla(${Math.random() * 60 + 15}, 100%, 60%,`; // Base color for this explosion
  
  for (let i = 0; i < particleCount; i++) {
      explosionParticles.push(new ExplosionParticle(x, y, baseColor + '1.0)'));
  }
}

//screen shake
let screenShakeTime = 0;
let screenShakeIntensity = 0;

function startScreenShake(intensity = 5, duration = 200) {
    screenShakeTime = duration;
    screenShakeIntensity = intensity;
}

function applyScreenShake() {
    if (screenShakeTime > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        const shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        document.body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        screenShakeTime -= 16.67; // Roughly 60fps
    } else {
        document.body.style.transform = 'translate(0px, 0px)';
    }
}

// Drawing settings with default values
let currentColor = '#FFFFFF';
let lineWidth = 2;


// Function to save settings to Firestore
async function saveSettings() {
  try {
    await settingsRef.set({
      color: currentColor,
      width: lineWidth
    });
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

// Function to load settings from Firestore
async function loadSettings() {
  try {
    const doc = await settingsRef.get();
    if (doc.exists) {
      const data = doc.data();
      currentColor = data.color;
      lineWidth = data.width;
      updateUISettings();
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

// Function to update UI based on loaded settings
function updateUISettings() {
  document.querySelectorAll('.color-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.style.backgroundColor === currentColor) {
      btn.classList.add('active');
    }
  });
  
  const widthSlider = document.getElementById('line-width-slider');
  const currentWidthDisplay = document.getElementById('current-width');
  if (widthSlider && currentWidthDisplay) {
    widthSlider.value = lineWidth;
    currentWidthDisplay.textContent = lineWidth;
  }
}

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
    saveSettings(); // Save when color changes
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
  saveSettings(); // Save when width changes
});

widthGroup.appendChild(widthSlider);
widthGroup.appendChild(currentWidthDisplay);

// Add all controls to container
controlsContainer.appendChild(colorGroup);
controlsContainer.appendChild(widthGroup);
document.body.appendChild(controlsContainer);

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings);

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
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.setupDragging();
    
    do {
      this.x = Math.random() * (window.innerWidth - ASTEROID_SIZE);
      this.y = Math.random() * (window.innerHeight - ASTEROID_SIZE);
    } while (this.checkOverlap());
    
    // Remove the speed constant - let initial speed be higher
    const angle = Math.random() * Math.PI * 2;
    this.dx = Math.cos(angle) * 5; // Increased from 2 to 5 for initial speed
    this.dy = Math.sin(angle) * 5;
    
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
    if (this.isDragging) return;
    let newX = this.x + this.dx;
    let newY = this.y + this.dy;
    let collisionOccurred = false;

    // Wall collisions - no speed normalization
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

    // Line collisions - remove speed normalization
    for (let line of lines) {
      if (this.lineCircleCollision(line, newX + ASTEROID_SIZE/2, newY + ASTEROID_SIZE/2, ASTEROID_SIZE/2)) {
        const nx = line.y2 - line.y1;
        const ny = line.x1 - line.x2;
        const length = Math.sqrt(nx * nx + ny * ny);
        const unitNormal = {x: nx / length, y: ny / length};
        
        const dotProduct = this.dx * unitNormal.x + this.dy * unitNormal.y;
        this.dx -= 2 * dotProduct * unitNormal.x;
        this.dy -= 2 * dotProduct * unitNormal.y;
        
        // Remove velocity normalization here
        newX = this.x + this.dx;
        newY = this.y + this.dy;
        collisionOccurred = true;
        break;
      }
    }

    // Asteroid-to-asteroid collisions - remove speed normalization
    for (let asteroid of asteroids) {
      if (asteroid === this) continue;
      const dx = newX - asteroid.x;
      const dy = newY - asteroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < ASTEROID_SIZE) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);


        // Rotate velocities
        const vx1 = this.dx * cos + this.dy * sin;
        const vy1 = this.dy * cos - this.dx * sin;
        const vx2 = asteroid.dx * cos + asteroid.dy * sin;
        const vy2 = asteroid.dy * cos - asteroid.dx * sin;

        // Swap velocities without normalization
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
        const collisionSpeed = Math.sqrt(
          Math.pow(this.dx - asteroid.dx, 2) + 
          Math.pow(this.dy - asteroid.dy, 2)
        );
      
        // Create explosion at collision point
        createExplosion(
            (this.x + asteroid.x) / 2 + ASTEROID_SIZE/2,
            (this.y + asteroid.y) / 2 + ASTEROID_SIZE/2,
            collisionSpeed
        );
        collisionOccurred = true;
        playCollisionSound();
        break;
      }
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
    // Vector from line start to circle center
    const ac = {
        x: cx - line.x1,
        y: cy - line.y1
    };
    
    // Vector from line start to line end
    const ab = {
        x: line.x2 - line.x1,
        y: line.y2 - line.y1
    };
    
    // Length of line segment
    const lineLength = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
    if (lineLength === 0) return false;
    
    // Normalize the line vector
    const unitLine = {
        x: ab.x / lineLength,
        y: ab.y / lineLength
    };
    
    // Project circle center onto line using dot product
    const projection = ac.x * unitLine.x + ac.y * unitLine.y;
    
    // Find the closest point on the line
    let closest;
    if (projection <= 0) {
        closest = { x: line.x1, y: line.y1 };
    } else if (projection >= lineLength) {
        closest = { x: line.x2, y: line.y2 };
    } else {
        closest = {
            x: line.x1 + unitLine.x * projection,
            y: line.y1 + unitLine.y * projection
        };
    }
    
    // Check if the closest point is within radius
    const dx = cx - closest.x;
    const dy = cy - closest.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= r;
}

  setupDragging() {
    this.element.addEventListener('mousedown', (e) => {
        this.isDragging = true;
        this.dragOffsetX = e.clientX - this.x;
        this.dragOffsetY = e.clientY - this.y;
        
        // Store original velocity
        this.originalDx = this.dx;
        this.originalDy = this.dy;
        this.dx = 0;
        this.dy = 0;
    });

    document.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
            this.x = e.clientX - this.dragOffsetX;
            this.y = e.clientY - this.dragOffsetY;
            this.updatePosition();
        }
    });

    document.addEventListener('mouseup', () => {
        if (this.isDragging) {
            this.isDragging = false;
            // Restore original velocity
            this.dx = this.originalDx;
            this.dy = this.originalDy;
        }
    });
  }
}

for (let i = 0; i < ASTEROID_COUNT; i++) {
  asteroids.push(new Asteroid());
}

function animateAsteroids() {
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  
  // Apply screen shake
  applyScreenShake();
  
  // Update and draw explosion particles
  explosionParticles = explosionParticles.filter(particle => {
      if (particle.update()) {
          particle.draw(trailCtx);
          return true;
      }
      return false;
  });
  
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