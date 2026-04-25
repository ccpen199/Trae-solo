import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  ChefHat,
  Clock,
  Heart,
  Star,
  Timer,
  Users
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import type { Recipe } from '../types';

interface RecipeFormProps {
  recipe?: Recipe;
  onClose: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onClose }) => {
  const { addRecipe, updateRecipe } = useHomeContext();
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    category: recipe?.category || '',
    prepTime: recipe?.prepTime || 0,
    cookTime: recipe?.cookTime || 0,
    servings: recipe?.servings || 2,
    ingredients: recipe?.ingredients || [{ name: '', quantity: '' }],
    instructions: recipe?.instructions || '',
    applianceIds: recipe?.applianceIds || [],
    difficulty: recipe?.difficulty || 'medium' as const,
    favorite: recipe?.favorite || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      ingredients: formData.ingredients.filter(i => i.name.trim()),
    };
    if (recipe) {
      updateRecipe(recipe.id, data);
    } else {
      addRecipe(data);
    }
    onClose();
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '' }],
    }));
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    setFormData(prev => {
      const ingredients = [...prev.ingredients];
      ingredients[index] = { ...ingredients[index], [field]: value };
      return { ...prev, ingredients };
    });
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const categories = ['家常菜', '海鲜', '肉类', '蔬菜', '汤品', '甜点', '主食', '其他'];
  const difficulties = [
    { id: 'easy', label: '简单' },
    { id: 'medium', label: '中等' },
    { id: 'hard', label: '困难' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">{recipe ? '编辑菜谱' : '添加菜谱'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">菜谱名称 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：红烧肉"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {difficulties.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">准备时间 (分钟)</label>
              <input
                type="number"
                min="0"
                value={formData.prepTime || ''}
                onChange={e => setFormData(prev => ({ ...prev, prepTime: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">烹饪时间 (分钟)</label>
              <input
                type="number"
                min="0"
                value={formData.cookTime || ''}
                onChange={e => setFormData(prev => ({ ...prev, cookTime: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">份量 (人份)</label>
              <input
                type="number"
                min="1"
                value={formData.servings || ''}
                onChange={e => setFormData(prev => ({ ...prev, servings: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">食材</label>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={e => updateIngredient(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="食材名称"
                  />
                  <input
                    type="text"
                    value={ingredient.quantity}
                    onChange={e => updateIngredient(index, 'quantity', e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="用量"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                添加食材
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">烹饪步骤</label>
            <textarea
              value={formData.instructions}
              onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder="1. 第一步...&#10;2. 第二步..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite"
              checked={formData.favorite}
              onChange={e => setFormData(prev => ({ ...prev, favorite: e.target.checked }))}
              className="w-4 h-4 text-red-600 rounded"
            />
            <label htmlFor="favorite" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Heart className="w-4 h-4" />
              加入收藏
            </label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {recipe ? '保存修改' : '添加菜谱'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecipeDetail: React.FC<{ recipe: Recipe; onClose: () => void }> = ({ recipe, onClose }) => {
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{recipe.name}</h3>
              <div className="flex items-center gap-2">
                {recipe.favorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                  {getDifficultyLabel(recipe.difficulty)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <Timer className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-xs text-gray-500">准备时间</p>
              <p className="font-medium">{recipe.prepTime}分钟</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-xs text-gray-500">烹饪时间</p>
              <p className="font-medium">{recipe.cookTime}分钟</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-xs text-gray-500">份量</p>
              <p className="font-medium">{recipe.servings}人份</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              食材清单
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {recipe.ingredients.length > 0 ? (
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{ingredient.name}</span>
                      <span className="text-gray-500">{ingredient.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">暂无食材记录</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-500" />
              烹饪步骤
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line">{recipe.instructions || '暂无步骤说明'}</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RecipesView: React.FC<{ showAddForm: boolean; onCloseForm: () => void }> = ({ showAddForm, onCloseForm }) => {
  const { recipes, updateRecipe, deleteRecipe } = useHomeContext();
  const [filter, setFilter] = useState<'all' | 'favorite'>('all');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  const filteredRecipes = recipes.filter(r => filter === 'all' || r.favorite);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">简单</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">中等</span>;
      case 'hard':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">困难</span>;
      default:
        return null;
    }
  };

  const totalTime = (prep: number, cook: number) => prep + cook;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          全部 ({recipes.length})
        </button>
        <button
          onClick={() => setFilter('favorite')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filter === 'favorite'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          收藏 ({recipes.filter(r => r.favorite).length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingRecipe(recipe)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{recipe.name}</h4>
                      {recipe.category && (
                        <p className="text-xs text-gray-500">{recipe.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {recipe.favorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                    {getDifficultyBadge(recipe.difficulty)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    总时间 {totalTime(recipe.prepTime, recipe.cookTime)}分钟
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {recipe.servings}人份
                  </span>
                </div>
                
                {recipe.ingredients.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">主要食材：</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.slice(0, 3).map((ing, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {ing.name}
                        </span>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <span className="text-xs text-gray-400">+{recipe.ingredients.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateRecipe(recipe.id, { favorite: !recipe.favorite });
                    }}
                    className={`flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      recipe.favorite 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${recipe.favorite ? 'fill-red-500' : ''}`} />
                    收藏
                  </button>
                  <button
                    onClick={() => setEditingRecipe(recipe)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无菜谱</p>
            <p className="text-sm mt-1">点击右上角"添加"按钮添加新菜谱</p>
          </div>
        )}
      </div>

      {showAddForm && <RecipeForm onClose={onCloseForm} />}
      {editingRecipe && (
        <RecipeForm recipe={editingRecipe} onClose={() => setEditingRecipe(null)} />
      )}
      {viewingRecipe && (
        <RecipeDetail recipe={viewingRecipe} onClose={() => setViewingRecipe(null)} />
      )}
    </div>
  );
};
