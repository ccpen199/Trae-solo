import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Appliance, Task, BudgetEntry, Recipe, InventoryItem, RepairRecord, ActiveTab } from '../types';
import { mockAppliances, mockTasks, mockBudgetEntries, mockRecipes, mockInventory, mockRepairRecords } from '../data/mockData';

interface StorageData {
  version: number;
  appliances: Appliance[];
  tasks: Task[];
  budgetEntries: BudgetEntry[];
  recipes: Recipe[];
  inventory: InventoryItem[];
  repairs: RepairRecord[];
}

const STORAGE_KEY = 'smart_home_manager_data';
const CURRENT_DATA_VERSION = 2;

const isValidRecipe = (recipe: any): recipe is Recipe => {
  if (!recipe || typeof recipe !== 'object') return false;
  if (typeof recipe.id !== 'string' || !recipe.id) return false;
  if (typeof recipe.name !== 'string' || !recipe.name) return false;
  if (!Array.isArray(recipe.ingredients)) return false;
  if (typeof recipe.instructions !== 'string') return false;
  if (!['easy', 'medium', 'hard'].includes(recipe.difficulty)) return false;
  if (typeof recipe.favorite !== 'boolean') return false;
  return true;
};

const isValidAppliance = (appliance: any): appliance is Appliance => {
  if (!appliance || typeof appliance !== 'object') return false;
  if (typeof appliance.id !== 'string' || !appliance.id) return false;
  if (typeof appliance.name !== 'string' || !appliance.name) return false;
  return true;
};

const isValidTask = (task: any): task is Task => {
  if (!task || typeof task !== 'object') return false;
  if (typeof task.id !== 'string' || !task.id) return false;
  if (typeof task.title !== 'string' || !task.title) return false;
  return true;
};

const isValidBudgetEntry = (entry: any): entry is BudgetEntry => {
  if (!entry || typeof entry !== 'object') return false;
  if (typeof entry.id !== 'string' || !entry.id) return false;
  return true;
};

const isValidInventoryItem = (item: any): item is InventoryItem => {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || !item.id) return false;
  return true;
};

const isValidRepairRecord = (record: any): record is RepairRecord => {
  if (!record || typeof record !== 'object') return false;
  if (typeof record.id !== 'string' || !record.id) return false;
  return true;
};

const migrateRecipe = (recipe: any): Recipe => {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: recipe.id || Math.random().toString(36).substr(2, 9),
    name: recipe.name || '未命名菜谱',
    category: recipe.category || '家常菜',
    cuisine: recipe.cuisine || undefined,
    prepTime: typeof recipe.prepTime === 'number' ? recipe.prepTime : 10,
    cookTime: typeof recipe.cookTime === 'number' ? recipe.cookTime : 20,
    servings: typeof recipe.servings === 'number' ? recipe.servings : 2,
    calories: typeof recipe.calories === 'number' ? recipe.calories : undefined,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: recipe.instructions || '',
    applianceIds: Array.isArray(recipe.applianceIds) ? recipe.applianceIds : [],
    equipment: Array.isArray(recipe.equipment) ? recipe.equipment : undefined,
    difficulty: ['easy', 'medium', 'hard'].includes(recipe.difficulty) ? recipe.difficulty : 'easy',
    tags: Array.isArray(recipe.tags) ? recipe.tags : undefined,
    favorite: typeof recipe.favorite === 'boolean' ? recipe.favorite : false,
    createdAt: recipe.createdAt || today,
  };
};

const loadFromStorage = (): StorageData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as any;
      
      if (!parsed) return null;
      
      const version = typeof parsed.version === 'number' ? parsed.version : 0;
      
      if (version < CURRENT_DATA_VERSION) {
        console.log(`数据版本旧 (v${version})，使用默认数据...`);
        return null;
      }
      
      let recipes: Recipe[] = [];
      if (Array.isArray(parsed.recipes)) {
        recipes = parsed.recipes.filter(isValidRecipe).map(migrateRecipe);
      }
      
      const appliances: Appliance[] = Array.isArray(parsed.appliances) 
        ? parsed.appliances.filter(isValidAppliance) 
        : [];
      
      const tasks: Task[] = Array.isArray(parsed.tasks) 
        ? parsed.tasks.filter(isValidTask) 
        : [];
      
      const budgetEntries: BudgetEntry[] = Array.isArray(parsed.budgetEntries) 
        ? parsed.budgetEntries.filter(isValidBudgetEntry) 
        : [];
      
      const inventory: InventoryItem[] = Array.isArray(parsed.inventory) 
        ? parsed.inventory.filter(isValidInventoryItem) 
        : [];
      
      const repairs: RepairRecord[] = Array.isArray(parsed.repairs) 
        ? parsed.repairs.filter(isValidRepairRecord) 
        : [];
      
      return {
        version: CURRENT_DATA_VERSION,
        appliances,
        tasks,
        budgetEntries,
        recipes,
        inventory,
        repairs,
      };
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return null;
};

const saveToStorage = (data: StorageData) => {
  try {
    const dataWithVersion = {
      ...data,
      version: CURRENT_DATA_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithVersion));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

interface HomeContextType {
  appliances: Appliance[];
  tasks: Task[];
  budgetEntries: BudgetEntry[];
  recipes: Recipe[];
  inventory: InventoryItem[];
  repairs: RepairRecord[];
  activeTab: ActiveTab;
  
  setActiveTab: (tab: ActiveTab) => void;
  
  addAppliance: (appliance: Omit<Appliance, 'id'>) => void;
  updateAppliance: (id: string, appliance: Partial<Appliance>) => void;
  deleteAppliance: (id: string) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addBudgetEntry: (entry: Omit<BudgetEntry, 'id'>) => void;
  updateBudgetEntry: (id: string, entry: Partial<BudgetEntry>) => void;
  deleteBudgetEntry: (id: string) => void;
  
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lowStock'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  
  addRepairRecord: (record: Omit<RepairRecord, 'id'>) => void;
  updateRepairRecord: (id: string, record: Partial<RepairRecord>) => void;
  deleteRepairRecord: (id: string) => void;
  
  exportData: (format: 'json' | 'csv') => void;
  importData: (data: string) => boolean;
  resetData: () => void;
  getReminders: () => { type: string; message: string; date?: string }[];
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const HomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedData = loadFromStorage();
  
  const [appliances, setAppliances] = useState<Appliance[]>(
    storedData && storedData.appliances.length > 0 ? storedData.appliances : mockAppliances
  );
  const [tasks, setTasks] = useState<Task[]>(
    storedData && storedData.tasks.length > 0 ? storedData.tasks : mockTasks
  );
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>(
    storedData && storedData.budgetEntries.length > 0 ? storedData.budgetEntries : mockBudgetEntries
  );
  const [recipes, setRecipes] = useState<Recipe[]>(
    storedData && storedData.recipes.length > 0 ? storedData.recipes : mockRecipes
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(
    storedData && storedData.inventory.length > 0 ? storedData.inventory : mockInventory
  );
  const [repairs, setRepairs] = useState<RepairRecord[]>(
    storedData && storedData.repairs.length > 0 ? storedData.repairs : mockRepairRecords
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  useEffect(() => {
    saveToStorage({
      version: CURRENT_DATA_VERSION,
      appliances,
      tasks,
      budgetEntries,
      recipes,
      inventory,
      repairs,
    });
  }, [appliances, tasks, budgetEntries, recipes, inventory, repairs]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addAppliance = useCallback((appliance: Omit<Appliance, 'id'>) => {
    setAppliances(prev => [...prev, { ...appliance, id: generateId() }]);
  }, []);

  const updateAppliance = useCallback((id: string, appliance: Partial<Appliance>) => {
    setAppliances(prev => prev.map(a => a.id === id ? { ...a, ...appliance } : a));
  }, []);

  const deleteAppliance = useCallback((id: string) => {
    setAppliances(prev => prev.filter(a => a.id !== id));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [...prev, { ...task, id: generateId(), createdAt: new Date().toISOString().split('T')[0] }]);
  }, []);

  const updateTask = useCallback((id: string, task: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...task } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const addBudgetEntry = useCallback((entry: Omit<BudgetEntry, 'id'>) => {
    setBudgetEntries(prev => [...prev, { ...entry, id: generateId() }]);
  }, []);

  const updateBudgetEntry = useCallback((id: string, entry: Partial<BudgetEntry>) => {
    setBudgetEntries(prev => prev.map(b => b.id === id ? { ...b, ...entry } : b));
  }, []);

  const deleteBudgetEntry = useCallback((id: string) => {
    setBudgetEntries(prev => prev.filter(b => b.id !== id));
  }, []);

  const addRecipe = useCallback((recipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    setRecipes(prev => [...prev, { ...recipe, id: generateId(), createdAt: new Date().toISOString().split('T')[0] }]);
  }, []);

  const updateRecipe = useCallback((id: string, recipe: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...recipe } : r));
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  }, []);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'lowStock'>) => {
    const lowStock = item.quantity <= item.minStock;
    setInventory(prev => [...prev, { ...item, id: generateId(), lowStock }]);
  }, []);

  const updateInventoryItem = useCallback((id: string, item: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, ...item };
        return { ...updated, lowStock: updated.quantity <= updated.minStock };
      }
      return i;
    }));
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  }, []);

  const addRepairRecord = useCallback((record: Omit<RepairRecord, 'id'>) => {
    setRepairs(prev => [...prev, { ...record, id: generateId() }]);
  }, []);

  const updateRepairRecord = useCallback((id: string, record: Partial<RepairRecord>) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...record } : r));
  }, []);

  const deleteRepairRecord = useCallback((id: string) => {
    setRepairs(prev => prev.filter(r => r.id !== id));
  }, []);

  const exportData = useCallback((format: 'json' | 'csv') => {
    const data: StorageData = {
      version: CURRENT_DATA_VERSION,
      appliances,
      tasks,
      budgetEntries,
      recipes,
      inventory,
      repairs,
    };

    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart_home_data_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let csv = '\uFEFF';
      csv += '数据类型,ID,名称/标题,详细信息,日期,金额/数量\n';
      
      appliances.forEach(a => {
        csv += `家电,${a.id},${a.name},${a.brand} ${a.model},${a.purchaseDate},¥${a.purchasePrice}\n`;
      });
      
      tasks.forEach(t => {
        csv += `任务,${t.id},${t.title},${t.description || ''},${t.dueDate || ''},\n`;
      });
      
      budgetEntries.forEach(b => {
        csv += `支出,${b.id},${b.description},${b.category},${b.date},¥${b.amount}\n`;
      });
      
      recipes.forEach(r => {
        csv += `菜谱,${r.id},${r.name},${r.category},${r.createdAt},\n`;
      });
      
      inventory.forEach(i => {
        csv += `库存,${i.id},${i.name},${i.category},${i.purchaseDate || ''},${i.quantity} ${i.unit}\n`;
      });
      
      repairs.forEach(r => {
        csv += `维修记录,${r.id},${r.title},${r.description},${r.date},¥${r.cost}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart_home_data_${dateStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [appliances, tasks, budgetEntries, recipes, inventory, repairs]);

  const importData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data) as Partial<StorageData>;
      
      if (parsed.appliances) setAppliances(parsed.appliances);
      if (parsed.tasks) setTasks(parsed.tasks);
      if (parsed.budgetEntries) setBudgetEntries(parsed.budgetEntries);
      if (parsed.recipes) setRecipes(parsed.recipes);
      if (parsed.inventory) setInventory(parsed.inventory);
      if (parsed.repairs) setRepairs(parsed.repairs);
      
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }, []);

  const resetData = useCallback(() => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
      setAppliances(mockAppliances);
      setTasks(mockTasks);
      setBudgetEntries(mockBudgetEntries);
      setRecipes(mockRecipes);
      setInventory(mockInventory);
      setRepairs(mockRepairRecords);
    }
  }, []);

  const getReminders = useCallback((): { type: string; message: string; date?: string }[] => {
    const reminders: { type: string; message: string; date?: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(task => {
      if (task.status !== 'completed' && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 3 && diffDays >= 0) {
          reminders.push({
            type: 'task',
            message: `任务 "${task.title}" ${diffDays === 0 ? '今天' : `还有${diffDays}天`}到期`,
            date: task.dueDate,
          });
        }
      }
    });

    appliances.forEach(appliance => {
      if (appliance.nextMaintenanceDate) {
        const maintenanceDate = new Date(appliance.nextMaintenanceDate);
        const diffDays = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 14 && diffDays >= 0) {
          reminders.push({
            type: 'maintenance',
            message: `设备 "${appliance.name}" ${diffDays === 0 ? '今天' : `还有${diffDays}天`}需要维护`,
            date: appliance.nextMaintenanceDate,
          });
        }
      }
    });

    inventory.forEach(item => {
      if (item.lowStock) {
        reminders.push({
          type: 'inventory',
          message: `库存 "${item.name}" 不足，当前: ${item.quantity} ${item.unit}，最低: ${item.minStock} ${item.unit}`,
        });
      }
      
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7 && diffDays >= 0) {
          reminders.push({
            type: 'expiry',
            message: `库存 "${item.name}" ${diffDays === 0 ? '今天' : `还有${diffDays}天`}过期`,
            date: item.expiryDate,
          });
        }
      }
    });

    repairs.forEach(repair => {
      if (repair.status !== 'completed' && repair.nextCheckDate) {
        const checkDate = new Date(repair.nextCheckDate);
        const diffDays = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 14 && diffDays >= 0) {
          reminders.push({
            type: 'repair',
            message: `维修记录 "${repair.title}" ${diffDays === 0 ? '今天' : `还有${diffDays}天`}需要复查`,
            date: repair.nextCheckDate,
          });
        }
      }
    });

    return reminders;
  }, [tasks, appliances, inventory, repairs]);

  return (
    <HomeContext.Provider
      value={{
        appliances,
        tasks,
        budgetEntries,
        recipes,
        inventory,
        repairs,
        activeTab,
        setActiveTab,
        addAppliance,
        updateAppliance,
        deleteAppliance,
        addTask,
        updateTask,
        deleteTask,
        addBudgetEntry,
        updateBudgetEntry,
        deleteBudgetEntry,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addRepairRecord,
        updateRepairRecord,
        deleteRepairRecord,
        exportData,
        importData,
        resetData,
        getReminders,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export const useHomeContext = () => {
  const context = useContext(HomeContext);
  if (context === undefined) {
    throw new Error('useHomeContext must be used within a HomeProvider');
  }
  return context;
};
