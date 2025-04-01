<!-- routes/invoice/deliveryChallan/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Download, ChevronDown } from 'svelte-lucide';
  import '$lib/styles/app.css';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  import CustomLoader from '$lib/components/CustomLoader.svelte';
  
  export let data;
  
  const { deliveryChallan } = data;
  let isLoadingNavigate = false;
  
const formatCurrency = (amount: number, currencySymbol: string = '₹') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('₹', currencySymbol);
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
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'void':
        return 'bg-gray-100 text-gray-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  async function goBack() {
    isLoadingNavigate = true;
    await goto('/deliveryChallan');
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
            <h1 class="text-2xl font-bold text-white">Delivery Challan: {deliveryChallan?.deliverychallan_number || ''}</h1>
          </div>
          <div class="flex items-center space-x-3">
            <span class="px-4 py-2 rounded-full text-sm font-medium bg-white {getStatusColor(deliveryChallan?.challan_status || '')}">
              {(deliveryChallan?.challan_status || '')?.replace(/_/g, ' ').toUpperCase()}
            </span>
            
            {#if deliveryChallan?.documents && deliveryChallan.documents.length > 0}
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
                    {#each deliveryChallan.documents as doc}
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
        <!-- Company and Challan Info -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">From</h2>
            <p class="font-medium">VC TECHNOSOLUTIONS PRIVATE LIMITED</p>
            <p>VC Technosolutions Corporate Office</p>
            <p>Plot No 17-25, Sector - 17, Kamothe</p>
            <p>Navi Mumbai Maharashtra 410209</p>
            <p>India</p>
            <p class="mt-2 text-blue-600">GSTIN: 27AAHCV4369B1Z8</p>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Challan Details</h2>
            <p><strong>Challan Number:</strong> {deliveryChallan?.deliverychallan_number || ''}</p>
            <p><strong>Challan Date:</strong> {formatDate(deliveryChallan?.date || '')}</p>
            <p><strong>Reference Number:</strong> {deliveryChallan?.reference_number || 'N/A'}</p>
            <p><strong>Challan Type:</strong> {deliveryChallan?.challan_type ? deliveryChallan.challan_type.charAt(0).toUpperCase() + deliveryChallan.challan_type.slice(1) : 'N/A'}</p>
            <p><strong>Place Of Supply:</strong> {deliveryChallan?.place_of_supply || 'N/A'}</p>
            <p><strong>Status:</strong> {(deliveryChallan?.challan_status || '')?.replace(/_/g, ' ').toUpperCase()}</p>
            <p><strong>Branch:</strong> {deliveryChallan?.branch_name || 'N/A'}</p>
          </div>
        </div>

        <!-- Customer & Delivery Info -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Delivery Address</h2>
            <p class="font-medium">{deliveryChallan?.customer_name || ''}</p>
            {#if deliveryChallan?.shipping_address}
              <p>{deliveryChallan.shipping_address.address || ''}</p>
              {#if deliveryChallan.shipping_address.street2}
                <p>{deliveryChallan.shipping_address.street2}</p>
              {/if}
              <p>{deliveryChallan.shipping_address.city || ''}, {deliveryChallan.shipping_address.state || ''} {deliveryChallan.shipping_address.zip || ''}</p>
              <p>{deliveryChallan.shipping_address.country || ''}</p>
              {#if deliveryChallan.shipping_address.phone}
                <p class="mt-2 text-blue-600">Phone: {deliveryChallan.shipping_address.phone}</p>
              {/if}
            {/if}
            {#if deliveryChallan?.gst_no}
              <p class="mt-2 text-blue-600">GSTIN: {deliveryChallan.gst_no}</p>
            {/if}
          </div>

          <div class="bg-blue-50 p-4 rounded-lg shadow">
            {#if deliveryChallan?.notes || deliveryChallan?.terms}
              <div class="space-y-4">
                {#if deliveryChallan?.notes}
                  <div>
                    <h2 class="text-lg font-semibold text-blue-800 mb-2">Notes</h2>
                    <p class="whitespace-pre-line">{deliveryChallan.notes}</p>
                  </div>
                {/if}
                
                {#if deliveryChallan?.terms}
                  <div>
                    <h2 class="text-lg font-semibold text-blue-800 mb-2">Terms & Conditions</h2>
                    <p class="whitespace-pre-line">{deliveryChallan.terms}</p>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="flex items-center justify-center h-full">
                <p class="text-gray-500 italic">No additional information available</p>
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
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#if deliveryChallan?.line_items}
                  {#each deliveryChallan.line_items as item, index}
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td class="px-6 py-4 text-sm text-gray-900">
                        <div class="font-medium">{item.name}</div>
                        <div class="text-gray-500">{item.description || ''}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hsn_or_sac || 'N/A'}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit || ''}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate, deliveryChallan.currency_symbol || '₹').replace('₹', '')}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total, deliveryChallan.currency_symbol || '₹').replace('₹', '')}</td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Order Totals -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">Challan Totals</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Sub Total:</span>
              <span>{formatCurrency(deliveryChallan?.sub_total || 0, deliveryChallan?.currency_symbol || '₹')}</span>
            </div>
            {#if deliveryChallan?.taxes && deliveryChallan.taxes.length > 0}
              {#each deliveryChallan.taxes as tax}
                <div class="flex justify-between">
                  <span>{tax.tax_name}:</span>
                  <span>{tax.tax_amount_formatted || formatCurrency(tax.tax_amount, deliveryChallan?.currency_symbol || '₹')}</span>
                </div>
              {/each}
            {/if}
            {#if deliveryChallan?.adjustment !== 0 && deliveryChallan?.adjustment !== undefined}
              <div class="flex justify-between">
                <span>{deliveryChallan?.adjustment_description || 'Adjustment'}:</span>
                <span>{formatCurrency(deliveryChallan.adjustment, deliveryChallan?.currency_symbol || '₹')}</span>
              </div>
            {/if}
            <div class="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span>{formatCurrency(deliveryChallan?.total || 0, deliveryChallan?.currency_symbol || '₹')}</span>
            </div>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">Additional Information</h2>
          <div class="space-y-2">
            <p><strong>Created:</strong> {new Date(deliveryChallan?.created_time || '').toLocaleString('en-IN')}</p>
            <p><strong>Last Modified:</strong> {new Date(deliveryChallan?.last_modified_time || '').toLocaleString('en-IN')}</p>
            {#if deliveryChallan?.created_by_name}
              <p><strong>Created By:</strong> {deliveryChallan.created_by_name}</p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center">
      <p class="text-gray-500 text-sm">© VC Technosolutions Private Limited</p>
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
