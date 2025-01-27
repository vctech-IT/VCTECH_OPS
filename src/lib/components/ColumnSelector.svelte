<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let columns: { key: string; label: string; selected: boolean }[];

  const dispatch = createEventDispatcher();

  function toggleColumn(key: string) {
    columns = columns.map(col => 
      col.key === key ? { ...col, selected: !col.selected } : col
    );
    dispatch('change', columns);
  }
</script>

<div class="bg-white border rounded-md p-4">
  <h3 class="font-bold mb-2">Select Columns</h3>
  {#each columns as column}
    <div class="flex items-center mb-2">
      <input
        type="checkbox"
        id={column.key}
        checked={column.selected}
        on:change={() => toggleColumn(column.key)}
        class="mr-2"
      />
      <label for={column.key}>{column.label}</label>
    </div>
  {/each}
</div>