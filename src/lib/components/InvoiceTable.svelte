<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { Cog, Download, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import * as XLSX from 'xlsx';
  import jsPDF from 'jspdf';
  import 'jspdf-autotable';

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
  const itemsPerPage = 10; // Reduced to improve readability
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

  // Unique status values
  let availableStatuses: string[] = [];

  // Fetch Invoices with improved filtering
  async function fetchInvoices() {
    isLoading = true;
    error = null;

    try {
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

      // Extract unique statuses if not already done
      if (availableStatuses.length === 0) {
        availableStatuses = [...new Set(invoices.map(inv => inv.status))];
      }
    } catch (e: any) {
      error = e.message;
      invoices = [];
    } finally {
      isLoading = false;
    }
  }

  // Navigate to Invoice Details
  function navigateToInvoiceDetails(invoiceId: string) {
    goto(`/invoice/${invoiceId}`);
  }

  // Pagination Improvements
  function getPaginationRange() {
    const totalPages = Math.ceil(totalInvoices / itemsPerPage);
    const currentPageIndex = currentPage;
    let startPage = Math.max(1, currentPageIndex - 2);
    let endPage = Math.min(totalPages, currentPageIndex + 2);

    // Adjust range to always show 5 pages if possible
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, 5);
      } else {
        startPage = Math.max(1, totalPages - 4);
      }
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  // Status Filter Toggle
  function toggleStatusFilter(status: string) {
    if (filters.status.includes(status)) {
      filters.status = filters.status.filter(s => s !== status);
    } else {
      filters.status = [...filters.status, status];
    }
    currentPage = 1;
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
    searchTerm = '';
    currentPage = 1;
    fetchInvoices();
  }

  // Lifecycle Hooks
  onMount(() => {
    fetchInvoices();
  });

  // Computed Properties
  $: totalPages = Math.ceil(totalInvoices / itemsPerPage);
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  {#if isLoading}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="loader"></div>
    </div>
  {/if}

  <div class="mb-4 flex justify-between items-center">
    <div class="relative w-full mr-4">
      <input
        type="text"
        placeholder="Search invoices..."
        bind:value={searchTerm}
        on:input={() => {
          currentPage = 1;
          fetchInvoices();
        }}
        class="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300"
      />
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
        <Search size={20} class="text-gray-400" />
      </div>
    </div>
    
    <div class="flex space-x-2">
      <button 
        on:click={() => isFilterModalOpen = true}
        class="p-2 rounded-full hover:bg-gray-200 relative"
      >
        <Filter size={24} />
        {#if filters.status.length > 0}
          <span class="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs">
            {filters.status.length}
          </span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Invoices Table -->
  {#if invoices.length === 0}
    <div class="text-center py-8 text-gray-500">
      <p>No invoices found. Try a different search term.</p>
      {#if filters.status.length > 0 || searchTerm}
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
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Invoice #</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Balance</th>
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
                {invoice.customer_name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                {invoice.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                 invoice.status === 'sent' || invoice.status === 'open' ? 'bg-green-100 text-green-800' : 
                 invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                 'bg-gray-100 text-gray-800'}">
                  {invoice.status}
                </span>
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
      <div class="text-sm text-gray-600">
        Showing {(currentPage - 1) * itemsPerPage + 1} - 
        {Math.min(currentPage * itemsPerPage, totalInvoices)} 
        of {totalInvoices} invoices
      </div>
      <div class="flex items-center space-x-2">
        <button 
          disabled={currentPage === 1}
          on:click={() => {
            if (currentPage > 1) {
              currentPage--;
              fetchInvoices();
            }
          }}
          class="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>

        {#each getPaginationRange() as pageNum}
          <button 
            class="px-3 py-1 rounded {currentPage === pageNum 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
            on:click={() => {
              currentPage = pageNum;
              fetchInvoices();
            }}
          >
            {pageNum}
          </button>
        {/each}

        <button 
          disabled={currentPage === totalPages}
          on:click={() => {
            if (currentPage < totalPages) {
              currentPage++;
              fetchInvoices();
            }
          }}
          class="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  {/if}

  <!-- Status Filter Modal -->
  {#if isFilterModalOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg w-96">
        <h2 class="text-xl font-bold mb-4">Filter Invoices</h2>
        
        <div class="mb-4">
          <h3 class="text-md font-semibold mb-2">Status</h3>
          <div class="flex flex-wrap gap-2">
            {#each availableStatuses as status}
              <button
                on:click={() => toggleStatusFilter(status)}
                class="px-3 py-1 rounded-full text-sm {filters.status.includes(status) 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
              >
                {status}
              </button>
            {/each}
          </div>
        </div>

        <div class="flex justify-between">
          <button 
            on:click={resetFilters}
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Reset
          </button>
          <button 
            on:click={() => isFilterModalOpen = false}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Apply
          </button>
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
