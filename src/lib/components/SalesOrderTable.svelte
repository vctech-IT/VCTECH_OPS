<!-- salesOrderTable.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { SalesOrder } from '$lib/types';
    import { goto } from '$app/navigation';
    import { 
        CheckCircle, 
        AlertCircle, 
        XCircle, 
        HelpCircle, 
        Loader2
    } from 'lucide-svelte';
    export let orders: (SalesOrder & { opsStatus: number | null })[] = [];
    export let columns: { key: string; label: string; selected: boolean }[] = [];

    let isLoading = false;
    const dispatch = createEventDispatcher();

    function getColumnValue(order: SalesOrder & { opsStatus: number | null }, key: string) {
        switch(key) {
            case 'date': return formatDate(order.date);
            case 'salesorder_number': return order.salesorder_number;
            case 'customer_name': return order.customer_name;
            case 'reference_number': return order.reference_number;
            case 'total': return formatCurrency(order.total);
            case 'order_status': return order.order_status;
            case 'invoiced_status': return order.invoiced_status;
            case 'paid_status': return order.paid_status;
            case 'ops_status': return order.opsStatus !== null ? `Stage ${order.opsStatus}` : 'N/A';
            case 'shipment_date': return order.shipment_date ? formatDate(order.shipment_date) : 'N/A';
            case 'status': return order.status;
            case 'delivery_method': return order.delivery_method;
            default: return '';
        }
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    async function handleRowClick(order: SalesOrder) {
        isLoading = true;
        await goto(`/salesOrder/${order.salesorder_id}`);
        isLoading = false;
    }

    function getOpsStatusColor(stage: number | null) {
        if (stage === null) return 'bg-gray-100 text-gray-800';
        switch(stage) {
            case 0: return 'bg-red-100 text-red-800';
            case 1: return 'bg-yellow-100 text-yellow-800';
            case 2: return 'bg-blue-100 text-blue-800';
            case 3: return 'bg-green-100 text-green-800';
            case 4: return 'bg-purple-100 text-purple-800';
            case 5: return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getOrderStatusColor(status: string) {
        const colors: any = {
            'draft': 'bg-gray-100 text-gray-800',
            'open': 'bg-green-100 text-green-800',
            'pending_approval': 'bg-yellow-100 text-yellow-800',
            'closed': 'bg-blue-100 text-blue-800',
            'void': 'bg-purple-100 text-purple-800',
            'default': 'bg-red-100 text-red-800'
        };
        return colors[status.toLowerCase()] || colors.default;
    }

    function getStatusText(status: string) {
        if (status === 'pending_approval') return 'Pending Approval';
        if (status === 'open') return 'Confirmed';
        if (status == 'invoiced') return 'Invoiced';
        if (status == 'closed') return 'Closed';
        if (status == 'void') return 'Void';
        if (status == 'partially_invoiced') return 'Partially Invoiced';
        if (status == 'draft') return 'Draft';
        if (status == 'not_invoiced') return 'Not Invoiced';
        if (status == 'partially_paid') return 'Partially Paid';
        if (status == 'unpaid') return 'Unpaid';
        if (status == 'paid') return 'Paid';
        return status;
    }

    function getStatusColor(status: string) {
        const colors: any = {
            'pending_approval': 'bg-yellow-100 text-yellow-800',
            'closed': 'bg-blue-100 text-blue-800',
            'open': 'bg-green-100 text-green-800',
            'invoiced': 'bg-sky-200 text-green-800',
            'void': 'bg-purple-100 text-purple-800',
            'draft': 'bg-gray-200 text-gray-800',
            'default': 'bg-red-100 text-blue-800'
        };
        return colors[status] || colors.default;
    }

    function getStatusIcon(status: string) {
        if (status === 'invoiced') return CheckCircle;
        if (status === 'paid') return CheckCircle;
        if (status === 'partially_invoiced') return AlertCircle;
        if (status === 'partially_paid') return AlertCircle;
        if (status === 'not_invoiced') return XCircle;
        if (status === 'unpaid') return XCircle;
        return HelpCircle;
    }

    function getIconStatusColor(status: string) {
        const colors: any = {
            'invoiced': 'green',
            'paid': 'green',
            'partially_invoiced': 'orange',
            'partially_paid': 'orange',
            'not_invoiced': 'red',
            'unpaid': 'red',
            'default': 'gray'
        };
        return colors[status] || colors.default;
    }
</script>

<!-- Updated Container with Vertical Scrolling -->
<div class="overflow-x-auto overflow-y-auto max-h-[600px] bg-white shadow-md rounded-lg">
    <table class="min-w-full divide-y divide-blue-200">
        <thead class="bg-blue-500">
            <tr>
                {#each columns.filter(col => col.selected) as column}
                    <!-- Apply sticky classes to each <th> -->
                    <th 
                        class="sticky top-0 z-0 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap bg-blue-500"
                    >
                        {column.label}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-blue-100">
            {#each orders as order, index}
                <tr 
                    class="hover:bg-blue-50 cursor-pointer transition-colors duration-200 {index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}"
                    on:click={() => handleRowClick(order)}
                >
                    {#each columns as column}
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {#if column.key === 'order_status' || column.key === 'status'}
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusColor(getColumnValue(order, column.key))}">
                                    {getStatusText(getColumnValue(order, column.key))}
                                </span>
                            {:else if column.key === 'invoiced_status' || column.key === 'payment_status'}
                                <span class="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full" title={getStatusText(getColumnValue(order, column.key)) || 'Undefined'}>
                                    <svelte:component 
                                        this={getStatusIcon(getColumnValue(order, column.key))} 
                                        color={getIconStatusColor(getColumnValue(order, column.key))} 
                                        class="w-6 h-6 icon-hover" 
                                    />
                                </span>
                            {:else if column.key === 'ops_status'}
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getOpsStatusColor(order.opsStatus)}">
                                    {getColumnValue(order, column.key)}
                                </span>
                            {:else}
                                {getColumnValue(order, column.key)}
                            {/if}
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

{#if isLoading}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <Loader2 class="animate-spin text-blue-500 w-16 h-16" />
    </div>
{/if}

<style>
    /* Existing styles can remain, but ensure no conflicts with Tailwind */

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
    .bg-gray-100 { background-color: #f3f4f6; }
    .text-gray-800 { color: #1f2937; }
    .bg-green-100 { background-color: #d1fae5; }
    .text-green-800 { color: #065f46; }
    .bg-yellow-100 { background-color: #fef3c7; }
    .text-yellow-800 { color: #92400e; }
    .bg-purple-100 { background-color: #ede9fe; }
    .text-purple-800 { color: #5b21b6; }
    .bg-red-100 { background-color: #fee2e2; }
    .text-red-800 { color: #991b1b; }
    .text-green-500:hover { @layer text-green-600; }
    .text-yellow-500:hover { @layer text-yellow-600; }
    .text-red-500:hover { @layer text-red-600; }
    .text-gray-500:hover { @layer text-gray-600; }
    tr:hover td {
        background-color: rgba(59, 130, 246, 0.05);
    }
    .icon-hover {
        transition: filter 0.2s ease-in-out;
    }
    .icon-hover:hover {
        filter: brightness(0.8);
    }
</style>
