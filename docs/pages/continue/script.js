// 显示自动存档信息
function showAutoSave() {
    const autoSaveData = JSON.parse(localStorage.getItem('autoSave'));
    const scene = autoSaveData.scene.split('/').pop().split('.')[0];
    if (autoSaveData) {
        // 创建自动存档卡片，并添加点击事件以加载存档
        document.getElementById('autoSaveGrid').innerHTML = `
            <div class="save-card-header">
                <h3>Continue your last game</h3>
            </div>
            <div class="save-card-content">
                <p>保存时间: ${autoSaveData.date}</p>
                <p>保存页面: ${scene}</p>
            </div>`
    }
    else {
        // 如果没有自动存档，显示提示信息
        document.getElementById('autoSaveGrid').innerHTML = `
            <div class="save-card-header">
                <h3>Continue</h3>
            </div>
            <div class="save-card-content">
                <p>No auto save found.</p>
            </div>`
    }
}

// 加载自动存档
function loadAutoSave() {
    const autoSaveData = JSON.parse(localStorage.getItem('autoSave'));
    if (autoSaveData) {
        window.location.href = autoSaveData.scene;
    } else {
        console.error('没有找到自动存档数据');
    }
}


// 点击卡片时加载存档
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('auto-save').addEventListener('click', function () {
        loadAutoSave();
    });
})


// 删除存档
function deleteSave(slot) {
    if (confirm('Are you sure you want to delete save ' + slot + ' ?')) {
        // 删除指定槽位的存档
        localStorage.removeItem('gameData' + slot);

        // 从页面中移除对应的存档卡片
        const saveCards = document.querySelectorAll('.save-card');
        saveCards.forEach(card => {
            const cardTitle = card.querySelector('h3').textContent;
            if (cardTitle === '存档 ' + slot) {
                card.remove();
            }
        });

        // 删除后检查是否还有存档，如果没有则显示提示
        checkSavesStatus();
    }
}

// 检查存档状态的函数
function checkSavesStatus() {
    // 清除现有的提示信息（如果有）
    const existingMessages = document.querySelectorAll('#savesGrid > p');
    existingMessages.forEach(msg => msg.remove());

    // 没有存档时显示提示
    if (document.querySelectorAll('.save-card').length === 0) {
        const noSavesMessage = document.createElement('p');
        noSavesMessage.id = 'noSavesMessage';
        noSavesMessage.textContent = 'No saves available. Please create a new save.';
        document.getElementsByClassName('container')[0].appendChild(noSavesMessage);
    }
}


// 加载存档
function loadSave(slot) {
    // 如果没有传入slot参数，尝试从点击的卡片中获取
    if (!slot) {
        console.error('No save slot specified');
        return;
    }

    // 加载指定槽位的存档数据
    const gameData = JSON.parse(localStorage.getItem('gameData' + slot));
    // 点击按钮时加载存档
    if (gameData) {
        window.location.href = gameData.scene;
    }
    else {
        console.error('No save found for slot ' + slot);
    }
}

document.addEventListener('click', function (event) {
    if (event.target.closest('.load-save-btn')) {
        // 从卡片标题中提取槽位号
        const cardTitle = event.target.closest('.load-save-btn').querySelector('h3').textContent;
        const slot = cardTitle.replace('存档 ', '');
        loadSave(slot);
    }
});



// 确保在DOM加载完成后检查是否有存档
document.addEventListener('DOMContentLoaded', function () {
    // 显示自动存档信息
    showAutoSave();

    // 延迟检查，确保存档卡片已经加载
    setTimeout(function () {
        checkSavesStatus(); // 使用统一的检查函数
    }, 100); // 给予100ms的延迟，确保存档卡片已经创建
});