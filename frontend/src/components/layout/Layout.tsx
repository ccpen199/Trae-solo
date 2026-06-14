import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { initMockIfEmpty } from '@/db/mockData';
import { useBookStore } from '@/stores/bookStore';
import { useTimerStore } from '@/stores/timerStore';
import { useNoteStore } from '@/stores/noteStore';
import { useEntityStore } from '@/stores/entityStore';

export default function Layout() {
  const { sidebarCollapsed } = useUIStore();
  const loadBooks = useBookStore(s => s.loadBooks);
  const loadTags = useBookStore(s => s.loadTags);
  const loadRecentSessions = useTimerStore(s => s.loadRecentSessions);
  const loadNotes = useNoteStore(s => s.loadNotes);
  const buildGraphData = useEntityStore(s => s.buildGraphData);

  useEffect(() => {
    async function init() {
      await initMockIfEmpty();
      await Promise.all([
        loadBooks(),
        loadTags(),
        loadRecentSessions(),
        loadNotes(),
        buildGraphData(),
      ]);
    }
    init();
  }, []);

  return (
    <div className="min-h-screen bg-parchment-50">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[220px]'
        )}
      >
        <div className="p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
