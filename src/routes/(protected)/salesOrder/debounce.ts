// routes/salesOrder/debounce.ts
export function debounce<F extends (...args: any[]) => any>(
    func: F, 
    wait: number
  ): (...args: Parameters<F>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(...args: Parameters<F>) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), wait);
    };
  }
