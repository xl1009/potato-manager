// 主应用控制器
class PotatoManager {
    constructor() {
        this.currentUser = null;
        this.accounts = [];
        this.tasks = [];
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.updateSystemInfo();
        this.loadAccounts();
        
        // 更新系统时间
        setInterval(() => this.updateSystemTime(), 1000);
        
        // 更新内存使用情况
        setInterval(() => this.updateMemoryUsage(), 5000);
    }

    checkAuth() {
        const savedUser = localStorage.getItem('potato_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLoginPanel();
        }
    }

    showLoginPanel() {
        document.getElementById('loginPanel').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loginPanel').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        this.updateAccountStats();
    }

    setupEventListeners() {
        // 登录相关
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        
        // 侧边栏导航
        document.querySelectorAll('.sidebar a[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(link.getAttribute('data-tab'));
            });
        });

        // 设置相关
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideSettings());

        // 账号管理
        document.getElementById('batchRegisterBtn').addEventListener('click', () => this.startBatchRegistration());
        document.getElementById('manualLoginBtn').addEventListener('click', () => this.manualLogin());
        document.getElementById('getCodeBtn').addEventListener('click', () => this.getVerificationCode());
        document.getElementById('refreshStatusBtn').addEventListener('click', () => this.refreshAccountStatus());

        // 全局点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideSettings();
            }
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showMessage('请输入用户名和密码', 'error');
            return;
        }

        try {
            // 模拟登录过程
            this.showMessage('登录中...', 'info');
            
            // 这里应该调用实际的登录API
            const userData = await this.mockLogin(username, password);
            
            this.currentUser = userData;
            localStorage.setItem('potato_current_user', JSON.stringify(userData));
            
            this.showMainApp();
            this.showMessage('登录成功!', 'success');
            
        } catch (error) {
            this.showMessage('登录失败: ' + error.message, 'error');
        }
    }

    async handleRegister() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showMessage('请输入用户名和密码', 'error');
            return;
        }

        try {
            this.showMessage('注册中...', 'info');
            
            // 模拟注册过程
            const userData = await this.mockRegister(username, password);
            
            this.showMessage('注册成功! 请登录', 'success');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            
        } catch (error) {
            this.showMessage('注册失败: ' + error.message, 'error');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('potato_current_user');
        this.showLoginPanel();
        this.showMessage('已退出登录', 'info');
    }

    switchTab(tabName) {
        // 隐藏所有标签页
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // 显示选中的标签页
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        } else {
            // 动态加载标签页内容
            this.loadTabContent(tabName);
        }

        // 更新导航激活状态
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.sidebar a[data-tab="${tabName}"]`).classList.add('active');
    }

    loadTabContent(tabName) {
        const contentArea = document.getElementById('otherTabs');
        contentArea.innerHTML = this.generateTabContent(tabName);
        contentArea.classList.add('active');
    }

    generateTabContent(tabName) {
        const templates = {
            accountImport: `
                <h2><i class="fas fa-file-import"></i> 导入账号</h2>
                <div class="card-grid">
                    <div class="card">
                        <h3>从文件导入</h3>
                        <div class="form-group">
                            <label>选择文件:</label>
                            <input type="file" id="accountFile" accept=".json,.txt,.csv">
                        </div>
                        <div class="form-group">
                            <label>文件格式:</label>
                            <select id="fileFormat">
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                                <option value="txt">文本</option>
                            </select>
                        </div>
                        <button id="importFileBtn" class="btn-primary">导入文件</button>
                    </div>
                    
                    <div class="card">
                        <h3>手动输入</h3>
                        <div class="form-group">
                            <label>账号数据 (每行一个):</label>
                            <textarea id="manualAccounts" rows="10" placeholder="格式: 手机号,密码&#10;+8613800138000,password123&#10;+79123456789,pass456"></textarea>
                        </div>
                        <button id="importManualBtn" class="btn-primary">导入账号</button>
                    </div>
                </div>
            `,

            userCollector: `
                <h2><i class="fas fa-search"></i> 采集用户</h2>
                <div class="tab-nav">
                    <button class="active" data-collect-version="v1">V1 基础采集</button>
                    <button data-collect-version="v2">V2 高级采集</button>
                </div>
                
                <div id="collectV1" class="collect-version active">
                    <div class="card-grid">
                        <div class="card">
                            <h3>附近的人</h3>
                            <div class="form-group">
                                <label>采集范围 (米):</label>
                                <input type="number" id="nearbyRange" value="1000" min="100" max="5000">
                            </div>
                            <div class="form-group">
                                <label>最大数量:</label>
                                <input type="number" id="nearbyMax" value="100" min="1" max="1000">
                            </div>
                            <button class="btn-primary" onclick="userCollector.startNearbyCollection()">开始采集</button>
                        </div>
                        
                        <div class="card">
                            <h3>群组成员</h3>
                            <div class="form-group">
                                <label>群组链接:</label>
                                <input type="text" id="groupLink" placeholder="输入群组链接或ID">
                            </div>
                            <div class="form-group">
                                <label>采集方式:</label>
                                <select id="collectMethod">
                                    <option value="all">所有成员</option>
                                    <option value="active">活跃成员</option>
                                    <option value="recent">最近加入</option>
                                </select>
                            </div>
                            <button class="btn-primary" onclick="userCollector.startGroupCollection()">采集成员</button>
                        </div>
                    </div>
                </div>
                
                <div id="collectV2" class="collect-version">
                    <div class="card">
                        <h3>高级采集设置</h3>
                        <!-- V2版本的高级功能 -->
                    </div>
                </div>
            `,

            bulkInvite: `
                <h2><i class="fas fa-user-plus"></i> 批量拉人</h2>
                <div class="tab-nav">
                    <button class="active" data-invite-version="v1">V1 直接拉人</button>
                    <button data-invite-version="v2">V2 群组采集后拉</button>
                    <button data-invite-version="v3">V3 智能拉人</button>
                </div>
                <!-- 批量拉人内容 -->
            `
        };

        return templates[tabName] || `<h2>${tabName} - 开发中</h2><p>此功能正在开发中...</p>`;
    }

    async startBatchRegistration() {
        const count = parseInt(document.getElementById('regCount').value);
        const smsService = document.getElementById('smsService').value;
        const apiKey = document.getElementById('apiKey').value;

        if (!count || count < 1) {
            this.showMessage('请输入有效的注册数量', 'error');
            return;
        }

        try {
            this.showMessage(`开始批量注册 ${count} 个账号...`, 'info');
            
            // 模拟批量注册过程
            const results = await this.mockBatchRegister(count, smsService, apiKey);
            
            this.accounts = this.accounts.concat(results.accounts);
            this.saveAccounts();
            this.updateAccountStats();
            
            this.showMessage(`成功注册 ${results.success} 个账号`, 'success');
            
        } catch (error) {
            this.showMessage('批量注册失败: ' + error.message, 'error');
        }
    }

    async manualLogin() {
        const phone = document.getElementById('loginPhone').value;
        const code = document.getElementById('loginCode').value;

        if (!phone || !code) {
            this.showMessage('请输入手机号和验证码', 'error');
            return;
        }

        try {
            this.showMessage('登录中...', 'info');
            
            // 模拟手动登录
            const account = await this.mockManualLogin(phone, code);
            this.accounts.push(account);
            this.saveAccounts();
            this.updateAccountStats();
            
            this.showMessage('账号登录成功!', 'success');
            
        } catch (error) {
            this.showMessage('登录失败: ' + error.message, 'error');
        }
    }

    async getVerificationCode() {
        const phone = document.getElementById('loginPhone').value;
        
        if (!phone) {
            this.showMessage('请输入手机号', 'error');
            return;
        }

        try {
            this.showMessage('发送验证码中...', 'info');
            
            // 模拟发送验证码
            await this.mockSendVerificationCode(phone);
            
            this.showMessage('验证码已发送', 'success');
            
        } catch (error) {
            this.showMessage('发送验证码失败: ' + error.message, 'error');
        }
    }

    updateAccountStats() {
        const total = this.accounts.length;
        const online = this.accounts.filter(acc => acc.status === 'online').length;
        
        document.getElementById('accountCount').textContent = total;
        document.getElementById('totalAccounts').textContent = total;
        document.getElementById('onlineAccounts').textContent = online;
        
        // 计算今日注册数量
        const today = new Date().toDateString();
        const todayReg = this.accounts.filter(acc => 
            new Date(acc.createdAt).toDateString() === today
        ).length;
        document.getElementById('todayReg').textContent = todayReg;
    }

    updateSystemTime() {
        const now = new Date();
        document.getElementById('systemTime').textContent = 
            now.toLocaleTimeString('zh-CN');
    }

    updateMemoryUsage() {
        // 模拟内存使用情况
        const usage = Math.floor(Math.random() * 100) + 50;
        document.getElementById('memoryUsage').textContent = usage;
    }

    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // 添加到页面
        document.body.appendChild(messageDiv);
        
        // 自动移除
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // 模拟方法 - 实际使用时需要替换为真实的API调用
    async mockLogin(username, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: 1,
                    username: username,
                    email: `${username}@example.com`,
                    createdAt: new Date()
                });
            }, 1000);
        });
    }

    async mockRegister(username, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: Date.now(),
                    username: username,
                    createdAt: new Date()
                });
            }, 1000);
        });
    }

    async mockBatchRegister(count, service, apiKey) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const accounts = [];
                const success = Math.floor(count * 0.8); // 模拟80%成功率
                
                for (let i = 0; i < success; i++) {
                    accounts.push({
                        id: `acc_${Date.now()}_${i}`,
                        phone: `+79${Math.random().toString().slice(2, 11)}`,
                        username: `user${Date.now()}${i}`,
                        status: 'online',
                        createdAt: new Date()
                    });
                }
                
                resolve({ success, accounts });
            }, 3000);
        });
    }

    loadAccounts() {
        const saved = localStorage.getItem('potato_accounts');
        if (saved) {
            this.accounts = JSON.parse(saved);
        }
    }

    saveAccounts() {
        localStorage.setItem('potato_accounts', JSON.stringify(this.accounts));
    }

    loadSettings() {
        const saved = localStorage.getItem('potato_settings');
        return saved ? JSON.parse(saved) : {};
    }

    saveSettings() {
        localStorage.setItem('potato_settings', JSON.stringify(this.settings));
    }
}

// 初始化应用
const app = new PotatoManager();

// 全局工具函数
window.showMessage = function(message, type = 'info') {
    app.showMessage(message, type);
};