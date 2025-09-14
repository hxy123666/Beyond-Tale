function getAchievements() {
    const achievements = JSON.parse(localStorage.getItem('unlockedAchievements'));
    return achievements ? new Set(achievements) : new Set();
}

// 解锁成就、
function unlockAchievement(achievementId) {
    const achievement = document.getElementById(achievementId);
    if (achievement) {
        achievement.classList.remove('locked');
        const lockedIcon = achievement.querySelector('.locked-icon');
        if (lockedIcon) {
            // 改为不可见
            lockedIcon.style.display = 'none';
        }
    }
}
document.addEventListener('DOMContentLoaded', function () {
    const unlockedAchievements = getAchievements();
    if (unlockedAchievements) {
        if (unlockedAchievements.has('随手一跳')) {
            // 解锁页面的成就
            unlockAchievement('fall-death-achievement');
        }
        if (unlockedAchievements.has('世界之外')) {
            // 解锁页面的成就
            unlockAchievement('out-of-world-achievement');
        }
        if (unlockedAchievements.has('这使你充满了决心')) {
            unlockAchievement('determination-achievement');
        }
        if (unlockedAchievements.has('有了决心就不一样了')) {
            unlockAchievement('high-jump-achievement');
        }
        if (unlockedAchievements.has('友情啊羁绊啊')) {
            unlockAchievement('friendship-achievement');
        }
        if (unlockedAchievements.has('左边可没有彩蛋')) {
            unlockAchievement('fallOffLeft-achievement');
        }
        if (unlockedAchievements.has('下北泽野槌蛇')) {
            unlockAchievement('foundintheGrass-achievement');
        }
        if (unlockedAchievements.has('未来道具9号机')) {
            unlockAchievement('invention-achievement');
        }
        if (unlockedAchievements.has('救命毫毛')){
            unlockAchievement('hair-achievement');
        }
        if (unlockedAchievements.has('将大局逆转吧')) {
            unlockAchievement('reverse-achievement');
        }
        if (unlockedAchievements.has('有了决心也不行')) {
            unlockAchievement('fallfromHigh-achievement');
        }
        if (unlockedAchievements.has('想到一同战斗的伙伴， 这使你充满了决心')) {
            // 移除问号并解锁成就
            const bossAchievement = document.getElementById('boss-achievement');
            if (bossAchievement) {
                const hiddenContent = bossAchievement.querySelector('.hidden-content');
                if (hiddenContent) {
                    hiddenContent.style.display = 'none';
                }
            }
            unlockAchievement('boss-achievement');
        }
    }
})