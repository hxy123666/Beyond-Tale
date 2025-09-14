// 存储已获得的成就，防止重复弹出
let unlockedAchievements = new Set();

// 从localStorage加载已解锁的成就
function loadUnlockedAchievements() {
    const savedAchievements = localStorage.getItem('unlockedAchievements');
    if (savedAchievements) {
        unlockedAchievements = new Set(JSON.parse(savedAchievements));
    }
}

// 保存已解锁的成就到localStorage
function saveUnlockedAchievements() {
    localStorage.setItem('unlockedAchievements', JSON.stringify(Array.from(unlockedAchievements)));
}

function getData() {
    return JSON.parse(localStorage.getItem('platformGameState'));
}

// 存储当前显示的弹窗元素
let activePopups = [];

function showPopup(name) {
    // 检查是否已经显示过该成就
    if (unlockedAchievements.has(name)) {
        return;
    }

    // 创建新的弹窗元素
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h2 id="achievementTitle">Unlock achievement</h2>
            <p id="achievementDescription">${name}</p>
        </div>
    `;

    // 添加到body中
    document.body.appendChild(popup);

    // 记录当前显示的弹窗
    activePopups.push(popup);

    // 记录已显示的成就
    unlockedAchievements.add(name);
    // 保存到localStorage
    saveUnlockedAchievements();

    // 返回弹窗元素，以便后续操作
    return popup;
}

function closePopup(popup) {
    // 如果没有指定弹窗，则关闭所有弹窗
    if (!popup) {
        activePopups.forEach(p => {
            p.remove();
        });
        activePopups = [];
        return;
    }

    // 关闭指定弹窗
    popup.remove();
    activePopups = activePopups.filter(p => p !== popup);
}


document.addEventListener('DOMContentLoaded', function () {
    // 加载已解锁的成就
    loadUnlockedAchievements();

    // 初始检查
    checkAchievements();

    // 每0.10秒检查一次成就条件
    setInterval(checkAchievements, 100);
});

// 播放音效
function playSound(soundName) {
    const sound = new Audio(`../../../assets/sounds/${soundName}.wav`);
    sound.play();
}

function checkAchievements() {
    const data = getData();
    if (data) {
        // 检查fallDeaths成就
        if (data.deathStats && data.deathStats.fallDeaths == 1 && !unlockedAchievements.has('随手一跳')) {
            const popup = showPopup('随手一跳');
            // 播放音效
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }
        // 检查otherFallDeaths成就
        if (data.deathStats && data.deathStats.otherFallDeaths == 1 && !unlockedAchievements.has('世界之外')) {
            const popup = showPopup('世界之外');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }
        // 检查determination成就
        if (data.determination >= 1 && !unlockedAchievements.has('这使你充满了决心')) {
            const popup = showPopup('这使你充满了决心');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }
        // 检查jumpCount43成就
        if (data.jumpCount43 >= 1 && !unlockedAchievements.has('有了决心就不一样了')) {
            const popup = showPopup('有了决心就不一样了');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }
        // 检查friendship-achievement成就
        if (data.nearbyNPCCounter >= 1 && !unlockedAchievements.has('友情啊羁绊啊')) {
            const popup = showPopup('友情啊羁绊啊');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }
        // 检查fallOffLeft-achievement 成就
        if (data.deathStats.fallOffLeftCounter >= 1 && !unlockedAchievements.has('左边可没有彩蛋')) {
            const popup = showPopup('左边可没有彩蛋');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }
        // 检查foundintheGrass-achievement 成就
        if (data.foundintheGrass_achievement == true && !unlockedAchievements.has('下北泽野槌蛇')) {
            const popup = showPopup('下北泽野槌蛇');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }

        // 检查invention-achievement 成就
        if (data.invention_achievement == true && !unlockedAchievements.has('未来道具9号机')) {
            const popup = showPopup('未来道具9号机');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }

        // 检查hair-achievement 成就
        if (data.hair_achievement == true && !unlockedAchievements.has('救命毫毛')) {
            const popup = showPopup('救命毫毛');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }

        // 检查reverse-achievement 成就
        if (data.currentLevel == 'game5' && !unlockedAchievements.has('将大局逆转吧')) {
            const popup = showPopup('将大局逆转吧');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }

        // 检查fallfromHigh-achievement 成就
        if (data.deathStats.fallfromHighCounter >= 1 && !unlockedAchievements.has('有了决心也不行')) {
            const popup = showPopup('有了决心也不行');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }

        // 检查boss-achievement 成就
        if (data.currentLevel == 'the_boss_you_can_defeat' && !unlockedAchievements.has('想到一同战斗的伙伴， 这使你充满了决心')) {
            const popup = showPopup('想到一同战斗的伙伴， 这使你充满了决心');
            playSound('achievement');
            setTimeout(() => closePopup(popup), 2000);
        }

    }
}