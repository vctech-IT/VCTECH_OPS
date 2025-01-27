<script lang="ts">
    import '$lib/styles/app.css'
    import type { PageData } from './$types';
    import { disableScrollHandling, goto } from '$app/navigation';
    import SalesOrderTable from '$lib/components/SalesOrderTable.svelte';
    import type { SalesOrder } from '$lib/types';
    import { loading } from '$lib/stores/loading';
    import { onMount } from 'svelte';
    import ColumnSelector from '$lib/components/ColumnSelector.svelte';
    import { clickOutside } from '$lib/actions/clickOutside';
    import { Search, Filter, Columns, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

    let showColumnSelector = false;
    let columns = [
        { key: 'date', label: 'Date', selected: true, disableScrollHandling },
        { key: 'salesorder_number', label: 'Sales Order Number', selected: true },
        { key: 'customer_name', label: 'Customer Name', selected: true },
        { key: 'reference_number', label: 'Reference Number', selected: true },
        { key: 'total', label: 'Total', selected: true },
        { key: 'status', label: 'Status', selected: true },
        { key: 'invoiced_status', label: 'Invoiced Status', selected: true },
        { key: 'payment_status', label: 'Payment Status', selected: true },
        { key: 'ops_status', label: 'Ops Status', selected: true },
        { key: 'shipment_date', label: 'Shipment Date', selected: true },
        { key: 'order_status', label: 'Order Status', selected: true },
        { key: 'delivery_method', label: 'Delivery Method', selected: true }
    // Add more columns as needed
    ];

    let opsStatusFilter = 'all';
    const opsStatusOptions = [
        { value: 'all', label: 'All OPS Status' },
        { value: 'null', label: 'N/A' },
        { value: '0', label: 'Stage 0' },
        { value: '1', label: 'Stage 1' },
        { value: '2', label: 'Stage 2' },
        { value: '3', label: 'Stage 3' },
        { value: '4', label: 'Stage 4' },
        { value: '5', label: 'Stage 5' },
    ];

    function toggleColumnSelector() {
    showColumnSelector = !showColumnSelector;
    }

    function handleColumnChange(event: CustomEvent) {
    columns = event.detail;
    }

    export let data: PageData;
    let orders: SalesOrder[] = [];
    let totalOrders = 7340; 
    let totalPages = totalOrders > 0 ? Math.ceil(totalOrders / 200) : 0;
    let searchTerm = '';
    let errorMessage = '';
    let statusFilter = 'all';

    onMount(() => {
        orders = data.orders as SalesOrder[];
    });

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'void', label: 'Void' },
        // Add more status options as needed
    ];

    async function changePage(pageNumber: number) {
        if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
        loading.set(true);
        try {
            await goto(`?page=${pageNumber}&search=${searchTerm}&status=${statusFilter}`);
            orders = data.orders as SalesOrder[];
            errorMessage = '';
        } catch (error) {
            console.error('Error changing page:', error);
            errorMessage = 'An error occurred while fetching orders. Please try again.';
        } finally {
            loading.set(false);
        }
    }

    async function handleSearch() {
        loading.set(true);
        errorMessage = '';
        try {
            await goto(`?search=${encodeURIComponent(searchTerm.trim())}&status=${statusFilter}&opsStatus=${opsStatusFilter}`);
            orders = data.orders as SalesOrder[];
            totalOrders = totalOrders;
            totalPages = totalOrders > 0 ? Math.ceil(totalOrders / 200) : 0;
            if (orders.length === 0) {
                errorMessage = 'No orders found for the given search term and filters.';
            }
        } catch (error) {
            console.error('Error searching orders:', error);
            errorMessage = 'An error occurred while searching. Please try again.';
        } finally {
            loading.set(false);
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }

    function handleRowClick(event: CustomEvent<SalesOrder>) {
        const order = event.detail;
        console.log('Clicked order:', order);
    }

    function getPageNumbers(current: number, total: number): (number | string)[] {
        const pages: (number | string)[] = [];
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 3) {
            pages.push(1, 2, 3, 4, '...', total);
        } else if (current >= total - 2) {
            pages.push(1, '...', total - 3, total - 2, total - 1, total);
        } else {
            pages.push(1, '...', current - 1, current, current + 1, '...', total);
        }
        return pages;
    }

    function prevPage() {
        if (data.currentPage > 1) {
            changePage(data.currentPage - 1);
        }
    }

    function nextPage() {
        if (data.hasMore) {
            changePage(data.currentPage + 1);
        }
    }
</script>

<div class="container mx-auto px-4 py-8 overflow-hidden">
    <div class="mb-6 flex flex-wrap items-center gap-4">
        <div class="flex-grow flex items-center">
            <input
                type="text"
                bind:value={searchTerm}
                on:keypress={handleKeyPress}
                placeholder="Search by order number"
                class="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                on:click={handleSearch}
                class="p-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                title="Search"
            >
                <Search size={20} />
            </button>
        </div>
        <div class="flex items-center gap-2">
            <div class="relative">
                <select
                    bind:value={statusFilter}
                    on:change={handleSearch}
                    class="appearance-none px-4 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    {#each statusOptions as option}
                    <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <Filter size={16} />
                </div>
            </div>
            <div class="relative">
                <select
                    bind:value={opsStatusFilter}
                    on:change={handleSearch}
                    class="appearance-none px-4 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    {#each opsStatusOptions as option}
                    <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <Filter size={16} />
                </div>
            </div>
            <button
                on:click={toggleColumnSelector}
                class="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                title="Toggle Columns"
            >
                <Columns size={20} />
            </button>
        </div>
    </div>

    {#if showColumnSelector}
    <div use:clickOutside on:clickoutside={toggleColumnSelector} class="absolute z-10 mt-2 right-4">
        <ColumnSelector {columns} on:change={handleColumnChange} />
    </div>
    {/if}

    {#if errorMessage}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">{errorMessage}</span>
        </div>
    {/if}
        
    {#if orders.length > 0}
     <div class="h-[calc(100vh-250px)] overflow-auto">
        <SalesOrderTable
            {orders}
            columns={columns.filter(col => col.selected)}
            on:rowClick={handleRowClick}
        />
    </div>


    <div class="flex justify-between items-center my-6">
        <button
            on:click={prevPage}
            disabled={data.currentPage === 1}
            class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
        >
            Previous
        </button>
        
        <span class="text-gray-600">
            Page {data.currentPage}
        </span>
        
        <button
            on:click={nextPage}
            disabled={!data.hasMore}
            class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
        >
            Next
        </button>
    </div>
    {:else if !errorMessage}
        <div class="text-center py-8">
            <p class="text-xl text-gray-600">No orders found.</p>
        </div>
    {/if}
</div>

{#if $loading}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="loading-spinner"></div>
            <p class="mt-4 text-center">Loading...</p>
        </div>
    </div>
{/if}

<style>
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>