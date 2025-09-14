const LEVEL_CONFIG = [
    { mapPath: 'maps/map7.json' },
];

// ==============================
// 过关逻辑
// ==============================
function checkLevelEnd() {
    if (gameState.isTransitioningLevel) return;

    const player = gameState.player;
    const mapWidth = (gameState.mapData?.width || 0) * TILE_SIZE;

    // 检测玩家是否到达地图右边缘
    if (player.x + player.width >= mapWidth - 96) {
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
            window.location.href = 'the_boss_you_can_not_defeat.html';
        }
    }, 50);
}