// 立即暴露自动存档函数到全局作用域，确保其他脚本可以调用
function autoSaveGame() {
    try {
        // 获取当前游戏状态
        const gameData = {
            date: new Date().toLocaleString(),
            scene: window.location.pathname
        };

        // 保存至自动存档槽
        localStorage.setItem('autoSave', JSON.stringify(gameData));
        console.log('游戏已自动存档');
    } catch (error) {
        console.error('自动存档失败:', error);
    }
}

// 立即将函数暴露到全局作用域
window.autoSaveGame = autoSaveGame;

// 确保在DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 获取存档功能相关的按钮
    const saveButton = document.getElementById('saveBtn');

    // 点击按钮时保存存档
    if (saveButton) {
        // 先移除可能已存在的事件监听器，防止重复绑定
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        
        // 重新绑定点击事件
        newSaveButton.addEventListener('click', function(event) {
            event.preventDefault(); // 防止默认行为
            event.stopPropagation(); // 阻止事件冒泡
            saveGame(); // 调用保存游戏的函数
        });
    }

    // 保存游戏的函数
    function saveGame() {
        // 添加防重复保存的标志
        if (window.isSaving) {
            console.log('Saving in progress, please wait...');
            return;
        }
        
        window.isSaving = true;
        
        try {
            // 获取当前游戏状态
            const gameData = {
                date: new Date().toLocaleString(),
                scene: window.location.pathname
            };

            // 找一个空槽位或让用户选择槽位
            let slot = 1;
            while (localStorage.getItem(`gameData${slot}`)) {
                slot++;
                if (slot > 10) { // 假设最多10个存档
                    alert('Save slots are full!');
                    return;
                }
            }

            // 将游戏状态保存到对应的槽位
            localStorage.setItem(`gameData${slot}`, JSON.stringify(gameData));
            alert(`Game saved to slot ${slot}!`);
        } finally {
            // 保存完成后重置标志
            setTimeout(() => {
                window.isSaving = false;
            }, 1000); // 1秒后允许再次保存
        }
    }




    // 在../pages/continue/index.html页面创建存档卡片
    function loadSaves() {
        // 清空现有的存档卡片
        const savesGrid = document.getElementById('savesGrid');
        if (savesGrid) {
            savesGrid.innerHTML = '';
        }

        // 检查所有可能的存档槽位
        for (let slot = 1; slot <= 10; slot++) {
            const gameData = JSON.parse(localStorage.getItem(`gameData${slot}`));
            if (gameData) {
                createSaveCard(slot, gameData);
            }
        }
    }


    // 创建存档卡片的函数，可以多存档
    function createSaveCard(slot, data) {
        const scene = data.scene.split('/').pop().split('.')[0];
        const saveCard = document.createElement('div');
        saveCard.classList.add('save-card');
        saveCard.innerHTML = `
        <div class="save-card-header">
            <h3>存档 ${slot}</h3>
            <button class="delete-save-btn" onclick="deleteSave(${slot})">删除</button>
            <button class="load-save-btn" onclick="loadSave(${slot})">加载</button>
        </div>
        <div class="save-card-content">
            <p>保存时间: ${data.date}</p>
            <p>保存页面: ${scene}</p>
        </div>
    `;

        // 将存档卡片添加到页面中
        if (document.getElementById('savesGrid')) {
            document.getElementById('savesGrid').appendChild(saveCard);
        }
    }


    // 在页面加载时加载存档
    // 移除可能已存在的load事件监听器，避免重复执行
    window.removeEventListener('load', loadSaves);
    window.addEventListener('load', loadSaves);

    // 将函数暴露到全局作用域，以便其他脚本可以调用
    window.saveGame = saveGame;
    window.autoSaveGame = autoSaveGame;
    window.loadSaves = loadSaves;
    window.createSaveCard = createSaveCard;
});