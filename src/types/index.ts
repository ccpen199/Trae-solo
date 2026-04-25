export interface Appliance {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  purchaseDate: string;
  purchasePrice: number;
  warrantyMonths: number;
  location: string;
  status: 'active' | 'maintenance' | 'inactive';
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'appliance' | 'cleaning' | 'shopping' | 'other';
  applianceId?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  reminder?: boolean;
  reminderDate?: string;
}

export interface BudgetEntry {
  id: string;
  category: 'purchase' | 'maintenance' | 'replacement' | 'utility' | 'other';
  amount: number;
  description: string;
  date: string;
  applianceId?: string;
  receiptUrl?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: {
    name: string;
    quantity: string;
  }[];
  instructions: string;
  applianceIds: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  favorite: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'food' | 'supplies' | 'parts' | 'other';
  quantity: number;
  unit: string;
  minStock: number;
  location: string;
  purchaseDate?: string;
  expiryDate?: string;
  notes?: string;
  lowStock: boolean;
}

export interface RepairRecord {
  id: string;
  applianceId: string;
  title: string;
  description: string;
  date: string;
  technician: string;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed';
  warranty: boolean;
  warrantyDetails?: string;
  nextCheckDate?: string;
  notes?: string;
  receiptUrl?: string;
}

export type ActiveTab = 'dashboard' | 'tasks' | 'appliances' | 'budget' | 'recipes' | 'inventory' | 'repairs';
