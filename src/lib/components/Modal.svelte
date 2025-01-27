<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher, onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  export let title: string;
  export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  export let scrollableContent = false;
  const dispatch = createEventDispatcher();
 
  function close() {
    dispatch('close');
  }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }
  function handleOutsideClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-full sm:m-4'
  };
</script>

<div class="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity z-50"
     on:click={handleOutsideClick}
     transition:fade={{duration: 200}}>
  <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
    <div class="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full {sizeClasses[size]}"
         transition:fly={{y: 50, duration: 300, easing: quintOut}}>
      <div class="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div class="flex justify-between items-center px-4 py-3">
          <h3 class="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
            {title}
          </h3>
          <button type="button"
                  class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  on:click={close}>
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <slot name="header"></slot>
        <div class="{scrollableContent ? 'max-h-[60vh] overflow-y-auto' : ''}">
          <slot></slot>
        </div>
      </div>
      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        <slot name="footer">
          <button type="button"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition duration-150 ease-in-out"
                  on:click={close}>
            Close
          </button>
        </slot>
      </div>
    </div>
  </div>
</div>