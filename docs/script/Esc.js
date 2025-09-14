document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const escMenu = document.getElementById('escMenu');
    const continueBtn = document.getElementById('continueBtn');
    const saveBtn = document.getElementById('saveBtn');
    const mainMenuBtn = document.getElementById('mainMenuBtn');

    // 游戏状态
    let gameRunning = true;
    let gamePaused = false;

    // Esc菜单类
    function EscMenu() {
        this.show = function () {
            escMenu.classList.remove('hidden');
            gamePaused = true;
        };

        this.hide = function () {
            escMenu.classList.add('hidden');
            gamePaused = false;
        };
    }

    // 创建Esc菜单实例
    const escMenuInstance = new EscMenu();

    // 初始隐藏菜单
    escMenuInstance.hide();

    // 监听键盘事件
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (gamePaused) {
                escMenuInstance.hide();
            } else {
                escMenuInstance.show();
            }
        }
    });

    // 按钮事件监听
    continueBtn.addEventListener('click', function () {
        escMenuInstance.hide();
    });

    saveBtn.addEventListener('click', function () {
        // 调用保存游戏函数
        if (typeof saveGame === 'function') {
            saveGame();
        } else {
            alert('保存功能不可用');
        }
    });

    mainMenuBtn.addEventListener('click', function () {
        // 实现返回主菜单逻辑
        // 同时自动存档
        if (typeof autoSaveGame === 'function') {
            autoSaveGame();
        }
        window.location.href = '../../../index.html';
    });



    // 游戏循环
    function gameLoop() {
        if (gameRunning && !gamePaused) {
            // 清除画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 在这里添加游戏渲染逻辑
            // 例如：绘制游戏场景、角色等

            // 示例：绘制一个简单的矩形作为游戏场景
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 示例：绘制一些游戏元素
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(gameLoop);
    }

    // 启动游戏循环
    gameLoop();

});
