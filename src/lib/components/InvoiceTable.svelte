<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import * as XLSX from 'xlsx';
  import jsPDF from 'jspdf';
  import 'jspdf-autotable';
  import { Cog, Download, Filter, Search } from 'lucide-svelte';
  
  interface Invoice {
    id: string;
    zoho_invoice_id: string;
    branch_name: string;
    balance: number;
    total: number;
    reference_number: string;
    date: string;
    invoice_number: string;
    customer_name: string;
    status: string;
    due_date: string;
  }

  // Pagination and Filtering State
  let currentPage = 1;
  const itemsPerPage = 200;
  let totalInvoices = 0;
  let sortColumn: keyof Invoice | null = null;
  let sortDirection: 'asc' | 'desc' = 'asc';

  // Data State
  let invoices: Invoice[] = [];
  let searchTerm = '';
  
  // UI States
  let error: string | null = null;
  let isLoading = false;
  let showDownloadOptions = false;
  let isColumnSelectorOpen = false;
  let isFilterModalOpen = false;

  // Filters
  let filters = {
    status: [] as string[],
    branch: [] as string[],
    dateRange: { start: '', end: '' },
    minTotal: null as number | null,
    maxTotal: null as number | null
  };

  // Column Configuration
  let visibleColumns = [
    'date', 'invoice_number', 'customer_name', 'reference_number', 
    'total', 'status', 'due_date', 'balance', 'branch_name'
  ];
  let originalColumnOrder = [...visibleColumns];

  // Refs for outside click handling
  let columnSelectorRef: HTMLDivElement;
  let downloadMenuRef: HTMLDivElement;
  let customizeButtonRef: HTMLButtonElement;
  let downloadButtonRef: HTMLButtonElement;
  let filterModalRef: HTMLDivElement;

  // Fetch Invoices
  async function fetchInvoices() {
    isLoading = true;
    error = null;

    try {
      // Construct query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        sortColumn: sortColumn || 'date',
        sortDirection: sortDirection,
        status: filters.status.join(','),
        branch: filters.branch.join(','),
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        minTotal: filters.minTotal?.toString() || '',
        maxTotal: filters.maxTotal?.toString() || ''
      });

      const response = await fetch(`/api/zoho-invoices?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      invoices = data.invoices;
      totalInvoices = data.total;
    } catch (e: any) {
      error = e.message;
      invoices = [];
    } finally {
      isLoading = false;
    }
  }

  // Search and Filter Handler
  function handleSearchAndFilter() {
    currentPage = 1; // Reset to first page on new search/filter
    fetchInvoices();
  }

  // Reset Filters
  function resetFilters() {
    filters = {
      status: [],
      branch: [],
      dateRange: { start: '', end: '' },
      minTotal: null,
      maxTotal: null
    };
    handleSearchAndFilter();
  }

  // Pagination Handler
  function changePage(page: number) {
    currentPage = page;
    fetchInvoices();
  }

  // Sorting Handler
  function handleSort(column: keyof Invoice) {
    if (sortColumn === column) {
      // Toggle sort direction if same column
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    fetchInvoices();
  }

  // Utility Functions
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Download Handlers
  function handleDownload(format: string) {
    async function downloadFullData() {
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          status: filters.status.join(','),
          branch: filters.branch.join(','),
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
          minTotal: filters.minTotal?.toString() || '',
          maxTotal: filters.maxTotal?.toString() || ''
        });

        const response = await fetch(`/api/zoho-invoices/export?${params}`);
        const data = await response.json();
        
        const formattedData = data.invoices.map(invoice => {
          let row: any = {};
          visibleColumns.forEach(column => {
            if (column === 'date' || column === 'due_date') {
              row[column] = formatDate(invoice[column]);
            } else if (column === 'total' || column === 'balance') {
              row[column] = formatCurrency(invoice[column]);
            } else {
              row[column] = invoice[column];
            }
          });
          return row;
        });

        if (format === 'CSV') downloadCSV(formattedData);
        else if (format === 'EXCEL') downloadExcel(formattedData);
        else if (format === 'PDF') downloadPDF(formattedData);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }

    downloadFullData();
    showDownloadOptions = false;
  }

  // Download Utility Functions
  function downloadCSV(data: any[]) {
    const headers = visibleColumns;
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'invoices.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function downloadExcel(data: any[]) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, 'invoices.xlsx');
  }

  function downloadPDF(data: any[]) {
    const doc = new jsPDF();
    doc.autoTable({
      head: [visibleColumns],
      body: data.map(row => visibleColumns.map(col => row[col])),
    });
    doc.save('invoices.pdf');
  }

  // Column Selector
  function toggleColumn(column: string) {
    if (visibleColumns.includes(column)) {
      visibleColumns = visibleColumns.filter(c => c !== column);
    } else {
      const index = originalColumnOrder.findIndex(c => c === column);
      const insertIndex = visibleColumns.findIndex(c => originalColumnOrder.indexOf(c) > index);
      if (insertIndex === -1) {
        visibleColumns = [...visibleColumns, column];
      } else {
        visibleColumns = [
          ...visibleColumns.slice(0, insertIndex),
          column,
          ...visibleColumns.slice(insertIndex)
        ];
      }
    }
  }

  // Event Handlers
  function toggleDownloadOptions(event: MouseEvent) {
    event.stopPropagation();
    showDownloadOptions = !showDownloadOptions;
  }

  function toggleColumnSelector(event: MouseEvent) {
    event.stopPropagation();
    isColumnSelectorOpen = !isColumnSelectorOpen;
  }

  function handleClickOutside(event: MouseEvent) {
    // Close dropdown menus when clicking outside
    if (columnSelectorRef && !columnSelectorRef.contains(event.target as Node)) {
      isColumnSelectorOpen = false;
    }
    if (downloadMenuRef && !downloadMenuRef.contains(event.target as Node)) {
      showDownloadOptions = false;
    }
  }

  // Lifecycle Hooks
  onMount(() => {
    fetchInvoices();
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  // Computed Properties
  $: totalPages = Math.ceil(totalInvoices / itemsPerPage);
  $: pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
</script>

<div class="container mx-auto px-4 py-8">
  {#if isLoading}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="loader"></div>
    </div>
  {:else}
    <div class="mb-4 flex justify-between items-center">
      <div class="relative w-full mr-4">
        <input
          type="text"
          placeholder="Search invoices (Customer, Invoice, Reference)..."
          bind:value={searchTerm}
          on:input={handleSearchAndFilter}
          class="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300"
        />
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search size={20} class="text-gray-400" />
        </div>
      </div>
      
      <div class="flex space-x-2">
        <button 
          on:click={() => isFilterModalOpen = true}
          class="p-2 rounded-full hover:bg-gray-200"
        >
          <Filter size={24} />
        </button>
        
        <button 
          on:click={toggleDownloadOptions} 
          bind:this={downloadButtonRef}
          class="p-2 rounded-full hover:bg-gray-200"
        >
          <Download size={24} />
        </button>
        
        <button 
          on:click={toggleColumnSelector}
          bind:this={customizeButtonRef}
          class="p-2 rounded-full hover:bg-gray-200"
        >
          <Cog size={24} />
        </button>
      </div>
    </div>

    <!-- Download Options Dropdown -->
    {#if showDownloadOptions}
      <div 
        bind:this={downloadMenuRef} 
        class="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
      >
        <div class="py-1">
          {['CSV', 'EXCEL', 'PDF'].map(format => (
            <button 
              key={format}
              on:click={() => handleDownload(format)}
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {format}
            </button>
          ))}
        </div>
      </div>
    {/if}

    <!-- Column Selector Dropdown -->
    {#if isColumnSelectorOpen}
      <div 
        bind:this={columnSelectorRef}
        class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
      >
        <div class="py-1">
          {originalColumnOrder.map(column => (
            <label 
              key={column} 
              class="flex items-center px-4 py-2 hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={visibleColumns.includes(column)}
                on:change={() => toggleColumn(column)}
                class="mr-2"
              />
              <span>{column.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
    {/if}

    <!-- Invoices Table -->
    {#if invoices.length === 0}
      <div class="text-center py-8 text-gray-500">
        <p>No invoices found. Try a different search term.</p>
      </div>
    {:else}
      <div class="overflow-x-auto bg-white shadow-md rounded-lg">
        <table class="min-w-full divide-y divide-blue-200">
          <thead class="bg-blue-500">
            <tr>
              {#each visibleColumns as column}
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap cursor-pointer"
                  on:click={() => handleSort(column as keyof Invoice)}
                >
                  {column.replace('_', ' ')}
                  {#if sortColumn === column}
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  {/if}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-blue-100">
            {#each invoices as invoice, index (invoice.invoice_number)}
              <tr 
                class="hover:bg-blue-50 cursor-pointer transition-colors duration-200 {index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}"
                transition:fade
              >
                {#each visibleColumns as column}
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {#if column === 'date' || column === 'due_date'}
                      {formatDate(invoice[column])}
                    {:else if column === 'total' || column === 'balance'}
                      {formatCurrency(invoice[column])}
                    {:else if column === 'status'}
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      {invoice[column] === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                       invoice[column] === 'sent' || invoice[column] === 'open' ? 'bg-green-100 text-green-800' : 
                       'bg-gray-100 text-gray-800'}">
                        {invoice[column]}
                      </span>
                    {:else}
                      {invoice[column]}
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex justify-between items-center mt-4">
        <div>
          <span>Total Invoices: {totalInvoices}</span>
        </div>
        <div class="flex space-x-2">
          {#each pageNumbers as pageNum}
            <button 
              class="px-3 py-1 {currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded"
              on:click={() => changePage(pageNum)}
            >
              {pageNum}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}

  <!-- Filter Modal (To be implemented) -->
  {#if isFilterModalOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg w-96">
        <h2 class="text-xl font-bold mb-4">Filter Invoices</h2>
        <!-- Filter inputs -->
        <button 
          on:click={() => isFilterModalOpen = false}
          class="mt-4 w-full bg-blue-500 text-white py-2 rounded"
        >
          Apply Filters
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .bg-blue-50 {
    background-color: #eff6ff;
  }
  .bg-blue-100 {
    background-color: #dbeafe;
  }
  .bg-blue-200 {
    background-color: #bfdbfe;
  }
  .bg-blue-500 {
    background-color: #3b82f6;
  }
  .hover\:bg-blue-50:hover {
    background-color: #eff6ff;
  }
  .divide-blue-100 > :not([hidden]) ~ :not([hidden]) {
    border-color: #dbeafe;
  }
  .divide-blue-200 > :not([hidden]) ~ :not([hidden]) {
    border-color: #bfdbfe;
  }
  input[type="checkbox"]:disabled + span {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .container {
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }
  .shadow-md {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .rounded-lg {
    border-radius: 0.5rem;
  }
  
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

