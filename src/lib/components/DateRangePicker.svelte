<!-- DateRangePicker.svelte -->
<script lang="ts">
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

let startDate: string;
let endDate: string;

function handleChange() {
  dispatch('change', { start: startDate, end: endDate });
}
</script>

<div class="flex items-center space-x-4">
  <div class="flex flex-col">
    <label for="start-date" class="text-sm font-medium text-gray-700">Start Date</label>
    <input
      id="start-date"
      type="date"
      bind:value={startDate}
      on:change={handleChange}
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    />
  </div>
  <div class="flex flex-col">
    <label for="end-date" class="text-sm font-medium text-gray-700">End Date</label>
    <input
      id="end-date"
      type="date"
      bind:value={endDate}
      on:change={handleChange}
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    />
  </div>
</div>