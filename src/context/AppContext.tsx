import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Team, CheckInRecord, PracticeLog, CreditProgress } from '../types';
import { mockTeams, mockCheckIns, mockLogs } from '../data/mockData';

interface AppContextType {
  teams: Team[];
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;

  checkIns: CheckInRecord[];
  addCheckIn: (record: Omit<CheckInRecord, 'id'>) => void;

  logs: PracticeLog[];
  addLog: (log: Omit<PracticeLog, 'id'>) => void;
  updateLog: (id: string, updates: Partial<PracticeLog>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(mockCheckIns);
  const [logs, setLogs] = useState<PracticeLog[]>(mockLogs);

  const value = useMemo<AppContextType>(() => {
    return {
      teams,
      addTeam: (t) => {
        const newTeam: Team = { ...t, id: `team_${Date.now()}` };
        setTeams((prev) => [newTeam, ...prev]);
      },
      updateTeam: (id, updates) => {
        setTeams((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );
      },

      checkIns,
      addCheckIn: (r) => {
        const newRecord: CheckInRecord = {
          ...r,
          id: `ci_${Date.now()}`,
        };
        setCheckIns((prev) => [newRecord, ...prev]);
        setTeams((prev) =>
          prev.map((t) =>
            t.id === r.teamId ? { ...t, checkInCount: t.checkInCount + 1 } : t
          )
        );
      },

      logs,
      addLog: (l) => {
        const newLog: PracticeLog = { ...l, id: `log_${Date.now()}` };
        setLogs((prev) => [newLog, ...prev]);
        setTeams((prev) => {
          return prev.map((t) => {
            if (t.id === l.teamId) {
              const newKeywords = Array.from(
                new Set([...(t.allKeywords || []), ...l.keywords])
              );
              const newHours = (t.totalServiceHours || 0) + l.serviceHours;
              let progress: CreditProgress = t.creditProgress || 'not_started';
              if (newHours >= 100) progress = 'hours_confirmed';
              else if (newHours > 0) progress = 'hours_collecting';
              return {
                ...t,
                logCount: t.logCount + 1,
                allKeywords: newKeywords,
                totalServiceHours: newHours,
                creditProgress: progress,
              };
            }
            return t;
          });
        });
      },
      updateLog: (id, updates) => {
        setLogs((prev) =>
          prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
        );
      },
    };
  }, [teams, checkIns, logs]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
