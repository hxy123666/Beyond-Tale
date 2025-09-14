// 注册
function handleSignup() {
    // 获取注册表单中的用户名和密码
    var username = document.getElementById('newUsername').value;
    var password = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    // 检查两次输入的密码是否一致
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return; // 阻止后续代码执行
    }
    // 检查是否为空
    if (username === '' || password === '' || confirmPassword === '') {
        alert('Username and password cannot be empty!');
        return; // 阻止后续代码执行
    }
    alert('Successfully registered!');
    // 创建一个对象来存储用户名、密码、登录状态
    var user = {
        username: username,
        password: password,
        isLoggedIn: false
    };
    // 将用户信息存储到本地存储中
    localStorage.setItem('user', JSON.stringify(user));
    // 跳转到登录文件
    window.location.href = '../../index.html';
}

// 登录
function handleLogin() {
    // 检查是否和上面的注册信息匹配
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    if (username === '' || password === '') {
        alert('Username and password cannot be empty!');
        return; // 阻止后续代码执行
    }
    var storedUser = JSON.parse(localStorage.getItem('user'));
    if (username === storedUser.username && password === storedUser.password) {
        alert('Successfully logged in!');
        // 将登录状态设置为true
        var user = JSON.parse(localStorage.getItem('user'));
        user.isLoggedIn = true;
        localStorage.setItem('user', JSON.stringify(user));
        // 跳转到新画面
        document.getElementById('usernameDisplay').textContent = username;
        var mainContainer = document.getElementById('mainContainer');
        mainContainer.style.display = 'block';
        var signinContainer = document.getElementById('signinContainer');
        signinContainer.style.display = 'none';
    }
    else {
        alert('Incorrect username or password!');
    }
}

// 根据页面上的元素来决定绑定哪个事件
document.addEventListener('DOMContentLoaded', function () {
    // 检查是否已经登录
    const loggedInUser = localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isLoggedIn;
    if (loggedInUser && document.getElementById('mainContainer')) {
        // 如果已登录并且在主登录页面上
        const user = JSON.parse(localStorage.getItem('user'));
        document.getElementById('usernameDisplay').textContent = user.username;
        document.getElementById('mainContainer').style.display = 'block';
        document.getElementById('signinContainer').style.display = 'none';
    }

    var signupButton = document.getElementById('signupButton');
    var signinButton = document.getElementById('signinButton');
    var logoutButton = document.getElementById('logoutButton');

    if (signupButton) {
        // 注册页面
        signupButton.addEventListener('click', handleSignup);
        document.getElementById('signupContainer').addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                handleSignup();
            }
        });
    }

    if (signinButton) {
        // 登录页面
        signinButton.addEventListener('click', handleLogin);
        document.getElementById('signinContainer').addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                handleLogin();
            }
        });
    }
    if (logoutButton) {
        // 主页面
        logoutButton.addEventListener('click', handleLogout);
    }
});

// 退出登录
function handleLogout() {
    // 显示登录界面，隐藏主界面
    var mainContainer = document.getElementById('mainContainer');
    mainContainer.style.display = 'none';
    var signinContainer = document.getElementById('signinContainer');
    signinContainer.style.display = 'block';
    // 将登录状态设置为false
    var user = JSON.parse(localStorage.getItem('user'));
    user.isLoggedIn = false;
    // 更新本地存储中的用户信息
    localStorage.setItem('user', JSON.stringify(user));
}

// 在登陆页面点击浏览器退回按钮时，返回到登录页面
// 检查当前是否在登录页面
if (document.getElementById('signinContainer')) {
    // 页面加载时，将一个状态推入历史记录，
    // 这样我们就有了一个可以“后退”到的状态，从而触发 popstate
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        // 当用户点击后退按钮时，popstate 事件被触发
        // 立即调用 history.forward()
        history.forward();
    };
}