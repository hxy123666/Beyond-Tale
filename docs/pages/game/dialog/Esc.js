document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const escMenu = document.getElementById('escMenu');
    const continueBtn = document.getElementById('continueBtn');
    const saveBtn = document.getElementById('saveBtn');
    const mainMenuBtn = document.getElementById('mainMenuBtn');

    // 不再使用canvas，避免覆盖游戏内容

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
        console.log('尝试自动存档...');
        if (typeof autoSaveGame === 'function') {
            console.log('找到 autoSaveGame 函数，正在执行...');
            try {
                autoSaveGame();
                console.log('自动存档成功');
            } catch (error) {
                console.error('自动存档失败:', error);
            }
        } else {
            console.warn('autoSaveGame 函数不存在或不可用');
        }
        window.location.href = '../../../index.html';
    });




    // 移除游戏循环，避免覆盖游戏内容
});
