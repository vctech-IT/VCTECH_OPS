<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let title: string;
  export let title2: string;
  export let value: string | number;
  export let icon: string;
  export let color: string = 'bg-blue-600';
  const dispatch = createEventDispatcher();
  function handleClick() {
    dispatch('click', { title, value });
  }
</script>

<div 
  class="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
  on:click={handleClick}
>
  <div class="p-5">
    <div class="flex items-center">
      <div class="{color} rounded-md p-3 mr-4">
        <i class="fas fa-{icon} text-white text-2xl"></i>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p class="text-sm font-medium text-gray-500 truncate">{title2}</p>
        <p class="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
</div>