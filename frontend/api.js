const API = {
    async submitScore(playerName, score, level) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName,
                    score,
                    level
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '提交分数失败');
            }
            
            return data;
        } catch (error) {
            console.error('提交分数错误:', error);
            throw error;
        }
    },
    
    async getLeaderboard(limit = 50) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/scores/leaderboard?limit=${limit}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '获取排行榜失败');
            }
            
            return data;
        } catch (error) {
            console.error('获取排行榜错误:', error);
            throw error;
        }
    },
    
    async checkHealth() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/health`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('健康检查失败:', error);
            throw error;
        }
    }
};
