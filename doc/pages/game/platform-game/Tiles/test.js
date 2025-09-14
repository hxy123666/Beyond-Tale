// ==============================
// 游戏配置
// ==============================
let TILE_SIZE = 32;
const GRAVITY = 0.08;
const JUMP_FORCE = -3.3; // 调整为恰好跳跃2格高度
const MOVE_SPEED = 1.3;
const FRICTION = 0.8;
const CAMERA_SCROLL_SPEED = 15;

// 死亡与屏幕抖动参数
const DEATH_RESPAWN_DELAY = 1000; // 毫秒
const SCREEN_SHAKE_FRAMES = 12; // 抖动持续帧数（~0.2s @60fps）
const SCREEN_SHAKE_MAGNITUDE = 5; // 抖动幅度（像素）
const HITSTOP_MS = 80; // 死亡瞬间定格时长
const DEATH_PARTICLE_CONFIG = {
count: 18,
speedMin: 2.5,
speedMax: 5.0,
gravity: 0.18,
drag: 0.98,
lifeMin: 22, // 帧
lifeMax: 38, // 帧
sizeMin: 2,
sizeMax: 4
};

// 反弹特效
const SPIN_DURATION_MS = 500; // 反弹旋转一圈用时（4格/5格相同）
const BOUNCE_SHAKE_FRAMES = 8;
const BOUNCE_SHAKE_MAGNITUDE = 3;
const BOUNCE_SHAKE_INTERVAL = 2; // 抖动更新频率（越大越慢）

const BOUNCE_PARTICLE_CONFIG = {
count: 14,
speedMin: 1.6,
speedMax: 3.2,
gravity: 0.25,
drag: 0.90,
lifeMin: 16, // 帧
lifeMax: 28, // 帧
sizeMin: 2,
sizeMax: 3,
colors: ['#e9e2d1', '#d8d4c0', '#c7c2b3'] // 土/灰尘色
};

// 地面冲击波（圆环）
const SHOCKWAVE_CONFIG = {
lifeFrames: 18, // 存在帧数（~0.3s@60fps）
radiusStart: 6, // 初始半径
radiusEnd: 30, // 结束半径
lineWidthStart: 5, // 初始描边宽度
lineWidthEnd: 1, // 结束描边宽度
alphaStart: 0.6, // 初始透明度
alphaEnd: 0.0, // 结束透明度
color: '#e9e2d1', // 颜色（受白闪风格影响）
squashY: 0.35, // 椭圆压扁比例（<1 更贴地）
additive: true // 叠加发光混合
};

// 跳跃手感调整变量
const JUMP_GRAVITY_REDUCTION_HEIGHT = 2.0 * TILE_SIZE; // 跳跃高度达到1.5格时开始减小重力
const GRAVITY_REDUCTION_MULTIPLIER = 0.4; // 重力减小倍数

// 计算跳跃总时间（帧数）
const JUMP_UP_FRAMES = Math.abs(JUMP_FORCE / GRAVITY); // 上升到最高点的帧数
const TOTAL_JUMP_FRAMES = JUMP_UP_FRAMES * 2; // 总跳跃时间（上升+下降）

// *** 玩家精灵图配置 (修正版) ***
const PLAYER_SPRITE_CONFIG = {
imagePath: 'assets/frisk_sprite.png',
frameWidth: 24,
frameHeight: 32,
animations: {
// idle 只有1帧，所以它永远不会循环
idle: { row: 0, frames: 1 },
// run 有3帧，frameDelay 表示每隔6个游戏帧切换一次动画
run: { row: 1, frames: 3, frameDelay: 6 },
// jump 和 fall 也是单帧
jump: { row: 2, frames: 1, frameIndex: 0 },
fall: { row: 2, frames: 1, frameIndex: 1 }
}
};

// 关卡配置
// const LEVEL_CONFIG = [
// //{ mapPath: 'maps/map1.json' },
// { mapPath: 'maps/map2.json' },
// ];
let currentLevelIndex = 0;

// ==============================
// 游戏状态
// ==============================
const gameState = {
player: {
x: 0, y: 0,
width: 18,
height: 30,
velX: 0, velY: 0, isJumping: false, facing: 'right',
lastGroundY: 0, // 记录最后站立的地面Y坐标
fallStartY: 0, // 记录开始下落时的Y坐标
isFalling: false, // 是否正在下落
jumpFrameCounter: 0, // 跳跃帧计数器
hitCeiling: false, // 是否碰到天花板
ceilingHangFrames: 0, // 碰到天花板后的滞空帧数
jumpStartY: 0, // 记录跳跃起始Y坐标
sprite: {
image: null,
currentAnimation: 'idle',
frameIndex: 0,
frameCounter: 0, // 使用帧计数器代替 dt 计时器
offsetX: (18 - PLAYER_SPRITE_CONFIG.frameWidth) / 2,
offsetY: 30 - PLAYER_SPRITE_CONFIG.frameHeight
},
spin: { active: false, startAt: 0, duration: SPIN_DURATION_MS }
},
camera: {
x: 0, y: 0,
isMoving: false,
targetX: 0, targetY: 0,
shake: { timeLeft: 0, magnitude: 0, offsetX: 0, offsetY: 0 } // 之前加过
},
effects: {
flashAlpha: 0,
shockwaves: [] // 新增：地面冲击波
}, // 屏幕白闪
particles: [], // 死亡粒子
death: {
active: false,
respawnAt: 0,
hitstopUntil: 0, // 定格结束时间
exploded: false // 是否已触发粒子与抖动
},
keys: {},
mapData: null,
tilesets: [],
isTransitioningLevel: false,
animationTime: 0, // 动画计时器

// FPS显示相关
fps: {
    current: 0,
    frameCount: 0,
    lastTime: performance.now(),
    updateInterval: 1000 // 每秒更新一次
},

// 存档相关状态
lastCheckpoint: null, // 记录最近的存档点位置
checkpointsActivated: new Set(), // 记录已激活的存档点（避免重复触发）
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==============================
// 存档功能
// ==============================

// 获取存档点对象层
function getSavePointLayer() {
return gameState.mapData?.layers.find(l =>
l.type === 'objectgroup' &&
l.name.toLowerCase() === 'savepoint'
);
}

// 检测玩家是否碰到存档点
function checkSavePointCollision() {
const player = gameState.player;
const savePointLayer = getSavePointLayer();

if (!savePointLayer || !savePointLayer.objects) return null;

// 玩家的碰撞盒
const playerLeft = player.x;
const playerRight = player.x + player.width;
const playerTop = player.y;
const playerBottom = player.y + player.height;

// 检查每个存档点
for (const savePoint of savePointLayer.objects) {
    // 只处理有gid的对象（tile对象）
    if (!savePoint.gid) continue;
    
    // 存档点的碰撞盒（注意：Tiled中对象的y坐标是底部）
    const spLeft = savePoint.x;
    const spRight = savePoint.x + savePoint.width;
    const spTop = savePoint.y - savePoint.height;
    const spBottom = savePoint.y;
    
    // 检测碰撞
    if (playerLeft < spRight &&
        playerRight > spLeft &&
        playerTop < spBottom &&
        playerBottom > spTop) {
        return {
            id: savePoint.id,
            x: savePoint.x + savePoint.width / 2 - player.width / 2, // 居中对齐
            y: savePoint.y - savePoint.height - player.height // 站在存档点上方
        };
    }
}

return null;
}

// 显示存档点激活消息
function showCheckpointMessage() {
// 创建一个临时的消息显示
const message = {
text: "Checkpoint Activated!",
alpha: 1.0,
timer: 120 // 显示2秒（假设60FPS）
};

gameState.checkpointMessage = message;
}

// ==============================
// 尖刺检测功能
// ==============================

// 获取危险物对象层
function getHazardsLayer() {
return gameState.mapData?.layers.find(l =>
l.type === 'objectgroup' &&
(l.name.toLowerCase() === 'hazards' || l.name.toLowerCase() === 'spikes')
);
}

// 检测玩家是否碰到尖刺
function checkSpikeCollision() {
const player = gameState.player;
const hazardsLayer = getHazardsLayer();

if (!hazardsLayer || !hazardsLayer.objects) return false;

// 玩家的碰撞盒
const playerLeft = player.x;
const playerRight = player.x + player.width;
const playerTop = player.y;
const playerBottom = player.y + player.height;

// 检查每个危险物对象
for (const hazard of hazardsLayer.objects) {
    // 跳过非spike类型
    if ((hazard.type || hazard.class || '').toLowerCase() !== 'spike') continue;
    
    // 处理多边形碰撞盒
    if (hazard.polygon) {
        // 计算多边形的边界框
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
        
        // 使用计算出的边界框进行碰撞检测
        if (playerLeft < maxX &&
            playerRight > minX &&
            playerTop < maxY &&
            playerBottom > minY) {
            return true;
        }
    } else {
        // 处理矩形碰撞盒（原有逻辑）
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

// 如果使用tile层方式，添加这个函数
function checkSpikeTileCollision() {
const player = gameState.player;
const spikeLayer = gameState.mapData?.layers.find(l =>
l.type === 'tilelayer' && l.name.toLowerCase() === 'spikes'
);

if (!spikeLayer) return false;

// 计算玩家占据的tile范围
const left = Math.floor(player.x / TILE_SIZE);
const right = Math.floor((player.x + player.width - 1) / TILE_SIZE);
const top = Math.floor(player.y / TILE_SIZE);
const bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE);

// 检查这些tile是否有尖刺
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

// 处理玩家死亡
function handlePlayerDeath(reason) {
killPlayer(); // 使用原有的死亡系统
}

// ==============================
// 主更新 (不带 dt)
// ==============================
function update() {
updateCameraShake();

if (gameState.death.active) {
    updateDeath();
    updateFlash();
    return;
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

// 更新动画时间
gameState.animationTime += 6.67;
updatePlayerAnimation();
updateParticles();
updateShockwaves(); // 新增
updateFlash();
}

// ==============================
// 玩家逻辑
// ==============================
function updatePlayer() {
const player = gameState.player;

// --- 移动输入处理 ---
if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) {
    player.velX = -MOVE_SPEED;
    player.facing = 'left';
} else if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) {
    player.velX = MOVE_SPEED;
    player.facing = 'right';
} else {
    player.velX *= FRICTION;
    if (Math.abs(player.velX) < 0.1) player.velX = 0;
}

// --- 跳跃输入处理 ---
if (gameState.keys[' '] && !player.isJumping) {
    player.velY = JUMP_FORCE;
    player.isJumping = true;
    player.isFalling = false;
    player.jumpFrameCounter = 0; // 重置跳跃计数器
    player.hitCeiling = false; // 重置天花板碰撞标记
    player.ceilingHangFrames = 0; // 重置滞空帧数
    player.jumpStartY = player.y; // 记录跳跃起始位置
}

// --- 重置按键处理 ---
if (gameState.keys['r'] || gameState.keys['R']) {
    setPlayerStartPosition();
    setInitialCameraPosition();
}

// --- Y轴物理和碰撞检测 ---
// 首先检查角色是否站在地面上（向下检测1像素）
const groundCheck = checkCollision(player.x, player.y + 1, player.width, player.height);

if (groundCheck && player.velY >= 0 && !gameState.keys[' ']) {
    // 角色确实站在地面上，且没有按跳跃键
    player.isJumping = false;
    player.isFalling = false;
    player.velY = 0;
    player.jumpFrameCounter = 0;
    player.hitCeiling = false;
    player.ceilingHangFrames = 0;
    // 确保角色精确对齐到地面
    player.y = groundCheck.y - player.height;
    player.lastGroundY = player.y;
} else {
    // 角色在空中或正在跳跃
    if (player.isJumping) {
        player.jumpFrameCounter++;
        
        // 计算当前跳跃高度
        const jumpHeight = player.jumpStartY - player.y;
        
        // 跳跃手感调整：当跳跃高度超过设定值时减小重力
        let currentGravity = GRAVITY;
        if (jumpHeight >= JUMP_GRAVITY_REDUCTION_HEIGHT && player.velY < 0 && !player.hitCeiling) {
            currentGravity = GRAVITY * GRAVITY_REDUCTION_MULTIPLIER;
        }
        
        // 如果碰到了天花板，处理特殊的滞空逻辑
        if (player.hitCeiling) {
            player.ceilingHangFrames++;
            // 计算剩余滞空时间
            const remainingFrames = TOTAL_JUMP_FRAMES - 2*player.jumpFrameCounter;
            
            if (remainingFrames <= 0) {
                // 滞空时间结束，开始正常下落
                player.hitCeiling = false;
                player.velY = currentGravity; // 从小的下落速度开始
            } else {
                // 继续滞空，速度保持为0
                player.velY = 0;
            }
        } else {
            // 应用重力（可能是调整后的重力）
            player.velY += currentGravity;
        }
    } else {
        // 非跳跃状态的正常重力
        player.velY += GRAVITY;
    }

    // 检测是否开始下落
    if (!player.isFalling && player.velY > 0 && player.isJumping && !player.hitCeiling) {
        player.isFalling = true;
        player.fallStartY = player.y;
    }

    let nextPlayerY = player.y + player.velY;
    const yCollision = checkCollision(player.x, nextPlayerY, player.width, player.height);

    if (yCollision) {
        if (player.velY > 0) {
            // 着陆时检查下落高度
            if (player.isFalling) {
                const fallDistance = yCollision.y - player.height - player.fallStartY;
                
                if (fallDistance >= 2.9 * TILE_SIZE && fallDistance < 3.9 * TILE_SIZE) {
                    // 从3格高度落下，死亡
                    killPlayer();
                    return;
                } else if (fallDistance >= 3.9 * TILE_SIZE && fallDistance < 4.9 * TILE_SIZE) {
                    // 从4格高度落下，反弹到3格高度
                    player.y = yCollision.y - player.height;
                    player.velY = -Math.sqrt(2 * GRAVITY * 3.3 * TILE_SIZE);
                    player.isJumping = true;
                    player.isFalling = false;
                    player.jumpFrameCounter = 0;
                    player.hitCeiling = false;
                    player.ceilingHangFrames = 0;
                    triggerBounceEffect(player.x + player.width / 2, yCollision.y);
                    return;
                } else if (fallDistance >= 4.9 * TILE_SIZE && fallDistance < 6 * TILE_SIZE) {
                    // 从5格高度落下，反弹到4格高度
                    player.y = yCollision.y - player.height;
                    player.velY = -Math.sqrt(2 * GRAVITY * 4.2 * TILE_SIZE);
                    player.isJumping = true;
                    player.isFalling = false;
                    player.jumpFrameCounter = 0;
                    player.hitCeiling = false;
                    player.ceilingHangFrames = 0;
                    triggerBounceEffect(player.x + player.width / 2, yCollision.y);
                    return;
                }
                if (fallDistance >= 6 * TILE_SIZE) {
                    // 从6格高度落下，死亡
                    killPlayer();
                    return;
                }
            }
            
            player.y = yCollision.y - player.height;
            player.isJumping = false;
            player.isFalling = false;
            player.jumpFrameCounter = 0;
            player.hitCeiling = false;
            player.ceilingHangFrames = 0;
            player.lastGroundY = player.y;
        } else if (player.velY < 0) {
            // 撞到天花板
            player.y = yCollision.y + yCollision.height;
            if (player.isJumping && !player.hitCeiling) {
                // 标记碰到天花板，开始特殊滞空
                player.hitCeiling = true;
                player.velY = 0;
            }
        }
        if (!player.hitCeiling) {
            player.velY = 0;
        }
    } else {
        player.y = nextPlayerY;
        if (!player.isJumping && !player.isFalling) {
            // 开始自然下落（不是跳跃导致的）
            player.isJumping = true;
            player.isFalling = true;
            player.fallStartY = player.y;
        }
    }
}

// --- X轴碰撞检测 ---
let nextPlayerX = player.x + player.velX;
const xCollision = checkCollision(nextPlayerX, player.y, player.width, player.height);
if (xCollision) {
    if (player.velX > 0) player.x = xCollision.x - player.width;
    else if (player.velX < 0) player.x = xCollision.x + xCollision.width;
    player.velX = 0;
} else {
    player.x = nextPlayerX;
}

// --- 掉出地图检测 ---
const mapHeight = (gameState.mapData?.height || 0) * TILE_SIZE;
if (player.y > mapHeight + 50) {
    killPlayer();
}

// --- 尖刺检测 ---
// 使用对象层方式
if (checkSpikeCollision()) {
    handlePlayerDeath('碰到尖刺');
    return;
}

// --- 存档点检测 ---
const savePoint = checkSavePointCollision();
if (savePoint && !gameState.checkpointsActivated.has(savePoint.id)) {
    // 激活新的存档点
    gameState.lastCheckpoint = {
        x: savePoint.x,
        y: savePoint.y
    };
    gameState.checkpointsActivated.add(savePoint.id);
    
    // 可选：添加视觉反馈
    showCheckpointMessage();
}
}

// ==============================
// 过关逻辑
// ==============================
function checkLevelEnd() {
if (gameState.isTransitioningLevel) return;

const player = gameState.player;
const mapWidth = (gameState.mapData?.width || 0) * TILE_SIZE;

// 检测玩家是否到达地图右边缘
if (player.x + player.width >= mapWidth) {
    gameState.isTransitioningLevel = true;
    
    // 添加淡出效果
    fadeOutAndTransition();
}
}

function fadeOutAndTransition() {
let opacity = 1;
const fadeInterval = setInterval(() => {
opacity -= 0.05;

    // 绘制黑色遮罩
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (opacity <= 0) {
        clearInterval(fadeInterval);
        // 跳转页面
        window.location.href = '../dialog/diag1.html';
    }
}, 50);
}

// ==============================
// 屏幕过渡与相机 (你的原版逻辑)
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
// 辅助函数
// ==============================

function updatePlayerAnimation() {
const player = gameState.player;
const sprite = player.sprite;

let newAnimation;
if (player.isJumping) {
    // 在空中时的动画
    newAnimation = player.velY < 0 ? 'jump' : 'fall';
} else if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A'] ||
           gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) {
    // 只要按着移动键就播放走动动画，不管是否真的在移动
    newAnimation = 'run';
} else {
    // 没有按任何移动键时才播放站立动画
    newAnimation = 'idle';
}

if (sprite.currentAnimation !== newAnimation) {
    sprite.currentAnimation = newAnimation;
    sprite.frameIndex = 0;
    sprite.frameCounter = 0; // 切换动画时，重置计数器
}

const animConfig = PLAYER_SPRITE_CONFIG.animations[sprite.currentAnimation];

// 如果是单帧动画 (比如 idle)，直接设置到第0帧并退出
if (animConfig.frames <= 1) {
    sprite.frameIndex = animConfig.frameIndex !== undefined ? animConfig.frameIndex : 0;
    return;
}

// 只对多帧动画 (比如 run) 进行计数和更新
sprite.frameCounter++;
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
    // 外链 tileset（.tsx），没有 image/tiles 的，先跳过（推荐在 Tiled 里 Embed）
    if (!ts.image && !ts.tiles && ts.source) {
        console.warn('[Tileset] 外链 tileset（tsx）未处理：', ts.source);
        continue;
    }

    const tilesetData = { ...ts, firstgid: ts.firstgid, type: 'spritesheet', tiles: {} };

    if (ts.image) {
        // A. spritesheet：整张图
        const imageUrl = new URL(ts.image, mapUrl).href;
        tilesetData.image = await loadImage(imageUrl);
        tilesetData.type = 'spritesheet';

        // 保留 tile 的元数据（属性/碰撞/动画），但不要去加载 tile.image
        if (Array.isArray(ts.tiles)) {
            for (const tile of ts.tiles) {
                tilesetData.tiles[tile.id] = { ...tile };
            }
        }

    } else if (Array.isArray(ts.tiles)) {
        // B. collection：逐张图片
        tilesetData.type = 'collection';
        for (const tile of ts.tiles) {
            // 先保存所有元数据（包括动画）
            tilesetData.tiles[tile.id] = {
                animation: tile.animation,  // 保留动画信息
                properties: tile.properties, // 保留属性信息
                objectgroup: tile.objectgroup // 保留碰撞信息
            };
            
            if (!tile.image) continue; // 只有属性/碰撞，没有图片的，跳过
            
            let imagePath = tile.image.replace(/\\/g, '/'); // 统一斜杠
            // 处理 C:/ 或以 / 开头：只取文件名，然后相对 mapUrl 去找
            if (/^[A-Za-z]:/.test(imagePath) || imagePath.startsWith('/')) {
                imagePath = imagePath.split('/').pop();
            }
            const imageUrl = new URL(imagePath, mapUrl).href;
            try {
                const tileImage = await loadImage(imageUrl);
                // 合并图片信息到已有的元数据中
                tilesetData.tiles[tile.id] = {
                    ...tilesetData.tiles[tile.id], // 保留之前的动画等信息
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
// 重置存档相关状态
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

// 如果有存档点，使用存档点位置
if (gameState.lastCheckpoint) {
    p.x = gameState.lastCheckpoint.x;
    p.y = gameState.lastCheckpoint.y;
} else {
    // 否则使用原来的逻辑
    const collisionLayer = getCollisionLayer();
    let spawnFound = false;

    if (collisionLayer) {
        const w = collisionLayer.width;
        const h = collisionLayer.height;
        const data = collisionLayer.data;

        // 从最左列开始往右找
        for (let col = 0; col < w && !spawnFound; col++) {
            // 从底部向上找该列的"地面"
            for (let row = h - 1; row >= 0; row--) {
                const gid = data[row * w + col];
                if (gid > 0) {
                    // 检查地面上方是否有足够空间（上一格为空）
                    const aboveEmpty = row > 0 ? data[(row - 1) * w + col] === 0 : true;
                    if (aboveEmpty) {
                        // 将玩家放在该列地面上，并水平居中在这列内，避免卡墙
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
        // 兜底：如果没有 Collision 层或没找到合适位置
        p.x = 0;
        p.y = 0;
    }
}

// 重置玩家状态
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
// 衰减
const t = s.totalFrames ? (s.timeLeft / s.totalFrames) : 0;
const mag = s.magnitude * t;

    // 低频更新：interval 帧才换一次随机位移
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

function killPlayer() {
if (gameState.death.active) return;
const now = performance.now();
gameState.death.active = true;
gameState.death.hitstopUntil = now + HITSTOP_MS; // 先定格
gameState.death.respawnAt = now + DEATH_RESPAWN_DELAY; // 1s 后重生
gameState.death.exploded = false; // 还没爆
// 立即隐藏角色由 render 中的 death.active 控制
// 不立刻抖动/粒子，等定格结束再触发
}

function updateDeath() {
if (!gameState.death.active) return;
const now = performance.now();

// 还在定格，什么都不动
if (now < gameState.death.hitstopUntil) return;

// 定格刚结束：触发爆裂+屏幕抖动+白闪
if (!gameState.death.exploded) {
    gameState.death.exploded = true;
    // 爆裂位置 = 玩家中心（此时玩家已隐藏，但坐标未变）
    const px = gameState.player.x + gameState.player.width / 2;
    const py = gameState.player.y + gameState.player.height / 2;
    spawnDeathParticles(px, py);
    startScreenShake();  // 之前已经实现的屏幕抖动
    startFlash(0.6);
} else {
    // 爆裂期间，粒子正常更新
    updateParticles();
}

// 到时间重生
if (now >= gameState.death.respawnAt) {
    setPlayerStartPosition();
    setInitialCameraPosition();
    // 清场与收尾
    gameState.particles = [];
    gameState.effects.flashAlpha = 0;
    gameState.death.active = false;
    gameState.death.exploded = false;
}
}

// 白闪
function startFlash(alpha = 0.6) {
gameState.effects.flashAlpha = alpha;
}
function updateFlash() {
if (gameState.effects.flashAlpha > 0) {
gameState.effects.flashAlpha = Math.max(0, gameState.effects.flashAlpha - 0.08);
}
}

// 粒子
function spawnDeathParticles(cx, cy) {
const cfg = DEATH_PARTICLE_CONFIG;
for (let i = 0; i < cfg.count; i++) {
const baseAngle = (i / cfg.count) * Math.PI * 2;
const jitter = (Math.random() * 16 - 8) * Math.PI / 180; // ±8°
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
const dir = Math.random() < 0.5 ? -1 : 1; // 左或右
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
// 原有：轻抖动 + 尘粒子 + 旋转
startScreenShake(BOUNCE_SHAKE_FRAMES, BOUNCE_SHAKE_MAGNITUDE, BOUNCE_SHAKE_INTERVAL);
spawnBounceDust(impactX, impactY);
const spin = gameState.player.spin;
spin.active = true;
spin.startAt = performance.now();
spin.duration = SPIN_DURATION_MS;

// 新增：地面冲击波（略微上移 2px 更贴地）
spawnShockwave(impactX, impactY - 2);
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
    // easeOutQuad
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

    // 画一个被压扁的圆（椭圆），更有"贴地冲击"感
    ctx.translate(dx, dy);
    ctx.scale(1, w.squashY);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
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
        
        // 检查是否有动画
        if (tileset.tiles && tileset.tiles[localId] && tileset.tiles[localId].animation) {
            const animation = tileset.tiles[localId].animation;
            let totalDuration = 0;
            
            // 计算动画总时长
            for (const frame of animation) {
                totalDuration += frame.duration;
            }
            
            // 计算当前应该显示哪一帧
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
    if (!obj.gid) continue; // 只处理有gid的对象（tile对象）
    
    const tileset = getTilesetForGid(obj.gid);
    if (!tileset) continue;
    
    let localId = obj.gid - tileset.firstgid;
    
    // 检查是否有动画
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
    
    // 计算绘制位置（注意：Tiled中对象的y坐标是底部）
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
        drawObjectLayer(layer); // 添加对象层绘制
    }
}
}

function drawPlayer() {
const { player, camera } = gameState;
const { sprite } = player;
const x = Math.floor(player.x - camera.x);
const y = Math.floor(player.y - camera.y);

if (!sprite.image) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(x, y, player.width, player.height);
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

// 旋转角（反弹时）
let angle = 0;
if (player.spin?.active) {
    const now = performance.now();
    const t = Math.min(1, (now - player.spin.startAt) / player.spin.duration);
    angle = t * Math.PI * 2; // 360°
    if (t >= 1) {
        player.spin.active = false; // 结束旋转
        angle = 0;
    }
}

if (angle !== 0) {
    const cx = Math.floor(drawX + frameWidth / 2);
    const cy = Math.floor(drawY + frameHeight / 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // 面向：保持左右翻转
    const scaleX = player.facing === 'left' ? -1 : 1;
    ctx.scale(scaleX, 1);
    ctx.drawImage(sprite.image, sx, sy, frameWidth, frameHeight,
                  -frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);
    ctx.restore();
} else {
    // 原始（不旋转）绘制
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
// FPS计算和显示
// ==============================
function updateFPS() {
    const fps = gameState.fps;
    const now = performance.now();
    fps.frameCount++;
    
    // 每秒更新一次FPS显示
    if (now - fps.lastTime >= fps.updateInterval) {
        fps.current = Math.round(fps.frameCount * 1000 / (now - fps.lastTime));
        fps.frameCount = 0;
        fps.lastTime = now;
    }
}

function drawFPS() {
    const fps = gameState.fps;
    
    ctx.save();
    ctx.font = '16px monospace';
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    const text = `FPS: ${fps.current}`;
    const x = 10;
    const y = 25;
    
    // 描边
    ctx.strokeText(text, x, y);
    // 填充
    ctx.fillText(text, x, y);
    
    ctx.restore();
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
drawShockwaves();              // 新增：在玩家/粒子之前
if (!gameState.death.active) {
    drawPlayer();
}
drawParticles();

ctx.restore();

// 绘制存档点消息
if (gameState.checkpointMessage && gameState.checkpointMessage.timer > 0) {
    const msg = gameState.checkpointMessage;
    ctx.save();
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 255, 255, ${msg.alpha})`;
    ctx.strokeStyle = `rgba(0, 0, 0, ${msg.alpha})`;
    ctx.lineWidth = 3;
    ctx.strokeText(msg.text, canvas.width / 2, 100);
    ctx.fillText(msg.text, canvas.width / 2, 100);
    ctx.restore();
    
    // 更新消息状态
    msg.timer--;
    if (msg.timer < 30) {
        msg.alpha = msg.timer / 30; // 淡出效果
    }
}

if (gameState.effects && gameState.effects.flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = gameState.effects.flashAlpha;
    ctx.fillStyle = '#e9e2d1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// 绘制FPS
drawFPS();
}

// *** 修正版：使用你原版的、不带 dt 的 gameLoop ***
function gameLoop() {
updateFPS(); // 更新FPS计算
update(); // 不再传递 dt
render();
requestAnimationFrame(gameLoop);
}

// ==============================
// 输入
// ==============================
window.addEventListener('keydown', (e) => { gameState.keys[e.key] = true; if (e.key === ' ') e.preventDefault(); });
window.addEventListener('keyup', (e) => { gameState.keys[e.key] = false; });

// ==============================
// 启动
// ==============================
async function init() {
canvas.width = 840;
canvas.height = 512;
// 解决模糊问题
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

try {
    const [mapLoaded, playerImage] = await Promise.all([
        loadMap(currentLevelIndex),
        loadImage(PLAYER_SPRITE_CONFIG.imagePath)
    ]);
    if (mapLoaded && playerImage) {
        gameState.player.sprite.image = playerImage;
        console.log('地图与角色加载成功！');
        setInitialCameraPosition();
        // *** 修正版：用你原版的方式启动游戏循环 ***
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

init()