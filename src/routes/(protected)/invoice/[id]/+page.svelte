<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import '$lib/styles/app.css';
  import { ArrowLeft } from 'svelte-lucide';

  export let data: PageData;

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  async function goBack() {
    await goto('/');
  }
</script>

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
            <h1 class="text-2xl font-bold text-white">Invoice: {data.invoice.invoice_number}</h1>
          </div>
          <span class="px-4 py-2 rounded-full text-sm font-medium {getStatusColor(data.invoice.status)}">
            {data.invoice.status}
          </span>
        </div>
      </div>

      <div class="p-6 space-y-8">
        <!-- Invoice Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Billing Address</h2>
            <p class="font-medium">{data.invoice.customer_name}</p>
            <p>{data.invoice.billing_address.address}</p>
            {#if data.invoice.billing_address.street2}
              <p>{data.invoice.billing_address.street2}</p>
            {/if}
            <p>{data.invoice.billing_address.city}, {data.invoice.billing_address.state} {data.invoice.billing_address.zip}</p>
            <p>{data.invoice.billing_address.country}</p>
            <p class="mt-2 text-blue-600">GST No: {data.invoice.gst_no}</p>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Shipping Address</h2>
            <p class="font-medium">{data.invoice.customer_name}</p>
            <p>{data.invoice.shipping_address.address}</p>
            {#if data.invoice.shipping_address.street2}
              <p>{data.invoice.shipping_address.street2}</p>
            {/if}
            <p>{data.invoice.shipping_address.city}, {data.invoice.shipping_address.state} {data.invoice.shipping_address.zip}</p>
            <p>{data.invoice.shipping_address.country}</p>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Invoice Details</h2>
            <p><strong>Invoice #:</strong> {data.invoice.invoice_number}</p>
            <p><strong>Date:</strong> {formatDate(data.invoice.date)}</p>
            <p><strong>Due Date:</strong> {formatDate(data.invoice.due_date)}</p>
            <p><strong>Payment Terms:</strong> {data.invoice.payment_terms_label}</p>
            <p><strong>Currency:</strong> {data.invoice.currency_code}</p>
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
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each data.invoice.line_items as item, index}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      <div class="font-medium">{item.name}</div>
                      <div class="text-gray-500">{item.description}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Invoice Totals -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">Invoice Totals</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Sub Total:</span>
              <span>{formatCurrency(data.invoice.sub_total)}</span>
            </div>
            {#each data.invoice.taxes as tax}
              <div class="flex justify-between">
                <span>{tax.tax_name}:</span>
                <span>{formatCurrency(tax.tax_amount)}</span>
              </div>
            {/each}
            <div class="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span>{formatCurrency(data.invoice.total)}</span>
            </div>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="bg-white p-4 rounded-lg shadow">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">Additional Information</h2>
          <div class="space-y-2">
            <p><strong>Notes:</strong> {data.invoice.notes || 'N/A'}</p>
            <p><strong>Terms:</strong> {data.invoice.terms || 'N/A'}</p>
            <p><strong>Created:</strong> {formatDate(data.invoice.created_time)}</p>
            <p><strong>Last Modified:</strong> {formatDate(data.invoice.last_modified_time)}</p>
            <p><strong>Payment Status:</strong> Balance: {formatCurrency(data.invoice.balance)}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
