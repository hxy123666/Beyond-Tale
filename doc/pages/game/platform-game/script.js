// 添加音乐播放控制功能
document.addEventListener('DOMContentLoaded', function () {
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
    window.addEventListener('blur', function () {
        if (audioStarted) {
            audio.pause();
        }
    });

    // 当页面重新获得焦点时恢复音乐
    window.addEventListener('focus', function () {
        if (audioStarted) {
            audio.play();
        }
    });

    // 当页面卸载时停止音乐
    window.addEventListener('beforeunload', function () {
        if (audioStarted) {
            audio.pause();
        }
    });

    // 监听NPC对话窗口的显示/隐藏状态
    const npcDialog = document.getElementById('npcDialog');
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
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

let TILE_SIZE = 32;
const GRAVITY = 0.52;
const JUMP_FORCE = -8.62; // 调整为恰好跳跃2格高度
const MOVE_SPEED = 3.28;
const FRICTION = 0.56;
const CAMERA_SCROLL_SPEED = 30;
const MOVE_RAMP_FRAMES = 5;             // 起步加速帧数，可调
const MOVE_RAMP_EASE = t => t * t;

// 死亡与屏幕抖动参数
const DEATH_RESPAWN_DELAY = 1000; // 毫秒
const SCREEN_SHAKE_FRAMES = 12;   // 抖动持续帧数（~0.2s @60fps）
const SCREEN_SHAKE_MAGNITUDE = 5; // 抖动幅度（像素）
const HITSTOP_MS = 80;                 // 死亡瞬间定格时长
const DEATH_PARTICLE_CONFIG = {
    count: 18,
    speedMin: 2.5,
    speedMax: 5.0,
    gravity: 0.18,
    drag: 0.98,
    lifeMin: 22,   // 帧
    lifeMax: 38,   // 帧
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
    lifeMin: 16,   // 帧
    lifeMax: 28,   // 帧
    sizeMin: 2,
    sizeMax: 3,
    colors: ['#e9e2d1', '#d8d4c0', '#c7c2b3'] // 土/灰尘色
};

// 地面冲击波（圆环）
const SHOCKWAVE_CONFIG = {
    lifeFrames: 18,      // 存在帧数（~0.3s@60fps）
    radiusStart: 6,      // 初始半径
    radiusEnd: 30,       // 结束半径
    lineWidthStart: 5,   // 初始描边宽度
    lineWidthEnd: 1,     // 结束描边宽度
    alphaStart: 0.6,     // 初始透明度
    alphaEnd: 0.0,       // 结束透明度
    color: '#e9e2d1',    // 颜色（受白闪风格影响）
    squashY: 0.35,       // 椭圆压扁比例（<1 更贴地）
    additive: true       // 叠加发光混合
};

// 起跳尘土（较轻、贴地、左右各一撮）
const JUMP_DUST_PARTICLE_CONFIG = {
    count: 10,
    speedMin: 0.8,
    speedMax: 1.8,
    gravity: 0.22,
    drag: 0.90,
    lifeMin: 12,   // 帧
    lifeMax: 22,   // 帧
    sizeMin: 1,
    sizeMax: 2,
    colors: ['#e9e2d1', '#d8d4c0', '#c7c2b3'] // 土/灰尘色
};

// 存档点小星星闪光配置
const SAVE_SPARKLE_CONFIG = {
    countSmall: 3,             // 小星数
    radiusMin: 8,              // 小星散布半径范围
    radiusMax: 12,
    lifeSmallMin: 14,          // 小星寿命（帧）
    lifeSmallMax: 26,
    lifeBigMin: 16,            // 中央大星寿命（帧）
    lifeBigMax: 32,
    colors: ['#fff7a8', '#ffe16b', '#f3ef09ff'], // 暖黄/白的星光
    additive: true
};

// 跳跃手感调整变量
const JUMP_GRAVITY_REDUCTION_HEIGHT = 2.0 * TILE_SIZE; // 跳跃高度达到2格时开始减小重力
const GRAVITY_REDUCTION_MULTIPLIER = 0.4; // 重力减小倍数

// 计算跳跃总时间（帧数）
const JUMP_UP_FRAMES = Math.abs(JUMP_FORCE / GRAVITY); // 上升到最高点的帧数
const TOTAL_JUMP_FRAMES = JUMP_UP_FRAMES * 2; // 总跳跃时间（上升+下降）

// 手感增强：土狼跳 + 跳跃缓冲
const COYOTE_FRAMES = 6;       // 离开地面后仍可起跳的宽限（帧）
const JUMP_BUFFER_FRAMES = 4;  // 提前按下跳跃键的缓冲（帧）

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

let currentLevelIndex = 0;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取当前网页url中的游戏名称
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

// 先从localStorage加载之前的状态
gameStateManager.loadFromLocalStorage();
// 然后设置当前关卡并保存
gameState.currentLevel = getCurrentUrl();
gameStateManager.saveToLocalStorage();


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
                x: savePoint.x + savePoint.width / 2 - player.width / 2, // 玩家重生用
                y: savePoint.y - savePoint.height - player.height,
                fxX: savePoint.x + savePoint.width / 2,                  // 星光位置（中心）
                fxY: spTop - 3                                           // 存档点上方 3px
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
    gameState.checkpointMessage.timer = 120; // 重置计时器，确保文字显示
    gameState.checkpointMessage.alpha = 1.0;  // 重置透明度
    gameState.checkpointMessage.counter++;
    gameStateManager.saveToLocalStorage(); // 保存游戏状态
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

// 计数跳跃函数
function countJumps(reason) {
    if (reason === 'jump43') {
        gameState.player.jumpCount43++;
    }

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
        try{
            checkPosition();
        }
        catch(err){
        }
    }

    // 更新动画时间（毫秒）
    gameState.animationTime += FIXED_DT_MS;
    updatePlayerAnimation();
    updateParticles();
    updateShockwaves();
    updateSparkles();
    updateFlash();
}

// ==============================
// NPC 对话控制 (iframe 方式)
// ==============================
let isPaused = false; // 游戏循环暂停标志

function pauseGame() { isPaused = true; }
function resumeGame() { isPaused = false; }

function showNpcDialog(url) {
    console.log("准备加载对话页面：", url);  // ✅ 调试关键点
    const frame = document.getElementById('dialogFrame');
    frame.src = url;
    document.getElementById('npcDialog').classList.remove('hidden');
    pauseGame();
    window.focus();
}

function closeNpcDialog() {
  const frame = document.getElementById('dialogFrame');
  frame.src = ""; // 清空地址防止音乐继续播放
  document.getElementById('npcDialog').classList.add('hidden');
  resumeGame();
  window.focus();  // 把浏览器焦点调回主窗口
document.getElementById('gameCanvas').focus(); // 把键盘事件焦点绑回游戏canvas
}


// ==============================
// 玩家逻辑
// ==============================
function updatePlayer() {
    const player = gameState.player;

    // --- 移动输入处理（加入起步加速） ---
    if (player.moveHeldFrames === undefined) {
        player.moveHeldFrames = 0;
        player.moveDir = 0;
    }

    const leftHeld = gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A'];
    const rightHeld = gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D'];

    let inputDir = 0;
    if (leftHeld && !rightHeld) inputDir = -1;
    else if (rightHeld && !leftHeld) inputDir = 1;

    if (inputDir !== 0) {
        // 方向变化或从未按到按下 -> 重置起步计数
        if (inputDir !== player.moveDir) {
            player.moveHeldFrames = 0;
        } else {
            player.moveHeldFrames++;
        }
        player.moveDir = inputDir;

        // 计算本帧速度系数（0~1）
        const t = Math.min(1, (player.moveHeldFrames + 1) / MOVE_RAMP_FRAMES);
        const eased = MOVE_RAMP_EASE(t);

        player.velX = inputDir * MOVE_SPEED * eased;
        player.facing = inputDir === -1 ? 'left' : 'right';
    } else {
        // 松开方向键 -> 摩擦减速
        player.moveDir = 0;
        player.moveHeldFrames = 0;
        player.velX *= FRICTION;
        if (Math.abs(player.velX) < 0.1) player.velX = 0;
    }

    // --- 跳跃输入处理 ---
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

    // --- 重置按键处理 ---
    if (gameState.keys['r'] || gameState.keys['R']) {
        setPlayerStartPosition();
        setInitialCameraPosition();
    }

    // --- Y轴物理和碰撞检测 ---
    // 首先检查角色是否站在地面上（向下检测1像素）
    const groundCheck = checkCollision(player.x, player.y + 1, player.width, player.height);

    // --- 土狼跳与跳跃缓冲 ---
    const isOnGround = !!groundCheck;

    // 刷新/递减土狼跳窗口
    if (isOnGround) {
        player.coyoteFrames = COYOTE_FRAMES;
    } else if (player.coyoteFrames > 0) {
        player.coyoteFrames--;
    }

    // 若有缓冲，且当前在地面或仍在土狼跳窗口内，则立刻消耗并起跳
    if (player.jumpBufferFrames > 0 && (isOnGround || player.coyoteFrames > 0)) {
        player.velY = JUMP_FORCE;
        player.isJumping = true;
        player.isFalling = false;
        player.jumpFrameCounter = 0;
        player.hitCeiling = false;
        player.ceilingHangFrames = 0;
        player.jumpStartY = player.y;
        player.canJump = false;          // 保留你原先的“必须松开才能再次起跳”
        player.jumpBufferFrames = 0;     // 消耗缓冲
        triggerJumpEffect();
    }

    // 每帧衰减跳跃缓冲
    if (player.jumpBufferFrames > 0) player.jumpBufferFrames--;

    // 修改：移除 !gameState.keys[' '] 条件，让地面检测独立于按键状态
    if (groundCheck && player.velY >= 0 && !player.isJumping && !player.isFalling) {
        // 只有当角色真正着陆时（不是刚起跳）才重置跳跃状态
        if (player.isJumping && player.velY > 0) {
            // 着陆
            player.isJumping = false;
            player.isFalling = false;
            player.jumpFrameCounter = 0;
            player.hitCeiling = false;
            player.ceilingHangFrames = 0;
        } else if (!player.isJumping) {
            // 保持在地面上
            player.isJumping = false;
            player.isFalling = false;
        }

        player.velY = 0;
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
                const remainingFrames = TOTAL_JUMP_FRAMES - 2 * player.jumpFrameCounter + 8;

                if (remainingFrames <= 0) {
                    // 滞空时间结束，开始正常下落
                    player.hitCeiling = false;
                    player.velY += GRAVITY; // 从小的下落速度开始
                } else {
                    // 继续滞空，速度保持为0
                    player.velY = 0.01;
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
        if (!player.isFalling && player.velY >= 0 && player.isJumping) {
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
                    const tiles = Math.round(fallDistance / TILE_SIZE);

                    if (tiles == 3) {
                        // 从3格高度落下，死亡
                        killPlayer('fall');
                        return;
                    } else if (tiles == 4) {
                        // 从4格高度落下，反弹到3格高度
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
                    } else if (tiles == 5) {
                        // 从5格高度落下，反弹到4格高度
                        player.y = yCollision.y - player.height;
                        player.velY = -Math.sqrt(2 * GRAVITY * 4.3 * TILE_SIZE);
                        player.isJumping = true;
                        player.isFalling = false;
                        player.jumpFrameCounter = 0;
                        player.hitCeiling = false;
                        player.ceilingHangFrames = 0;
                        triggerBounceEffect(player.x + player.width / 2, yCollision.y);
                        return;
                    }
                    if (tiles >= 6) {
                        // 从6格高度落下，死亡
                        killPlayer('fallfromHigh');
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
                player.velY = 0;
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
        // 从最左边掉出地图
        if (player.x < 0) {
            gameState.deathStats.fallOffLeftCounter++,
                gameStateManager.saveToLocalStorage();
        }
        killPlayer('otherFall'); // 掉出地图
    }


    // --- 尖刺检测 ---
    // 使用对象层方式
    if (checkSpikeCollision()) {
        killPlayer('spike'); // 直接传递尖刺死亡原因
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

        spawnSaveSparkles(savePoint.fxX ?? (gameState.player.x + gameState.player.width / 2),
            savePoint.fxY ?? (gameState.player.y - 8)); // 兜底：用玩家头顶
    }

    // --- NPC 检测 ---
    const npc = checkNPCCollision();
    gameState.nearbyNPC = npc;
    if (npc) {
        gameState.nearbyNPCCounter++;
        gameStateManager.saveToLocalStorage();
    }
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
// SFX 音效管理器
// ==============================

const SFX_MAP = {
    jump: 'sfx/jump.wav',
    bounce: 'sfx/bounce.wav',
    save: 'sfx/save.mp3',
    death: 'sfx/death.mp3',
    // levelClear: 'sfx/level_clear.wav',
    // interact: 'sfx/interact.wav',
    //walk: 'sfx/walk.mp3'
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
        master.gain.value = 0.9; // 总音量
        master.connect(audioCtx.destination);

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 1.0; // 游戏音效
        sfxGain.connect(master);

        uiGain = audioCtx.createGain();
        uiGain.gain.value = 1.0; // UI音效（如果有）
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
        if (!buf) return; // 未找到则安静失败，不报错

        const now = audioCtx.currentTime;
        const throttle = opt.throttleMs ? (opt.throttleMs / 1000) : 0;
        const last = lastPlayed.get(name) || 0;
        if (throttle && now - last < throttle) return; // 节流
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

// 建议：在首次用户交互时解锁音频（浏览器限制自动播放）
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

function getNPCLayer() {
    return gameState.mapData?.layers.find(l =>
        l.type === 'objectgroup' && l.name.toLowerCase() === 'npcs'
    );
}

// 获取 Grid 图层
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
        // 保留一些跨关卡的状态，只重置当前关卡的存档点
        // 注意：这里我们保留lastCheckpoint和checkpointsActivated，以便在关卡切换时维持游戏状态
        // 如果需要每个关卡独立的存档点，可以在这里添加关卡ID的判断

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

function killPlayer(deathReason = 'other') {

    if (gameState.death.active) return;
    const now = performance.now();
    gameState.death.active = true;
    gameState.death.hitstopUntil = now + HITSTOP_MS;          // 先定格
    gameState.death.respawnAt = now + DEATH_RESPAWN_DELAY;     // 1s 后重生
    gameState.death.exploded = false;                          // 还没爆

    // 更新死亡统计
    gameState.deathStats.totalDeaths++;

    // 根据死亡原因更新对应统计
    if (deathReason === 'fall') {
        gameState.deathStats.fallDeaths++;

        // 检测是否是第一次摔死
        if (gameState.firstFallDeath) {
            console.log("玩家第一次摔死！");
            // 这里可以添加第一次摔死的特殊处理逻辑
            gameState.firstFallDeath = false; // 标记为已经不是第一次摔死
        }
    } else if (deathReason === 'otherFall') {
        gameState.deathStats.otherFallDeaths++;
    }
    else if (deathReason === 'spike') {
        gameState.deathStats.spikeDeaths++;
    }
    else if (deathReason === 'fallfromHigh') {
        gameState.deathStats.fallfromHighCounter++;
    }
    else {
        gameState.deathStats.otherDeaths++;
    }

    // 保存状态到localStorage
    gameStateManager.saveToLocalStorage();

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
        SFX.play('death', { volume: 1.0 });
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

function spawnJumpDust(cx, groundY) {
    const cfg = JUMP_DUST_PARTICLE_CONFIG;
    for (let i = 0; i < cfg.count; i++) {
        const side = i < cfg.count / 2 ? -1 : 1; // 左半边/右半边
        const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
        const vx = side * speed * (0.8 + Math.random() * 0.7); // 主要向左右
        const vy = -Math.abs(speed) * (0.25 + Math.random() * 0.5); // 轻微向上
        const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
        const life = Math.floor(cfg.lifeMin + Math.random() * (cfg.lifeMax - cfg.lifeMin));
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];

        gameState.particles.push({
            x: cx + side * (4 + Math.random() * 3), // 左右各偏一点
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
    // 只在“地面起跳”时出尘
    const ground = checkCollision(p.x, p.y + 1, p.width, p.height);
    if (!ground) return;

    const cx = p.x + p.width / 2;
    const gy = ground.y;
    spawnJumpDust(cx, gy);

    SFX.play('jump', { volume: 0.3, rate: 0.98 + Math.random() * 0.06, throttleMs: 80 });
}

function spawnSaveSparkles(cx, cy, opt = {}) {
    const cfg = { ...SAVE_SPARKLE_CONFIG, ...opt };

    // 选择颜色
    const pickColor = () => cfg.colors[Math.floor(Math.random() * cfg.colors.length)];

    // 中央较大的星
    gameState.effects.sparkles.push({
        x: cx, y: cy,
        age: 0,
        life: Math.floor(cfg.lifeBigMin + Math.random() * (cfg.lifeBigMax - cfg.lifeBigMin)),
        r0: 2,                                  // 初始半径
        r1: 10 + Math.random() * 4,            // 目标半径
        angle: Math.random() * Math.PI,        // 初始角度
        spin: (Math.random() * 2 - 1) * 0.06,  // 轻微旋转
        color: pickColor(),
        additive: cfg.additive,
        type: 'big'
    });

    // 周围若干小星
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
        // 轻微上浮（可注释掉）
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
        const te = 1 - (1 - t) * (1 - t); // easeOutQuad
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

        // 主十字
        ctx.lineWidth = s.type === 'big' ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0);
        ctx.moveTo(0, -radius); ctx.lineTo(0, radius);
        ctx.stroke();

        // 斜十字（更短、更淡）
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
    if (!gameState.death.active) {
        drawPlayer();
        // === NPC 提示 ===
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

    // ==========================
    // 存档提示文字渲染（固定在存档点位置）
    // ==========================
    if (gameState.checkpointMessage && gameState.checkpointMessage.timer > 0) {
        const msg = gameState.checkpointMessage;

        // --- 更新运动 ---
        msg.y += msg.vy;      // 往上移动
        msg.timer--;          // 倒计时
        if (msg.timer < 20) { // 最后 20 帧开始淡出
            msg.alpha = msg.timer / 20;
        }

        // --- 绘制 ---
        const offsetX = 30; // ⚡想右移多少就改这个
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

    // ==========================
    // 白闪特效
    // ==========================
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
const FIXED_DT_MS = 1000 / BASE_FPS;  // 16.6667ms
const MAX_CATCHUP_MS = 250;           // 防止长时间挂起后的"螺旋补帧"

let lastTime = performance.now();
let accumulator = 0;

function gameLoop(now = performance.now()) {
    if (isPaused) { // 如果暂停了，只保留渲染
        requestAnimationFrame(gameLoop);
        return;
    }

    // 当前帧耗时（做上限钳制）
    let frameMs = now - lastTime;
    if (frameMs > MAX_CATCHUP_MS) frameMs = MAX_CATCHUP_MS;
    lastTime = now;

    // 累加时间
    accumulator += frameMs;

    // 物理更新：以固定 16.67ms 的步长跑多次
    while (accumulator >= FIXED_DT_MS) {
        update(); // 你的 update 保持不变（按帧逻辑）
        accumulator -= FIXED_DT_MS;
    }

    // 渲染一次
    render();

    requestAnimationFrame(gameLoop);
}

// ==============================
// 输入
// ==============================
// 在游戏状态中添加按键状态跟踪
gameState.keyPressed = {}; // 记录按键是否刚刚按下
gameState.keyReleased = {}; // 记录按键是否需要释放后才能再次触发

// 修改键盘事件监听器
// 修改键盘事件监听器
window.addEventListener('keydown', (e) => {
    if (!gameState.keys[e.key]) {
        gameState.keyPressed[e.key] = true; // 标记为刚刚按下

        // === Shift 切换 Grid 显示 ===
        if (e.key === 'Shift') {
            const gridLayer = getGridLayer();
            if (gridLayer) {
                gridLayer.visible = !gridLayer.visible; // 显示/隐藏切换
                console.log("Grid 图层切换为:", gridLayer.visible ? "显示" : "隐藏");
            }
        }

        if (e.key === 'e' || e.key === 'E') {
            if (gameState.nearbyNPC) {
                const dialogPage = gameState.nearbyNPC.properties?.find(p => p.name === "dialogPage")?.value;
                if (dialogPage) {
                    showNpcDialog(dialogPage);   // 在 iframe 显示
                }
            }
        }
        // --- Q 键：退出对话
        const npcDialog = document.getElementById('npcDialog');
        if (!npcDialog.classList.contains('hidden') && (e.key === "q" || e.key === "Q")) {
            closeNpcDialog();
            return;
        }
        if (e.key === ' ') {
            gameState.player.jumpBufferFrames = JUMP_BUFFER_FRAMES;
        }
    }
    gameState.keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
    gameState.keyPressed[e.key] = false;
    gameState.keyReleased[e.key] = false; // 重置释放标记

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

            // 从localStorage加载游戏状态
            gameStateManager.loadFromLocalStorage();
            console.log('死亡统计数据:', gameState.deathStats);
            console.log('是否第一次摔死:', gameState.firstFallDeath);

            setInitialCameraPosition();
            setupAudioUnlock();
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

init();