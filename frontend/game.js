class SpaceShooterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = 'menu';
        this.score = 0;
        this.health = CONFIG.GAME.MAX_HEALTH;
        this.level = 1;
        this.combo = 0;
        this.lastBulletTime = 0;
        
        this.player = {
            x: CONFIG.GAME.CANVAS_WIDTH / 2,
            y: CONFIG.GAME.CANVAS_HEIGHT - 80,
            width: 40,
            height: 50,
            speed: CONFIG.GAME.PLAYER_SPEED
        };
        
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.stars = [];
        this.nebulas = [];
        
        this.keys = {};
        this.lastSpawnTime = 0;
        this.animationId = null;
        
        this.initNebulas();
        this.initStars();
        this.bindEvents();
        this.bindUIEvents();
    }
    
    initNebulas() {
        this.nebulas = [
            {
                x: CONFIG.GAME.CANVAS_WIDTH * 0.2,
                y: CONFIG.GAME.CANVAS_HEIGHT * 0.3,
                radius: 200,
                color: 'rgba(100, 50, 150, 0.1)',
                speed: 0.1
            },
            {
                x: CONFIG.GAME.CANVAS_WIDTH * 0.7,
                y: CONFIG.GAME.CANVAS_HEIGHT * 0.6,
                radius: 180,
                color: 'rgba(50, 100, 150, 0.1)',
                speed: 0.08
            },
            {
                x: CONFIG.GAME.CANVAS_WIDTH * 0.5,
                y: CONFIG.GAME.CANVAS_HEIGHT * 0.8,
                radius: 250,
                color: 'rgba(100, 80, 120, 0.08)',
                speed: 0.05
            }
        ];
    }
    
    initStars() {
        for (let layer = 0; layer < 4; layer++) {
            let starCount, baseSpeed, minSize, maxSize, brightness;
            
            if (layer === 0) {
                starCount = 140;
                baseSpeed = 0.4;
                minSize = 0.8;
                maxSize = 1.6;
                brightness = 0.45;
            } else if (layer === 1) {
                starCount = 110;
                baseSpeed = 0.8;
                minSize = 1.2;
                maxSize = 2.4;
                brightness = 0.6;
            } else if (layer === 2) {
                starCount = 70;
                baseSpeed = 1.4;
                minSize = 1.8;
                maxSize = 3.5;
                brightness = 0.8;
            } else {
                starCount = 30;
                baseSpeed = 2.2;
                minSize = 3.0;
                maxSize = 5.5;
                brightness = 1.0;
            }
            
            for (let i = 0; i < starCount; i++) {
                const size = Math.random() * (maxSize - minSize) + minSize;
                const twinkleSpeed = Math.random() * 0.06 + 0.015;
                const twinkleOffset = Math.random() * Math.PI * 2;
                
                this.stars.push({
                    x: Math.random() * CONFIG.GAME.CANVAS_WIDTH,
                    y: Math.random() * CONFIG.GAME.CANVAS_HEIGHT,
                    size: size,
                    baseSize: size,
                    speed: baseSpeed + Math.random() * 0.4,
                    brightness: brightness,
                    twinkleSpeed: twinkleSpeed,
                    twinkleOffset: twinkleOffset,
                    twinkleTime: Math.random() * Math.PI * 2,
                    layer: layer
                });
            }
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    bindUIEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('exitBtn').addEventListener('click', () => this.exitGame());
        
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('gameoverLeaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('gameoverExitBtn').addEventListener('click', () => this.showStartScreen());
        
        document.getElementById('backBtn').addEventListener('click', () => this.showStartScreen());
        
        document.getElementById('submitBtn').addEventListener('click', () => this.submitScore());
        
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
        });
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    showStartScreen() {
        this.gameState = 'menu';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.showScreen('start-screen');
    }
    
    startGame() {
        this.score = 0;
        this.health = CONFIG.GAME.MAX_HEALTH;
        this.level = 1;
        this.combo = 0;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.lastSpawnTime = Date.now();
        this.lastBulletTime = 0;
        
        this.player.x = CONFIG.GAME.CANVAS_WIDTH / 2;
        this.player.y = CONFIG.GAME.CANVAS_HEIGHT - 80;
        
        this.gameState = 'playing';
        this.showScreen('game-screen');
        this.updateHUD();
        this.gameLoop();
    }
    
    exitGame() {
        this.gameState = 'menu';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.showStartScreen();
    }
    
    async showLeaderboard() {
        this.showScreen('leaderboard-screen');
        document.getElementById('leaderboard-container').style.display = 'none';
        document.getElementById('leaderboard-loading').style.display = 'block';
        
        try {
            const result = await API.getLeaderboard(50);
            this.renderLeaderboard(result.data);
            document.getElementById('leaderboard-container').style.display = 'block';
            document.getElementById('leaderboard-loading').style.display = 'none';
        } catch (error) {
            document.getElementById('leaderboard-loading').textContent = '加载失败: ' + error.message;
        }
    }
    
    renderLeaderboard(data) {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="color: #666;">暂无数据</td></tr>';
            return;
        }
        
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            const rankClass = item.rank <= 3 ? `rank-${item.rank}` : '';
            
            tr.innerHTML = `
                <td class="${rankClass}">${item.rank}</td>
                <td>${item.player_name}</td>
                <td>${item.score}</td>
                <td>${item.level}</td>
                <td>${this.formatDate(item.created_at)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    async submitScore() {
        const nameInput = document.getElementById('playerName');
        const playerName = nameInput.value.trim();
        const statusEl = document.getElementById('submit-status');
        
        if (!playerName) {
            statusEl.textContent = '请输入你的姓名';
            statusEl.className = 'status-message error';
            return;
        }
        
        statusEl.textContent = '提交中...';
        statusEl.className = 'status-message';
        
        try {
            const result = await API.submitScore(playerName, this.score, this.level);
            statusEl.textContent = `提交成功！你的排名: 第${result.data.rank}名`;
            statusEl.className = 'status-message success';
            document.getElementById('submitBtn').disabled = true;
            nameInput.disabled = true;
        } catch (error) {
            statusEl.textContent = '提交失败: ' + error.message;
            statusEl.className = 'status-message error';
        }
    }
    
    updateHUD() {
        let hearts = '';
        for (let i = 0; i < this.health; i++) {
            hearts += '❤️';
        }
        for (let i = this.health; i < CONFIG.GAME.MAX_HEALTH; i++) {
            hearts += '🖤';
        }
        document.getElementById('health-display').textContent = hearts;
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('level-display').textContent = this.level;
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.updateStars();
        this.handleInput();
        this.spawnEnemies();
        this.updateBullets();
        this.updateEnemies();
        this.updateParticles();
        this.checkCollisions();
        this.checkLevelUp();
    }
    
    updateStars() {
        this.stars.forEach(star => {
            star.y += star.speed;
            star.twinkleTime += star.twinkleSpeed;
            const twinkle = Math.sin(star.twinkleTime) * 0.3 + 0.7;
            star.size = star.baseSize * twinkle;
            
            if (star.y > CONFIG.GAME.CANVAS_HEIGHT) {
                star.y = -10;
                star.x = Math.random() * CONFIG.GAME.CANVAS_WIDTH;
            }
        });
        
        this.nebulas.forEach(nebula => {
            nebula.y += nebula.speed;
            if (nebula.y > CONFIG.GAME.CANVAS_HEIGHT + nebula.radius) {
                nebula.y = -nebula.radius;
            }
        });
    }
    
    handleInput() {
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(this.player.width / 2, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(CONFIG.GAME.CANVAS_WIDTH - this.player.width / 2, this.player.x + this.player.speed);
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y = Math.max(50, this.player.y - this.player.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y = Math.min(CONFIG.GAME.CANVAS_HEIGHT - 30, this.player.y + this.player.speed);
        }
        
        if (this.keys['Space']) {
            this.shoot();
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastBulletTime < CONFIG.GAME.BULLET_COOLDOWN) return;
        
        this.lastBulletTime = now;
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - this.player.height / 2,
            width: 4,
            height: 15,
            speed: CONFIG.GAME.BULLET_SPEED
        });
    }
    
    spawnEnemies() {
        const now = Date.now();
        const spawnInterval = Math.max(500, CONFIG.GAME.SPAWN_INTERVAL - (this.level - 1) * 150);
        
        if (now - this.lastSpawnTime > spawnInterval) {
            this.lastSpawnTime = now;
            
            const enemyType = Math.random();
            let enemy;
            
            if (enemyType < 0.6) {
                enemy = {
                    x: Math.random() * (CONFIG.GAME.CANVAS_WIDTH - 40) + 20,
                    y: -30,
                    width: 30,
                    height: 30,
                    speed: CONFIG.GAME.ENEMY_BASE_SPEED + (this.level - 1) * 0.3,
                    type: 'normal',
                    color: '#ff4444',
                    points: 100
                };
            } else if (enemyType < 0.85) {
                enemy = {
                    x: Math.random() * (CONFIG.GAME.CANVAS_WIDTH - 50) + 25,
                    y: -40,
                    width: 40,
                    height: 40,
                    speed: CONFIG.GAME.ENEMY_BASE_SPEED + (this.level - 1) * 0.2,
                    type: 'fast',
                    color: '#ffaa00',
                    points: 150
                };
            } else {
                enemy = {
                    x: Math.random() * (CONFIG.GAME.CANVAS_WIDTH - 60) + 30,
                    y: -50,
                    width: 50,
                    height: 50,
                    speed: CONFIG.GAME.ENEMY_BASE_SPEED * 0.7 + (this.level - 1) * 0.1,
                    type: 'big',
                    color: '#ff00ff',
                    points: 200
                };
            }
            
            this.enemies.push(enemy);
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -20;
        });
    }
    
    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            return enemy.y < CONFIG.GAME.CANVAS_HEIGHT + 50;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                life: 30,
                maxLife: 30,
                alpha: 1
            });
        }
    }
    
    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    this.createExplosion(enemy.x, enemy.y, enemy.color, 15);
                    
                    this.combo++;
                    const baseScore = enemy.points;
                    const comboBonus = baseScore * (this.combo - 1) * CONFIG.SCORING.COMBO_MULTIPLIER;
                    const levelBonus = baseScore * (this.level - 1) * CONFIG.SCORING.LEVEL_MULTIPLIER;
                    const totalScore = Math.floor(baseScore + comboBonus + levelBonus);
                    
                    this.score += totalScore;
                    
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.updateHUD();
                    break;
                }
            }
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (this.isColliding(this.player, enemy)) {
                this.createExplosion(this.player.x, this.player.y, '#00ffff', 20);
                this.createExplosion(enemy.x, enemy.y, enemy.color, 15);
                
                this.health--;
                this.combo = 0;
                this.enemies.splice(i, 1);
                this.updateHUD();
                
                if (this.health <= 0) {
                    this.gameOver(false);
                }
            }
        }
    }
    
    isColliding(rect1, rect2) {
        const r1Left = rect1.x - rect1.width / 2;
        const r1Right = rect1.x + rect1.width / 2;
        const r1Top = rect1.y - rect1.height / 2;
        const r1Bottom = rect1.y + rect1.height / 2;
        
        const r2Left = rect2.x - rect2.width / 2;
        const r2Right = rect2.x + rect2.width / 2;
        const r2Top = rect2.y - rect2.height / 2;
        const r2Bottom = rect2.y + rect2.height / 2;
        
        return r1Left < r2Right &&
               r1Right > r2Left &&
               r1Top < r2Bottom &&
               r1Bottom > r2Top;
    }
    
    checkLevelUp() {
        const newLevel = Math.floor(this.score / CONFIG.GAME.LEVEL_SCORE_THRESHOLD) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateHUD();
            this.createExplosion(CONFIG.GAME.CANVAS_WIDTH / 2, CONFIG.GAME.CANVAS_HEIGHT / 2, '#00ff00', 30);
        }
    }
    
    gameOver(isVictory) {
        this.gameState = 'gameover';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const title = document.getElementById('gameover-title');
        title.textContent = isVictory ? '胜利！' : '游戏结束';
        title.className = isVictory ? 'victory' : '';
        
        document.getElementById('final-score-value').textContent = this.score;
        document.getElementById('final-level-value').textContent = this.level;
        
        document.getElementById('playerName').value = '';
        document.getElementById('playerName').disabled = false;
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submit-status').textContent = '';
        document.getElementById('submit-status').className = 'status-message';
        
        this.showScreen('gameover-screen');
    }
    
    render() {
        this.renderBackground();
        this.renderNebulas();
        this.renderStars();
        this.renderParticles();
        this.renderBullets();
        this.renderEnemies();
        this.renderPlayer();
        
        if (this.combo > 1) {
            this.renderCombo();
        }
    }
    
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.GAME.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#252550');
        gradient.addColorStop(0.25, '#303070');
        gradient.addColorStop(0.5, '#3a3a80');
        gradient.addColorStop(0.75, '#353575');
        gradient.addColorStop(1, '#2a2a60');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.GAME.CANVAS_WIDTH, CONFIG.GAME.CANVAS_HEIGHT);
        
        const purpleNebula = this.ctx.createRadialGradient(
            CONFIG.GAME.CANVAS_WIDTH * 0.15, CONFIG.GAME.CANVAS_HEIGHT * 0.15, 0,
            CONFIG.GAME.CANVAS_WIDTH * 0.15, CONFIG.GAME.CANVAS_HEIGHT * 0.15, 350
        );
        purpleNebula.addColorStop(0, 'rgba(180, 130, 240, 0.45)');
        purpleNebula.addColorStop(0.3, 'rgba(150, 100, 210, 0.3)');
        purpleNebula.addColorStop(0.6, 'rgba(120, 70, 180, 0.15)');
        purpleNebula.addColorStop(1, 'rgba(90, 50, 150, 0)');
        this.ctx.fillStyle = purpleNebula;
        this.ctx.fillRect(0, 0, CONFIG.GAME.CANVAS_WIDTH, CONFIG.GAME.CANVAS_HEIGHT);
        
        const blueNebula = this.ctx.createRadialGradient(
            CONFIG.GAME.CANVAS_WIDTH * 0.85, CONFIG.GAME.CANVAS_HEIGHT * 0.75, 0,
            CONFIG.GAME.CANVAS_WIDTH * 0.85, CONFIG.GAME.CANVAS_HEIGHT * 0.75, 400
        );
        blueNebula.addColorStop(0, 'rgba(100, 170, 240, 0.45)');
        blueNebula.addColorStop(0.3, 'rgba(70, 140, 210, 0.3)');
        blueNebula.addColorStop(0.6, 'rgba(40, 110, 180, 0.15)');
        blueNebula.addColorStop(1, 'rgba(20, 80, 150, 0)');
        this.ctx.fillStyle = blueNebula;
        this.ctx.fillRect(0, 0, CONFIG.GAME.CANVAS_WIDTH, CONFIG.GAME.CANVAS_HEIGHT);
        
        const cyanNebula = this.ctx.createRadialGradient(
            CONFIG.GAME.CANVAS_WIDTH * 0.6, CONFIG.GAME.CANVAS_HEIGHT * 0.2, 0,
            CONFIG.GAME.CANVAS_WIDTH * 0.6, CONFIG.GAME.CANVAS_HEIGHT * 0.2, 300
        );
        cyanNebula.addColorStop(0, 'rgba(120, 210, 240, 0.35)');
        cyanNebula.addColorStop(0.4, 'rgba(80, 180, 220, 0.2)');
        cyanNebula.addColorStop(1, 'rgba(40, 140, 180, 0)');
        this.ctx.fillStyle = cyanNebula;
        this.ctx.fillRect(0, 0, CONFIG.GAME.CANVAS_WIDTH, CONFIG.GAME.CANVAS_HEIGHT);
        
        const centerLight = this.ctx.createRadialGradient(
            CONFIG.GAME.CANVAS_WIDTH * 0.5, CONFIG.GAME.CANVAS_HEIGHT * 0.5, 0,
            CONFIG.GAME.CANVAS_WIDTH * 0.5, CONFIG.GAME.CANVAS_HEIGHT * 0.5, 500
        );
        centerLight.addColorStop(0, 'rgba(150, 150, 200, 0.25)');
        centerLight.addColorStop(0.4, 'rgba(120, 120, 170, 0.15)');
        centerLight.addColorStop(1, 'rgba(80, 80, 130, 0)');
        this.ctx.fillStyle = centerLight;
        this.ctx.fillRect(0, 0, CONFIG.GAME.CANVAS_WIDTH, CONFIG.GAME.CANVAS_HEIGHT);
        
        const ambientGlow = this.ctx.createRadialGradient(
            CONFIG.GAME.CANVAS_WIDTH * 0.3, CONFIG.GAME.CANVAS_HEIGHT * 0.6, 0,
            CONFIG.GAME.CANVAS_WIDTH * 0.3, CONFIG.GAME.CANVAS_HEIGHT * 0.6, 350
        );
        ambientGlow.addColorStop(0, 'rgba(200, 180, 255, 0.12)');
        ambientGlow.addColorStop(1, 'rgba(150, 130, 200, 0)');
        this.ctx.fillStyle = ambientGlow;
        this.ctx.fillRect(0, 0, CONFIG.GAME.CANVAS_WIDTH, CONFIG.GAME.CANVAS_HEIGHT);
    }
    
    renderNebulas() {
        this.nebulas.forEach(nebula => {
            const gradient = this.ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.radius
            );
            gradient.addColorStop(0, nebula.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    renderStars() {
        const sortedStars = [...this.stars].sort((a, b) => a.layer - b.layer);
        
        sortedStars.forEach(star => {
            const twinkleIntensity = (star.size / star.baseSize);
            const alpha = star.brightness * (0.7 + twinkleIntensity * 0.5);
            
            const glowSize = star.size * (star.layer + 2) * 2.5;
            const glowGradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, glowSize
            );
            
            let starColor;
            if (star.layer === 3) {
                starColor = '#ffffff';
                glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.7 * twinkleIntensity})`);
                glowGradient.addColorStop(0.3, `rgba(220, 240, 255, ${0.4 * twinkleIntensity})`);
                glowGradient.addColorStop(0.6, `rgba(180, 220, 255, ${0.2 * twinkleIntensity})`);
                glowGradient.addColorStop(1, 'rgba(150, 180, 255, 0)');
            } else if (star.layer === 2) {
                starColor = '#e6f2ff';
                glowGradient.addColorStop(0, `rgba(230, 242, 255, ${0.55 * twinkleIntensity})`);
                glowGradient.addColorStop(0.4, `rgba(180, 210, 255, ${0.25 * twinkleIntensity})`);
                glowGradient.addColorStop(1, 'rgba(130, 170, 220, 0)');
            } else if (star.layer === 1) {
                starColor = '#cce0ff';
                glowGradient.addColorStop(0, `rgba(200, 224, 255, ${0.45 * twinkleIntensity})`);
                glowGradient.addColorStop(0.4, `rgba(150, 185, 220, ${0.2 * twinkleIntensity})`);
                glowGradient.addColorStop(1, 'rgba(100, 150, 190, 0)');
            } else {
                starColor = '#aabbcc';
                glowGradient.addColorStop(0, `rgba(170, 187, 204, ${0.35 * twinkleIntensity})`);
                glowGradient.addColorStop(0.4, `rgba(130, 150, 170, ${0.15 * twinkleIntensity})`);
                glowGradient.addColorStop(1, 'rgba(100, 115, 130, 0)');
            }
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowColor = starColor;
            this.ctx.shadowBlur = star.size * (star.layer + 3);
            
            this.ctx.fillStyle = starColor;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1.0;
            this.ctx.shadowBlur = 0;
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    renderBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.save();
            
            const glowGradient = this.ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, bullet.height
            );
            glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
            glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.height, 0, Math.PI * 2);
            this.ctx.fill();
            
            const gradient = this.ctx.createLinearGradient(bullet.x, bullet.y - bullet.height / 2, bullet.x, bullet.y + bullet.height / 2);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#00ffff');
            gradient.addColorStop(0.7, '#00ccff');
            gradient.addColorStop(1, '#0088ff');
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 20;
            this.ctx.fillRect(
                bullet.x - bullet.width / 2,
                bullet.y - bullet.height / 2,
                bullet.width,
                bullet.height
            );
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(
                bullet.x - 1,
                bullet.y - bullet.height / 2 + 2,
                2,
                bullet.height - 4
            );
            
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        });
    }
    
    renderEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            
            const glowRadius = enemy.width * 1.2;
            const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            glowGradient.addColorStop(0, enemy.color + '60');
            glowGradient.addColorStop(0.5, enemy.color + '30');
            glowGradient.addColorStop(1, enemy.color + '00');
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 25;
            
            const bodyGradient = this.ctx.createLinearGradient(0, -enemy.height / 2, 0, enemy.height / 2);
            bodyGradient.addColorStop(0, '#ffffff');
            bodyGradient.addColorStop(0.2, enemy.color);
            bodyGradient.addColorStop(1, this.darkenColor(enemy.color, 0.6));
            
            this.ctx.fillStyle = bodyGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -enemy.height / 2);
            this.ctx.lineTo(-enemy.width / 2, enemy.height / 2);
            this.ctx.lineTo(enemy.width / 2, enemy.height / 2);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
            
            const eyeGlow = this.ctx.createRadialGradient(0, enemy.height / 4, 0, 0, enemy.height / 4, 8);
            eyeGlow.addColorStop(0, '#ffffff');
            eyeGlow.addColorStop(0.5, enemy.color);
            eyeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = eyeGlow;
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(0, enemy.height / 4, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(0, enemy.height / 4, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        });
    }
    
    darkenColor(hexColor, factor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    renderPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        const outerGlow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.player.width);
        outerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        outerGlow.addColorStop(0.5, 'rgba(0, 200, 255, 0.1)');
        outerGlow.addColorStop(1, 'rgba(0, 100, 255, 0)');
        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.width, 0, Math.PI * 2);
        this.ctx.fill();
        
        const gradient = this.ctx.createLinearGradient(0, -this.player.height / 2, 0, this.player.height / 2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.1, '#00ffff');
        gradient.addColorStop(0.4, '#00ccff');
        gradient.addColorStop(0.7, '#0088ff');
        gradient.addColorStop(1, '#0044aa');
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 30;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 2, this.player.height / 2);
        this.ctx.lineTo(0, this.player.height / 3);
        this.ctx.lineTo(this.player.width / 2, this.player.height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        
        const cockpitGlow = this.ctx.createRadialGradient(0, -5, 0, 0, -5, 15);
        cockpitGlow.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        cockpitGlow.addColorStop(0.5, 'rgba(50, 100, 200, 0.4)');
        cockpitGlow.addColorStop(1, 'rgba(0, 50, 100, 0)');
        this.ctx.fillStyle = cockpitGlow;
        this.ctx.shadowColor = '#00ccff';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -5, 10, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#003366';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -5, 7, 11, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.ellipse(-2, -8, 3, 4, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        const flameSize = 12 + Math.random() * 8;
        const flameWidth = 10;
        
        const outerFlameGradient = this.ctx.createRadialGradient(
            0, this.player.height / 3 + flameSize / 2, 0,
            0, this.player.height / 3 + flameSize / 2, flameSize
        );
        outerFlameGradient.addColorStop(0, 'rgba(255, 200, 50, 0.6)');
        outerFlameGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
        outerFlameGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        
        this.ctx.fillStyle = outerFlameGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, this.player.height / 3 + flameSize / 2, flameWidth + 5, flameSize / 2 + 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const flameGradient = this.ctx.createLinearGradient(0, this.player.height / 3, 0, this.player.height / 3 + flameSize);
        flameGradient.addColorStop(0, '#ffffff');
        flameGradient.addColorStop(0.2, '#ffff00');
        flameGradient.addColorStop(0.5, '#ff8800');
        flameGradient.addColorStop(0.8, '#ff4400');
        flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.fillStyle = flameGradient;
        this.ctx.shadowColor = '#ff6600';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.moveTo(-flameWidth / 2, this.player.height / 3);
        this.ctx.lineTo(flameWidth / 2, this.player.height / 3);
        this.ctx.quadraticCurveTo(flameWidth / 2 + 3, this.player.height / 3 + flameSize * 0.5, 0, this.player.height / 3 + flameSize);
        this.ctx.quadraticCurveTo(-flameWidth / 2 - 3, this.player.height / 3 + flameSize * 0.5, -flameWidth / 2, this.player.height / 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    renderCombo() {
        this.ctx.save();
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(`${this.combo}x 连击!`, CONFIG.GAME.CANVAS_WIDTH / 2, 80);
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpaceShooterGame();
});
