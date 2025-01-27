<!-- src/lib/components/Button.svelte -->
<script lang="ts">
  export let variant: 'default' | 'ghost' = 'default';
  export let size: 'default' | 'icon' = 'default';
</script>

<button
  class="rounded-md px-4 py-2 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
  class:bg-blue-500={variant === 'default'}
  class:text-white={variant === 'default'}
  class:hover:bg-blue-600={variant === 'default'}
  class:bg-transparent={variant === 'ghost'}
  class:text-blue-500={variant === 'ghost'}
  class:hover:bg-blue-100={variant === 'ghost'}
  class:p-2={size === 'icon'}
  on:click
>
  <slot />
</button>