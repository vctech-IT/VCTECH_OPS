<!-- KPICard.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let title: string;
  export let title2: string;
  export let value: string | number;
  export let icon: string;
  export let color: string = 'bg-blue-600';

  const dispatch = createEventDispatcher();
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  function handleClick() {
    dispatch('click', { title, value });
  }
</script>

{#if mounted}
  <div 
    class="card-container" 
    on:click={handleClick}
    in:fade={{ duration: 300, delay: 300 }}
    out:fade={{ duration: 300 }}
  >
    <div class="card">
      <div class="card-front bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div class="{color} rounded-full p-3 mr-4">
              <i class="fas fa-{icon} text-white text-2xl"></i>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-500 mb-1">{title}</p>
              <p class="text-3xl font-bold text-gray-900" in:fly={{ y: 20, duration: 300, delay: 300, easing: quintOut }}>{value}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="card-back bg-gray-50 rounded-xl shadow-lg p-6">
        <p class="text-lg font-semibold text-gray-800">{title2}</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .card-container {
    perspective: 1000px;
    width: 100%;
    height: 140px;
    cursor: pointer;
  }
  .card {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  .card-container:hover .card {
    transform: rotateY(180deg);
  }
  .card-front, .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .card-back {
    transform: rotateY(180deg);
    text-align: center;
  }
</style>