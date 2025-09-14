// 添加音乐播放控制功能
        document.addEventListener('DOMContentLoaded', function() {
            const audio = document.getElementById('dd');
            let audioStarted = false;
            
            function startAudio() {
                if (!audioStarted) {
                    audio.play();
                    audioStarted = true;
                    // 移除事件监听器，避免重复触发
                    document.removeEventListener('keydown', startAudio);
                    document.removeEventListener('mousedown', startAudio);
                }
            }
            
            // 添加键盘和鼠标事件监听
            document.addEventListener('keydown', startAudio);
            document.addEventListener('mousedown', startAudio);
            
            // 当页面失去焦点时暂停音乐
            window.addEventListener('blur', function() {
                if (audioStarted) {
                    audio.pause();
                }
            });
            
            // 当页面重新获得焦点时恢复音乐
            window.addEventListener('focus', function() {
                if (audioStarted) {
                    audio.play();
                }
            });
            
            // 当页面卸载时停止音乐
            window.addEventListener('beforeunload', function() {
                if (audioStarted) {
                    audio.pause();
                }
            });
            
            // 监听NPC对话窗口的显示/隐藏状态
            const npcDialog = document.getElementById('npcDialog');
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'class') {
                        if (npcDialog.classList.contains('hidden')) {
                            // NPC对话结束，恢复音乐
                            if (audioStarted) {
                                audio.play();
                            }
                        } else {
                            // NPC对话开始，暂停音乐
                            if (audioStarted) {
                                audio.pause();
                            }
                        }
                    }
                });
            });
            
            // 开始观察NPC对话窗口的class属性变化
            observer.observe(npcDialog, { attributes: true });
        });

// ==============================
// 游戏配置
// ==============================
let TILE_SIZE = 32;
const GRAVITY = 0.52;
const JUMP_FORCE = -8.62; // 调整为恰好跳跃2格高度
const MOVE_SPEED = 3.28;
const FRICTION = 0.56;
const CAMERA_SCROLL_SPEED = 30;
const MOVE_RAMP_FRAMES = 5;
const MOVE_RAMP_EASE = t => t * t;

let bossImage = null;
let counterItemImage = null;

function getCurrentUrl() {
    const url = window.location.href;
    console.log("当前URL:", url);

    // 尝试从查询参数中获取游戏名称
    const params = new URLSearchParams(window.location.search);
    const gameFromParam = params.get('game');

    if (gameFromParam) {
        console.log("从查询参数获取游戏名称:", gameFromParam);
        return gameFromParam;
    }

    // 如果没有查询参数，尝试从URL路径中获取游戏名称
    // 例如: http://example.com/games/mario.html -> "mario"
    const pathParts = window.location.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (filename && filename.includes('.')) {
        const gameName = filename.split('.')[0];
        console.log("从URL路径获取游戏名称:", gameName);
        return gameName;
    }

    // 如果无法获取游戏名称，返回默认值
    console.log("无法获取游戏名称，使用默认值");
    return "default";
}

gameState.currentLevel = getCurrentUrl();
// 存储
gameStateManager.saveToLocalStorage();



// ==============================
// BOSS配置
// ==============================
const BOSS_CONFIG = {
    // Boss基础属性
    health: 15,
    maxHealth: 15,
    width: 280,
    height: 180,
    imagePath: 'assets/dragon.png',

    // 攻击频率随受伤提升（可调）
    attackSpeed: {
        perHit: 0.08,     // 每受一次伤，冷却乘数减少 8%
        minMultiplier: 0.35 // 冷却下限 35%
    },

    // 攻击模式配置
    attacks: {
        // 圆形弹幕
        circularBullets: {
            damage: 1,
            bulletSpeed: 2,
            bulletRadius: 8,
            bulletCount: 10, // 一次发射的子弹数
            cooldown: 2000, // 基础冷却时间(ms)
            color: '#ff4444'
        },
        // 地面突刺
        groundSpike: {
            damage: 1,
            slowDuration: 2000, // 减速持续时间(ms)
            slowFactor: 0.5, // 减速倍率
            warningTime: 1500, // 预警时间(ms)
            spikeWidth: 32,
            spikeHeight: 48,
            cooldown: 4000,
            warningColor: 'rgba(255, 100, 100, 0.5)',
            spikeColor: '#ff2222'
        },
        // 激光
        laser: {
            damage: 2,
            warningTime: 1500,
            laserDuration: 500, // 激光持续时间(ms)
            laserWidth: 20,
            cooldown: 5000,
            warningColor: 'rgba(255, 200, 0, 0.3)',
            laserColor: '#ffaa00'
        }
    },

    // 反击物配置
    counterItem: {
        spawnIntervalMin: 5000, // 最小生成间隔(ms)
        spawnIntervalMax: 10000, // 最大生成间隔(ms)
        width: 28,
        height: 28,
        color: '#00ff00',
        glowColor: 'rgba(0, 255, 0, 0.3)',
        imagePath: 'assets/knife.webp',
        maxOnField: 3
    }
};

// 玩家生命值配置
const PLAYER_HEALTH_CONFIG = {
    maxHealth: 5,
    invulnerabilityTime: 2000, // 受伤后无敌时间(ms)
    healthBarWidth: 100,
    healthBarHeight: 10,
    healthBarColor: '#00ff00',
    healthBarBgColor: '#333333'
};

// 死亡与屏幕抖动参数
const DEATH_RESPAWN_DELAY = 1000;
const SCREEN_SHAKE_FRAMES = 12;
const SCREEN_SHAKE_MAGNITUDE = 5;
const HITSTOP_MS = 80;
const DEATH_PARTICLE_CONFIG = {
    count: 18,
    speedMin: 2.5,
    speedMax: 5.0,
    gravity: 0.18,
    drag: 0.98,
    lifeMin: 22,
    lifeMax: 38,
    sizeMin: 2,
    sizeMax: 4
};

// 反弹特效
const SPIN_DURATION_MS = 500;
const BOUNCE_SHAKE_FRAMES = 8;
const BOUNCE_SHAKE_MAGNITUDE = 3;
const BOUNCE_SHAKE_INTERVAL = 2;

const BOUNCE_PARTICLE_CONFIG = {
    count: 14,
    speedMin: 1.6,
    speedMax: 3.2,
    gravity: 0.25,
    drag: 0.90,
    lifeMin: 16,
    lifeMax: 28,
    sizeMin: 2,
    sizeMax: 3,
    colors: ['#e9e2d1', '#d8d4c0', '#c7c2b3']
};

// 地面冲击波
const SHOCKWAVE_CONFIG = {
    lifeFrames: 18,
    radiusStart: 6,
    radiusEnd: 30,
    lineWidthStart: 5,
    lineWidthEnd: 1,
    alphaStart: 0.6,
    alphaEnd: 0.0,
    color: '#e9e2d1',
    squashY: 0.35,
    additive: true
};

// 起跳尘土
const JUMP_DUST_PARTICLE_CONFIG = {
    count: 10,
    speedMin: 0.8,
    speedMax: 1.8,
    gravity: 0.22,
    drag: 0.90,
    lifeMin: 12,
    lifeMax: 22,
    sizeMin: 1,
    sizeMax: 2,
    colors: ['#e9e2d1', '#d8d4c0', '#c7c2b3']
};

// 存档点小星星闪光配置
const SAVE_SPARKLE_CONFIG = {
    countSmall: 3,
    radiusMin: 8,
    radiusMax: 12,
    lifeSmallMin: 14,
    lifeSmallMax: 26,
    lifeBigMin: 16,
    lifeBigMax: 32,
    colors: ['#fff7a8', '#ffe16b', '#f3ef09ff'],
    additive: true
};

// 跳跃手感调整变量
const JUMP_GRAVITY_REDUCTION_HEIGHT = 2.0 * TILE_SIZE;
const GRAVITY_REDUCTION_MULTIPLIER = 0.4;

// 计算跳跃总时间
const JUMP_UP_FRAMES = Math.abs(JUMP_FORCE / GRAVITY);
const TOTAL_JUMP_FRAMES = JUMP_UP_FRAMES * 2;

// 手感增强：土狼跳 + 跳跃缓冲
const COYOTE_FRAMES = 6;
const JUMP_BUFFER_FRAMES = 4;

// 玩家精灵图配置
const PLAYER_SPRITE_CONFIG = {
    imagePath: 'assets/frisk_sprite.png',
    frameWidth: 24,
    frameHeight: 32,
    animations: {
        idle: { row: 0, frames: 1 },
        run: { row: 1, frames: 3, frameDelay: 6 },
        jump: { row: 2, frames: 1, frameIndex: 0 },
        fall: { row: 2, frames: 1, frameIndex: 1 }
    }
};

let currentLevelIndex = 0;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==============================
// Boss状态管理
// ==============================
const bossState = {
    active: false,
    x: 0,
    y: 0,
    health: BOSS_CONFIG.health,
    damagesTaken: 0, // 受到的伤害次数
    unlockedAttacks: ['circularBullets'], // 初始只有圆形弹幕

    // 攻击冷却管理
    attackCooldowns: {
        circularBullets: 0,
        groundSpike: 0,
        laser: 0
    },

    // 当前攻击状态
    currentAttack: null,
    attackStartTime: 0,

    // 子弹管理
    bullets: [],

    // 突刺管理
    spikes: [],

    // 激光管理
    lasers: [],

    // 反击物管理
    counterItems: [],
    nextCounterItemSpawn: 0,

    // Boss动画
    animationFrame: 0,
    hitFlashTime: 0
};

// 玩家扩展状态
const playerBossState = {
    health: PLAYER_HEALTH_CONFIG.maxHealth,
    invulnerableUntil: 0,
    slowedUntil: 0,
    slowFactor: 1
};

// ==============================
// Boss系统初始化
// ==============================
function initBossSystem() {
    // Boss位置（屏幕中上）
    bossState.x = canvas.width / 2 - BOSS_CONFIG.width / 2;
    bossState.y = 50;

    // 基本状态
    bossState.active = true;
    bossState.health = BOSS_CONFIG.maxHealth;
    bossState.damagesTaken = 0;
    bossState.unlockedAttacks = ['circularBullets'];

    // 冷却 & 当前攻击
    bossState.attackCooldowns = { circularBullets: 0, groundSpike: 0, laser: 0 };
    bossState.currentAttack = null;
    bossState.attackStartTime = 0;

    // 清空场上物件
    bossState.bullets = [];
    bossState.spikes = [];
    bossState.lasers = [];
    bossState.counterItems = [];

    // 受击闪光/动画
    bossState.hitFlashTime = 0;
    bossState.animationFrame = 0;

    // 玩家在Boss战内的状态
    playerBossState.health = PLAYER_HEALTH_CONFIG.maxHealth;
    playerBossState.invulnerableUntil = 0;
    playerBossState.slowedUntil = 0;
    playerBossState.slowFactor = 1;

    // 下一个反击物时间
    bossState.nextCounterItemSpawn = performance.now() +
        BOSS_CONFIG.counterItem.spawnIntervalMin +
        Math.random() * (BOSS_CONFIG.counterItem.spawnIntervalMax - BOSS_CONFIG.counterItem.spawnIntervalMin);

    // 清理浮空文字（避免“解锁/击败”残留）
    if (gameState.effects?.floatingTexts) {
        gameState.effects.floatingTexts.length = 0;
    }
}

// ==============================
// Boss攻击系统
// ==============================
function updateBossAttacks() {
    if (!bossState.active) return;

    const now = performance.now();

    // 冷却减少
    for (let attack in bossState.attackCooldowns) {
        if (bossState.attackCooldowns[attack] > 0) {
            bossState.attackCooldowns[attack] -= FIXED_DT_MS; // 用固定帧
        }
    }

    // 并行触发：每个已解锁、冷却到期的攻击都执行一次
    for (const atk of bossState.unlockedAttacks) {
        if (bossState.attackCooldowns[atk] <= 0) {
            startBossAttack(atk);
        }
    }

    // 更新进行中的技能/子弹/物件
    updateCurrentAttack();
    updateBullets();
    updateSpikes();
    updateLasers();
    updateCounterItems();

    // 反击物生成
    if (now >= bossState.nextCounterItemSpawn) {
        const ci = BOSS_CONFIG.counterItem;
        if (bossState.counterItems.length < (ci.maxOnField ?? Infinity)) {
            spawnCounterItem();
            bossState.nextCounterItemSpawn = now +
                ci.spawnIntervalMin +
                Math.random() * (ci.spawnIntervalMax - ci.spawnIntervalMin);
        } else {
            // 已达上限：延迟稍后再尝试（避免每帧尝试）
            bossState.nextCounterItemSpawn = now + 1000; // 1秒后重试
        }
    }
}

// 开始Boss攻击
function startBossAttack(attackType) {
    const m = Math.max(
        BOSS_CONFIG.attackSpeed?.minMultiplier ?? 0.35,
        1 - bossState.damagesTaken * (BOSS_CONFIG.attackSpeed?.perHit ?? 0.08)
    );

    switch (attackType) {
        case 'circularBullets':
            fireCircularBullets();
            bossState.attackCooldowns.circularBullets =
                BOSS_CONFIG.attacks.circularBullets.cooldown * m * (0.9 + Math.random() * 0.2);
            break;
        case 'groundSpike':
            startGroundSpike();
            bossState.attackCooldowns.groundSpike =
                BOSS_CONFIG.attacks.groundSpike.cooldown * m * (0.9 + Math.random() * 0.2);
            break;
        case 'laser':
            startLaser();
            bossState.attackCooldowns.laser =
                BOSS_CONFIG.attacks.laser.cooldown * m * (0.9 + Math.random() * 0.2);
            break;
    }
}

// 圆形弹幕攻击
function fireCircularBullets() {
    const centerX = bossState.x + BOSS_CONFIG.width / 2 + gameState.camera.x; // +cam
    const centerY = bossState.y + BOSS_CONFIG.height / 2 + gameState.camera.y; // +cam
    const config = BOSS_CONFIG.attacks.circularBullets;

    for (let i = 0; i < config.bulletCount; i++) {
        const angle = (Math.PI * 2 / config.bulletCount) * i;
        const vx = Math.cos(angle) * config.bulletSpeed;
        const vy = Math.sin(angle) * config.bulletSpeed;

        bossState.bullets.push({
            x: centerX,
            y: centerY,
            vx: vx,
            vy: vy,
            radius: config.bulletRadius,
            damage: config.damage,
            color: config.color
        });
    }
}

// 地面突刺攻击
function startGroundSpike() {
    const player = gameState.player;
    const config = BOSS_CONFIG.attacks.groundSpike;

    bossState.spikes.push({
        x: player.x + player.width / 2 - config.spikeWidth / 2,
        y: player.y + player.height,
        width: config.spikeWidth,
        height: config.spikeHeight,
        warningStartTime: performance.now(),
        warningTime: config.warningTime,
        damage: config.damage,
        active: false
    });
}

// 激光攻击
function startLaser() {
    const player = gameState.player;
    const config = BOSS_CONFIG.attacks.laser;

    const edges = ['top', 'bottom', 'left', 'right'];
    const edge = edges[Math.floor(Math.random() * edges.length)];

    const cam = gameState.camera;
    let startX, startY;
    switch (edge) {
        case 'top':
            startX = cam.x + Math.random() * canvas.width;
            startY = cam.y;
            break;
        case 'bottom':
            startX = cam.x + Math.random() * canvas.width;
            startY = cam.y + canvas.height;
            break;
        case 'left':
            startX = cam.x;
            startY = cam.y + Math.random() * canvas.height;
            break;
        case 'right':
            startX = cam.x + canvas.width;
            startY = cam.y + Math.random() * canvas.height;
            break;
    }

    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;

    bossState.lasers.push({
        startX, startY, targetX, targetY,
        warningStartTime: performance.now(),
        warningTime: config.warningTime,
        duration: config.laserDuration,
        damage: config.damage,
        active: false
    });
}

// 更新当前攻击状态
function updateCurrentAttack() {
    const now = performance.now();

    // 突刺
    for (let i = bossState.spikes.length - 1; i >= 0; i--) {
        const spike = bossState.spikes[i];
        if (!spike.active && now - spike.warningStartTime >= spike.warningTime) {
            spike.active = true;
            spike.activeStartTime = now;
        }
        if (spike.active && now - spike.activeStartTime >= 500) {
            bossState.spikes.splice(i, 1);
        }
    }

    // 激光
    for (let i = bossState.lasers.length - 1; i >= 0; i--) {
        const laser = bossState.lasers[i];
        if (!laser.active && now - laser.warningStartTime >= laser.warningTime) {
            laser.active = true;
            laser.activeStartTime = now;
        }
        if (laser.active && now - laser.activeStartTime >= laser.duration) {
            bossState.lasers.splice(i, 1);
        }
    }
}

// 更新子弹
function updateBullets() {
    const cam = gameState.camera;
    for (let i = bossState.bullets.length - 1; i >= 0; i--) {
        const b = bossState.bullets[i];
        b.x += b.vx; b.y += b.vy;
        if (b.x < cam.x - 80 || b.x > cam.x + canvas.width + 80 ||
            b.y < cam.y - 80 || b.y > cam.y + canvas.height + 80) {
            bossState.bullets.splice(i, 1);
        }
    }
}

// 更新突刺
function updateSpikes() {
    const player = gameState.player;
    const now = performance.now();

    for (const spike of bossState.spikes) {
        if (spike.active) {
            // 检测与玩家的碰撞
            if (player.x < spike.x + spike.width &&
                player.x + player.width > spike.x &&
                player.y < spike.y &&
                player.y + player.height > spike.y - spike.height) {

                damagePlayer(spike.damage, 'boss');

                // 应用减速效果
                const config = BOSS_CONFIG.attacks.groundSpike;
                playerBossState.slowedUntil = now + config.slowDuration;
                playerBossState.slowFactor = config.slowFactor;

                // 移除突刺（避免重复伤害）
                const index = bossState.spikes.indexOf(spike);
                if (index > -1) {
                    bossState.spikes.splice(index, 1);
                }
            }
        }
    }
}

// 更新激光
function updateLasers() {
    const player = gameState.player;
    const now = performance.now();

    for (const laser of bossState.lasers) {
        if (laser.active) {
            // 计算激光线段与玩家的碰撞
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;

            // 简化的碰撞检测：检查玩家中心点到激光线的距离
            const distance = pointToLineDistance(
                playerCenterX, playerCenterY,
                laser.startX, laser.startY,
                laser.targetX, laser.targetY
            );

            if (distance < BOSS_CONFIG.attacks.laser.laserWidth / 2 + player.width / 2) {
                damagePlayer(laser.damage, 'boss');

                // 移除激光（避免重复伤害）
                const index = bossState.lasers.indexOf(laser);
                if (index > -1) {
                    bossState.lasers.splice(index, 1);
                }
            }
        }
    }
}

// 计算点到线段的距离
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

// 更新反击物
function updateCounterItems() {
    const player = gameState.player;

    for (let i = bossState.counterItems.length - 1; i >= 0; i--) {
        const item = bossState.counterItems[i];

        // 添加浮动动画
        item.floatOffset = Math.sin(performance.now() * 0.003) * 5;

        // 检测与玩家的碰撞
        if (player.x < item.x + BOSS_CONFIG.counterItem.width &&
            player.x + player.width > item.x &&
            player.y < item.y + BOSS_CONFIG.counterItem.height + item.floatOffset &&
            player.y + player.height > item.y + item.floatOffset) {

            // 玩家捡起反击物
            bossState.counterItems.splice(i, 1);

            // 对Boss造成伤害
            damageBoss(1);
        }
    }
}

// 生成反击物
function spawnCounterItem() {
    const mapW = (gameState.mapData?.width || 0) * TILE_SIZE;
    const mapH = (gameState.mapData?.height || 0) * TILE_SIZE;

    const minY = Math.max(0, mapH * 0.75);
    const maxY = Math.max(minY + 1, mapH - BOSS_CONFIG.counterItem.height - 50);
    const minX = 50;
    const maxX = Math.max(minX + 1, mapW - BOSS_CONFIG.counterItem.width - 200);

    bossState.counterItems.push({
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        floatOffset: 0
    });
}

// ==============================
// 伤害处理系统
// ==============================

// 对玩家造成伤害
function damagePlayer(damage, reason = 'boss') {
    const now = performance.now();
    if (now < playerBossState.invulnerableUntil) return;

    playerBossState.health -= damage;
    playerBossState.invulnerableUntil = now + PLAYER_HEALTH_CONFIG.invulnerabilityTime;

    startScreenShake(SCREEN_SHAKE_FRAMES, SCREEN_SHAKE_MAGNITUDE);
    spawnDamageParticles(gameState.player.x + gameState.player.width / 2,
        gameState.player.y + gameState.player.height / 2);

    if (playerBossState.health <= 0) {
        handlePlayerHPDeath(reason);
    }
}

function handlePlayerHPDeath(reason) {
    playerBossState.health = 0;
    killPlayer(reason);

    setTimeout(() => {
        playerBossState.health = PLAYER_HEALTH_CONFIG.maxHealth;
        playerBossState.invulnerableUntil = 0;
        playerBossState.slowedUntil = 0;
        playerBossState.slowFactor = 1;

        // 清空Boss攻击
        bossState.bullets = [];
        bossState.spikes = [];
        bossState.lasers = [];
    }, DEATH_RESPAWN_DELAY);
}

// 对Boss造成伤害
function damageBoss(damage) {

    bossState.health -= damage;
    bossState.damagesTaken++;
    bossState.hitFlashTime = performance.now() + 200; // 200ms的受击闪烁

    // 屏幕抖动（较轻）
    startScreenShake(6, 3);

    // Boss受伤特效
    spawnBossDamageParticles();

    // 检查解锁新攻击
    if (bossState.damagesTaken >= 3 && !bossState.unlockedAttacks.includes('groundSpike')) {
        bossState.unlockedAttacks.push('groundSpike');
        showUnlockMessage("Boss解锁了新攻击：地面突刺！");
    }
    if (bossState.damagesTaken >= 5 && !bossState.unlockedAttacks.includes('laser')) {
        bossState.unlockedAttacks.push('laser');
        showUnlockMessage("Boss解锁了新攻击：激光射线！");
    }

    // 检查Boss是否被击败
    if (bossState.health <= 0) {
        handleBossDefeat();
    }
}

// 显示闪避文字
function showDodgeText() {
    // 在Boss上方显示"MISS"或"闪避"文字
    gameState.effects.floatingTexts = gameState.effects.floatingTexts || [];
    gameState.effects.floatingTexts.push({
        text: "闪避!",
        x: bossState.x + BOSS_CONFIG.width / 2,
        y: bossState.y - 10,
        vy: -2,
        life: 60,
        color: '#ffff00'
    });
}

// 显示解锁消息
function showUnlockMessage(message) {
    gameState.effects.floatingTexts = gameState.effects.floatingTexts || [];
    gameState.effects.floatingTexts.push({
        text: message,
        x: canvas.width / 2,
        y: canvas.height / 3,
        vy: 0,
        life: 120,
        color: '#ff00ff',
        fontSize: 20
    });
}

// 生成伤害粒子
function spawnDamageParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 2;

        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 2,
            life: 20 + Math.random() * 10,
            maxLife: 30,
            color: '#ff0000',
            drag: 0.95,
            gravity: 0.1
        });
    }
}

// 生成Boss伤害粒子
function spawnBossDamageParticles() {
    const centerX = bossState.x + BOSS_CONFIG.width / 2;
    const centerY = bossState.y + BOSS_CONFIG.height / 2;

    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 3;

        gameState.particles.push({
            x: centerX + (Math.random() - 0.5) * BOSS_CONFIG.width,
            y: centerY + (Math.random() - 0.5) * BOSS_CONFIG.height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 4 + Math.random() * 3,
            life: 25 + Math.random() * 15,
            maxLife: 40,
            color: '#ff00ff',
            drag: 0.93,
            gravity: 0.15
        });
    }
}

// 处理玩家在Boss战中死亡
function handlePlayerBossDeath() {
    playerBossState.health = 0;
    killPlayer('boss');
}

// 处理Boss被击败
function handleBossDefeat() {
    bossState.active = false;

    // 大爆炸特效
    const centerX = bossState.x + BOSS_CONFIG.width / 2;
    const centerY = bossState.y + BOSS_CONFIG.height / 2;

    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 5;

        gameState.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 5 + Math.random() * 5,
            life: 40 + Math.random() * 20,
            maxLife: 60,
            color: ['#ff00ff', '#ffff00', '#00ffff'][Math.floor(Math.random() * 3)],
            drag: 0.92,
            gravity: 0.2
        });
    }

    // 屏幕大抖动
    startScreenShake(30, 10);

    // 显示胜利消息
    showUnlockMessage("Boss被击败了！");

    // 清空所有攻击
    bossState.bullets = [];
    bossState.spikes = [];
    bossState.lasers = [];
    bossState.counterItems = [];

    // 可以在这里添加过关逻辑
    setTimeout(() => {
        // 例如：跳转到下一关或显示胜利画面
        gameState.bossDefeated = true;
    }, 3000);
}

function ensureHudHintsContainer() {
  let c = document.getElementById('hudHints');
  if (!c) {
    c = document.createElement('div');
    c.id = 'hudHints';
    document.body.appendChild(c);
  }
  return c;
}

// 顶部提示：默认显示 5 秒
function showHudHint(text, duration = 5000) {
  const container = ensureHudHintsContainer();
  const el = document.createElement('div');
  el.className = 'hint-bubble';
  el.textContent = text;
  container.appendChild(el);

  // 进入场动画
  requestAnimationFrame(() => el.classList.add('show'));

  // 退出和移除
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function scheduleBossDialogHints() {
  if (gameState.bossDialogHintsScheduled) return;

  // 仅在对话层可见时安排
  const dlg = document.getElementById('npcDialog');
  const dialogOpen = dlg && !dlg.classList.contains('hidden');
  if (!dialogOpen) return;

  gameState.hintTimers.upLook = setTimeout(() => {
    showHudHint('向上看', 7000);
  }, 20 * 1000);

  gameState.hintTimers.changeUrl = setTimeout(() => {
    showHudHint('你可以改变网址', 7000);
  }, 40 * 1000);

  gameState.bossDialogHintsScheduled = true;w
}

function clearBossDialogHints() {
  if (gameState.hintTimers.upLook) {
    clearTimeout(gameState.hintTimers.upLook);
    gameState.hintTimers.upLook = null;
  }
  if (gameState.hintTimers.changeUrl) {
    clearTimeout(gameState.hintTimers.changeUrl);
    gameState.hintTimers.changeUrl = null;
  }
  gameState.bossDialogHintsScheduled = false;

  // 清理当前屏幕上的提示元素（可选）
  const c = document.getElementById('hudHints');
  if (c) c.innerHTML = '';
}

// ==============================
// Boss战碰撞检测
// ==============================

// 检测子弹与玩家的碰撞
function checkBulletCollisions() {
    const player = gameState.player;

    for (let i = bossState.bullets.length - 1; i >= 0; i--) {
        const bullet = bossState.bullets[i];

        // 圆形与矩形的碰撞检测
        const closestX = Math.max(player.x, Math.min(bullet.x, player.x + player.width));
        const closestY = Math.max(player.y, Math.min(bullet.y, player.y + player.height));

        const distanceX = bullet.x - closestX;
        const distanceY = bullet.y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        if (distanceSquared < bullet.radius * bullet.radius) {
            damagePlayer(bullet.damage, 'boss');
            bossState.bullets.splice(i, 1);
        }
    }
}

// ==============================
// Boss战渲染
// ==============================

// 绘制Boss
function drawBoss() {
    if (!bossState.active) return;

    const now = performance.now();
    ctx.save();

    // 受击闪烁
    if (now < bossState.hitFlashTime) ctx.globalAlpha = 0.7;

    if (bossImage) {
        // Boss 固定在屏幕坐标（无需减相机）
        ctx.drawImage(bossImage, bossState.x, bossState.y, BOSS_CONFIG.width, BOSS_CONFIG.height);
    } else {
        // 兜底矩形
        ctx.fillStyle = now < bossState.hitFlashTime ? '#ffffff' : '#8b0000';
        ctx.fillRect(bossState.x, bossState.y, BOSS_CONFIG.width, BOSS_CONFIG.height);
    }

    ctx.restore();
    drawBossHealthBar();
}

// 绘制Boss血条
function drawBossHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 20;

    // 背景
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 血量
    const healthPercent = Math.max(0, bossState.health / BOSS_CONFIG.maxHealth);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // 边框
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Boss名称
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', canvas.width / 2, y - 5);
}

// 绘制玩家血条
function drawPlayerHealthBar() {
    const x = 20;
    const y = canvas.height - 30;

    // 背景
    ctx.fillStyle = PLAYER_HEALTH_CONFIG.healthBarBgColor;
    ctx.fillRect(x, y, PLAYER_HEALTH_CONFIG.healthBarWidth, PLAYER_HEALTH_CONFIG.healthBarHeight);

    // 血量
    const healthPercent = Math.max(0, playerBossState.health / PLAYER_HEALTH_CONFIG.maxHealth);
    ctx.fillStyle = PLAYER_HEALTH_CONFIG.healthBarColor;
    ctx.fillRect(x, y, PLAYER_HEALTH_CONFIG.healthBarWidth * healthPercent, PLAYER_HEALTH_CONFIG.healthBarHeight);

    // 边框
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(x, y, PLAYER_HEALTH_CONFIG.healthBarWidth, PLAYER_HEALTH_CONFIG.healthBarHeight);

    // 显示数字
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${playerBossState.health}/${PLAYER_HEALTH_CONFIG.maxHealth}`, x, y - 5);
}

// 绘制子弹
function drawBullets() {
    ctx.fillStyle = BOSS_CONFIG.attacks.circularBullets.color;
    const cam = gameState.camera;
    for (const bullet of bossState.bullets) {
        const sx = bullet.x - cam.x;
        const sy = bullet.y - cam.y;
        ctx.beginPath();
        ctx.arc(sx, sy, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawSpikes() {
    const cam = gameState.camera;
    for (const spike of bossState.spikes) {
        const sx = spike.x - cam.x;
        const sy = spike.y - cam.y;
        if (!spike.active) {
            ctx.fillStyle = BOSS_CONFIG.attacks.groundSpike.warningColor;
            ctx.fillRect(sx, sy - spike.height, spike.width, spike.height);
            if (Math.floor(performance.now() / 100) % 2 === 0) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx, sy - spike.height, spike.width, spike.height);
            }
        } else {
            ctx.fillStyle = BOSS_CONFIG.attacks.groundSpike.spikeColor;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + spike.width / 2, sy - spike.height);
            ctx.lineTo(sx + spike.width, sy);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawLasers() {
    const cam = gameState.camera;
    for (const laser of bossState.lasers) {
        const x1 = laser.startX - cam.x;
        const y1 = laser.startY - cam.y;
        const x2 = laser.targetX - cam.x;
        const y2 = laser.targetY - cam.y;

        if (!laser.active) {
            ctx.strokeStyle = BOSS_CONFIG.attacks.laser.warningColor;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
            if (Math.floor(performance.now() / 200) % 2 === 0) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x2, y2, 20, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            ctx.strokeStyle = BOSS_CONFIG.attacks.laser.laserColor;
            ctx.lineWidth = BOSS_CONFIG.attacks.laser.laserWidth;
            ctx.shadowColor = BOSS_CONFIG.attacks.laser.laserColor;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, 'rgba(255, 170, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 170, 0, 0.8)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = BOSS_CONFIG.attacks.laser.laserWidth * 1.5;
            ctx.stroke();
        }
    }
}

function drawCounterItems() {
    const cam = gameState.camera;
    for (const item of bossState.counterItems) {
        const y = item.y + item.floatOffset;
        const sx = item.x - cam.x;
        const sy = y - cam.y;

        // 发光效果保留
        ctx.fillStyle = BOSS_CONFIG.counterItem.glowColor;
        ctx.beginPath();
        ctx.arc(
            sx + BOSS_CONFIG.counterItem.width / 2,
            sy + BOSS_CONFIG.counterItem.height / 2,
            BOSS_CONFIG.counterItem.width,
            0, Math.PI * 2
        );
        ctx.fill();

        if (counterItemImage) {
            ctx.drawImage(counterItemImage, sx, sy, BOSS_CONFIG.counterItem.width, BOSS_CONFIG.counterItem.height);
        } else {
            // 兜底矩形
            ctx.fillStyle = BOSS_CONFIG.counterItem.color;
            ctx.fillRect(sx, sy, BOSS_CONFIG.counterItem.width, BOSS_CONFIG.counterItem.height);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, BOSS_CONFIG.counterItem.width, BOSS_CONFIG.counterItem.height);
        }
    }
}

// 更新漂浮文字
function updateFloatingTexts() {
    if (!gameState.effects.floatingTexts) return;

    for (let i = gameState.effects.floatingTexts.length - 1; i >= 0; i--) {
        const text = gameState.effects.floatingTexts[i];
        text.y += text.vy;
        text.life--;

        if (text.life <= 0) {
            gameState.effects.floatingTexts.splice(i, 1);
        }
    }
}

// 绘制漂浮文字
function drawFloatingTexts() {
    if (!gameState.effects.floatingTexts) return;

    for (const text of gameState.effects.floatingTexts) {
        const alpha = Math.min(1, text.life / 30);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = text.color;
        ctx.font = `${text.fontSize || 16}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(text.text, text.x, text.y);
        ctx.restore();
    }
}

// ==============================
// 存档功能（原有代码）
// ==============================

function getSavePointLayer() {
    return gameState.mapData?.layers.find(l =>
        l.type === 'objectgroup' &&
        l.name.toLowerCase() === 'savepoint'
    );
}

function checkSavePointCollision() {
    const player = gameState.player;
    const savePointLayer = getSavePointLayer();

    if (!savePointLayer || !savePointLayer.objects) return null;

    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    for (const savePoint of savePointLayer.objects) {
        if (!savePoint.gid) continue;

        const spLeft = savePoint.x;
        const spRight = savePoint.x + savePoint.width;
        const spTop = savePoint.y - savePoint.height;
        const spBottom = savePoint.y;

        if (playerLeft < spRight &&
            playerRight > spLeft &&
            playerTop < spBottom &&
            playerBottom > spTop) {
            return {
                id: savePoint.id,
                x: savePoint.x + savePoint.width / 2 - player.width / 2,
                y: savePoint.y - savePoint.height - player.height,
                fxX: savePoint.x + savePoint.width / 2,
                fxY: spTop - 3
            };
        }
    }

    return null;
}

function checkNPCCollision() {
    const player = gameState.player;
    const npcLayer = getNPCLayer();
    if (!npcLayer) return null;

    for (const npc of npcLayer.objects) {
        if ((npc.type || '').toLowerCase() !== 'npc') continue;

        const nLeft = npc.x;
        const nRight = npc.x + npc.width;
        const nTop = npc.y - npc.height;
        const nBottom = npc.y;

        const pLeft = player.x;
        const pRight = player.x + player.width;
        const pTop = player.y;
        const pBottom = player.y + player.height;

        if (pRight > nLeft && pLeft < nRight && pBottom > nTop && pTop < nBottom) {
            return npc;
        }
    }
    return null;
}

function showCheckpointMessage() {
    gameState.checkpointMessage.text = '这使你充满了决心';
    gameState.checkpointMessage.x = gameState.player.x;
    gameState.checkpointMessage.y = gameState.player.y - 20;
    gameState.checkpointMessage.timer = 120;
    gameState.checkpointMessage.alpha = 1.0;
    gameState.checkpointMessage.counter++;
    gameStateManager.saveToLocalStorage();
}

// ==============================
// 尖刺检测功能（原有代码）
// ==============================

function getHazardsLayer() {
    return gameState.mapData?.layers.find(l =>
        l.type === 'objectgroup' &&
        (l.name.toLowerCase() === 'hazards' || l.name.toLowerCase() === 'spikes')
    );
}

function checkSpikeCollision() {
    const player = gameState.player;
    const hazardsLayer = getHazardsLayer();

    if (!hazardsLayer || !hazardsLayer.objects) return false;

    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    for (const hazard of hazardsLayer.objects) {
        if ((hazard.type || hazard.class || '').toLowerCase() !== 'spike') continue;

        if (hazard.polygon) {
            let minX = hazard.x + hazard.polygon[0].x;
            let maxX = minX;
            let minY = hazard.y + hazard.polygon[0].y;
            let maxY = minY;

            for (const point of hazard.polygon) {
                const px = hazard.x + point.x;
                const py = hazard.y + point.y;
                minX = Math.min(minX, px);
                maxX = Math.max(maxX, px);
                minY = Math.min(minY, py);
                maxY = Math.max(maxY, py);
            }

            if (playerLeft < maxX &&
                playerRight > minX &&
                playerTop < maxY &&
                playerBottom > minY) {
                return true;
            }
        } else {
            const hazardLeft = hazard.x;
            const hazardRight = hazard.x + hazard.width;
            const hazardTop = hazard.y;
            const hazardBottom = hazard.y + hazard.height;

            if (playerLeft < hazardRight &&
                playerRight > hazardLeft &&
                playerTop < hazardBottom &&
                playerBottom > hazardTop) {
                return true;
            }
        }
    }

    return false;
}

function checkSpikeTileCollision() {
    const player = gameState.player;
    const spikeLayer = gameState.mapData?.layers.find(l =>
        l.type === 'tilelayer' && l.name.toLowerCase() === 'spikes'
    );

    if (!spikeLayer) return false;

    const left = Math.floor(player.x / TILE_SIZE);
    const right = Math.floor((player.x + player.width - 1) / TILE_SIZE);
    const top = Math.floor(player.y / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE);

    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            if (x < 0 || x >= spikeLayer.width || y < 0 || y >= spikeLayer.height) continue;

            const tileGid = spikeLayer.data[y * spikeLayer.width + x];
            if (tileGid > 0) {
                return true;
            }
        }
    }

    return false;
}

function handlePlayerDeath(reason) {
    killPlayer();
}

function countJumps(reason) {
    if (reason === 'jump43') {
        gameState.player.jumpCount43++;
    }
}

// ==============================
// 主更新（整合Boss系统）
// ==============================
function update() {
    updateCameraShake();

    if (gameState.death.active) {
        updateDeath();
        updateFlash();
        return;
    }

    // 更新Boss战系统
    if (bossState.active) {
        updateBossAttacks();
        checkBulletCollisions();
        updateFloatingTexts();
    }

    if (gameState.camera.isMoving) {
        moveCameraTowardsTarget();
    } else {
        updatePlayer();
        checkForScreenTransition();
    }
    if (!gameState.camera.isMoving) {
        checkLevelEnd();
    }

    gameState.animationTime += FIXED_DT_MS;
    updatePlayerAnimation();
    updateParticles();
    updateShockwaves();
    updateSparkles();
    updateFlash();
}

// ==============================
// NPC 对话控制（原有代码）
// ==============================
let isPaused = false;

function pauseGame() { isPaused = true; }
function resumeGame() { isPaused = false; }

function showNpcDialog(url) {
    console.log("准备加载对话页面：", url);
    const frame = document.getElementById('dialogFrame');
    frame.src = url;
    document.getElementById('npcDialog').classList.remove('hidden');
    pauseGame();
}

function closeNpcDialog() {
    const frame = document.getElementById('dialogFrame');
    frame.src = "";
    document.getElementById('npcDialog').classList.add('hidden');
    clearBossDialogHints();
    resumeGame();
}

document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("dialogCloseBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeNpcDialog);
    }
});

// ==============================
// 玩家逻辑（修正减速效果）
// ==============================
function updatePlayer() {
    const player = gameState.player;

    if (player.moveHeldFrames === undefined) {
        player.moveHeldFrames = 0;
        player.moveDir = 0;
    }

    const leftHeld = gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A'];
    const rightHeld = gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D'];

    let inputDir = 0;
    if (leftHeld && !rightHeld) inputDir = -1;
    else if (rightHeld && !leftHeld) inputDir = 1;

    // 应用减速效果
    const now = performance.now();
    let speedMultiplier = 1;
    if (playerBossState.slowedUntil > now) {
        speedMultiplier = playerBossState.slowFactor;
    }

    if (inputDir !== 0) {
        if (inputDir !== player.moveDir) {
            player.moveHeldFrames = 0;
        } else {
            player.moveHeldFrames++;
        }
        player.moveDir = inputDir;

        const t = Math.min(1, (player.moveHeldFrames + 1) / MOVE_RAMP_FRAMES);
        const eased = MOVE_RAMP_EASE(t);

        player.velX = inputDir * MOVE_SPEED * eased * speedMultiplier;
        player.facing = inputDir === -1 ? 'left' : 'right';
    } else {
        player.moveDir = 0;
        player.moveHeldFrames = 0;
        player.velX *= FRICTION;
        if (Math.abs(player.velX) < 0.1) player.velX = 0;
    }

    if (gameState.keys[' ']) {
        if (!player.isJumping && player.canJump) {
            player.velY = JUMP_FORCE;
            player.isJumping = true;
            player.isFalling = false;
            player.jumpFrameCounter = 0;
            player.hitCeiling = false;
            player.ceilingHangFrames = 0;
            player.jumpStartY = player.y;
            player.canJump = false;
            triggerJumpEffect();
        }
    } else {
        player.canJump = true;
    }

    if (gameState.keys['r'] || gameState.keys['R']) {
        setPlayerStartPosition();
        setInitialCameraPosition();
    }

    const groundCheck = checkCollision(player.x, player.y + 1, player.width, player.height);

    const isOnGround = !!groundCheck;

    if (isOnGround) {
        player.coyoteFrames = COYOTE_FRAMES;
    } else if (player.coyoteFrames > 0) {
        player.coyoteFrames--;
    }

    if (player.jumpBufferFrames > 0 && (isOnGround || player.coyoteFrames > 0)) {
        player.velY = JUMP_FORCE;
        player.isJumping = true;
        player.isFalling = false;
        player.jumpFrameCounter = 0;
        player.hitCeiling = false;
        player.ceilingHangFrames = 0;
        player.jumpStartY = player.y;
        player.canJump = false;
        player.jumpBufferFrames = 0;
        triggerJumpEffect();
    }

    if (player.jumpBufferFrames > 0) player.jumpBufferFrames--;

    if (groundCheck && player.velY >= 0 && !player.isJumping && !player.isFalling) {
        if (player.isJumping && player.velY > 0) {
            player.isJumping = false;
            player.isFalling = false;
            player.jumpFrameCounter = 0;
            player.hitCeiling = false;
            player.ceilingHangFrames = 0;
        } else if (!player.isJumping) {
            player.isJumping = false;
            player.isFalling = false;
        }

        player.velY = 0;
        player.y = groundCheck.y - player.height;
        player.lastGroundY = player.y;
    } else {
        if (player.isJumping) {
            player.jumpFrameCounter++;

            const jumpHeight = player.jumpStartY - player.y;

            let currentGravity = GRAVITY;
            if (jumpHeight >= JUMP_GRAVITY_REDUCTION_HEIGHT && player.velY < 0 && !player.hitCeiling) {
                currentGravity = GRAVITY * GRAVITY_REDUCTION_MULTIPLIER;
            }

            if (player.hitCeiling) {
                player.ceilingHangFrames++;
                const remainingFrames = TOTAL_JUMP_FRAMES - 2 * player.jumpFrameCounter + 8;

                if (remainingFrames <= 0) {
                    player.hitCeiling = false;
                    player.velY += GRAVITY;
                } else {
                    player.velY = 0.01;
                }
            } else {
                player.velY += currentGravity;
            }
        } else {
            player.velY += GRAVITY;
        }

        if (!player.isFalling && player.velY >= 0 && player.isJumping) {
            player.isFalling = true;
            player.fallStartY = player.y;
        }

        let nextPlayerY = player.y + player.velY;
        const yCollision = checkCollision(player.x, nextPlayerY, player.width, player.height);

        if (yCollision) {
            if (player.velY > 0) {
                if (player.isFalling) {
                    const fallDistance = yCollision.y - player.height - player.fallStartY;
                    const tiles = Math.round(fallDistance / TILE_SIZE);

                    if (tiles === 4) {
                        // 弹一次（保留原逻辑）
                        player.y = yCollision.y - player.height;
                        player.velY = -Math.sqrt(2 * GRAVITY * 3.3 * TILE_SIZE);
                        player.isJumping = true;
                        player.isFalling = false;
                        player.jumpFrameCounter = 0;
                        player.hitCeiling = false;
                        player.ceilingHangFrames = 0;
                        triggerBounceEffect(player.x + player.width / 2, yCollision.y);
                        countJumps('jump43');
                        gameStateManager.saveToLocalStorage();
                        return;
                    } else if (tiles === 5) {
                        // 弹一次（保留原逻辑）
                        player.y = yCollision.y - player.height;
                        player.velY = -Math.sqrt(2 * GRAVITY * 4.3 * TILE_SIZE);
                        player.isJumping = true;
                        player.isFalling = false;
                        player.jumpFrameCounter = 0;
                        player.hitCeiling = false;
                        player.ceilingHangFrames = 0;
                        triggerBounceEffect(player.x + player.width / 2, yCollision.y);
                        return;
                    } else if (tiles === 3 || tiles >= 6) {
                        // 改成扣一滴血，但继续落地
                        damagePlayer(1, 'fall'); // 注意：带上 'fall' 原因
                        // 不 return，继续执行下面的落地归位
                    }
                }

                // 统一落地归位（包括 tiles==3 和 tiles>=6 情况）
                player.y = yCollision.y - player.height;
                player.isJumping = false;
                player.isFalling = false;
                player.jumpFrameCounter = 0;
                player.hitCeiling = false;
                player.ceilingHangFrames = 0;
                player.lastGroundY = player.y;
                player.velY = 0;

            } else if (player.velY < 0) {
                // 顶到天花板（原逻辑不变）
                player.y = yCollision.y + yCollision.height;
                if (player.isJumping && !player.hitCeiling) {
                    player.hitCeiling = true;
                    player.velY = 0;
                }
            }
            if (!player.hitCeiling) {
                player.velY = 0;
            }
        } else {
            // 原逻辑保持
            player.y = nextPlayerY;
            if (!player.isJumping && !player.isFalling) {
                player.isJumping = true;
                player.isFalling = true;
                player.fallStartY = player.y;
            }
        }
    }
    // X轴碰撞检测
    let nextPlayerX = player.x + player.velX;
    const xCollision = checkCollision(nextPlayerX, player.y, player.width, player.height);
    if (xCollision) {
        if (player.velX > 0) player.x = xCollision.x - player.width;
        else if (player.velX < 0) player.x = xCollision.x + xCollision.width;
        player.velX = 0;
    } else {
        player.x = nextPlayerX;
    }

    // 掉出地图检测
    const mapHeight = (gameState.mapData?.height || 0) * TILE_SIZE;
    if (player.y > mapHeight + 50) {
        killPlayer('otherFall');
    }

    // 尖刺检测
    if (checkSpikeCollision()) {
        killPlayer('spike');
        return;
    }

    // 存档点检测
    const savePoint = checkSavePointCollision();
    if (savePoint && !gameState.checkpointsActivated.has(savePoint.id)) {
        gameState.lastCheckpoint = {
            x: savePoint.x,
            y: savePoint.y
        };
        gameState.checkpointsActivated.add(savePoint.id);

        showCheckpointMessage();

        spawnSaveSparkles(savePoint.fxX ?? (gameState.player.x + gameState.player.width / 2),
            savePoint.fxY ?? (gameState.player.y - 8));
    }

    // NPC 检测
    const npc = checkNPCCollision();
    gameState.nearbyNPC = npc;
    if (npc) {
        gameState.nearbyNPCCounter++;
        gameStateManager.saveToLocalStorage();
    }
}

// ==============================
// 过关逻辑
// ==============================
function checkLevelEnd() {
    if (gameState.isTransitioningLevel) return;

    const player = gameState.player;
    const mapWidth = (gameState.mapData?.width || 0) * TILE_SIZE;

    if (player.x + player.width >= mapWidth - 96) {
        gameState.isTransitioningLevel = true;

        fadeOutAndTransition();
    }
}

function fadeOutAndTransition() {
    let opacity = 1;
    const fadeInterval = setInterval(() => {
        opacity -= 0.05;

        ctx.fillStyle = `rgba(0, 0, 0, ${1 - opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (opacity <= 0) {
            clearInterval(fadeInterval);
            window.location.href = '../dialog/diag1.html';
        }
    }, 50);
}

// ==============================
// 屏幕过渡与相机
// ==============================
function checkForScreenTransition() {
    const player = gameState.player;
    const camera = gameState.camera;
    const mapWidth = (gameState.mapData?.width || 0) * TILE_SIZE;
    const mapHeight = (gameState.mapData?.height || 0) * TILE_SIZE;
    if (!mapWidth || !mapHeight) return;
    let nextTargetX = camera.x;
    let nextTargetY = camera.y;
    let transitionTriggered = false;
    if (player.x >= camera.x + canvas.width) {
        nextTargetX = camera.x + canvas.width;
        transitionTriggered = true;
    } else if (player.x + player.width <= camera.x) {
        nextTargetX = camera.x - canvas.width;
        transitionTriggered = true;
    }
    if (player.y >= camera.y + canvas.height) {
        nextTargetY = camera.y + canvas.height;
        transitionTriggered = true;
    } else if (player.y + player.height <= camera.y) {
        nextTargetY = camera.y - canvas.height;
        transitionTriggered = true;
    }
    if (transitionTriggered) {
        camera.targetX = mapWidth > canvas.width ? Math.max(0, Math.min(nextTargetX, mapWidth - canvas.width)) : (mapWidth - canvas.width) / 2;
        camera.targetY = mapHeight > canvas.height ? Math.max(0, Math.min(nextTargetY, mapHeight - canvas.height)) : (mapHeight - canvas.height) / 2;
        if (camera.targetX !== camera.x || camera.targetY !== camera.y) {
            camera.isMoving = true;
        }
    }
}

function moveCameraTowardsTarget() {
    const camera = gameState.camera;
    if (camera.x < camera.targetX) {
        camera.x = Math.min(camera.x + CAMERA_SCROLL_SPEED, camera.targetX);
    } else if (camera.x > camera.targetX) {
        camera.x = Math.max(camera.x - CAMERA_SCROLL_SPEED, camera.targetX);
    }
    if (camera.y < camera.targetY) {
        camera.y = Math.min(camera.y + CAMERA_SCROLL_SPEED, camera.targetY);
    } else if (camera.y > camera.targetY) {
        camera.y = Math.max(camera.y - CAMERA_SCROLL_SPEED, camera.targetY);
    }
    if (camera.x === camera.targetX && camera.y === camera.targetY) {
        camera.isMoving = false;
        const player = gameState.player;
        if (player.x >= camera.x + canvas.width) {
            player.x = camera.x + 1;
        } else if (player.x + player.width <= camera.x) {
            player.x = camera.x + player.width + 1;
        }
        if (player.y >= camera.y + canvas.height) {
            player.y = camera.y + 1;
        } else if (player.y + player.height <= camera.y) {
            player.y = camera.y + player.height + 1;
        }
    }
}

// ==============================
// SFX 音效管理器
// ==============================

const SFX_MAP = {
    jump: 'sfx/jump.wav',
    bounce: 'sfx/bounce.wav',
    save: 'sfx/save.mp3',
    death: 'sfx/death.mp3',
};

const SFX = (() => {
    let audioCtx = null;
    let master = null, sfxGain = null, uiGain = null;
    const buffers = new Map();
    const lastPlayed = new Map();
    let unlocked = false;
    let loadingPromise = null;

    async function init() {
        if (audioCtx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        master = audioCtx.createGain();
        master.gain.value = 0.9;
        master.connect(audioCtx.destination);

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 1.0;
        sfxGain.connect(master);

        uiGain = audioCtx.createGain();
        uiGain.gain.value = 1.0;
        uiGain.connect(master);
    }

    async function unlock() {
        if (unlocked) return;
        await init();
        try { await audioCtx.resume(); } catch (_) { }
        unlocked = audioCtx.state === 'running';
        if (unlocked && !loadingPromise) {
            loadingPromise = loadAll(SFX_MAP);
        }
    }

    async function load(name, url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`加载失败: ${url}`);
        const ab = await res.arrayBuffer();
        const buf = await audioCtx.decodeAudioData(ab);
        buffers.set(name, buf);
        return buf;
    }

    async function loadAll(map) {
        await init();
        const entries = Object.entries(map);
        await Promise.all(entries.map(([name, url]) =>
            load(name, url).catch(err => console.warn(`[SFX] ${name} 载入失败(${url})`, err))
        ));
        console.log('[SFX] 已加载:', [...buffers.keys()]);
    }

    function play(name, opt = {}) {
        if (!audioCtx || buffers.size === 0) return;
        const buf = buffers.get(name);
        if (!buf) return;

        const now = audioCtx.currentTime;
        const throttle = opt.throttleMs ? (opt.throttleMs / 1000) : 0;
        const last = lastPlayed.get(name) || 0;
        if (throttle && now - last < throttle) return;
        lastPlayed.set(name, now);

        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        if (opt.detune !== undefined && src.detune) src.detune.value = opt.detune;
        src.playbackRate.value = opt.rate || 1;

        const g = audioCtx.createGain();
        g.gain.value = opt.volume !== undefined ? opt.volume : 1.0;

        const group = (opt.group === 'ui') ? uiGain : sfxGain;
        src.connect(g).connect(group);
        src.start();
        return src;
    }

    function setVolume(group, v) {
        v = Math.max(0, Math.min(1, v));
        if (group === 'master' && master) master.gain.value = v;
        if (group === 'sfx' && sfxGain) sfxGain.gain.value = v;
        if (group === 'ui' && uiGain) uiGain.gain.value = v;
    }

    return {
        init, unlock, loadAll, load, play, setVolume,
        get isUnlocked() { return unlocked; }
    };
})();

function setupAudioUnlock() {
    const unlockOnce = () => {
        SFX.unlock();
        window.removeEventListener('pointerdown', unlockOnce);
        window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    window.addEventListener('keydown', unlockOnce, { once: true });
}

// ==============================
// 辅助函数
// ==============================

function updatePlayerAnimation() {
    const player = gameState.player;
    const sprite = player.sprite;

    let newAnimation;
    if (player.isJumping) {
        newAnimation = player.velY < 0 ? 'jump' : 'fall';
    } else if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A'] ||
        gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) {
        newAnimation = 'run';
    } else {
        newAnimation = 'idle';
    }

    if (sprite.currentAnimation !== newAnimation) {
        sprite.currentAnimation = newAnimation;
        sprite.frameIndex = 0;
        sprite.frameCounter = 0;
    }

    const animConfig = PLAYER_SPRITE_CONFIG.animations[sprite.currentAnimation];

    if (animConfig.frames <= 1) {
        sprite.frameIndex = animConfig.frameIndex !== undefined ? animConfig.frameIndex : 0;
        return;
    }

    sprite.frameCounter += 0.5;
    if (sprite.frameCounter >= animConfig.frameDelay) {
        sprite.frameCounter = 0;
        sprite.frameIndex = (sprite.frameIndex + 1) % animConfig.frames;
    }
}

const log = (...args) => console.log('[Loader]', ...args);

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`图片加载失败: ${src}`));
        img.src = src;
    });
}

async function resolveAllTilesets(mapData, mapUrl) {
    const result = [];

    for (const ts of mapData.tilesets) {
        if (!ts.image && !ts.tiles && ts.source) {
            console.warn('[Tileset] 外链 tileset（tsx）未处理：', ts.source);
            continue;
        }

        const tilesetData = { ...ts, firstgid: ts.firstgid, type: 'spritesheet', tiles: {} };

        if (ts.image) {
            const imageUrl = new URL(ts.image, mapUrl).href;
            tilesetData.image = await loadImage(imageUrl);
            tilesetData.type = 'spritesheet';

            if (Array.isArray(ts.tiles)) {
                for (const tile of ts.tiles) {
                    tilesetData.tiles[tile.id] = { ...tile };
                }
            }

        } else if (Array.isArray(ts.tiles)) {
            tilesetData.type = 'collection';
            for (const tile of ts.tiles) {
                tilesetData.tiles[tile.id] = {
                    animation: tile.animation,
                    properties: tile.properties,
                    objectgroup: tile.objectgroup
                };

                if (!tile.image) continue;

                let imagePath = tile.image.replace(/\\/g, '/');
                if (/^[A-Za-z]:/.test(imagePath) || imagePath.startsWith('/')) {
                    imagePath = imagePath.split('/').pop();
                }
                const imageUrl = new URL(imagePath, mapUrl).href;
                try {
                    const tileImage = await loadImage(imageUrl);
                    tilesetData.tiles[tile.id] = {
                        ...tilesetData.tiles[tile.id],
                        image: tileImage,
                        width: tile.imagewidth,
                        height: tile.imageheight
                    };
                } catch (e) {
                    console.warn('[Tileset] 单张 tile 图片加载失败：', imageUrl, e.message);
                }
            }

        } else {
            console.warn('[Tileset] tileset 无 image 且无 tiles，已跳过：', ts.name || ts.source);
            continue;
        }

        result.push(tilesetData);
    }

    result.sort((a, b) => a.firstgid - b.firstgid);
    return result;
}

function getTilesetForGid(gid) {
    if (!gid) return null;
    for (let i = gameState.tilesets.length - 1; i >= 0; i--) {
        if (gid >= gameState.tilesets[i].firstgid) return gameState.tilesets[i];
    }
    return null;
}

function getCollisionLayer() {
    return gameState.mapData?.layers.find(l => String(l.type).toLowerCase() === 'tilelayer' && String(l.name).toLowerCase() === 'collision');
}

function getNPCLayer() {
    return gameState.mapData?.layers.find(l =>
        l.type === 'objectgroup' && l.name.toLowerCase() === 'npcs'
    );
}

function getGridLayer() {
    return gameState.mapData?.layers.find(
        l => l.type === 'tilelayer' && l.name.toLowerCase() === 'grid'
    );
}

function setInitialCameraPosition() {
    const { player, camera } = gameState;
    const screenCol = Math.floor(player.x / canvas.width);
    const screenRow = Math.floor(player.y / canvas.height);
    camera.x = screenCol * canvas.width;
    camera.y = screenRow * canvas.height;
    clampCameraToBounds();
    camera.isMoving = false;
    camera.targetX = camera.x;
    camera.targetY = camera.y;
}

function clampCameraToBounds() {
    const { camera, mapData } = gameState;
    const mapWidth = (mapData?.width || 0) * TILE_SIZE;
    const mapHeight = (mapData?.height || 0) * TILE_SIZE;
    if (!mapWidth || !mapHeight) return;
    camera.x = mapWidth > canvas.width ? Math.max(0, Math.min(camera.x, mapWidth - canvas.width)) : (mapWidth - canvas.width) / 2;
    camera.y = mapHeight > canvas.height ? Math.max(0, Math.min(camera.y, mapHeight - canvas.height)) : (mapHeight - canvas.height) / 2;
}

async function loadMap(levelIndex) {
    try {
        const currentLevel = LEVEL_CONFIG[levelIndex];
        const mapUrl = new URL(currentLevel.mapPath, window.location.href);
        const response = await fetch(mapUrl.href);
        if (!response.ok) throw new Error(`地图请求失败: ${response.status}`);
        gameState.mapData = await response.json();
        TILE_SIZE = gameState.mapData.tilewidth || TILE_SIZE;
        gameState.tilesets = await resolveAllTilesets(gameState.mapData, mapUrl);
        for (const layer of gameState.mapData.layers) {
            if (layer.type === 'imagelayer' && layer.image) {
                const imgUrl = new URL(layer.image, mapUrl).href;
                try {
                    layer.__image = await loadImage(imgUrl);
                } catch (e) {
                    console.warn(`[WARN] imagelayer 加载失败(${layer.name}):`, imgUrl, e.message);
                }
            }
        }
        gameState.lastCheckpoint = null;
        gameState.checkpointsActivated.clear();

        setPlayerStartPosition();
        return true;
    } catch (error) {
        console.error('地图加载失败:', error);
        return false;
    }
}

function setPlayerStartPosition() {
    const p = gameState.player;

    p.coyoteFrames = 0;
    p.jumpBufferFrames = 0;

    if (gameState.lastCheckpoint) {
        p.x = gameState.lastCheckpoint.x;
        p.y = gameState.lastCheckpoint.y;
    } else {
        const collisionLayer = getCollisionLayer();
        let spawnFound = false;

        if (collisionLayer) {
            const w = collisionLayer.width;
            const h = collisionLayer.height;
            const data = collisionLayer.data;

            for (let col = 1; col < w && !spawnFound; col++) {
                for (let row = h - 1; row >= 0; row--) {
                    const gid = data[row * w + col];
                    if (gid > 0) {
                        const aboveEmpty = row > 0 ? data[(row - 1) * w + col] === 0 : true;
                        if (aboveEmpty) {
                            p.x = col * TILE_SIZE + Math.floor((TILE_SIZE - p.width) / 2);
                            p.y = row * TILE_SIZE - p.height;
                            spawnFound = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!spawnFound) {
            p.x = 0;
            p.y = 0;
        }
    }

    p.velX = 0;
    p.velY = 0;
    p.isJumping = false;
    p.isFalling = false;
    p.lastGroundY = p.y;
    p.fallStartY = p.y;
    p.jumpFrameCounter = 0;
    p.hitCeiling = false;
    p.ceilingHangFrames = 0;
}

function startScreenShake(frames = SCREEN_SHAKE_FRAMES, magnitude = SCREEN_SHAKE_MAGNITUDE, interval = 1) {
    const s = gameState.camera.shake;
    s.timeLeft = frames;
    s.totalFrames = frames;
    s.magnitude = magnitude;
    s.interval = Math.max(1, interval);
    s.frameCounter = 0;
    s.offsetX = 0;
    s.offsetY = 0;
}

function updateCameraShake() {
    const s = gameState.camera.shake;
    if (s.timeLeft > 0) {
        s.timeLeft--;
        s.frameCounter = (s.frameCounter || 0) + 1;
        const t = s.totalFrames ? (s.timeLeft / s.totalFrames) : 0;
        const mag = s.magnitude * t;

        if (s.frameCounter % (s.interval || 1) === 0) {
            s.offsetX = (Math.random() * 2 - 1) * mag;
            s.offsetY = (Math.random() * 2 - 1) * mag;
        }
        if (s.timeLeft <= 0) {
            s.offsetX = 0; s.offsetY = 0;
        }
    } else {
        s.offsetX = 0; s.offsetY = 0;
    }
}

function killPlayer(deathReason = 'other') {
    if (gameState.death.active) return;
    const now = performance.now();
    gameState.death.active = true;
    gameState.death.hitstopUntil = now + HITSTOP_MS;
    gameState.death.respawnAt = now + DEATH_RESPAWN_DELAY;
    gameState.death.exploded = false;

    gameState.deathStats.totalDeaths++;

    if (deathReason === 'fall') {
        gameState.deathStats.fallDeaths++;
        if (gameState.firstFallDeath) {
            console.log("玩家第一次摔死！");
            gameState.firstFallDeath = false;
        }
    } else if (deathReason === 'otherFall') {
        gameState.deathStats.otherFallDeaths++;
    } else if (deathReason === 'spike') {
        gameState.deathStats.spikeDeaths++;
    } else if (deathReason === 'boss') {
        gameState.deathStats.bossDeaths++; // 修正这里
    } else {
        gameState.deathStats.otherDeaths++;
    }

    gameStateManager.saveToLocalStorage();
}
function updateDeath() {
    if (!gameState.death.active) return;
    const now = performance.now();

    if (now < gameState.death.hitstopUntil) return;

    if (!gameState.death.exploded) {
        SFX.play('death', { volume: 1.0 });
        gameState.death.exploded = true;
        const px = gameState.player.x + gameState.player.width / 2;
        const py = gameState.player.y + gameState.player.height / 2;
        spawnDeathParticles(px, py);
        startScreenShake();
        startFlash(0.6);
    } else {
        updateParticles();
    }

if (now >= gameState.death.respawnAt) {
    setPlayerStartPosition();
    setInitialCameraPosition();

    if (bossState.active) {
        initBossSystem();
    }
    gameState.particles = [];
    gameState.effects.flashAlpha = 0;
    gameState.death.active = false;
    gameState.death.exploded = false;

    const bd = gameState.deathStats?.bossDeaths || 0;


    // 第5次 Boss 战死亡：显示警示文案（一次性触发）
    if (bd === 5) {
        const spLayer = getSavePointLayer();
        if (spLayer) spLayer.visible = false;
        showCenterMessage("面对不可战胜的敌人，Frisk的决心大幅降低，没有决心的Frisk失去了存档", {life: 400, color: 'rgba(0, 0, 0, 1)', fontSize: 20});
    }

    // 第6次 Boss 战死亡：打开 diag10（一次性）
    if (!gameState.bossDeathDialogShown && bd >= 6) {
        gameState.bossDeathDialogShown = true;
        gameStateManager.saveToLocalStorage(); // 可选：持久化一次性开关
        showNpcDialog('../dialog/diag10.html');

        scheduleBossDialogHints();
    }
}
}

function showCenterMessage(text, {life=180, color='#ffffff', fontSize=18} = {}) {
    gameState.effects.floatingTexts = gameState.effects.floatingTexts || [];
    gameState.effects.floatingTexts.push({
        text,
        x: canvas.width / 2,
        y: canvas.height / 2,
        vy: 0,
        life,
        color,
        fontSize
    });
}

function startFlash(alpha = 0.6) {
    gameState.effects.flashAlpha = alpha;
}

function updateFlash() {
    if (gameState.effects.flashAlpha > 0) {
        gameState.effects.flashAlpha = Math.max(0, gameState.effects.flashAlpha - 0.08);
    }
}

function spawnDeathParticles(cx, cy) {
    const cfg = DEATH_PARTICLE_CONFIG;
    for (let i = 0; i < cfg.count; i++) {
        const baseAngle = (i / cfg.count) * Math.PI * 2;
        const jitter = (Math.random() * 16 - 8) * Math.PI / 180;
        const angle = baseAngle + jitter;
        const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
        const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
        const life = Math.floor(cfg.lifeMin + Math.random() * (cfg.lifeMax - cfg.lifeMin));
        gameState.particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            life,
            maxLife: life
        });
    }
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        const drag = p.drag ?? 0.98;
        const gravity = p.gravity ?? 0.18;
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) gameState.particles.splice(i, 1);
    }
}

function drawParticles() {
    const { camera } = gameState;
    if (!gameState.particles.length) return;
    ctx.save();
    for (const p of gameState.particles) {
        const alpha = Math.max(0, p.life / p.maxLife) * (p.baseAlpha ?? 0.9);
        const size = p.size;
        const half = size / 2;
        const sx = Math.floor(p.x - camera.x);
        const sy = Math.floor(p.y - camera.y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color || '#ffffff';

        if (p.alignToVelocity) {
            const angle = Math.atan2(p.vy, p.vx);
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            ctx.fillRect(-half, -half, size, size);
            ctx.restore();
        } else {
            ctx.fillRect(Math.floor(sx - half), Math.floor(sy - half), size, size);
        }
    }
    ctx.restore();
}

function spawnBounceDust(cx, cy) {
    const cfg = BOUNCE_PARTICLE_CONFIG;
    for (let i = 0; i < cfg.count; i++) {
        const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
        const dir = Math.random() < 0.5 ? -1 : 1;
        const vx = dir * speed * (0.6 + Math.random() * 0.4);
        const vy = -Math.abs(speed) * (0.2 + Math.random() * 0.6);
        const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
        const life = Math.floor(cfg.lifeMin + Math.random() * (cfg.lifeMax - cfg.lifeMin));
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
        gameState.particles.push({
            x: cx + dir * 6, y: cy - 2,
            vx, vy, size,
            life, maxLife: life,
            color,
            drag: cfg.drag,
            gravity: cfg.gravity,
            alignToVelocity: false,
            baseAlpha: 0.8
        });
    }
}

function triggerBounceEffect(impactX, impactY) {
    startScreenShake(BOUNCE_SHAKE_FRAMES, BOUNCE_SHAKE_MAGNITUDE, BOUNCE_SHAKE_INTERVAL);
    spawnBounceDust(impactX, impactY);
    const spin = gameState.player.spin;
    spin.active = true;
    spin.startAt = performance.now();
    spin.duration = SPIN_DURATION_MS;

    spawnShockwave(impactX, impactY - 2);

    SFX.play('bounce', { volume: 1.4, rate: 0.98 + Math.random() * 0.04 });
}

function spawnShockwave(cx, cy, opt = {}) {
    const cfg = { ...SHOCKWAVE_CONFIG, ...opt };
    gameState.effects.shockwaves.push({
        x: cx, y: cy,
        age: 0,
        life: cfg.lifeFrames,
        r0: cfg.radiusStart, r1: cfg.radiusEnd,
        w0: cfg.lineWidthStart, w1: cfg.lineWidthEnd,
        a0: cfg.alphaStart, a1: cfg.alphaEnd,
        color: cfg.color,
        squashY: cfg.squashY,
        additive: cfg.additive
    });
}

function updateShockwaves() {
    const arr = gameState.effects.shockwaves;
    for (let i = arr.length - 1; i >= 0; i--) {
        const w = arr[i];
        w.age++;
        if (w.age >= w.life) arr.splice(i, 1);
    }
}

function drawShockwaves() {
    const arr = gameState.effects.shockwaves;
    if (!arr.length) return;
    const camX = gameState.camera.x;
    const camY = gameState.camera.y;

    for (const w of arr) {
        const t = Math.min(1, w.age / w.life);
        const te = 1 - (1 - t) * (1 - t);
        const radius = w.r0 + (w.r1 - w.r0) * te;
        const lineW = w.w0 + (w.w1 - w.w0) * t;
        const alpha = w.a0 + (w.a1 - w.a0) * t;
        const dx = Math.floor(w.x - camX);
        const dy = Math.floor(w.y - camY);

        ctx.save();
        if (w.additive) ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = w.color;
        ctx.lineWidth = lineW;

        ctx.translate(dx, dy);
        ctx.scale(1, w.squashY);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

function spawnJumpDust(cx, groundY) {
    const cfg = JUMP_DUST_PARTICLE_CONFIG;
    for (let i = 0; i < cfg.count; i++) {
        const side = i < cfg.count / 2 ? -1 : 1;
        const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
        const vx = side * speed * (0.8 + Math.random() * 0.7);
        const vy = -Math.abs(speed) * (0.25 + Math.random() * 0.5);
        const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
        const life = Math.floor(cfg.lifeMin + Math.random() * (cfg.lifeMax - cfg.lifeMin));
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];

        gameState.particles.push({
            x: cx + side * (4 + Math.random() * 3),
            y: groundY - 1,
            vx, vy, size,
            life, maxLife: life,
            color,
            drag: cfg.drag,
            gravity: cfg.gravity,
            baseAlpha: 0.9,
            alignToVelocity: false
        });
    }
}

function triggerJumpEffect() {
    const p = gameState.player;
    const ground = checkCollision(p.x, p.y + 1, p.width, p.height);
    if (!ground) return;

    const cx = p.x + p.width / 2;
    const gy = ground.y;
    spawnJumpDust(cx, gy);

    SFX.play('jump', { volume: 0.3, rate: 0.98 + Math.random() * 0.06, throttleMs: 80 });
}

function spawnSaveSparkles(cx, cy, opt = {}) {
    const cfg = { ...SAVE_SPARKLE_CONFIG, ...opt };

    const pickColor = () => cfg.colors[Math.floor(Math.random() * cfg.colors.length)];

    gameState.effects.sparkles.push({
        x: cx, y: cy,
        age: 0,
        life: Math.floor(cfg.lifeBigMin + Math.random() * (cfg.lifeBigMax - cfg.lifeBigMin)),
        r0: 2,
        r1: 10 + Math.random() * 4,
        angle: Math.random() * Math.PI,
        spin: (Math.random() * 2 - 1) * 0.06,
        color: pickColor(),
        additive: cfg.additive,
        type: 'big'
    });

    for (let i = 0; i < cfg.countSmall; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin);
        gameState.effects.sparkles.push({
            x: cx + Math.cos(a) * d,
            y: cy + Math.sin(a) * d,
            age: 0,
            life: Math.floor(cfg.lifeSmallMin + Math.random() * (cfg.lifeSmallMax - cfg.lifeSmallMin)),
            r0: 1,
            r1: 4 + Math.random() * 4,
            angle: Math.random() * Math.PI,
            spin: (Math.random() * 2 - 1) * 0.08,
            color: pickColor(),
            additive: cfg.additive,
            type: 'small'
        });
    }

    SFX.play('save', { volume: 0.15 });
}

function updateSparkles() {
    const arr = gameState.effects.sparkles;
    for (let i = arr.length - 1; i >= 0; i--) {
        const s = arr[i];
        s.age++;
        s.angle += s.spin || 0;
        s.y -= 0.05;
        if (s.age >= s.life) arr.splice(i, 1);
    }
}

function drawSparkles() {
    const arr = gameState.effects.sparkles;
    if (!arr.length) return;

    const camX = gameState.camera.x;
    const camY = gameState.camera.y;

    for (const s of arr) {
        const t = Math.min(1, s.age / s.life);
        const te = 1 - (1 - t) * (1 - t);
        const radius = s.r0 + (s.r1 - s.r0) * te;
        const alpha = (1 - t) * 0.95;

        const dx = Math.floor(s.x - camX);
        const dy = Math.floor(s.y - camY);

        ctx.save();
        if (s.additive) ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;
        ctx.translate(dx, dy);
        ctx.rotate(s.angle);

        ctx.strokeStyle = s.color;
        ctx.lineCap = 'round';

        ctx.lineWidth = s.type === 'big' ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0);
        ctx.moveTo(0, -radius); ctx.lineTo(0, radius);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.7;
        ctx.rotate(Math.PI / 4);
        const r2 = radius * 0.6;
        ctx.lineWidth = s.type === 'big' ? 1.6 : 1.2;
        ctx.beginPath();
        ctx.moveTo(-r2, 0); ctx.lineTo(r2, 0);
        ctx.moveTo(0, -r2); ctx.lineTo(0, r2);
        ctx.stroke();

        ctx.restore();
    }
}

// ==============================
// 绘制
// ==============================
function drawImageLayer(layer) {
    const img = layer.__image;
    if (!img) return;
    const px = layer.parallaxx ?? 1;
    const py = layer.parallaxy ?? 1;
    const offx = layer.offsetx || 0;
    const offy = layer.offsety || 0;
    const dx0 = Math.floor(-gameState.camera.x * px + offx);
    const dy = Math.floor(-gameState.camera.y * py + offy);
    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;
    if (layer.repeatx) {
        const imgW = img.width;
        let startX = dx0 % imgW;
        if (startX > 0) startX -= imgW;
        for (let x = startX; x < canvas.width; x += imgW) {
            ctx.drawImage(img, x, dy, imgW, img.height);
        }
    } else {
        ctx.drawImage(img, dx0, dy);
    }
    ctx.restore();
}

function drawTileLayer(layer) {
    const camX = Math.floor(gameState.camera.x);
    const camY = Math.floor(gameState.camera.y);
    const startCol = Math.floor(camX / TILE_SIZE);
    const endCol = startCol + Math.ceil(canvas.width / TILE_SIZE);
    const startRow = Math.floor(camY / TILE_SIZE);
    const endRow = startRow + Math.ceil(canvas.height / TILE_SIZE);

    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;

    for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
            if (y < 0 || y >= layer.height || x < 0 || x >= layer.width) continue;

            let gid = layer.data[y * layer.width + x];
            if (!gid) continue;

            const tileset = getTilesetForGid(gid);
            if (!tileset) continue;

            let localId = gid - tileset.firstgid;

            if (tileset.tiles && tileset.tiles[localId] && tileset.tiles[localId].animation) {
                const animation = tileset.tiles[localId].animation;
                let totalDuration = 0;

                for (const frame of animation) {
                    totalDuration += frame.duration;
                }

                const currentTime = gameState.animationTime % totalDuration;
                let accumulatedTime = 0;

                for (const frame of animation) {
                    accumulatedTime += frame.duration;
                    if (currentTime < accumulatedTime) {
                        localId = frame.tileid;
                        break;
                    }
                }
            }

            const dx = Math.floor(x * TILE_SIZE - camX);
            const dy = Math.floor(y * TILE_SIZE - camY);

            if (tileset.type === 'collection') {
                const tileInfo = tileset.tiles[localId];
                if (tileInfo?.image) {
                    const finalDy = dy + TILE_SIZE - tileInfo.height;
                    ctx.drawImage(tileInfo.image, dx, finalDy);
                }
            } else {
                if (!tileset.image) continue;
                const sx = (localId % tileset.columns) * tileset.tilewidth;
                const sy = Math.floor(localId / tileset.columns) * tileset.tileheight;
                ctx.drawImage(tileset.image, sx, sy, tileset.tilewidth, tileset.tileheight, dx, dy, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    ctx.restore();
}

function drawObjectLayer(layer) {
    if (!layer.objects) return;

    const camX = Math.floor(gameState.camera.x);
    const camY = Math.floor(gameState.camera.y);

    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;

    for (const obj of layer.objects) {
        if (!obj.gid) continue;

        const tileset = getTilesetForGid(obj.gid);
        if (!tileset) continue;

        let localId = obj.gid - tileset.firstgid;

        if (tileset.tiles && tileset.tiles[localId] && tileset.tiles[localId].animation) {
            const animation = tileset.tiles[localId].animation;
            let totalDuration = 0;

            for (const frame of animation) {
                totalDuration += frame.duration;
            }

            const currentTime = gameState.animationTime % totalDuration;
            let accumulatedTime = 0;

            for (const frame of animation) {
                accumulatedTime += frame.duration;
                if (currentTime < accumulatedTime) {
                    localId = frame.tileid;
                    break;
                }
            }
        }

        const dx = Math.floor(obj.x - camX);
        const dy = Math.floor(obj.y - obj.height - camY);

        if (tileset.type === 'collection') {
            const tileInfo = tileset.tiles[localId];
            if (tileInfo?.image) {
                ctx.drawImage(tileInfo.image, dx, dy, obj.width, obj.height);
            }
        } else {
            if (tileset.image) {
                const sx = (localId % tileset.columns) * tileset.tilewidth;
                const sy = Math.floor(localId / tileset.columns) * tileset.tileheight;
                ctx.drawImage(tileset.image, sx, sy, tileset.tilewidth, tileset.tileheight,
                    dx, dy, obj.width, obj.height);
            }
        }
    }

    ctx.restore();
}

function drawMap() {
    if (!gameState.mapData) return;
    for (const layer of gameState.mapData.layers) {
        if (!layer.visible) continue;

        if (layer.type === 'imagelayer') {
            drawImageLayer(layer);
        } else if (layer.type === 'tilelayer') {
            drawTileLayer(layer);
        } else if (layer.type === 'objectgroup') {
            drawObjectLayer(layer);
        }
    }
}

function drawPlayer() {
    const { player, camera } = gameState;
    const { sprite } = player;
    const x = Math.floor(player.x - camera.x);
    const y = Math.floor(player.y - camera.y);

    // 无敌闪烁效果
    if (playerBossState.invulnerableUntil > performance.now()) {
        if (Math.floor(performance.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
    }

    if (!sprite.image) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(x, y, player.width, player.height);
        ctx.globalAlpha = 1;
        return;
    }

    const animConfig = PLAYER_SPRITE_CONFIG.animations[sprite.currentAnimation];
    if (!animConfig) return;
    const { frameWidth, frameHeight } = PLAYER_SPRITE_CONFIG;
    let frameToDraw = animConfig.frameIndex !== undefined ? animConfig.frameIndex : sprite.frameIndex;
    const sx = frameToDraw * frameWidth;
    const sy = animConfig.row * frameHeight;
    const drawX = x + sprite.offsetX;
    const drawY = y + sprite.offsetY;

    let angle = 0;
    if (player.spin?.active) {
        const now = performance.now();
        const t = Math.min(1, (now - player.spin.startAt) / player.spin.duration);
        angle = t * Math.PI * 2;
        if (t >= 1) {
            player.spin.active = false;
            angle = 0;
        }
    }

    if (angle !== 0) {
        const cx = Math.floor(drawX + frameWidth / 2);
        const cy = Math.floor(drawY + frameHeight / 2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const scaleX = player.facing === 'left' ? -1 : 1;
        ctx.scale(scaleX, 1);
        ctx.drawImage(sprite.image, sx, sy, frameWidth, frameHeight,
            -frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);
        ctx.restore();
    } else {
        ctx.save();
        if (player.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite.image, sx, sy, frameWidth, frameHeight,
                -drawX - frameWidth, drawY, frameWidth, frameHeight);
        } else {
            ctx.drawImage(sprite.image, sx, sy, frameWidth, frameHeight,
                drawX, drawY, frameWidth, frameHeight);
        }
        ctx.restore();
    }

    ctx.globalAlpha = 1;
}

function checkCollision(x, y, width, height) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + width - 0.1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + height - 0.1) / TILE_SIZE);
    const collisionLayer = getCollisionLayer();
    if (!collisionLayer) return null;
    for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
            if (row < 0 || row >= collisionLayer.height || col < 0 || col >= collisionLayer.width) continue;
            if (collisionLayer.data[row * collisionLayer.width + col] > 0) {
                return { x: col * TILE_SIZE, y: row * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
            }
        }
    }
    return null;
}
// ==============================
// 渲染与主循环
// ==============================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const s = gameState.camera.shake;
    ctx.save();
    if (s && (s.offsetX || s.offsetY)) {
        ctx.translate(Math.round(s.offsetX), Math.round(s.offsetY));
    }

    drawMap();
    drawShockwaves();
    drawSparkles();

    // 绘制Boss战元素
    if (bossState.active) {
        drawBoss();
        drawBullets();
        drawSpikes();
        drawLasers();
        drawCounterItems();
        drawFloatingTexts();
    }

    if (!gameState.death.active) {
        drawPlayer();

        // NPC 提示
        if (gameState.nearbyNPC) {
            const npc = gameState.nearbyNPC;
            const dx = npc.x - gameState.camera.x + npc.width / 2;
            const dy = npc.y - npc.height - 20 - gameState.camera.y;
            ctx.font = "12px Arial";
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.strokeText("E: 交谈", dx, dy);
            ctx.fillText("E: 交谈", dx, dy);
        }
    }
    drawParticles();
    ctx.restore();

    // 绘制UI元素（不受相机影响）
    if (bossState.active) {
        drawBossHealthBar();
        drawPlayerHealthBar();
    }

    // 存档提示文字渲染
    if (gameState.checkpointMessage && gameState.checkpointMessage.timer > 0) {
        const msg = gameState.checkpointMessage;

        msg.y += msg.vy;
        msg.timer--;
        if (msg.timer < 20) {
            msg.alpha = msg.timer / 20;
        }

        const offsetX = 30;
        const screenX = Math.floor(msg.x - gameState.camera.x + gameState.player.width / 2 + offsetX);
        const screenY = Math.floor(msg.y - gameState.camera.y);

        ctx.save();
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255,255,255,${msg.alpha})`;
        ctx.strokeStyle = `rgba(0,0,0,${msg.alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeText(msg.text, screenX, screenY);
        ctx.fillText(msg.text, screenX, screenY);
        ctx.restore();
    }

    // 白闪特效
    if (gameState.effects && gameState.effects.flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = gameState.effects.flashAlpha;
        ctx.fillStyle = '#e9e2d1';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

// 固定步长参数（60Hz）
const BASE_FPS = 60;
const FIXED_DT_MS = 1000 / BASE_FPS;
const MAX_CATCHUP_MS = 250;

let lastTime = performance.now();
let accumulator = 0;

function gameLoop(now = performance.now()) {
    if (isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    let frameMs = now - lastTime;
    if (frameMs > MAX_CATCHUP_MS) frameMs = MAX_CATCHUP_MS;
    lastTime = now;

    accumulator += frameMs;

    while (accumulator >= FIXED_DT_MS) {
        update();
        accumulator -= FIXED_DT_MS;
    }

    render();

    requestAnimationFrame(gameLoop);
}

// ==============================
// 输入
// ==============================
gameState.keyPressed = {};
gameState.keyReleased = {};

window.addEventListener('keydown', (e) => {
    if (!gameState.keys[e.key]) {
        gameState.keyPressed[e.key] = true;

        // Shift 切换 Grid 显示
        if (e.key === 'Shift') {
            const gridLayer = getGridLayer();
            if (gridLayer) {
                gridLayer.visible = !gridLayer.visible;
                console.log("Grid 图层切换为:", gridLayer.visible ? "显示" : "隐藏");
            }
        }

        // E键交互
        if (e.key === 'e' || e.key === 'E') {
            if (gameState.nearbyNPC) {
                const dialogPage = gameState.nearbyNPC.properties?.find(p => p.name === "dialogPage")?.value;
                if (dialogPage) {
                    showNpcDialog(dialogPage);
                }
            }
        }

        // 空格键跳跃缓冲
        if (e.key === ' ') {
            gameState.player.jumpBufferFrames = JUMP_BUFFER_FRAMES;
        }

        // B键开始Boss战（测试用）
        if (e.key === 'b' || e.key === 'B') {
            if (!bossState.active) {
                initBossSystem();
                console.log("Boss战开始！");
            }
        }
    }
    gameState.keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
    gameState.keyPressed[e.key] = false;
    gameState.keyReleased[e.key] = false;

    if (e.key === ' ') {
        gameState.player.canJump = true;
    }
});

// ==============================
// 启动
// ==============================
async function init() {
    canvas.width = 840;
    canvas.height = 512;
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    try {
        const [mapLoaded, playerImage, bossImgLoaded, itemImgLoaded] = await Promise.all([
            loadMap(currentLevelIndex),
            loadImage(PLAYER_SPRITE_CONFIG.imagePath),
            BOSS_CONFIG.imagePath ? loadImage(BOSS_CONFIG.imagePath) : Promise.resolve(null),
            BOSS_CONFIG.counterItem.imagePath ? loadImage(BOSS_CONFIG.counterItem.imagePath) : Promise.resolve(null)
        ]);
        if (mapLoaded && playerImage) {
            gameState.player.sprite.image = playerImage;
            bossImage = bossImgLoaded;
            counterItemImage = itemImgLoaded
            console.log('地图与角色加载成功！');

            gameStateManager.loadFromLocalStorage();
            console.log('死亡统计数据:', gameState.deathStats);
            console.log('是否第一次摔死:', gameState.firstFallDeath);

            setInitialCameraPosition();
            setupAudioUnlock();
            initBossSystem();
            gameLoop();
        } else {
            throw new Error("地图或角色图片加载失败");
        }
    } catch (error) {
        console.error("资源加载失败:", error);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('资源加载失败！请检查控制台。', canvas.width / 2, canvas.height / 2);
    }
}

init();
