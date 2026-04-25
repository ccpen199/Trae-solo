import React, { useState, useMemo, useCallback } from 'react';
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
  Users,
  Search,
  Filter,
  Flame,
  UtensilsCrossed,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import type { Recipe, Task } from '../types';

const categories = [
  { id: 'all', label: '全部', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'favorite', label: '收藏', icon: <Heart className="w-4 h-4" /> },
  { id: 'recent', label: '最近', icon: <Clock className="w-4 h-4" /> },
];

const cuisineCategories = [
  { id: 'all', label: '全部菜系' },
  { id: '川菜', label: '川菜' },
  { id: '粤菜', label: '粤菜' },
  { id: '鲁菜', label: '鲁菜' },
  { id: '湘菜', label: '湘菜' },
  { id: '家常菜', label: '家常菜' },
];

const ingredientCategories = [
  { id: 'all', label: '全部食材' },
  { id: '海鲜', label: '海鲜' },
  { id: '肉类', label: '肉类' },
  { id: '蔬菜', label: '蔬菜' },
  { id: '豆制品', label: '豆制品' },
  { id: '主食', label: '主食' },
];

const difficultyFilters = [
  { id: 'all', label: '全部难度' },
  { id: 'easy', label: '简单' },
  { id: 'medium', label: '中等' },
  { id: 'hard', label: '困难' },
];

const timeFilters = [
  { id: 'all', label: '全部时间' },
  { id: 'quick', label: '快手菜 (<30分钟)' },
  { id: 'normal', label: '正常 (30-60分钟)' },
  { id: 'long', label: '耗时 (>60分钟)' },
];

interface RecipeFormProps {
  recipe?: Recipe;
  onClose: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onClose }) => {
  const { addRecipe, updateRecipe } = useHomeContext();
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    category: recipe?.category || '',
    cuisine: recipe?.cuisine || '',
    prepTime: recipe?.prepTime || 0,
    cookTime: recipe?.cookTime || 0,
    servings: recipe?.servings || 2,
    calories: recipe?.calories || 0,
    ingredients: recipe?.ingredients || [{ name: '', quantity: '' }],
    instructions: recipe?.instructions || '',
    applianceIds: recipe?.applianceIds || [],
    equipment: recipe?.equipment || [],
    difficulty: recipe?.difficulty || 'medium' as const,
    tags: recipe?.tags || [],
    favorite: recipe?.favorite || false,
  });
  const [tagInput, setTagInput] = useState('');

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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag),
    }));
  };

  const categoriesList = ['家常菜', '海鲜', '肉类', '蔬菜', '豆制品', '主食', '汤品', '甜点', '其他'];
  const cuisinesList = ['川菜', '粤菜', '鲁菜', '湘菜', '家常菜', '其他'];
  const difficultiesList = [
    { id: 'easy', label: '简单' },
    { id: 'medium', label: '中等' },
    { id: 'hard', label: '困难' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">食材分类</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">菜系</label>
              <select
                value={formData.cuisine}
                onChange={e => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                {cuisinesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {difficultiesList.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预估热量 (卡路里/份)</label>
              <input
                type="number"
                min="0"
                value={formData.calories || ''}
                onChange={e => setFormData(prev => ({ ...prev, calories: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：350"
              />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入标签后回车添加"
              />
              <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                添加
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

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onCook: (recipe: Recipe) => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onClose, onCook }) => {
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

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-2xl">
              🍽️
            </div>
            <div>
              <h3 className="text-lg font-semibold">{recipe.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {recipe.cuisine && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {recipe.cuisine}
                  </span>
                )}
                {recipe.category && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {recipe.category}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                  {getDifficultyLabel(recipe.difficulty)}
                </span>
                {recipe.favorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-5">
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <Timer className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-gray-500">准备时间</p>
              <p className="font-semibold text-gray-800">{recipe.prepTime}分钟</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-gray-500">烹饪时间</p>
              <p className="font-semibold text-gray-800">{recipe.cookTime}分钟</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-gray-500">总时间</p>
              <p className="font-semibold text-gray-800">{totalTime}分钟</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-xs text-gray-500">份量</p>
              <p className="font-semibold text-gray-800">{recipe.servings}人份</p>
            </div>
          </div>
          
          {recipe.calories && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-700">
                预估热量：<span className="font-semibold">{recipe.calories}</span> 卡路里/份
              </span>
            </div>
          )}
          
          {recipe.tags && recipe.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">标签</h4>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {recipe.equipment && recipe.equipment.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">使用厨具</h4>
              <div className="flex flex-wrap gap-2">
                {recipe.equipment.map(equip => (
                  <span key={equip} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm flex items-center gap-1">
                    <UtensilsCrossed className="w-3 h-3" />
                    {equip}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              食材清单 ({recipe.ingredients.length}种)
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {recipe.ingredients.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex justify-between p-2 bg-white rounded-lg">
                      <span className="text-gray-800">{ingredient.name}</span>
                      <span className="text-gray-500 text-sm">{ingredient.quantity}</span>
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
              <ChefHat className="w-5 h-5 text-orange-500" />
              烹饪步骤
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {recipe.instructions || '暂无步骤说明'}
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">烹饪后设备维护提醒</p>
                <p className="text-xs text-blue-600 mt-1">
                  开始烹饪后，系统会根据您使用的厨具自动生成维护任务（如油烟机清洁、炒锅保养等）
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={() => onCook(recipe)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Flame className="w-5 h-5" />
              开始烹饪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CookingMaintenanceSuggestion {
  applianceCategory: string;
  taskTitle: string;
  taskDescription: string;
  priority: 'low' | 'medium' | 'high';
  dueDays: number;
}

const maintenanceSuggestions: CookingMaintenanceSuggestion[] = [
  {
    applianceCategory: '油烟机',
    taskTitle: '清洁油烟机',
    taskDescription: '烹饪后油烟机油污累积，建议进行清洁保养',
    priority: 'medium',
    dueDays: 3,
  },
  {
    applianceCategory: '炒锅',
    taskTitle: '炒锅保养',
    taskDescription: '炒锅使用后需要清洁和保养，延长使用寿命',
    priority: 'low',
    dueDays: 1,
  },
  {
    applianceCategory: '蒸锅',
    taskTitle: '蒸锅清洁',
    taskDescription: '蒸锅使用后需要清洁水垢和残留物',
    priority: 'low',
    dueDays: 1,
  },
  {
    applianceCategory: '冰箱',
    taskTitle: '检查冰箱食材',
    taskDescription: '检查冰箱内食材新鲜度，清理过期食材',
    priority: 'medium',
    dueDays: 7,
  },
];

export const RecipesView: React.FC<{ showAddForm: boolean; onCloseForm: () => void }> = ({ showAddForm, onCloseForm }) => {
  const { recipes, appliances, updateRecipe, deleteRecipe, addTask } = useHomeContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);

  const filteredRecipes = useMemo(() => {
    let result = [...recipes];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(query)) ||
        r.tags?.some(t => t.toLowerCase().includes(query)) ||
        r.category?.toLowerCase().includes(query) ||
        r.cuisine?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory === 'favorite') {
      result = result.filter(r => r.favorite);
    } else if (selectedCategory === 'recent') {
      result = result.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    if (selectedCuisine !== 'all') {
      result = result.filter(r => r.cuisine === selectedCuisine);
    }
    
    if (selectedIngredientCategory !== 'all') {
      result = result.filter(r => r.category === selectedIngredientCategory);
    }
    
    if (selectedDifficulty !== 'all') {
      result = result.filter(r => r.difficulty === selectedDifficulty);
    }
    
    if (selectedTime === 'quick') {
      result = result.filter(r => r.prepTime + r.cookTime < 30);
    } else if (selectedTime === 'normal') {
      result = result.filter(r => {
        const total = r.prepTime + r.cookTime;
        return total >= 30 && total < 60;
      });
    } else if (selectedTime === 'long') {
      result = result.filter(r => r.prepTime + r.cookTime >= 60);
    }
    
    return result;
  }, [
    recipes, searchQuery, selectedCategory, selectedCuisine, 
    selectedIngredientCategory, selectedDifficulty, selectedTime
  ]);

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

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  const handleStartCooking = useCallback((recipe: Recipe) => {
    setCookingRecipe(recipe);
    setViewingRecipe(null);
    
    const tasks: Task[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    if (recipe.equipment && recipe.equipment.length > 0) {
      recipe.equipment.forEach(equip => {
        const suggestion = maintenanceSuggestions.find(s => 
          equip.includes(s.applianceCategory) || 
          s.applianceCategory.includes(equip)
        );
        
        if (suggestion) {
          const relatedAppliance = appliances.find(a => 
            a.name.includes(suggestion.applianceCategory) ||
            a.category === suggestion.applianceCategory
          );
          
          tasks.push({
            id: `maintenance-${Date.now()}-${Math.random()}`,
            title: suggestion.taskTitle,
            description: `${recipe.name}烹饪完成后，${suggestion.taskDescription}`,
            category: 'appliance',
            applianceId: relatedAppliance?.id,
            dueDate: addDays(new Date(), suggestion.dueDays),
            priority: suggestion.priority,
            status: 'pending',
            createdAt: today,
            reminder: true,
            reminderDate: addDays(new Date(), Math.max(0, suggestion.dueDays - 1)),
          });
        }
      });
    }
    
    if (tasks.length === 0) {
      const defaultTask: Task = {
        id: `maintenance-${Date.now()}`,
        title: '厨房设备清洁检查',
        description: `完成${recipe.name}的烹饪后，检查厨房设备是否需要清洁`,
        category: 'cleaning',
        dueDate: addDays(new Date(), 1),
        priority: 'low',
        status: 'pending',
        createdAt: today,
        reminder: true,
        reminderDate: addDays(new Date(), 0),
      };
      tasks.push(defaultTask);
    }
    
    setGeneratedTasks(tasks);
    setShowMaintenanceModal(true);
  }, [appliances]);

  const confirmMaintenanceTasks = useCallback(() => {
    generatedTasks.forEach(task => {
      addTask(task);
    });
    setShowMaintenanceModal(false);
    setGeneratedTasks([]);
    setCookingRecipe(null);
  }, [generatedTasks, addTask]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索菜谱名称、食材、标签..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-600' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {cat.icon}
              {cat.label}
              {cat.id === 'all' && <span className="text-xs opacity-75">({recipes.length})</span>}
              {cat.id === 'favorite' && <span className="text-xs opacity-75">({recipes.filter(r => r.favorite).length})</span>}
            </button>
          ))}
        </div>
        
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">菜系</label>
                <div className="flex flex-wrap gap-2">
                  {cuisineCategories.map(cuisine => (
                    <button
                      key={cuisine.id}
                      onClick={() => setSelectedCuisine(cuisine.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCuisine === cuisine.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {cuisine.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">食材分类</label>
                <div className="flex flex-wrap gap-2">
                  {ingredientCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedIngredientCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedIngredientCategory === cat.id
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">难度</label>
                <div className="flex flex-wrap gap-2">
                  {difficultyFilters.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDifficulty(d.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedDifficulty === d.id
                          ? 'bg-orange-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">烹饪时间</label>
                <div className="flex flex-wrap gap-2">
                  {timeFilters.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTime(t.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedTime === t.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedCuisine('all');
                  setSelectedIngredientCategory('all');
                  setSelectedDifficulty('all');
                  setSelectedTime('all');
                  setSearchQuery('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                清除所有筛选
              </button>
            </div>
          </div>
        )}
      </div>

      {searchQuery && (
        <div className="text-sm text-gray-500">
          搜索 "<span className="font-medium text-gray-700">{searchQuery}</span>" 找到 {filteredRecipes.length} 个菜谱
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setViewingRecipe(recipe)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🍽️
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{recipe.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        {recipe.cuisine && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {recipe.cuisine}
                          </span>
                        )}
                        {recipe.category && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {recipe.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {recipe.favorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                    {getDifficultyBadge(recipe.difficulty)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    {totalTime(recipe.prepTime, recipe.cookTime)}分钟
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {recipe.servings}人份
                  </span>
                  {recipe.calories && (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      {recipe.calories}卡
                    </span>
                  )}
                </div>
                
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {recipe.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{recipe.tags.length - 3}</span>
                    )}
                  </div>
                )}
                
                {recipe.ingredients.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.slice(0, 4).map((ing, index) => (
                        <span key={index} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                          {ing.name}
                        </span>
                      ))}
                      {recipe.ingredients.length > 4 && (
                        <span className="text-xs text-gray-400 flex items-center">+{recipe.ingredients.length - 4}</span>
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
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700">暂无匹配的菜谱</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? '试试其他搜索关键词' : '点击右上角"添加"按钮添加新菜谱'}
            </p>
          </div>
        )}
      </div>

      {showAddForm && <RecipeForm onClose={onCloseForm} />}
      {editingRecipe && (
        <RecipeForm recipe={editingRecipe} onClose={() => setEditingRecipe(null)} />
      )}
      {viewingRecipe && (
        <RecipeDetail 
          recipe={viewingRecipe} 
          onClose={() => setViewingRecipe(null)}
          onCook={handleStartCooking}
        />
      )}
      
      {showMaintenanceModal && cookingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">烹饪完成！</h3>
                  <p className="text-sm opacity-90">{cookingRecipe.name}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">以下维护任务已自动生成：</p>
              {generatedTasks.map((task, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority === 'high' ? '高优先级' : 
                           task.priority === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                        <span className="text-xs text-gray-500">
                          截止日期：{task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setGeneratedTasks([]);
                  setCookingRecipe(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                跳过
              </button>
              <button
                onClick={confirmMaintenanceTasks}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                添加到任务列表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
