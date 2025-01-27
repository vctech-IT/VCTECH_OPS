import { writable } from 'svelte/store';

interface DashboardState {
  orderStatus: string;
  selectedPM: string;
  dateRange: { start: Date | null; end: null };
  activeTab: number;
  showModal: boolean;
  modalContent: {
    title: string;
    totalOrders: number;
    totalSum: number;
    categorizedData: {
      byClient: { [key: string]: { orders: number; sum: number; soNumbers: string[] } };
      byCategory: { [key: string]: { orders: number; sum: number; soNumbers: string[] } };
    };
    soNumbers: Array<{ SONumber: string; SOId: string }>;
    agingData: any;
    orderDetails: Array<{ SONumber: string; SOId: string; clientName: string; SOCategory: string }>;
  };
  selectedClient: string | null;
  selectedCategory: string | null;
}

const initialState: DashboardState = {
  orderStatus: 'open',
  selectedPM: 'all',
  dateRange: { start: null, end: null },
  activeTab: 0,
  showModal: false,
  modalContent: {
    title: '',
    totalOrders: 0,
    totalSum: 0,
    categorizedData: { byClient: {}, byCategory: {} },
    soNumbers: [],
    agingData: {},
    orderDetails: []
  },
  selectedClient: null,
  selectedCategory: null
};

export const dashboardState = writable<DashboardState>(initialState);

export function resetDashboardState() {
  dashboardState.set(initialState);
}