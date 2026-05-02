import React, { useEffect, useState } from 'react';
import { gameApi, authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [crafting, setCrafting] = useState(null);
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await gameApi.getRecipes();
      setRecipes(response.data);
    } catch (err) {
      console.error('获取配方失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCraft = async (recipe) => {
    if (!recipe.can_craft || crafting) return;
    
    setCrafting(recipe.id);
    try {
      const response = await gameApi.craft(recipe.id);
      updateUser(response.data.user);
      showToast(response.data.message, 'success');
      fetchRecipes();
    } catch (err) {
      showToast(err.response?.data?.error || '合成失败', 'error');
    } finally {
      setCrafting(null);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getRarityColor = (rarity) => {
    const colors = {
      'common': '#a0aec0',
      'uncommon': '#48bb78',
      'rare': '#4299e1',
      'epic': '#9f7aea',
      'legendary': '#ed8936',
    };
    return colors[rarity] || '#a0aec0';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📜 合成配方</h2>
        
        {recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <h3>暂无配方</h3>
          </div>
        ) : (
          <div className="grid grid-2">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`recipe-card ${!recipe.is_unlocked ? 'locked' : ''}`}
              >
                <div className="recipe-header">
                  <div className="recipe-name">
                    {recipe.name}
                    {!recipe.is_unlocked && (
                      <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#e53e3e' }}>
                        🔒 等级不足
                      </span>
                    )}
                  </div>
                  <span className="recipe-level">Lv.{recipe.unlocked_level}</span>
                </div>

                <div className="recipe-result">
                  <div className="result-label">合成产物</div>
                  <div className="result-name" style={{ color: getRarityColor(recipe.result_item_rarity) }}>
                    {recipe.result_item_name} x{recipe.result_count}
                  </div>
                </div>

                <div className="recipe-ingredients">
                  <div style={{ marginBottom: '12px', fontWeight: '600', color: '#4a5568' }}>
                    所需材料:
                  </div>
                  {recipe.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="ingredient">
                      <div className="ingredient-name">
                        {ingredient.item_name}
                      </div>
                      <div className={`ingredient-count ${ingredient.user_count >= ingredient.required_count ? 'sufficient' : 'insufficient'}`}>
                        {ingredient.user_count} / {ingredient.required_count}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className={`btn ${recipe.can_craft ? 'btn-success' : 'btn-secondary'}`}
                  style={{ width: '100%' }}
                  disabled={!recipe.can_craft || crafting === recipe.id}
                  onClick={() => handleCraft(recipe)}
                >
                  {crafting === recipe.id 
                    ? '合成中...' 
                    : recipe.is_unlocked 
                      ? (recipe.can_craft ? '立即合成' : '材料不足')
                      : `需要 Lv.${recipe.unlocked_level}`
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Recipes;
