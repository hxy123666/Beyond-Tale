/**
 * 移动端虚拟控制器
 * 为Beyond Tale游戏提供触摸控制支持
 */
class MobileController {
    constructor() {
        this.isActive = false;
        this.buttons = {};
        this.touches = {};
        this.gameState = null;
        this.controllerElement = null;
        
        // 控制器配置
        this.config = {
            buttonSize: 60,
            buttonSpacing: 10,
            opacity: 0.7,
            position: {
                left: 20,
                bottom: 20,
                right: 20
            }
        };
        
        // 按键映射
        this.keyMapping = {
            'left': 'ArrowLeft',
            'right': 'ArrowRight', 
            'jump': ' ',
            'action': 'e',
            'esc': 'Escape'
        };
        
        this.init();
    }
    
    init() {
        // 检测是否为移动设备
        this.detectMobile();
        
        if (this.isActive) {
            this.createController();
            this.setupTouchEvents();
            this.setupOrientationChange();
        }
    }
    
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const isHoverNone = window.matchMedia('(hover: none)').matches;
        
        // 更全面的移动设备检测
        this.isActive = isMobile || isTouchDevice || isCoarsePointer || isHoverNone;
        
        // 同时检测屏幕尺寸
        const isSmallScreen = window.innerWidth <= 768;
        this.isActive = this.isActive || isSmallScreen;
        
        // 调试信息
        console.log('移动端检测:', {
            userAgent: userAgent.substring(0, 50) + '...',
            isMobile,
            isTouchDevice,
            isCoarsePointer,
            isHoverNone,
            isSmallScreen,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            isActive: this.isActive
        });
        
        // 检测是否为横屏
        this.isLandscape = window.innerWidth > window.innerHeight;
    }
    
    createController() {
        // 创建控制器容器
        this.controllerElement = document.createElement('div');
        this.controllerElement.id = 'mobile-controller';
        this.controllerElement.className = 'mobile-controller';
        
        // 创建左侧方向键
        const leftControls = this.createDirectionPad();
        
        // 创建右侧动作键
        const rightControls = this.createActionButtons();
        
        this.controllerElement.appendChild(leftControls);
        this.controllerElement.appendChild(rightControls);
        
        // 添加到页面
        document.body.appendChild(this.controllerElement);
        
        // 添加样式
        this.addControllerStyles();
    }
    
    createDirectionPad() {
        const container = document.createElement('div');
        container.className = 'direction-pad';
        
        // 左键
        const leftBtn = this.createButton('left', '◀', 'direction-button left-button');
        // 右键  
        const rightBtn = this.createButton('right', '▶', 'direction-button right-button');
        
        container.appendChild(leftBtn);
        container.appendChild(rightBtn);
        
        return container;
    }
    
    createActionButtons() {
        const container = document.createElement('div');
        container.className = 'action-buttons';
        
        // 跳跃按钮
        const jumpBtn = this.createButton('jump', 'JUMP', 'action-button jump-button');
        // 交互按钮
        const actionBtn = this.createButton('action', 'E', 'action-button interact-button');
        // Esc菜单按钮
        const escBtn = this.createButton('esc', 'MENU', 'action-button esc-button');
        
        container.appendChild(jumpBtn);
        container.appendChild(actionBtn);
        container.appendChild(escBtn);
        
        return container;
    }
    
    createButton(id, text, className) {
        const button = document.createElement('div');
        button.className = className;
        button.id = `mobile-btn-${id}`;
        button.innerHTML = text;
        button.dataset.action = id;
        
        // 存储按钮引用
        this.buttons[id] = {
            element: button,
            isPressed: false
        };
        
        return button;
    }
    
    setupTouchEvents() {
        // 防止默认的触摸行为
        document.addEventListener('touchstart', this.preventDefault.bind(this), { passive: false });
        document.addEventListener('touchmove', this.preventDefault.bind(this), { passive: false });
        
        // 按钮触摸事件
        Object.keys(this.buttons).forEach(buttonId => {
            const button = this.buttons[buttonId].element;
            
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonPress(buttonId, e);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleButtonRelease(buttonId, e);
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.handleButtonRelease(buttonId, e);
            });
            
            // 鼠标事件（用于桌面端测试）
            button.addEventListener('mousedown', (e) => {
                this.handleButtonPress(buttonId, e);
            });
            
            button.addEventListener('mouseup', (e) => {
                this.handleButtonRelease(buttonId, e);
            });
            
            button.addEventListener('mouseleave', (e) => {
                this.handleButtonRelease(buttonId, e);
            });
        });
    }
    
    handleButtonPress(buttonId, event) {
        if (!this.buttons[buttonId].isPressed) {
            this.buttons[buttonId].isPressed = true;
            this.buttons[buttonId].element.classList.add('pressed');
            
            // 触觉反馈
            this.vibrate();
            
            // 触发按键事件
            this.triggerKeyEvent(this.keyMapping[buttonId], 'keydown');
        }
    }
    
    handleButtonRelease(buttonId, event) {
        if (this.buttons[buttonId].isPressed) {
            this.buttons[buttonId].isPressed = false;
            this.buttons[buttonId].element.classList.remove('pressed');
            
            // 触发按键释放事件
            this.triggerKeyEvent(this.keyMapping[buttonId], 'keyup');
        }
    }
    
    triggerKeyEvent(key, eventType) {
        // 创建键盘事件
        const event = new KeyboardEvent(eventType, {
            key: key,
            code: key,
            keyCode: this.getKeyCode(key),
            which: this.getKeyCode(key),
            bubbles: true
        });
        
        // 分发事件到document
        document.dispatchEvent(event);
        
        // 如果有游戏状态引用，直接更新
        if (this.gameState && this.gameState.keys) {
            this.gameState.keys[key] = (eventType === 'keydown');
        }
    }
    
    getKeyCode(key) {
        const keyMap = {
            'ArrowLeft': 37,
            'ArrowRight': 39,
            ' ': 32,
            'e': 69,
            'E': 69,
            'Escape': 27
        };
        return keyMap[key] || 0;
    }
    
    preventDefault(event) {
        // 只阻止游戏相关区域的默认行为
        if (event.target.closest('#mobile-controller, #gameCanvas, #game-canvas')) {
            event.preventDefault();
        }
    }
    
    setupOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isLandscape = window.innerWidth > window.innerHeight;
                this.updateLayout();
                this.handleOrientationChange();
            }, 100);
        });
        
        window.addEventListener('resize', () => {
            const wasLandscape = this.isLandscape;
            this.isLandscape = window.innerWidth > window.innerHeight;
            
            if (wasLandscape !== this.isLandscape) {
                this.handleOrientationChange();
            }
            
            this.updateLayout();
        });
    }
    
    updateLayout() {
        if (!this.controllerElement) return;
        
        this.controllerElement.className = `mobile-controller ${this.isLandscape ? 'landscape' : 'portrait'}`;
    }
    
    handleOrientationChange() {
        // 横屏变化时的处理
        if (this.isLandscape) {
            this.showLandscapeMessage();
        } else {
            this.showPortraitMessage();
        }
        
        // 触觉反馈
        this.vibrate(50);
    }
    
    showLandscapeMessage() {
        // 可以在这里添加横屏模式的提示
        console.log('切换到横屏模式');
    }
    
    showPortraitMessage() {
        // 可以在这里添加竖屏模式的提示
        console.log('切换到竖屏模式');
    }
    
    addControllerStyles() {
        if (document.getElementById('mobile-controller-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mobile-controller-styles';
        style.textContent = `
            .mobile-controller {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            }
            
            .direction-pad {
                position: absolute;
                bottom: 20px;
                left: 20px;
                display: flex;
                gap: 10px;
                pointer-events: auto;
            }
            
            .action-buttons {
                position: absolute;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: auto;
            }
            
            .direction-button, .action-button {
                width: 60px;
                height: 60px;
                background: rgba(255, 255, 255, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Press Start 2P', monospace;
                font-size: 12px;
                color: white;
                cursor: pointer;
                user-select: none;
                transition: all 0.1s ease;
                backdrop-filter: blur(5px);
            }
            
            .jump-button {
                width: 80px;
                height: 80px;
                font-size: 10px;
                background: rgba(255, 100, 100, 0.3);
                border-color: rgba(255, 100, 100, 0.5);
            }
            
            .interact-button {
                background: rgba(100, 255, 100, 0.3);
                border-color: rgba(100, 255, 100, 0.5);
            }
            
            .esc-button {
                background: rgba(255, 255, 100, 0.3);
                border-color: rgba(255, 255, 100, 0.5);
                font-size: 9px;
            }
            
            .direction-button.pressed, .action-button.pressed {
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0.95);
                border-color: rgba(255, 255, 255, 0.8);
            }
            
            .jump-button.pressed {
                background: rgba(255, 150, 150, 0.6);
                border-color: rgba(255, 150, 150, 0.8);
            }
            
            .interact-button.pressed {
                background: rgba(150, 255, 150, 0.6);
                border-color: rgba(150, 255, 150, 0.8);
            }
            
            .esc-button.pressed {
                background: rgba(255, 255, 150, 0.6);
                border-color: rgba(255, 255, 150, 0.8);
            }
            
            /* 横屏模式调整 */
            .mobile-controller.landscape .direction-pad {
                bottom: 10px;
                left: 10px;
            }
            
            .mobile-controller.landscape .action-buttons {
                bottom: 10px;
                right: 10px;
                flex-direction: row;
            }
            
            .mobile-controller.landscape .direction-button,
            .mobile-controller.landscape .action-button {
                width: 50px;
                height: 50px;
                font-size: 10px;
            }
            
            .mobile-controller.landscape .jump-button {
                width: 70px;
                height: 70px;
                font-size: 9px;
            }
            
            /* 小屏幕适配 */
            @media (max-width: 480px) {
                .direction-button, .action-button {
                    width: 50px;
                    height: 50px;
                    font-size: 10px;
                }
                
                .jump-button {
                    width: 70px;
                    height: 70px;
                    font-size: 8px;
                }
                
                .direction-pad {
                    bottom: 10px;
                    left: 10px;
                    gap: 8px;
                }
                
                .action-buttons {
                    bottom: 10px;
                    right: 10px;
                    gap: 8px;
                }
            }
            
            /* 隐藏控制器（桌面端） - 更精确的检测 */
            @media (min-width: 1024px) and (hover: hover) and (pointer: fine) {
                .mobile-controller {
                    display: none;
                }
            }
            
            /* 强制显示移动端控制器 */
            @media (max-width: 1023px), (pointer: coarse), (hover: none) {
                .mobile-controller {
                    display: block !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    vibrate(duration = 10) {
        // 触觉反馈（如果支持）
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
    
    // 设置游戏状态引用
    setGameState(gameState) {
        this.gameState = gameState;
    }
    
    // 显示/隐藏控制器
    show() {
        if (this.controllerElement) {
            this.controllerElement.style.display = 'block';
        }
    }
    
    hide() {
        if (this.controllerElement) {
            this.controllerElement.style.display = 'none';
        }
    }
    
    // 销毁控制器
    destroy() {
        if (this.controllerElement) {
            this.controllerElement.remove();
        }
        
        const styles = document.getElementById('mobile-controller-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// 导出类
window.MobileController = MobileController;
