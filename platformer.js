// Initialize Firestore
const db = firebase.firestore();

// Leaderboard Manager Class Definition (Must come before Game class)
class LeaderboardManager {
  constructor() {
    this.playerName = localStorage.getItem('platformerPlayerName') || null;
    this.highestLevel = 1;
    this.setupLeaderboardToggle();
    this.loadLeaderboard();
  }

  setupLeaderboardToggle() {
    const toggleButton = document.getElementById('toggle-leaderboard');
    const leaderboardEntries = document.getElementById('leaderboard-entries');
    
    toggleButton.addEventListener('click', () => {
      leaderboardEntries.classList.toggle('collapsed');
      toggleButton.classList.toggle('collapsed');
    });
  }

  async loadLeaderboard() {
    try {
      const snapshot = await db.collection('leaderboard')
        .orderBy('level', 'desc')
        .limit(10)
        .get();

      const leaderboardDiv = document.getElementById('leaderboard-entries');
      leaderboardDiv.innerHTML = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        entry.innerHTML = `
          <span>${data.name}</span>
          <span>Level ${data.level}</span>
        `;
        leaderboardDiv.appendChild(entry);
      });
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  }

  async handleNewHighScore(level) {
    if (level > this.highestLevel) {
      this.highestLevel = level;
      
      if (!this.playerName) {
        await this.showNameInputModal();
      } else {
        await this.saveScore(level);
      }
    }
  }

  async showNameInputModal() {
    return new Promise((resolve) => {
      const modal = document.getElementById('name-input-modal');
      const submitButton = document.getElementById('submit-name');
      const nameInput = document.getElementById('player-name');
      
      modal.style.display = 'block';
      
      submitButton.onclick = async () => {
        const name = nameInput.value.trim();
        if (name && name.length >= 2 && name.length <= 20) {
          this.playerName = name;
          localStorage.setItem('platformerPlayerName', name);
          modal.style.display = 'none';
          await this.saveScore(this.highestLevel);
          resolve();
        } else {
          alert('Please enter a name between 2 and 20 characters.');
        }
      };
    });
  }

  async saveScore(level) {
    try {
      if (!this.playerName) {
        console.error("No player name set");
        return;
      }

      const scoreData = {
        name: this.playerName,
        level: level
      };

      // Use the player's name as the document ID
      const docRef = db.collection('leaderboard').doc(this.playerName);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists || docSnap.data().level < level) {
        await docRef.set(scoreData);
        console.log("Score saved successfully");
        await this.loadLeaderboard();
      }
    } catch (error) {
      console.error("Error saving score:", error);
      if (error.code === 'permission-denied') {
        console.error("Permission denied. Please check Firestore rules.");
      }
    }
  }
}

// Sound Manager
const collisionSound = new Audio('boop.mp3');
const jumpSound = new Audio('jump.mp3');
const deathSound = new Audio('death.mp3');
const hitSound = new Audio('ahh.mp3');

const SOUND_POOL_SIZE = 5;
const soundPool = Array.from({ length: SOUND_POOL_SIZE }, () => {
  const audio = new Audio('boop.mp3');
  audio.volume = 0.3;
  return audio;
});
let currentSound = 0;

function playCollisionSound() {
    soundPool[currentSound].currentTime = 0;
    soundPool[currentSound].play();
    currentSound = (currentSound + 1) % SOUND_POOL_SIZE;
}

function playJumpSound() {
    jumpSound.currentTime = 0;
    jumpSound.play();
}

function playDeathSound() {
    deathSound.currentTime = 0;
    deathSound.play();
}

function playHitSound() {
    hitSound.currentTime = 0;
    hitSound.play();
}

class Game {
  constructor() {
    this.leaderboardManager = new LeaderboardManager();
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Make canvas fill the window
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Add window resize handler
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
    
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    
    this.gravity = 0.3;
    this.friction = 0.8;
    
    this.enemyImage = new Image();
    this.enemyImage.src = 'alien.png';
    this.ufoImage = new Image();
    this.ufoImage.src = 'ufo.png';
    this.coinImage = new Image();
    this.coinImage.src = 'coin.png';

    this.heartImage = new Image();
    this.heartImage.src = 'heart.png';
    this.hearts = [];
    this.enemySize = 40;
    this.enemySpeed = 1.5;
    this.coinSize = 30; 
    
    this.player = new Player(this);
    this.platforms = [];
    this.coins = [];
    this.enemies = [];
    
    this.keys = {};
    this.lastTime = 0;
    this.frameRate = 1000/60;
    
    this.setupEventListeners();
    this.initLevel();
    this.gameLoop();
    this.playerName = localStorage.getItem('platformerPlayerName') || null;
    this.highestLevel = 1;
    this.loadLeaderboard();
    const toggleButton = document.getElementById('toggle-leaderboard');
    const leaderboardEntries = document.getElementById('leaderboard-entries');
  
    toggleButton.addEventListener('click', () => {
      leaderboardEntries.classList.toggle('collapsed');
      toggleButton.classList.toggle('collapsed');
    });
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
  }

  generatePlatforms() {
    const platforms = [];
    const PLATFORM_HEIGHT = 20;
    const MIN_VERTICAL_GAP = 180;  // Increased minimum vertical gap
    
    // Ground platform
    platforms.push(new Platform(0, this.canvas.height - 40, this.canvas.width, 40, 'ground'));
    
    // First platform - always reachable
    const firstPlatformY = this.canvas.height - 200;
    const firstPlatformWidth = 300;
    const firstPlatformX = 100;
    platforms.push(new Platform(firstPlatformX, firstPlatformY, firstPlatformWidth, PLATFORM_HEIGHT, 'normal'));
    
    const platformCount = 3 + Math.min(this.level, 5);
    const minY = 100;
    const maxY = this.canvas.height - 250;
    const verticalSections = platformCount;
    const sectionHeight = (maxY - minY) / verticalSections;
    
    for (let i = 0; i < platformCount; i++) {
      let attempts = 0;
      let validPlatform = false;
      let platform;
      
      while (!validPlatform && attempts < 100) {
        const sectionMinY = minY + i * sectionHeight;
        const sectionMaxY = sectionMinY + sectionHeight;
        
        let platformType = 'normal';
        if (this.level >= 2 && Math.random() < 0.15) {
          platformType = 'box';
        }
        if (this.level >= 3 && Math.random() < 0.3) {
          platformType = 'stairs';
        }
        // Add lava platforms after level 10
        if (this.level >= 10 && Math.random() < 0.2) {
          platformType = 'lava';
        }

        let width, height;
        switch(platformType) {
          case 'box':
            width = 100;
            height = 100;
            break;
          case 'stairs':
            width = 200;
            height = 100;
            break;
          default:
            width = Math.random() * 200 + 200;
            height = PLATFORM_HEIGHT;
        }
        
        const x = Math.random() * (this.canvas.width - width - 100) + 50;
        const y = sectionMinY + Math.random() * (sectionMaxY - sectionMinY);
        
        platform = new Platform(x, y, width, height, platformType);
        
        validPlatform = true;
        for (const existingPlatform of platforms) {
          const verticalDistance = Math.abs(platform.y - existingPlatform.y);
          const horizontalOverlap = !(platform.x + platform.width < existingPlatform.x - 50 || 
                                    platform.x > existingPlatform.x + existingPlatform.width + 50);
          
          if (verticalDistance < MIN_VERTICAL_GAP && horizontalOverlap) {
            validPlatform = false;
            break;
          }
        }
        
        attempts++;
      }
      
      if (validPlatform) {
        platforms.push(platform);
      }
    }
    
    platforms.sort((a, b) => b.y - a.y);
    return platforms;
  }

  findValidCoinPosition() {
    const JUMP_HEIGHT = 200;
    const PLATFORM_MARGIN = 15;  // Reduced from 30 to spawn closer to platforms
    let attempts = 0;
    const MAX_ATTEMPTS = 100;
  
    while (attempts < MAX_ATTEMPTS) {
      const platformIndex = Math.floor(Math.random() * (this.platforms.length - 1)) + 1;
      const platform = this.platforms[platformIndex];
      
      // Skip box platforms
      if (platform.type === 'box') {
        attempts++;
        continue;
      }
      
      const coinX = platform.x + Math.random() * (platform.width - this.coinSize);
      const coinY = platform.y - PLATFORM_MARGIN - this.coinSize;
      
      // Check if a heart is already near this position
      const heartNearby = this.hearts.some(heart => {
        const dx = heart.x - coinX;
        const dy = heart.y - coinY;
        return Math.sqrt(dx * dx + dy * dy) < 50;  // 50px minimum distance
      });
  
      if (heartNearby) {
        attempts++;
        continue;
      }
      
      const isReachable = this.platforms.some(p => {
        if (p === platform) return false;
        
        const verticalDist = p.y - coinY;
        const horizontalOverlap = coinX + this.coinSize >= p.x - 50 && 
                                 coinX <= p.x + p.width + 50;
        return verticalDist > -JUMP_HEIGHT && verticalDist < 0 && horizontalOverlap;
      });
  
      if (isReachable) {
        return { x: coinX, y: coinY };
      }
      
      attempts++;
    }
    
    const platform = this.platforms[1];
    return { 
      x: platform.x + platform.width/2, 
      y: platform.y - PLATFORM_MARGIN - this.coinSize 
    };
  }

  createEnemyByType(type, platform) {
    if (platform.type === 'box' || platform.type === 'lava') return null;
  
    const y = platform.y - this.enemySize - 5;
    const leftBound = platform.x;
    const rightBound = platform.x + platform.width;
    const x = platform.x + platform.width / 2 - this.enemySize / 2;
  
    // Calculate speed multiplier based on level
    const speedMultiplier = Math.min(1 + (this.level - 1) * 0.05, 2.5); // Caps at 2.5x speed
    const baseSpeed = this.enemySpeed * speedMultiplier;
  
    switch(type) {
      case 'basic':
        return new Enemy(x, y, leftBound, rightBound, '#e74c3c', baseSpeed);
      case 'fast':
        return new Enemy(x, y, leftBound, rightBound, '#e67e22', baseSpeed * 1.5);
      case 'hunter':
        // Cap hunter speed at player's speed (7)
        const hunterSpeed = Math.min(baseSpeed * 0.75, 7);
        return new HunterEnemy(x, y, this.player, '#c0392b', hunterSpeed);
      default:
        return new Enemy(x, y, leftBound, rightBound, '#e74c3c', baseSpeed);
    }
  }

  spawnHeart() {
    if (this.hearts.length >= 2) return;
    
    const PLATFORM_MARGIN = 15;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;
  
    while (attempts < MAX_ATTEMPTS) {
      const platformIndex = Math.floor(Math.random() * (this.platforms.length - 1)) + 1;
      const platform = this.platforms[platformIndex];
      
      // Skip box platforms
      if (platform.type === 'box') {
        attempts++;
        continue;
      }
  
      const heartX = platform.x + Math.random() * (platform.width - 25);
      const heartY = platform.y - PLATFORM_MARGIN - 25;
  
      // Check if any coins are near this position
      const coinNearby = this.coins.some(coin => {
        const dx = coin.x - heartX;
        const dy = coin.y - heartY;
        return Math.sqrt(dx * dx + dy * dy) < 50;  // 50px minimum distance
      });
  
      if (!coinNearby) {
        this.hearts.push({
          x: heartX,
          y: heartY,
          width: 25,
          height: 25
        });
        break;
      }
      
      attempts++;
    }
  }

  initLevel() {
    this.platforms = [];
    this.coins = [];
    this.enemies = [];
    this.hearts = [];
    
    this.platforms = this.generatePlatforms();
    
    const coinCount = 5 + Math.floor(this.level / 2);
    for (let i = 0; i < coinCount; i++) {
      const pos = this.findValidCoinPosition();
      this.coins.push(new Coin(pos.x, pos.y, this.coinSize, this.coinSize));  // Pass size to Coin constructor
    }
    
    // Spawn enemies only on valid platforms
    this.platforms.slice(1).forEach((platform) => {
      if (platform.type === 'ground' || platform.type === 'box') return;  // Skip ground and box platforms
      if (Math.random() > 0.7) return;
      
      const enemyTypes = ['basic'];
      if (this.level >= 2) enemyTypes.push('fast');
      if (this.level >= 4) {
        enemyTypes.push('hunter');
        if (Math.random() < 0.3) {
          enemyTypes.push('hunter', 'fast');
        }
      }
      
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const enemy = this.createEnemyByType(type, platform);
      if (enemy) this.enemies.push(enemy);
    });
  
    // Chance to spawn heart if player has less than full health
    if (this.lives < 3 && Math.random() < 0.3) {
      this.spawnHeart();
    }
  }

  update() {
    this.player.update();
    this.enemies.forEach(enemy => enemy.update(this));
    
    // Check coin collisions
    this.coins = this.coins.filter(coin => {
      if (this.checkCollision(this.player, coin)) {
        this.score += 10;
        document.getElementById('score').textContent = `Score: ${this.score}`;
        playCollisionSound();
        return false;
      }
      return true;
    });

    // Check heart collisions
    this.hearts = this.hearts.filter(heart => {
      if (this.checkCollision(this.player, heart)) {
        if (this.lives < 3) {
          this.lives++;
          document.getElementById('lives').textContent = `Lives: ${this.lives}`;
        }
        return false;
      }
      return true;
    });

    this.platforms.forEach(platform => {
      if (platform.type === 'lava' && this.checkCollision(this.player, platform)) {
        this.playerHit();
      }
    });
    
    // Randomly spawn hearts
    if (this.lives < 3 && Math.random() < 0.001) { // 0.1% chance per frame
      this.spawnHeart();
    }
    
    this.enemies.forEach(enemy => {
      if (this.checkCollision(this.player, enemy)) {
        this.playerHit();
      }
    });
    
    if (this.coins.length === 0) {
      this.level++;
      document.getElementById('level').textContent = `Level: ${this.level}`;
      this.player.x = 50;
      this.player.y = this.canvas.height - this.player.height - 40;
      this.player.dx = 0;
      this.player.dy = 0;
      this.initLevel();
      this.updateLeaderboard();  // Add this line
    }
  }

  playerHit() {
    if (this.player.hurt()) {
      this.lives--;
      document.getElementById('lives').textContent = `Lives: ${this.lives}`;
      if (this.lives <= 0) {
        this.player.die();
      } else {
        playHitSound();
      }
    }
  }

  resetGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    document.getElementById('score').textContent = `Score: ${this.score}`;
    document.getElementById('lives').textContent = `Lives: ${this.lives}`;
    document.getElementById('level').textContent = `Level: ${this.level}`;
    this.player.x = 50;
    this.player.y = this.canvas.height - 80;
    this.player.dx = 0;
    this.player.dy = 0;
    this.player.isHurt = false;
    this.player.isDying = false;
    this.player.isInvincible = false;
    this.player.invincibilityTimer = 0;
    this.initLevel();
  }

  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw platforms
    this.platforms.forEach(platform => {
      switch(platform.type) {
        case 'box':
          this.ctx.fillStyle = '#8e44ad';
          this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          break;
        case 'lava':
          this.ctx.fillStyle = `rgba(231, 76, 60, ${0.7 + Math.sin(Date.now() / 200) * 0.3})`;
          this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          break;
        case 'stairs':
          this.ctx.fillStyle = '#d35400';
          const stepHeight = platform.height / 4;
          for (let i = 0; i < 4; i++) {
            this.ctx.fillRect(
              platform.x,
              platform.y + (i * stepHeight),
              platform.width - (i * (platform.width / 4)),
              stepHeight
            );
          }
          break;
        default:
          this.ctx.fillStyle = '#2ecc71';
          this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      }
    });
    
    // Draw hearts
    this.hearts.forEach(heart => {
      this.ctx.drawImage(this.heartImage, heart.x, heart.y, heart.width, heart.height);
    });
    
    // Draw coins
    this.coins.forEach(coin => {
      this.ctx.drawImage(this.coinImage, coin.x, coin.y, coin.width, coin.height);
    });
    
    // Draw enemies
    this.enemies.forEach(enemy => {
      const image = enemy instanceof HunterEnemy ? this.ufoImage : this.enemyImage;
      this.ctx.drawImage(image, enemy.x, enemy.y, this.enemySize, this.enemySize);
    });
    
    this.player.draw(this.ctx);
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  async updateLeaderboard() {
    await this.leaderboardManager.handleNewHighScore(this.level);
  }
}
  
class Player {
  constructor(game) {
    this.game = game;
    this.width = 30;  // Changed from 50 to 30
    this.height = 30; // Changed from 50 to 30
    this.x = 50;
    this.y = game.canvas.height - this.height - 40; // Changed to spawn above ground (40 is ground platform height)
    this.dx = 0;
    this.dy = 0;
    this.jumpForce = -15;
    this.minJumpForce = -10;  // Minimum jump height
    this.jumpTime = 0;
    this.maxJumpTime = 30;   // Maximum frames to hold jump
    this.isJumping = false;
    this.canJump = false;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.invincibilityDuration = 120;
    this.isDying = false;
  }

  update() {
    // Update invincibility
    if (this.isInvincible) {
      this.invincibilityTimer++;
      if (this.invincibilityTimer >= this.invincibilityDuration) {
        this.isInvincible = false;
        this.invincibilityTimer = 0;
      }
    }

    // Don't update movement if dying
    if (this.isDying) {
      return;
    }

    // Regular movement update
    if (this.game.keys['ArrowLeft']) {
      this.dx = -7;
    }
    if (this.game.keys['ArrowRight']) {
      this.dx = 7;
    }
    if (!this.game.keys['ArrowLeft'] && !this.game.keys['ArrowRight']) {
      this.dx *= this.game.friction;
    }

    this.dy += this.game.gravity;

    if ((this.game.keys['Space'] || this.game.keys['ArrowUp'])) {
      if (this.canJump) {
        this.dy = this.minJumpForce;
        this.isJumping = true;
        this.jumpTime = 0;
        this.canJump = false;
        playJumpSound();
      } else if (this.isJumping && this.jumpTime < this.maxJumpTime) {
        this.dy -= 0.5;  // Continue adding upward force
        this.jumpTime++;
      }
    } else {
      this.isJumping = false;
    }

    this.dy += this.game.gravity;

    let newX = this.x + this.dx;
    let newY = this.y + this.dy;

    this.canJump = false;
    this.game.platforms.forEach(platform => {
      if (this.y + this.height > platform.y && 
          this.y < platform.y + platform.height) {
        if (this.dx > 0 && newX + this.width > platform.x && this.x + this.width <= platform.x + 5) {
          newX = platform.x - this.width;
          this.dx = 0;
        } else if (this.dx < 0 && newX < platform.x + platform.width && this.x >= platform.x + platform.width - 5) {
          newX = platform.x + platform.width;
          this.dx = 0;
        }
      }
    });

    this.x = newX;  // Update X position first

    // Then handle vertical collisions
    this.game.platforms.forEach(platform => {
      if (this.x + this.width > platform.x + 5 && 
          this.x < platform.x + platform.width - 5) {
        if (this.dy > 0 && newY + this.height > platform.y && this.y + this.height <= platform.y) {
          newY = platform.y - this.height;
          this.dy = 0;
          this.canJump = true;
          this.isJumping = false;
        } else if (this.dy < 0 && newY < platform.y + platform.height && this.y >= platform.y + platform.height) {
          newY = platform.y + platform.height;
          this.dy = 0;
          this.isJumping = false;
        }
      }
    });

    this.y = newY;
    this.x = newX;

    if (this.x < 0) {
      this.x = 0;
      this.dx = 0;
    }
    if (this.x + this.width > this.game.canvas.width) {
      this.x = this.game.canvas.width - this.width;
      this.dx = 0;
    }
    if (this.y < 0) {
      this.y = 0;
      this.dy = 0;
    }
    if (this.y + this.height > this.game.canvas.height) {
      this.y = this.game.canvas.height - this.height;
      this.dy = 0;
      this.canJump = true;
    }
  }

  draw(ctx) {
    // If invincible, make player semi-transparent
    if (this.isInvincible) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = '#3498db';  // Blue color for player
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.globalAlpha = 1.0;
  }

  hurt() {
    if (!this.isInvincible && !this.isDying) {
      this.isInvincible = true;
      this.invincibilityTimer = 0;
      return true;
    }
    return false;
  }

  die() {
    this.isDying = true;
    this.dx = 0;
    this.dy = 0;
    playDeathSound();
    setTimeout(() => this.game.resetGame(), 1000); // Reset game after 1 second
  }
}
  
class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }
}
  class Coin {
    constructor(x, y, width = 30, height = 30) { // Changed from 20 to 30
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }
  
  class Enemy {
    constructor(x, y, leftBound, rightBound, color, speed) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 30;
      this.speed = speed;
      this.direction = 1;
      this.leftBound = leftBound;
      this.rightBound = rightBound;
      this.color = color;
    }
  
    update() {
      this.x += this.speed * this.direction;
      if (this.x <= this.leftBound || this.x + this.width >= this.rightBound) {
        this.direction *= -1;
      }
    }
  }
  
  class VerticalEnemy extends Enemy {
    constructor(x, y, topBound, bottomBound, color, speed) {
      super(x, y, x, x, color, speed);
      this.topBound = topBound;
      this.bottomBound = bottomBound;
      this.moveVertical = true;
    }
  
    update() {
      this.y += this.speed * this.direction;
      if (this.y <= this.topBound || this.y + this.height >= this.bottomBound) {
        this.direction *= -1;
      }
    }
  }
  
  class HunterEnemy extends Enemy {
    constructor(x, y, player, color, speed) {
        super(x, y, 0, 0, color, speed);
        this.player = player;
      }
    
      update(game) {
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }
    
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > game.canvas.width) this.x = game.canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > game.canvas.height) this.y = game.canvas.height - this.height;
    
        game.platforms.forEach(platform => {
          if (game.checkCollision(this, platform)) {
            if (this.y + this.height > platform.y && this.y < platform.y) {
              this.y = platform.y - this.height;
            }
          }
        });
      }
    }


  
    
    // Start the game
    new Game();