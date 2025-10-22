// 用户采集管理类
class UserCollector {
    constructor() {
        this.collectedUsers = this.loadCollectedUsers();
        this.isCollecting = false;
    }

    loadCollectedUsers() {
        const saved = localStorage.getItem('collected_users');
        return saved ? JSON.parse(saved) : [];
    }

    saveCollectedUsers() {
        localStorage.setItem('collected_users', JSON.stringify(this.collectedUsers));
    }

    async startNearbyCollection() {
        if (this.isCollecting) {
            showMessage('采集正在进行中', 'warning');
            return;
        }

        const range = parseInt(document.getElementById('nearbyRange').value);
        const maxUsers = parseInt(document.getElementById('nearbyMax').value);

        this.isCollecting = true;
        showMessage('开始采集附近用户...', 'info');

        try {
            // 模拟采集过程
            const users = await this.collectNearbyUsers(range, maxUsers);
            this.collectedUsers = this.collectedUsers.concat(users);
            this.saveCollectedUsers();

            showMessage(`成功采集 ${users.length} 个附近用户`, 'success');
            
        } catch (error) {
            showMessage('采集失败: ' + error.message, 'error');
        } finally {
            this.isCollecting = false;
        }
    }

    async startGroupCollection() {
        const groupLink = document.getElementById('groupLink').value;
        const method = document.getElementById('collectMethod').value;

        if (!groupLink) {
            showMessage('请输入群组链接', 'error');
            return;
        }

        this.isCollecting = true;
        showMessage('开始采集群组成员...', 'info');

        try {
            const users = await this.collectGroupMembers(groupLink, method);
            this.collectedUsers = this.collectedUsers.concat(users);
            this.saveCollectedUsers();

            showMessage(`成功采集 ${users.length} 个群组成员`, 'success');
            
        } catch (error) {
            showMessage('采集失败: ' + error.message, 'error');
        } finally {
            this.isCollecting = false;
        }
    }

    collectNearbyUsers(range, maxUsers) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = [];
                const count = Math.min(maxUsers, Math.floor(range / 10));
                
                for (let i = 0; i < count; i++) {
                    users.push({
                        id: `user_${Date.now()}_${i}`,
                        username: `nearby_user_${i}`,
                        phone: `+79${Math.random().toString().slice(2, 11)}`,
                        distance: Math.floor(Math.random() * range),
                        collectedAt: new Date(),
                        source: 'nearby'
                    });
                }
                
                resolve(users);
            }, 2000);
        });
    }

    collectGroupMembers(groupLink, method) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = [];
                const count = method === 'all' ? 200 : 100;
                
                for (let i = 0; i < count; i++) {
                    users.push({
                        id: `user_${Date.now()}_${i}`,
                        username: `group_member_${i}`,
                        phone: `+79${Math.random().toString().slice(2, 11)}`,
                        group: groupLink,
                        activity: Math.random() > 0.3 ? 'active' : 'inactive',
                        collectedAt: new Date(),
                        source: 'group'
                    });
                }
                
                resolve(users);
            }, 3000);
        });
    }

    filterUsers(criteria) {
        return this.collectedUsers.filter(user => {
            if (criteria.source && user.source !== criteria.source) return false;
            if (criteria.minDistance && user.distance < criteria.minDistance) return false;
            if (criteria.maxDistance && user.distance > criteria.maxDistance) return false;
            if (criteria.activity && user.activity !== criteria.activity) return false;
            return true;
        });
    }

    exportUsers(format = 'json') {
        let content = '';
        
        switch (format) {
            case 'json':
                content = JSON.stringify(this.collectedUsers, null, 2);
                break;
            case 'csv':
                content = this.convertToCSV(this.collectedUsers);
                break;
            case 'txt':
                content = this.convertToText(this.collectedUsers);
                break;
        }

        this.downloadFile(content, `collected_users_${Date.now()}.${format}`, `text/${format}`);
    }

    convertToCSV(users) {
        if (users.length === 0) return '';
        
        const headers = Object.keys(users[0]).join(',');
        const rows = users.map(user => Object.values(user).join(','));
        
        return [headers, ...rows].join('\n');
    }

    convertToText(users) {
        return users.map(user => 
            `用户名: ${user.username} | 手机: ${user.phone} | 来源: ${user.source} | 时间: ${user.collectedAt}`
        ).join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// 初始化用户采集器
const userCollector = new UserCollector();5