// ==============================
// 游戏状态管理
// ==============================

// 导入游戏配置（如果需要）
// import { TILE_SIZE } from './script.js';

// 游戏状态对象
const gameState = {
    bossDefeated: false, // Boss是否被击败
    effects: {
        flashAlpha: 0,
        shockwaves: [],
        sparkles: [],
        floatingTexts: [] // 添加漂浮文字数组
    },
    bossDeathDialogShown: false,
    bossDialogHintsScheduled: false,   // 新增：提示是否已安排
    hintTimers: {                      // 新增：两个定时器ID
        upLook: null,
        changeUrl: null
    },
    savePointsDisabled: false,
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
        canJump: true,
        moveHeldFrames: 0,
        moveDir: 0,
        jumpCount43: 0, // 跳跃次数
        sprite: {
            image: null,
            currentAnimation: 'idle',
            frameIndex: 0,
            frameCounter: 0, // 使用帧计数器代替 dt 计时器
            offsetX: (18 - 24) / 2, // 这里需要从PLAYER_SPRITE_CONFIG获取
            offsetY: 30 - 32
        },
        spin: { active: false, startAt: 0, duration: 500 } // SPIN_DURATION_MS
    },
    camera: {
        x: 0, y: 0,
        isMoving: false,
        targetX: 0, targetY: 0,
        shake: { timeLeft: 0, magnitude: 0, offsetX: 0, offsetY: 0 }
    },
    particles: [],               // 死亡粒子
    death: {
        active: false,
        respawnAt: 0,
        hitstopUntil: 0,   // 定格结束时间
        exploded: false     // 是否已触发粒子与抖动
    },
    keys: {},
    mapData: null,
    tilesets: [],
    isTransitioningLevel: false,
    animationTime: 0, // 动画计时器

    // 存档相关状态
    lastCheckpoint: null, // 记录最近的存档点位置
    checkpointsActivated: new Set(), // 记录已激活的存档点（避免重复触发）
    firstFallDeath: true, // 标记是否是第一次摔死
    deathStats: {
        totalDeaths: 0,    // 总死亡次数
        fallDeaths: 0,     // 摔死次数
        otherFallDeaths: 0, //掉到地图外
        spikeDeaths: 0,    // 尖刺死亡次数
        otherDeaths: 0,    // 其他原因死亡次数
        bossDeaths: 0, // Boss战死亡次数
        fallOffLeftCounter: 0,
        fallfromHighCounter: 0 // 从过高处掉落次数

    },
    checkpointMessage: {
        text: "",
        alpha: 1.0,
        timer: 120,   // 1 秒钟左右，太长可以再调
        x: 0,  // 初始化为0，后续在需要时更新
        y: 0,  // 初始化为0，后续在需要时更新
        vy: -0.1,     // 每帧向上移动 0.1 像素
        // 添加计数器，计算当前显示了多少次 "这使你充满了决心"
        counter: 0
    }, // 初始化为null，在需要时创建
    nearbyNPC: null, // 记录玩家附近的NPC
    nearbyNPCCounter: 0, // 记录玩家附近NPC的计数器
    atTheplace: false,   // 到达特定位置
    invention_achievement: false,
    hair_achievement: false,
    // 当前关卡url
    currentLevel: null,
};

// 导出gameState对象，以便在其他文件中使用
// 如果使用ES6模块，使用export default gameState;
// 如果使用传统方式，可以直接使用全局变量
window.gameState = gameState;

//游戏状态管理函数
const gameStateManager = {

    // 重置游戏状态
    reset: function () {
        gameState.bossDefeated = false;
        gameState.effects.floatingTexts = [];
        // 保留必要的配置，重置游戏状态
        const mapData = gameState.mapData;
        const tilesets = gameState.tilesets;

        // 重置玩家状态
        gameState.player = {
            x: 0, y: 0,
            width: 18,
            height: 30,
            velX: 0, velY: 0, isJumping: false, facing: 'right',
            lastGroundY: 0,
            fallStartY: 0,
            isFalling: false,
            jumpFrameCounter: 0,
            hitCeiling: false,
            ceilingHangFrames: 0,
            jumpStartY: 0,
            canJump: true,
            jumpCount43: 0, // 跳跃次数
            sprite: {
                image: gameState.player.sprite.image,
                currentAnimation: 'idle',
                frameIndex: 0,
                frameCounter: 0,
                offsetX: (18 - 24) / 2,
                offsetY: 30 - 32
            },
            spin: { active: false, startAt: 0, duration: 500 }
        };

        // 重置相机
        gameState.camera = {
            x: 0, y: 0,
            isMoving: false,
            targetX: 0, targetY: 0,
            shake: { timeLeft: 0, magnitude: 0, offsetX: 0, offsetY: 0 }
        };

        // 重置效果
        gameState.effects.flashAlpha = 0;
        gameState.effects.shockwaves.length = 0;
        gameState.effects.sparkles.length = 0;
        gameState.effects.floatingTexts.length = 0;

        // 重置其他状态
        gameState.particles = [];
        gameState.death = {
            active: false,
            respawnAt: 0,
            hitstopUntil: 0,
            exploded: false
        };
        gameState.keys = {};
        gameState.savePointsDisabled = false;
        gameState.mapData = mapData;
        gameState.tilesets = tilesets;
        gameState.isTransitioningLevel = false;
        gameState.animationTime = 0;
        gameState.lastCheckpoint = null;
        gameState.checkpointsActivated = new Set();
        gameState.firstFallDeath = true;
        gameState.deathStats = {
            totalDeaths: 0,
            fallDeaths: 0,
            otherFallDeaths: 0,
            spikeDeaths: 0,
            otherDeaths: 0,
            bossDeaths: 0
        };
        gameState.bossDeathDialogShown = false;
        gameState.bossDialogHintsScheduled = false;
        gameState.hintTimers = { upLook: null, changeUrl: null };
    },

    // 保存游戏状态到存档点
    saveToCheckpoint: function (checkpoint) {
        gameState.lastCheckpoint = {
            x: checkpoint.x,
            y: checkpoint.y,
            id: checkpoint.id
        };
        gameState.checkpointsActivated.add(checkpoint.id);

        // 这里可以添加更多需要保存的状态
        // 例如：玩家生命值、收集的物品等
    },

    // 从存档点恢复游戏状态
    loadFromCheckpoint: function () {
        if (gameState.lastCheckpoint) {
            gameState.player.x = gameState.lastCheckpoint.x;
            gameState.player.y = gameState.lastCheckpoint.y;
            gameState.player.velX = 0;
            gameState.player.velY = 0;

            // 重置死亡状态
            gameState.death.active = false;
            gameState.death.exploded = false;

            // 重置相机
            gameState.camera.x = 0;
            gameState.camera.y = 0;

            return true;
        }
        return false;
    },

    // 更新游戏状态
    update: function (deltaTime) {
        // 更新动画时间
        gameState.animationTime += deltaTime;

        // 更新相机抖动
        if (gameState.camera.shake.timeLeft > 0) {
            gameState.camera.shake.timeLeft--;
            // 随机偏移
            gameState.camera.shake.offsetX = (Math.random() - 0.5) * gameState.camera.shake.magnitude;
            gameState.camera.shake.offsetY = (Math.random() - 0.5) * gameState.camera.shake.magnitude;
        } else {
            gameState.camera.shake.offsetX = 0;
            gameState.camera.shake.offsetY = 0;
        }

        // 更新死亡状态
        if (gameState.death.active && Date.now() > gameState.death.respawnAt) {
            this.loadFromCheckpoint();
        }

        // 更新粒子效果
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            p.x += p.velX;
            p.y += p.velY;
            p.velY += 0.18; // 重力
            p.life--;

            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }

        // 更新冲击波
        for (let i = gameState.effects.shockwaves.length - 1; i >= 0; i--) {
            const wave = gameState.effects.shockwaves[i];
            wave.life--;

            if (wave.life <= 0) {
                gameState.effects.shockwaves.splice(i, 1);
            }
        }

        // 更新屏幕白闪
        if (gameState.effects.flashAlpha > 0) {
            gameState.effects.flashAlpha -= 0.05;
            if (gameState.effects.flashAlpha < 0) gameState.effects.flashAlpha = 0;
        }
    },

    // 保存游戏状态到localStorage
    saveToLocalStorage: function () {
        const saveData = {
            currentLevel: gameState.currentLevel,
            bossDefeated: gameState.bossDefeated,
            bossDeaths: gameState.deathStats.bossDeaths || 0,
            savePointsDisabled: gameState.savePointsDisabled,

            firstFallDeath: gameState.firstFallDeath,
            deathStats: gameState.deathStats,
            determination: gameState.checkpointMessage.counter,
            jumpCount43: gameState.player.jumpCount43,
            nearbyNPCCounter: gameState.nearbyNPCCounter,
            invention_achievement: gameState.invention_achievement,
            hair_achievement: gameState.hair_achievement,
            foundintheGrass_achievement: gameState.atTheplace,
            
            
        };
        localStorage.setItem('platformGameState', JSON.stringify(saveData));
    },

    // 从localStorage加载游戏状态
    loadFromLocalStorage: function () {
        const savedData = localStorage.getItem('platformGameState');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                gameState.bossDefeated = parsedData.bossDefeated || false;
                if (parsedData.bossDeaths !== undefined) {
                    gameState.deathStats.bossDeaths = parsedData.bossDeaths;
                }
                gameState.firstFallDeath = parsedData.firstFallDeath !== undefined ? parsedData.firstFallDeath : true;
                gameState.deathStats = parsedData.deathStats || {
                    totalDeaths: 0,
                    fallDeaths: 0,
                    spikeDeaths: 0,
                    otherDeaths: 0
                };
                gameState.checkpointMessage.counter = parsedData.determination;
                gameState.player.jumpCount43 = parsedData.jumpCount43 || 0;
                gameState.bossDeathDialogShown = !!parsedData.bossDeathDialogShown; // 新增
                gameState.nearbyNPCCounter = parsedData.nearbyNPCCounter || 0;
                gameState.invention_achievement = parsedData.invention_achievement || false;
                gameState.hair_achievement = parsedData.hair_achievement || false;
                gameState.atTheplace = parsedData.foundintheGrass_achievement || false;
                
                
                
                if (gameState.savePointsDisabled) {
                    const spLayer = getSavePointLayer();
                    if (spLayer) spLayer.visible = false;
                }
                return true;
            } catch (e) {
                console.error('加载存档失败:', e);
                return false;
            }
        }
        return false;
    }
};

// 导出游戏状态管理器
// 如果使用ES6模块，使用export default gameStateManager;
// 如果使用传统方式，可以直接使用全局变量
window.gameStateManager = gameStateManager;
