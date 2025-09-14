// 点击新游戏清空localStorage的platformGameState数据
function newGame() {
    try {
        localStorage.removeItem('platformGameState');
        localStorage.removeItem('unlockedAchievements');
    } catch (error) {
        console.error('Error removing platformGameState:', error);
    }
}
const newGameButton = document.getElementById('newGame');
newGameButton.addEventListener('click', newGame);