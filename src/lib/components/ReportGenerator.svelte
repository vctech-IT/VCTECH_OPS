<script lang="ts">
import { onMount } from 'svelte';
import * as XLSX from 'xlsx';

export let totalOrders: number = 0;
export let totalRevenue: number = 0;
export let activeInstallations: number = 0;
export let activeServices: number = 0;
export let orderCategories: {category: string, count: number, revenue: number}[] = [];
export let ordersByStage: {stage: number, count: number}[] = [];
export let recentOrders: any[] = [];
export let topCustomers: {name: string, totalOrders: number, totalRevenue: number}[] = [];
export let ordersByMonth: {month: number, year: number, count: number, revenue: number}[] = [];
export let averageOrderValue: number = 0;
export let conversionRate: number = 0;

function generateExcelReport() {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Dashboard Summary Report'],
        ['Generated on', new Date().toLocaleString()],
        [],
        ['Key Performance Indicators'],
        ['Metric', 'Value'],
        ['Total Orders', totalOrders],
        ['Total Revenue', totalRevenue !== undefined ? `₹${totalRevenue.toLocaleString()}` : 'N/A'],
        ['Active Installations', activeInstallations],
        ['Active Services', activeServices],
        ['Average Order Value', averageOrderValue !== undefined ? `₹${averageOrderValue.toLocaleString()}` : 'N/A'],
        ['Conversion Rate', `${((conversionRate || 0) * 100).toFixed(2)}%`],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Order Categories sheet
    if (orderCategories && orderCategories.length > 0) {
        const categoriesData = [
            ['Order Categories'],
            ['Category', 'Count', 'Revenue'],
            ...orderCategories.map(c => [c.category, c.count, c.revenue !== undefined ? `₹${c.revenue.toLocaleString()}` : 'N/A'])
        ];
        const categoriesWs = XLSX.utils.aoa_to_sheet(categoriesData);
        XLSX.utils.book_append_sheet(wb, categoriesWs, 'Order Categories');
    }

    // Orders by Stage sheet
    if (ordersByStage && ordersByStage.length > 0) {
        const stageData = [
            ['Orders by Stage'],
            ['Stage', 'Count', 'Description'],
            ...ordersByStage.map(s => [getStageTitle(s.stage), s.count, getStageDescription(s.stage)])
        ];
        const stageWs = XLSX.utils.aoa_to_sheet(stageData);
        XLSX.utils.book_append_sheet(wb, stageWs, 'Orders by Stage');
    }

    // Recent Orders sheet
    if (recentOrders && recentOrders.length > 0) {
        const recentOrdersData = [
            ['Recent Orders'],
            ['SO Number', 'Client Name', 'Total', 'Current Stage', 'Created At'],
            ...recentOrders.map(o => [
                o.SONumber,
                o.clientName,
                o.Total !== undefined ? `₹${o.Total.toLocaleString()}` : 'N/A',
                getStageTitle(o.currentStage),
                o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'
            ])
        ];
        const recentOrdersWs = XLSX.utils.aoa_to_sheet(recentOrdersData);
        XLSX.utils.book_append_sheet(wb, recentOrdersWs, 'Recent Orders');
    }

    // Top Customers sheet
    if (topCustomers && topCustomers.length > 0) {
        const topCustomersData = [
            ['Top Customers'],
            ['Customer', 'Total Orders', 'Total Revenue'],
            ...topCustomers.map(c => [c.name, c.totalOrders, c.totalRevenue !== undefined ? `₹${c.totalRevenue.toLocaleString()}` : 'N/A'])
        ];
        const topCustomersWs = XLSX.utils.aoa_to_sheet(topCustomersData);
        XLSX.utils.book_append_sheet(wb, topCustomersWs, 'Top Customers');
    }

    // Orders by Month sheet
    if (ordersByMonth && ordersByMonth.length > 0) {
        const ordersByMonthData = [
            ['Orders by Month'],
            ['Month', 'Year', 'Order Count', 'Revenue'],
            ...ordersByMonth.map(o => [
                getMonthName(o.month),
                o.year,
                o.count,
                o.revenue !== undefined ? `₹${o.revenue.toLocaleString()}` : 'N/A'
            ])
        ];
        const ordersByMonthWs = XLSX.utils.aoa_to_sheet(ordersByMonthData);
        XLSX.utils.book_append_sheet(wb, ordersByMonthWs, 'Orders by Month');
    }

    // Generate Excel file
    XLSX.writeFile(wb, 'comprehensive_dashboard_report.xlsx');
}

function getStageTitle(stage: number): string {
    switch (stage) {
        case 0: return "Site Not Ready";
        case 1: return "Logistic";
        case 2: return "Material to Procure";
        case 3: return "Ongoing";
        case 4: return "Return Pickup";
        case 5: return "Share With Account";
        default: return "Unknown Stage";
    }
}

function getStageDescription(stage: number): string {
    switch (stage) {
        case 0: return "The site is not yet prepared for installation or service";
        case 1: return "Logistics are being arranged for the order";
        case 2: return "Materials need to be procured for the order";
        case 3: return "The order is currently in progress";
        case 4: return "Items need to be picked up and returned";
        case 5: return "Order details need to be shared with the accounting department";
        default: return "Unknown stage status";
    }
}

function getMonthName(month: number): string {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return monthNames[month - 1] || "Unknown Month";
}
</script>

<button
    on:click={generateExcelReport}
    class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
>
    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
    </svg>
    Generate Comprehensive Report
</button>