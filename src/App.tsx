import { useState } from 'react';
import { HomeProvider, useHomeContext } from './context/HomeContext';
import { Sidebar, Header } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TasksView } from './components/TasksView';
import { AppliancesView } from './components/AppliancesView';
import { BudgetView } from './components/BudgetView';
import { RecipesView } from './components/RecipesView';
import { InventoryView } from './components/InventoryView';
import { RepairsView } from './components/RepairsView';
import './index.css';

const MainContent: React.FC = () => {
  const { activeTab } = useHomeContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return (
          <TasksView 
            showAddForm={showAddForm} 
            onCloseForm={() => setShowAddForm(false)} 
          />
        );
      case 'appliances':
        return (
          <AppliancesView 
            showAddForm={showAddForm} 
            onCloseForm={() => setShowAddForm(false)} 
          />
        );
      case 'budget':
        return (
          <BudgetView 
            showAddForm={showAddForm} 
            onCloseForm={() => setShowAddForm(false)} 
          />
        );
      case 'recipes':
        return (
          <RecipesView 
            showAddForm={showAddForm} 
            onCloseForm={() => setShowAddForm(false)} 
          />
        );
      case 'inventory':
        return (
          <InventoryView 
            showAddForm={showAddForm} 
            onCloseForm={() => setShowAddForm(false)} 
          />
        );
      case 'repairs':
        return (
          <RepairsView 
            showAddForm={showAddForm} 
            onCloseForm={() => setShowAddForm(false)} 
          />
        );
      default:
        return <Dashboard />;
    }
  };

  const handleAddClick = () => {
    setShowAddForm(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onAddClick={handleAddClick}
        />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <HomeProvider>
      <MainContent />
    </HomeProvider>
  );
}

export default App;
