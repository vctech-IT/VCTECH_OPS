<!--routes/invoice/[id]/+page.svelte-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { ArrowLeft, Download, ChevronDown } from 'svelte-lucide';
  import '$lib/styles/app.css';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  import CustomLoader from '$lib/components/CustomLoader.svelte';
  
  export let data: PageData;
  
  let invoiceData = data.invoiceData?.invoice || null;
  let success = data.success;
  let error = data.error;
  let isLoadingNavigate = false;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'void':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-white text-blue-800';
    }
  }

  async function goBack() {
    isLoadingNavigate = true;
    await goto('/invoice');
    isLoadingNavigate = false;
  }

  let showDocumentsDropdown = false;

  function toggleDocumentsDropdown() {
    showDocumentsDropdown = !showDocumentsDropdown;
  }

  function downloadDocument(doc: any) {
    console.log(`Downloading ${doc.file_name}`);
    // Implement actual download logic here
  }
</script>

<LoadingOverlay />

<div class="bg-gray-100 min-h-screen py-8 px-4">
  <div class="max-w-6xl mx-auto">
    <div class="bg-white shadow-xl rounded-lg overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div class="flex flex-col sm:flex-row justify-between items-center">
          <div class="flex items-center mb-4 sm:mb-0">
            <button 
              class="mr-4 text-white hover:bg-blue-700 rounded-full p-2 transition duration-300 ease-in-out"
              on:click={goBack}
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 class="text-2xl font-bold text-white">Invoice: {invoiceData?.invoice_number || ''}</h1>
          </div>
          <div class="flex items-center space-x-3">
            <span class="px-4 py-2 rounded-full text-sm font-medium bg-white {getStatusColor(invoiceData?.status || '')}">
              {invoiceData?.status?.replace(/_/g, ' ').toUpperCase() || ''}
            </span>
            
            {#if invoiceData?.documents && invoiceData.documents.length > 0}
              <div class="relative">
                <button 
                  class="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-full shadow-sm hover:shadow transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                  on:click={toggleDocumentsDropdown}
                >
                  <Download size={20} class="mr-2" />
                  <span>Documents</span>
                  <ChevronDown size={20} class="ml-2" />
                </button>
                
                {#if showDocumentsDropdown}
                  <div class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg overflow-hidden z-10">
                    {#each invoiceData.documents as doc}
                      <button 
                        class="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center"
                        on:click={() => downloadDocument(doc)}
                      >
                        <Download size={16} class="mr-2" />
                        <span>{doc.file_name}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="p-6 space-y-8">
        <!-- Company and Invoice Info -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">From</h2>
            <p class="font-medium">VC TECHNOSOLUTIONS PRIVATE LIMITED</p>
            <p>Office No-607, 608 Mayuresh Cosmos,</p>
            <p>Plot No 37, Sector - 11, CBD Belapur</p>
            <p>Navi Mumbai, Maharashtra 410209</p>
            <p>India</p>
            <p class="mt-2 text-blue-600">GSTIN: 27AAHCV4369B1Z8</p>
            <p class="text-blue-600">UDYAM Registration: UDYAM-MH-27-0000854</p>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Invoice Details</h2>
            <p><strong>Invoice Number:</strong> {invoiceData?.invoice_number || ''}</p>
            <p><strong>Invoice Date:</strong> {formatDate(invoiceData?.date || '')}</p>
            <p><strong>Terms:</strong> {invoiceData?.payment_terms_label || ''}</p>
            <p><strong>Due Date:</strong> {formatDate(invoiceData?.due_date || '')}</p>
            <p><strong>P.O.#:</strong> {invoiceData?.reference_number || ''}</p>
            <p><strong>Place Of Supply:</strong> {invoiceData?.place_of_supply || ''}</p>
            <p><strong>Status:</strong> {invoiceData?.status?.replace(/_/g, ' ').toUpperCase() || ''}</p>
          </div>
        </div>

        <!-- Subject -->
        {#if invoiceData?.subject_content}
          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Subject</h2>
            <p>{invoiceData.subject_content}</p>
          </div>
        {/if}

        <!-- Billing & Shipping -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Billing Address</h2>
            <p class="font-medium">{invoiceData?.customer_name || ''}</p>
            {#if invoiceData?.billing_address}
              <p>{invoiceData.billing_address.attention || ''}</p>
              <p>{invoiceData.billing_address.address || ''}</p>
              {#if invoiceData.billing_address.street2}
                <p>{invoiceData.billing_address.street2}</p>
              {/if}
              <p>{invoiceData.billing_address.city || ''}, {invoiceData.billing_address.state || ''} {invoiceData.billing_address.zip || ''}</p>
              <p>{invoiceData.billing_address.country || ''}</p>
              {#if invoiceData.billing_address.phone}
                <p>Phone: {invoiceData.billing_address.phone}</p>
              {/if}
            {/if}
            {#if invoiceData?.gst_no}
              <p class="mt-2 text-blue-600">GSTIN: {invoiceData.gst_no}</p>
            {/if}
            {#if invoiceData?.cf_site_id}
              <p class="text-blue-600">Site ID: {invoiceData.cf_site_id}</p>
            {/if}
          </div>

          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Shipping Address</h2>
            {#if invoiceData?.shipping_address}
              <p class="font-medium">{invoiceData.shipping_address.attention || invoiceData.customer_name || ''}</p>
              <p>{invoiceData.shipping_address.address || ''}</p>
              {#if invoiceData.shipping_address.street2}
                <p>{invoiceData.shipping_address.street2}</p>
              {/if}
              <p>{invoiceData.shipping_address.city || ''}, {invoiceData.shipping_address.state || ''} {invoiceData.shipping_address.zip || ''}</p>
              <p>{invoiceData.shipping_address.country || ''}</p>
              {#if invoiceData.shipping_address.phone}
                <p class="mt-2 text-blue-600">Phone: {invoiceData.shipping_address.phone}</p>
              {/if}
            {/if}
          </div>
        </div>

        <!-- Associated Information -->
        <div class="bg-blue-50 p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-2">Related Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Sales Order Info -->
            {#if invoiceData?.salesorders && invoiceData.salesorders.length > 0}
              <div class="border border-blue-200 bg-white rounded-lg p-3">
                <h3 class="font-semibold mb-1">Associated Sales Order</h3>
                {#each invoiceData.salesorders as salesOrder}
                  <p><strong>Order Number:</strong> {salesOrder.salesorder_number}</p>
                  <p><strong>Reference:</strong> {salesOrder.reference_number || 'N/A'}</p>
                  <p><strong>Date:</strong> {formatDate(salesOrder.date)}</p>
                  <p><strong>Status:</strong> {salesOrder.salesorder_order_status.toUpperCase()}</p>
                {/each}
              </div>
            {/if}
            
            <!-- Sales Person Info -->
            {#if invoiceData?.salesperson_name}
              <div class="border border-blue-200 bg-white rounded-lg p-3">
                <h3 class="font-semibold mb-1">Sales Person</h3>
                <p>{invoiceData.salesperson_name}</p>
                {#if invoiceData.salesperson_id}
                  <p class="text-sm text-gray-500">ID: {invoiceData.salesperson_id}</p>
                {/if}
              </div>
            {/if}
            
            <!-- Submitted By Info -->
            {#if invoiceData?.submitted_by_name}
              <div class="border border-blue-200 bg-white rounded-lg p-3">
                <h3 class="font-semibold mb-1">Submitted By</h3>
                <p>{invoiceData.submitted_by_name}</p>
                <p class="text-sm">{invoiceData.submitted_by_email || ''}</p>
                <p><strong>Date:</strong> {formatDate(invoiceData.submitted_date)}</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Line Items -->
        <div>
          <h2 class="text-xl font-semibold text-blue-800 mb-4">Line Items</h2>
          <div class="bg-white shadow rounded-lg overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#if invoiceData?.line_items}
                  {#each invoiceData.line_items as item, index}
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td class="px-6 py-4 text-sm text-gray-900">
                        <div class="font-medium">{item.name}</div>
                        <div class="text-gray-500">{item.description || ''}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hsn_or_sac || ''}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit || ''}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate).replace('₹', '')}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {#if item.line_item_taxes && item.line_item_taxes.length > 0}
                          {item.line_item_taxes[0].tax_percentage}%
                        {/if}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total).replace('₹', '')}</td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        <!-- HSN/SAC Summary -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">HSN/SAC Summary</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Amount</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Rate</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Amount</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tax</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#if invoiceData?.line_items}
                  {#each [...new Set(invoiceData.line_items.map(item => item.hsn_or_sac))] as hsn}
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hsn}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(invoiceData.line_items
                          .filter(item => item.hsn_or_sac === hsn)
                          .reduce((sum, item) => sum + item.item_total, 0)).replace('₹', '')}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoiceData.line_items
                          .find(item => item.hsn_or_sac === hsn)?.line_item_taxes[0]?.tax_percentage}%
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(invoiceData.line_items
                          .filter(item => item.hsn_or_sac === hsn)
                          .reduce((sum, item) => sum + (item.line_item_taxes[0]?.tax_amount || 0), 0)).replace('₹', '')}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(invoiceData.line_items
                          .filter(item => item.hsn_or_sac === hsn)
                          .reduce((sum, item) => sum + (item.line_item_taxes[0]?.tax_amount || 0), 0)).replace('₹', '')}
                      </td>
                    </tr>
                  {/each}
                  <tr class="font-medium bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoiceData.sub_total).replace('₹', '')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoiceData.tax_total).replace('₹', '')}</td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Order Totals -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">Invoice Totals</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Sub Total:</span>
              <span>{formatCurrency(invoiceData?.sub_total || 0)}</span>
            </div>
            {#if invoiceData?.taxes && invoiceData.taxes.length > 0}
              {#each invoiceData.taxes as tax}
                <div class="flex justify-between">
                  <span>{tax.tax_name}:</span>
                  <span>{formatCurrency(tax.tax_amount)}</span>
                </div>
              {/each}
            {/if}
            <div class="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span>{formatCurrency(invoiceData?.total || 0)}</span>
            </div>
            <div class="flex justify-between text-blue-600 font-semibold pt-2">
              <span>Balance Due:</span>
              <span>{formatCurrency(invoiceData?.balance || 0)}</span>
            </div>
          </div>
        </div>

        <!-- Bank Details -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">Bank Details</h2>
          <div class="space-y-2">
            <p><strong>Account Name:</strong> VC TECHNOSOLUTIONS PVT LTD</p>
            <p><strong>Bank Name:</strong> ICICI Bank</p>
            <p><strong>Account No:</strong> 148605001128</p>
            <p><strong>IFSCODE:</strong> ICIC0001486</p>
          </div>
          <div class="mt-8 pt-8 border-t border-gray-300">
            <p>Authorized Signature</p>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">Additional Information</h2>
          <div class="space-y-2">
            <p><strong>Created:</strong> {formatDate(invoiceData?.created_date || '')} by {invoiceData?.created_by_name || ''}</p>
            <p><strong>Last Modified:</strong> {new Date(invoiceData?.last_modified_time || '').toLocaleString('en-IN')}</p>
            {#if invoiceData?.submitted_date}
              <p><strong>Submitted On:</strong> {formatDate(invoiceData.submitted_date)}</p>
            {/if}
            {#if invoiceData?.current_sub_status}
              <p><strong>Current Sub-Status:</strong> {invoiceData.current_sub_status.replace(/_/g, ' ')}</p>
            {/if}
            {#if invoiceData?.branch_name}
              <p><strong>Branch:</strong> {invoiceData.branch_name}</p>
            {/if}
            {#if invoiceData?.einvoice_details?.status_formatted}
              <p><strong>E-Invoice Status:</strong> {invoiceData.einvoice_details.status_formatted}</p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{#if isLoadingNavigate}
  <CustomLoader message="Please Wait, Redirecting..." />
{/if}

<style>
  :global(body) {
    background-color: #f3f4f6;
  }
</style>
