<script lang="ts">
export let orders: any[];
</script>

<table class="min-w-full">
  <thead>
    <tr>
      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
        SO Number
      </th>
      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
        Client Name
      </th>
      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
        Total
      </th>
      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
        Status
      </th>
    </tr>
  </thead>
  <tbody>
    {#each orders as order}
      <tr>
        <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-300">
          {order.SONumber}
        </td>
        <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-300">
          {order.clientName}
        </td>
        <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-300">
          ₹{order.Total.toLocaleString()}
        </td>
        <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-300">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            {order.currentStage}
          </span>
        </td>
      </tr>
    {/each}
  </tbody>
</table>