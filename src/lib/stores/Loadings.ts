// src/lib/stores/Loadings.ts
import { writable } from 'svelte/store';

type LoadingState = {
    isLoading: boolean;
    message: string;
};

const createLoadingStore = () => {
    const { subscribe, set, update } = writable<LoadingState>({
        isLoading: false,
        message: ''
    });

    return {
        subscribe,
        show: (message: string) => set({ isLoading: true, message }),
        hide: () => set({ isLoading: false, message: '' })
    };
};

export const loading = createLoadingStore();