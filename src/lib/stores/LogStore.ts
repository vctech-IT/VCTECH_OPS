// src/lib/stores/logStore.ts
import { writable } from 'svelte/store';

export interface LogEntry {
  username: string;
  role: string;
  action: string;
  timestamp: Date;
}

interface SalesOrderLogs {
  [salesOrderNumber: string]: LogEntry[];
}

function createLogStore() {
  const { subscribe, update } = writable<SalesOrderLogs>({});

  return {
    subscribe,
    addLog: (salesOrderNumber: string, entry: LogEntry) => update(logs => {
      if (!logs[salesOrderNumber]) {
        logs[salesOrderNumber] = [];
      }
      logs[salesOrderNumber] = [entry, ...logs[salesOrderNumber]];
      return logs;
    }),
    loadLogs: () => {
      const storedLogs = localStorage.getItem('salesOrderLogs');
      if (storedLogs) {
        update(() => JSON.parse(storedLogs));
      }
    },
    saveLogs: (logs: SalesOrderLogs) => {
      localStorage.setItem('salesOrderLogs', JSON.stringify(logs));
    }
  };
}

export const logStore = createLogStore();