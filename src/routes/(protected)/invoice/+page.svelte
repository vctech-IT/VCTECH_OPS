<!-- routes/invoice/+page.svelte -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page, navigating } from '$app/stores';
  import { browser } from '$app/environment';
  import { Filter, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';


  export let data;

  // UI States
  let isLoading = false;
  let isFilterModalOpen = false;
  
  // Search and filtering
  let searchTerm = data.search || '';
  let selectedStatuses = data.sortColumn === 'status' ? (data.sortColumn || '').split(',') : [];
  let selectedBranches = data.sortColumn === 'branch' ? (data.branch || '').split(',') : [];
  let sortColumn = data.sortColumn || 'date';
  let sortDirection = data.sortDirection || 'desc';
  
  // Date filters
  let startDate = '';
  let endDate = '';
  let minTotal = '';
  let maxTotal = '';

  // Pagination options
  let paginationOptions = [10, 25, 50, 100];
  let itemsPerPage = parseInt(data.limit) || 10;

  function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' && currentPage < totalPages) {
    changePage(currentPage + 1);
  } else if (e.key === 'ArrowLeft' && currentPage > 1) {
    changePage(currentPage - 1);
  }
}

onMount(() => {
  window.addEventListener('keydown', handleKeydown);
});

onDestroy(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Calculate days until due date
function getDaysUntilDue(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const today = new Date();
  
  // Reset time portion for accurate day calculation
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Calculate difference in milliseconds and convert to days
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

  // Update URL and refetch data when filters change
  function updateFilters() {
    if (!browser) return;
    
    const params = new URLSearchParams($page.url.searchParams);
    
    params.set('page', currentPage.toString());
    params.set('limit', itemsPerPage.toString());
    
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    
    params.set('sortColumn', sortColumn);
    params.set('sortDirection', sortDirection);
    
    if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
    else params.delete('status');
    
    if (selectedBranches.length > 0) params.set('branch', selectedBranches.join(','));
    else params.delete('branch');
    
    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');
    
    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');
    
    if (minTotal) params.set('minTotal', minTotal);
    else params.delete('minTotal');
    
    if (maxTotal) params.set('maxTotal', maxTotal);
    else params.delete('maxTotal');
    
    goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
  }

  // Function to handle search input (with debounce)
  let searchTimeout: NodeJS.Timeout;
  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      updateFilters();
    }, 300);
  }

  // Toggle sort column and direction
  function toggleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    updateFilters();
  }

  // Toggle status filter
  function toggleStatusFilter(status: string) {
    if (selectedStatuses.includes(status)) {
      selectedStatuses = selectedStatuses.filter(s => s !== status);
    } else {
      selectedStatuses = [...selectedStatuses, status];
    }
  }

  // Toggle branch filter
  function toggleBranchFilter(branch: string) {
    if (selectedBranches.includes(branch)) {
      selectedBranches = selectedBranches.filter(b => b !== branch);
    } else {
      selectedBranches = [...selectedBranches, branch];
    }
  }

  // Apply all filters
  function applyFilters() {
    currentPage = 1;
    isFilterModalOpen = false;
    updateFilters();
  }

  // Reset Filters
  function resetFilters() {
    searchTerm = '';
    selectedStatuses = [];
    selectedBranches = [];
    startDate = '';
    endDate = '';
    minTotal = '';
    maxTotal = '';
    sortColumn = 'date';
    sortDirection = 'desc';
    currentPage = 1;
    isFilterModalOpen = false;
    updateFilters();
  }

  // Navigate to Invoice Details
  function navigateToInvoiceDetails(invoiceId: string) {
    goto(`/invoice/${invoiceId}`);
  }

  // Pagination Functions
function getPaginationRange() {
  const totalPages = Math.ceil(totalInvoices / itemsPerPage);
  
  // For smaller number of pages, show all
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  // For larger number of pages, use a smart range with ellipses
  let pages = [];
  
  // Always include first and last page
  pages.push(1);
  
  // Logic for middle pages
  if (currentPage <= 3) {
    // Near the start
    pages.push(2, 3, 4, '...', totalPages - 1);
  } else if (currentPage >= totalPages - 2) {
    // Near the end
    pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1);
  } else {
    // Somewhere in the middle
    pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...'); 
  }
  
  // Add last page
  pages.push(totalPages);
  
  return pages;
}

  function changePage(newPage: any) {
    currentPage = newPage;
    updateFilters();
  }

  // Format Status Display
  function getStatusClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Computed Properties
  // Reactive variables from data
  $: invoices = data.invoices;
  $: totalInvoices = data.totalInvoices;
  $: availableStatuses = data.availableStatuses;
  $: availableBranches = data.availableBranches;
  $: currentPage = data.page;
  $: itemsPerPage = data.limit;
  $: error = data.error;
  $: totalPages = Math.ceil(totalInvoices / itemsPerPage);
  $: hasBranchFilters = selectedBranches.length > 0;
  $: hasStatusFilters = selectedStatuses.length > 0;
  $: hasDateFilters = startDate || endDate;
  $: hasTotalFilters = minTotal || maxTotal;
  $: hasAnyFilters = hasStatusFilters || hasBranchFilters || hasDateFilters || hasTotalFilters;
  $: isLoading = $navigating !== null;

</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  {#if isLoading}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="loader"></div>
    </div>
  {/if}

  <h1 class="text-2xl font-bold mb-6">Invoices</h1>

  <div class="mb-4 flex justify-between items-center">
    <div class="relative w-full mr-4">
      <input
        type="text"
        placeholder="Search invoices by customer, invoice number, or reference..."
        bind:value={searchTerm}
        on:input={handleSearch}
        class="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
      />
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
        <Search size={20} class="text-gray-400" />
      </div>
    </div>
    
    <div class="flex space-x-2">
      <button 
        on:click={() => isFilterModalOpen = true}
        class="p-2 rounded-full hover:bg-gray-200 relative"
        aria-label="Open filter options"
      >
        <Filter size={24} />
        {#if hasAnyFilters}
          <span class="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs">
            {(hasStatusFilters ? 1 : 0) + (hasBranchFilters ? 1 : 0) + (hasDateFilters ? 1 : 0) + (hasTotalFilters ? 1 : 0)}
          </span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Invoices Table -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {/if}

  {#if invoices.length === 0}
    <div class="text-center py-8 text-gray-500">
      <p>No invoices found. Try a different search term or filter.</p>
      {#if hasAnyFilters || searchTerm}
        <button 
          on:click={resetFilters}
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reset Filters
        </button>
      {/if}
    </div>
  {:else}
    <div class="overflow-x-auto bg-white shadow-md rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-blue-500 text-white">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('date')}>
              <div class="flex items-center">
                Date
                {#if sortColumn === 'date'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('invoice_number')}>
              <div class="flex items-center">
                Invoice #
                {#if sortColumn === 'invoice_number'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('reference_number')}>
              <div class="flex items-center">
                Reference #
                {#if sortColumn === 'reference_number'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('customer_name')}>
              <div class="flex items-center">
                Customer
                {#if sortColumn === 'customer_name'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('branch_name')}>
              <div class="flex items-center">
                Branch
                {#if sortColumn === 'branch_name'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('status')}>
              <div class="flex items-center">
                Status
                {#if sortColumn === 'status'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('due_date')}>
              <div class="flex items-center">
                Due Date
                {#if sortColumn === 'due_date'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('total')}>
              <div class="flex items-center">
                Total
                {#if sortColumn === 'total'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" on:click={() => toggleSort('balance')}>
              <div class="flex items-center">
                Balance
                {#if sortColumn === 'balance'}
                  {#if sortDirection === 'asc'}
                    <ArrowUp size={14} class="ml-1" />
                  {:else}
                    <ArrowDown size={14} class="ml-1" />
                  {/if}
                {/if}
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each invoices as invoice (invoice.id)}
            <tr 
              class="hover:bg-blue-50 cursor-pointer transition-colors duration-200"
              on:click={() => navigateToInvoiceDetails(invoice.zoho_invoice_id)}
              transition:fade
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {new Date(invoice.date).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {invoice.invoice_number}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {invoice.reference_number}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {invoice.customer_name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {invoice.branch_name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col">
                  {#if invoice.status.toLowerCase() === 'sent'}
                    {@const daysUntilDue = getDaysUntilDue(invoice.due_date)}
                    {#if daysUntilDue <= 30 && daysUntilDue >= 0}
                      <span class="mt-1 text-xs
                        {daysUntilDue <= 2 ? 'text-red-600' : 
                        daysUntilDue <= 7 ? 'text-red-500' : 
                        daysUntilDue <= 14 ? 'text-orange-500' : 
                        'text-yellow-600'}">
                        Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                      </span>
                    {/if}
                    {:else}
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusClasses(invoice.status)}">
                    {invoice.status}
                  </span>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {new Date(invoice.due_date).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ₹{invoice.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
      <div class="flex justify-between items-center mt-4">
        <div class="flex items-center text-sm text-gray-600">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} - 
            {Math.min(currentPage * itemsPerPage, totalInvoices)} 
            of {totalInvoices} invoices
          </span>
          <div class="ml-4 flex items-center">
            <span class="mr-2">Show:</span>
            <select 
              bind:value={itemsPerPage}
              on:change={() => {
                currentPage = 1;
                updateFilters();
              }}
              class="border rounded px-2 py-1 text-sm"
            >
              {#each paginationOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <button 
            disabled={currentPage === 1}
            on:click={() => changePage(currentPage - 1)}
            class="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>

          {#each getPaginationRange() as pageNum}
            {#if pageNum === '...'}
              <span class="px-3 py-1">...</span>
            {:else}
              <button 
                class="px-3 py-1 rounded {currentPage === pageNum 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                on:click={() => changePage(pageNum)}
              >
                {pageNum}
              </button>
            {/if}
          {/each}

          <button 
            disabled={currentPage === totalPages}
            on:click={() => changePage(currentPage + 1)}
            class="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
  {/if}

  <!-- Filter Modal -->
  {#if isFilterModalOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade>
      <div class="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Filter Invoices</h2>
        
        <!-- Status Filter -->
        <div class="mb-4">
          <h3 class="text-md font-semibold mb-2">Status</h3>
          <div class="flex flex-wrap gap-2">
            {#each availableStatuses as status}
              <button
                on:click={() => toggleStatusFilter(status)}
                class="px-3 py-1 rounded-full text-sm {selectedStatuses.includes(status) 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
              >
                {status}
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Branch Filter -->
        {#if availableBranches.length > 0}
          <div class="mb-4">
            <h3 class="text-md font-semibold mb-2">Branch</h3>
            <div class="flex flex-wrap gap-2">
              {#each availableBranches as branch}
                <button
                  on:click={() => toggleBranchFilter(branch)}
                  class="px-3 py-1 rounded-full text-sm {selectedBranches.includes(branch) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                >
                  {branch}
                </button>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Date Range Filter -->
        <div class="mb-4">
          <h3 class="text-md font-semibold mb-2">Date Range</h3>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm text-gray-600 mb-1">From</label>
              <input 
                type="date" 
                bind:value={startDate}
                class="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">To</label>
              <input 
                type="date" 
                bind:value={endDate}
                class="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
        
        <!-- Amount Range Filter -->
        <div class="mb-6">
          <h3 class="text-md font-semibold mb-2">Total Amount</h3>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm text-gray-600 mb-1">Min (₹)</label>
              <input 
                type="number" 
                bind:value={minTotal}
                placeholder="0.00"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">Max (₹)</label>
              <input 
                type="number" 
                bind:value={maxTotal}
                placeholder="0.00"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="flex justify-between">
          <button 
            on:click={resetFilters}
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Reset
          </button>
          <div class="space-x-2">
            <button 
              on:click={() => isFilterModalOpen = false}
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button 
              on:click={applyFilters}
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .loader {
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
