class Game {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = 800;
      this.canvas.height = 600;
      
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      
      this.gravity = 0.5;
      this.friction = 0.8;
      
      this.player = new Player(this);
      this.platforms = [];
      this.coins = [];
      this.enemies = [];
      
      this.keys = {};
      
      this.setupEventListeners();
      this.initLevel();
      
      // Add level counter to HUD
      this.levelDisplay = document.createElement('div');
      this.levelDisplay.id = 'level';
      this.levelDisplay.style.position = 'absolute';
      this.levelDisplay.style.top = '20px';
      this.levelDisplay.style.right = '100px';
      this.levelDisplay.style.color = 'white';
      this.levelDisplay.style.fontSize = '20px';
      document.getElementById('hud').appendChild(this.levelDisplay);
      this.updateLevelDisplay();
      
      this.gameLoop();
    }
  
    updateLevelDisplay() {
      this.levelDisplay.textContent = `Level: ${this.level}`;
    }
  
    setupEventListeners() {
      window.addEventListener('keydown', (e) => this.keys[e.code] = true);
      window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }
  
    generatePlatforms() {
      const platforms = [];
      
      // Ground platform
      platforms.push(new Platform(0, this.canvas.height - 40, this.canvas.width, 40));
      
      // Generate platforms based on level
      const platformCount = 3 + Math.min(this.level, 4); // More platforms in higher levels
      const minY = 150; // Minimum height for platforms
      const maxY = this.canvas.height - 100; // Maximum height for platforms
      
      for (let i = 0; i < platformCount; i++) {
        const width = Math.random() * 100 + 100; // Platform width between 100-200
        const x = Math.random() * (this.canvas.width - width);
        const y = minY + (maxY - minY) * (i / platformCount); // Distribute platforms vertically
        
        platforms.push(new Platform(x, y, width, 20));
      }
      
      return platforms;
    }
  
    findValidCoinPosition() {
      const JUMP_HEIGHT = 150; // Maximum jump height
      const PLATFORM_MARGIN = 40; // Space above platforms where coins can spawn
      let attempts = 0;
      const MAX_ATTEMPTS = 100;
  
      while (attempts < MAX_ATTEMPTS) {
        // Pick a random platform
        const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
        
        // Generate position above platform
        const coinX = platform.x + Math.random() * (platform.width - 20);
        const coinY = platform.y - Math.random() * PLATFORM_MARGIN - 20;
        
        // Check if position is reachable from any platform
        const isReachable = this.platforms.some(p => {
          const verticalDist = p.y - coinY;
          const horizontalOverlap = coinX + 20 >= p.x && coinX <= p.x + p.width;
          return verticalDist > 0 && verticalDist < JUMP_HEIGHT && horizontalOverlap;
        });
  
        if (isReachable && coinY > 0) {
          return { x: coinX, y: coinY };
        }
        
        attempts++;
      }
      
      // Fallback position if no valid position found
      return { x: this.platforms[0].x + 50, y: this.platforms[0].y - 50 };
    }
  
    createEnemyByType(type, x, y, platform) {
      switch(type) {
        case 'basic':
          return new Enemy(x, y, platform.x, platform.x + platform.width, '#e74c3c', 2);
        case 'fast':
          return new Enemy(x, y, platform.x, platform.x + platform.width, '#e67e22', 4);
        case 'vertical':
          return new VerticalEnemy(x, y, y - 100, y + 100, '#9b59b6', 2);
        case 'hunter':
          return new HunterEnemy(x, y, this.player, '#c0392b', 1.5);
        default:
          return new Enemy(x, y, platform.x, platform.x + platform.width, '#e74c3c', 2);
      }
    }
  
    initLevel() {
      // Clear existing arrays
      this.platforms = [];
      this.coins = [];
      this.enemies = [];
      
      // Generate platforms for current level
      this.platforms = this.generatePlatforms();
      
      // Add coins
      const coinCount = 5 + Math.floor(this.level / 2); // More coins in higher levels
      for (let i = 0; i < coinCount; i++) {
        const pos = this.findValidCoinPosition();
        this.coins.push(new Coin(pos.x, pos.y));
      }
      
      // Add enemies based on level
      this.platforms.forEach(platform => {
        if (platform.y < this.canvas.height - 50) { // Don't place enemies on ground
          const enemyTypes = ['basic'];
          if (this.level >= 2) enemyTypes.push('fast');
          if (this.level >= 3) enemyTypes.push('vertical');
          if (this.level >= 4) enemyTypes.push('hunter');
          
          const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          const enemy = this.createEnemyByType(
            type,
            platform.x + platform.width / 2,
            platform.y - 30,
            platform
          );
          this.enemies.push(enemy);
        }
      });
    }
  
    update() {
      this.player.update();
      
      // Update enemies
      this.enemies.forEach(enemy => enemy.update(this));
      
      // Check coin collisions
      this.coins = this.coins.filter(coin => {
        if (this.checkCollision(this.player, coin)) {
          this.score += 10;
          document.getElementById('score').textContent = `Score: ${this.score}`;
          return false;
        }
        return true;
      });
      
      // Check enemy collisions
      this.enemies.forEach(enemy => {
        if (this.checkCollision(this.player, enemy)) {
          this.playerHit();
        }
      });
      
      // Level complete check
      if (this.coins.length === 0) {
        this.level++;
        this.updateLevelDisplay();
        this.initLevel();
      }
    }
  
    playerHit() {
      this.lives--;
      document.getElementById('lives').textContent = `Lives: ${this.lives}`;
      if (this.lives <= 0) {
        alert('Game Over! Your score: ' + this.score);
        this.resetGame();
      } else {
        this.player.x = 50;
        this.player.y = this.canvas.height - 80;
        this.player.dx = 0;
        this.player.dy = 0;
      }
    }
  
    resetGame() {
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      document.getElementById('score').textContent = `Score: ${this.score}`;
      document.getElementById('lives').textContent = `Lives: ${this.lives}`;
      this.updateLevelDisplay();
      this.player.x = 50;
      this.player.y = this.canvas.height - 80;
      this.player.dx = 0;
      this.player.dy = 0;
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
      this.ctx.fillStyle = '#2ecc71';
      this.platforms.forEach(platform => {
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      });
      
      // Draw coins
      this.ctx.fillStyle = '#f1c40f';
      this.coins.forEach(coin => {
        this.ctx.beginPath();
        this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
        this.ctx.fill();
      });
      
      // Draw enemies
      this.enemies.forEach(enemy => {
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      });
      
      // Draw player
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }
  
    gameLoop() {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.gameLoop());
    }
  }
  
  class Player {
    constructor(game) {
      this.game = game;
      this.width = 30;
      this.height = 30;
      this.x = 50;
      this.y = game.canvas.height - 80;
      this.dx = 0;
      this.dy = 0;
      this.jumpForce = -12;
      this.canJump = false;
    }
  
    update() {
      // Horizontal movement
      if (this.game.keys['ArrowLeft']) this.dx = -5;
      if (this.game.keys['ArrowRight']) this.dx = 5;
      if (!this.game.keys['ArrowLeft'] && !this.game.keys['ArrowRight']) this.dx *= this.game.friction;
  
      // Apply gravity
      this.dy += this.game.gravity;
  
      // Jump (both Space and ArrowUp)
      if ((this.game.keys['Space'] || this.game.keys['ArrowUp']) && this.canJump) {
        this.dy = this.jumpForce;
        this.canJump = false;
      }
  
      // Calculate new position
      let newX = this.x + this.dx;
      let newY = this.y + this.dy;
  
      // Platform collisions
      this.canJump = false;
      this.game.platforms.forEach(platform => {
        if (this.x + this.width > platform.x && 
            this.x < platform.x + platform.width) {
          // Vertical collision
          if (this.dy > 0 && newY + this.height > platform.y && this.y + this.height <= platform.y) {
            newY = platform.y - this.height;
            this.dy = 0;
            this.canJump = true;
          } else if (this.dy < 0 && newY < platform.y + platform.height && this.y >= platform.y + platform.height) {
            newY = platform.y + platform.height;
            this.dy = 0;
          }
        }
        
        if (this.y + this.height > platform.y && 
            this.y < platform.y + platform.height) {
          // Horizontal collision
          if (this.dx > 0 && newX + this.width > platform.x && this.x + this.width <= platform.x) {
            newX = platform.x - this.width;
            this.dx = 0;
          } else if (this.dx < 0 && newX < platform.x + platform.width && this.x >= platform.x + platform.width) {
            newX = platform.x + platform.width;
            this.dx = 0;
          }
        }
      });
  
      // Update position
      this.x = newX;
      this.y = newY;
  
      // Screen boundaries
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
  }
  
  class Platform {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }
  
  class Coin {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 20;
      this.height = 20;
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
      // Simple AI to move towards player
      const dx = this.player.x - this.x;
      const dy = this.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }

    // Keep enemy within canvas bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > game.canvas.width) this.x = game.canvas.width - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > game.canvas.height) this.y = game.canvas.height - this.height;

    // Platform collisions to prevent going through platforms
    game.platforms.forEach(platform => {
      if (game.checkCollision(this, platform)) {
        // Move enemy to platform edge
        if (this.y + this.height > platform.y && this.y < platform.y) {
          this.y = platform.y - this.height;
        }
      }
    });
  }
}

// Start the game
new Game();