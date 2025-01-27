<script>
  import { onMount } from 'svelte';
  import SveleteToolTip from 'svelte-tooltip';

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  export let content = '';
</script>

{#if mounted}
  <SveleteToolTip {content}>
    <slot />
  </SveleteToolTip>
{:else}
  <slot />
{/if}