import React from 'react';
import { useNavigate } from 'react-router-dom';

function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="help-page">
      <div className="room-detail-header" style={{ padding: '20px 0' }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          ←
        </button>
        <h2>游戏帮助</h2>
      </div>

      <div className="help-section">
        <h3>🎮 游戏规则</h3>
        <p>海龟汤是一种推理游戏，又被称为"情景猜谜"。</p>
        <p>游戏方法非常简单：</p>
        <p>1. 出题者给出一个不完整的故事（汤面）</p>
        <p>2. 猜题者通过提问来验证自己对故事缺失部分的猜测</p>
        <p>3. 出题者只能用"是"、"不是"或"不重要"来回答问题</p>
        <p>4. 猜出完整故事（汤底）即为获胜</p>
      </div>

      <div className="help-section">
        <h3>🏠 创建房间规则</h3>
        <p>1. 每个房间最多可容纳 8 名玩家</p>
        <p>2. 创建房间时可选择游戏难度</p>
        <p>3. 房主可以选择故事、控制游戏进度</p>
        <p>4. 房间人数满 2 人即可开始游戏</p>
      </div>

      <div className="help-section">
        <h3>📝 编写故事规则</h3>
        <p>1. 故事需要有出人意料的反转</p>
        <p>2. 避免过于血腥或暴力的内容</p>
        <p>3. 故事需要逻辑自洽</p>
        <p>4. 提交后需要经过审核才能上线</p>
      </div>

      <div className="help-section">
        <h3>🐣 小龟汤</h3>
        <p>适合新手入门的简单题目</p>
        <p>题目特点：线索清晰，逻辑简单</p>
        <p>难度指数：⭐</p>
      </div>

      <div className="help-section">
        <h3>🐢 老龟汤</h3>
        <p>适合资深玩家的高难度题目</p>
        <p>题目特点：需要深度推理，多层反转</p>
        <p>难度指数：⭐⭐⭐</p>
      </div>

      <div className="help-section">
        <h3>🏆 积分规则</h3>
        <p>• 首次答对故事：+100 分</p>
        <p>• 参与游戏并完成：+20 分</p>
        <p>• 贡献优质故事：+200 分</p>
        <p>• 连续签到每日：+10 分</p>
      </div>
    </div>
  );
}

export default HelpPage;
