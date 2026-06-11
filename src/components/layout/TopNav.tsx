import { useState, useEffect } from 'react';
import { Search, Bell, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

export default function TopNav() {
  const navigate = useNavigate();
  const { entities, getUnreadPushCount, setSelectedEntity } = useAppStore();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const unread = getUnreadPushCount();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const suggestions = query.trim()
    ? entities
        .filter(
          (e) =>
            e.name.toLowerCase().includes(query.toLowerCase()) ||
            (e.description && e.description.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 6)
    : [];

  const onSelect = (entityId: string) => {
    const e = entities.find((x) => x.id === entityId);
    if (e) setSelectedEntity(e);
    setQuery('');
    setShowSuggestions(false);
    navigate(`/entity/${entityId}`);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gold-500/10 bg-finance-800/70 px-6 backdrop-blur-xl">
      <div className="relative flex-1 max-w-xl">
        <div className="flex items-center gap-2 rounded-md border border-gold-500/15 bg-finance-900/60 px-3.5 py-2 focus-within:border-gold-500/40">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            id="global-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="搜索上市公司、高管、机构、概念、事件..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
          <div className="flex items-center gap-1 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-gold-500/20 bg-finance-800/95 shadow-xl backdrop-blur-xl animate-fade-in-up">
            {suggestions.map((e) => (
              <button
                key={e.id}
                onMouseDown={() => onSelect(e.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gold-500/10"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-medium ${
                    e.type === 'company'
                      ? 'bg-blue-500/15 text-blue-300'
                      : e.type === 'person'
                        ? 'bg-purple-500/15 text-purple-300'
                        : e.type === 'institution'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  {e.type === 'company'
                    ? '公司'
                    : e.type === 'person'
                      ? '人物'
                      : e.type === 'institution'
                        ? '机构'
                        : '概念'}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{e.name}</p>
                  {e.description && (
                    <p className="truncate text-xs text-slate-500">{e.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/subscriptions')}
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-gold-500/10 bg-finance-900/50 text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal-danger px-1 text-[10px] font-bold text-white animate-pulse">
              {unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
