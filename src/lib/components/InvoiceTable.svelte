<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import * as XLSX from 'xlsx';
  import jsPDF from 'jspdf';
  import 'jspdf-autotable';
  import { Cog, Download } from 'lucide-svelte';
  
  interface Invoice {
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
  
  let invoices: Invoice[] = [];
  let error: string | null = null;
  let searchTerm = '';
  let showDownloadOptions = false;
  let isColumnSelectorOpen = false;
  let isLoading = true;
  
  let visibleColumns = [
    'date', 'invoice_number', 'customer_name', 'reference_number', 'total',
    'status', 'due_date', 'balance', 'branch_name'
  ];
  let originalColumnOrder = [...visibleColumns];
  let columnSelectorRef: HTMLDivElement;
  let downloadMenuRef: HTMLDivElement;
  let customizeButtonRef: HTMLButtonElement;
  let downloadButtonRef: HTMLButtonElement;

  let filteredInvoices: Invoice[] = [];


  onMount(async () => {
    try {
      const response = await fetch('/api/zoho-invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      invoices = data.invoices;
      filteredInvoices = [...invoices];
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyPress);
  });
  
  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeyPress);
  });

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
  
  function normalizeString(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function handleSearch() {
    const normalizedSearch = normalizeString(searchTerm);
    filteredInvoices = invoices.filter(invoice => {
      const normalizedInvoiceNumber = normalizeString(invoice.invoice_number);
      const normalizedCustomerName = normalizeString(invoice.customer_name);
      const normalizedReferenceNumber = normalizeString(invoice.reference_number);
      const normalizedFullInvoiceNumber = normalizeString(`vctin${invoice.invoice_number}`);

      return normalizedInvoiceNumber.includes(normalizedSearch) ||
             normalizedCustomerName.includes(normalizedSearch) ||
             normalizedReferenceNumber.includes(normalizedSearch) ||
             normalizedFullInvoiceNumber.includes(normalizedSearch);
    });

    // Additional check for "VCT/IN/" format
    const parts = searchTerm.split('/');
    if (parts.length === 3 && parts[0].toLowerCase() === 'vct' && parts[1].toLowerCase() === 'in') {
      const invoiceNumber = parts[2];
      filteredInvoices = filteredInvoices.filter(invoice => 
        normalizeString(invoice.invoice_number).includes(normalizeString(invoiceNumber))
      );
    }
  }

  $: {
    handleSearch();
  }


  function toggleDownloadOptions(event: MouseEvent) {
    event.stopPropagation();
    showDownloadOptions = !showDownloadOptions;
    if (showDownloadOptions) {
      isColumnSelectorOpen = false;
    }
  }

  function handleDownload(format: string) {
    const data = filteredInvoices.map(invoice => {
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

    if (format === 'CSV') {
      downloadCSV(data);
    } else if (format === 'EXCEL') {
      downloadExcel(data);
    } else if (format === 'PDF') {
      downloadPDF(data);
    }

    showDownloadOptions = false;
  }

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

  function toggleColumnSelector(event: MouseEvent) {
    event.stopPropagation();
    isColumnSelectorOpen = !isColumnSelectorOpen;
    if (isColumnSelectorOpen) {
      showDownloadOptions = false;
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (!columnSelectorRef?.contains(event.target as Node) && 
        !customizeButtonRef?.contains(event.target as Node)) {
      isColumnSelectorOpen = false;
    }
    if (!downloadMenuRef?.contains(event.target as Node) && 
        !downloadButtonRef?.contains(event.target as Node)) {
      showDownloadOptions = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isColumnSelectorOpen = false;
      showDownloadOptions = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
{#if isLoading}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="loader"></div>
  </div>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else}
  <div class="mb-4 flex justify-between items-center">
    <input
      type="text"
      placeholder="Search invoices..."
      class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      bind:value={searchTerm}
      on:input={handleSearch}
    />
    <div class="ml-4 flex relative">
      <button 
        on:click={toggleDownloadOptions} 
        class="p-2 rounded-full hover:bg-gray-200 mr-2"
        bind:this={downloadButtonRef}
      >
        <Download size={24} />
      </button>
      {#if showDownloadOptions}
        <div bind:this={downloadMenuRef} class="absolute right-0 mt-10 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button on:click={() => handleDownload('CSV')} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left" role="menuitem">CSV</button>
            <button on:click={() => handleDownload('EXCEL')} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left" role="menuitem">EXCEL</button>
            <button on:click={() => handleDownload('PDF')} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left" role="menuitem">PDF</button>
          </div>
        </div>
      {/if}
      <button 
        on:click={toggleColumnSelector}
        class="p-2 rounded-full hover:bg-gray-200"
        bind:this={customizeButtonRef}
      >
        <Cog size={24} />
      </button>
      {#if isColumnSelectorOpen}
        <div bind:this={columnSelectorRef} class="absolute right-0 mt-10 w-48 bg-white rounded-md shadow-lg z-10">
          <div class="py-1">
            {#each originalColumnOrder as column}
              <label class="flex items-center px-4 py-2 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column)}
                  on:change={() => toggleColumn(column)}
                  class="mr-2"
                />
                <span>{column.replace('_', ' ')}</span>
              </label>
            {/each}
            <button
              on:click={() => {
                isColumnSelectorOpen = false;
              }}
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if filteredInvoices.length === 0}
    <p>No invoices found.</p>
  {:else}
    <div class="overflow-x-auto bg-white shadow-md rounded-lg">
      <table class="min-w-full divide-y divide-blue-200">
        <thead class="bg-blue-500">
          <tr>
            {#each visibleColumns as column}
              <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">{column.replace('_', ' ')}</th>
            {/each}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-blue-100">
          {#each filteredInvoices as invoice, index (invoice.invoice_number)}
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
    {/if}
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

