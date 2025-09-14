window.onload = function () {
    // 5秒后执行切换
    setTimeout(function () {
        // 隐藏第一个图片
        document.getElementById("tangzhe").style.display = "none";
        // 显示第二个图片
        document.getElementById("walking-person").style.display = "block";
    }, 5000); // 5000毫秒 = 5秒
};
// 自动跳转，设置时间为六秒
setTimeout(function () {
    window.location.href = "../platform-game/game.html";
}, 10000)