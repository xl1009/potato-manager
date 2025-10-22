// 认证管理类
class AuthManager {
    constructor() {
        this.users = this.loadUsers();
    }

    loadUsers() {
        const saved = localStorage.getItem('potato_users');
        return saved ? JSON.parse(saved) : [];
    }

    saveUsers() {
        localStorage.setItem('potato_users', JSON.stringify(this.users));
    }

    register(username, password) {
        return new Promise((resolve, reject) => {
            // 检查用户是否存在
            if (this.users.find(user => user.username === username)) {
                reject(new Error('用户名已存在'));
                return;
            }

            // 创建新用户
            const newUser = {
                id: this.generateId(),
                username: username,
                password: this.hashPassword(password),
                email: '',
                createdAt: new Date(),
                lastLogin: null,
                settings: {}
            };

            this.users.push(newUser);
            this.saveUsers();

            resolve(newUser);
        });
    }

    login(username, password) {
        return new Promise((resolve, reject) => {
            const user = this.users.find(u => u.username === username);
            
            if (!user) {
                reject(new Error('用户不存在'));
                return;
            }

            if (user.password !== this.hashPassword(password)) {
                reject(new Error('密码错误'));
                return;
            }

            // 更新最后登录时间
            user.lastLogin = new Date();
            this.saveUsers();

            resolve(user);
        });
    }

    hashPassword(password) {
        // 简单的哈希函数 - 实际使用时应该使用更安全的方法
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    changePassword(username, oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            const user = this.users.find(u => u.username === username);
            
            if (!user) {
                reject(new Error('用户不存在'));
                return;
            }

            if (user.password !== this.hashPassword(oldPassword)) {
                reject(new Error('原密码错误'));
                return;
            }

            user.password = this.hashPassword(newPassword);
            this.saveUsers();

            resolve(true);
        });
    }

    resetPassword(username, email) {
        // 密码重置逻辑
        return new Promise((resolve) => {
            // 这里应该发送重置邮件
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    }
}

// 初始化认证管理器
const authManager = new AuthManager();