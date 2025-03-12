<!-- dashboard/+page.svelte -->
<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import Chart from 'chart.js/auto';
import DateRangePicker from '$lib/components/DateRangePicker.svelte';
import KPICard from '$lib/components/KPICard.svelte';
import KPISTAGECard from '$lib/components/KPICARDSTAGE.svelte';
import ReportGenerator from '$lib/components/ReportGenerator.svelte';
import OrderTable from '$lib/components/OrderTable.svelte';
import Modal from '$lib/components/Modal.svelte';
import Tabs from '$lib/components/Tabs.svelte';
import LineChart from '$lib/components/LineChart.svelte';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
import { goto } from '$app/navigation';
import { fade, fly } from 'svelte/transition';
import { quintOut } from 'svelte/easing';
import {  Filter } from 'lucide-svelte';
import { ArrowUpDown } from 'lucide-svelte';
import { ChevronDown, ChevronUp, Search } from 'lucide-svelte';
import { Interface } from 'readline';
import CustomLoader from '$lib/components/CustomLoader.svelte';



interface DashboardState {
  activeTab: number;
  orderStatus: string;
  selectedPM: string;
  showModal: boolean;
  selectedClient: string | null;
  selectedCategory: string | null;
  searchTerm: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  filterCategory: string;
  modalContent: ModalContent;
  dateRange: { start: string | null; end: string | null };
}

let totalOrders = 0;
let activeTab = 0;
let totalRevenue = 0;
let activeInstallations = 0;
let activeServices = 0;
let installationDetails: any;
let serviceDetails: any;
let orderCategories: {category: string, count: number, revenue: number}[] = [];
let ordersByStage: {stage: number, count: number}[] = [];
let recentOrders: any[] = [];
let topCustomers: {name: string, totalOrders: number, totalRevenue: number}[] = [];
let ordersByMonth: {month: number, year: number, count: number, revenue: number}[] = [];
let averageOrderValue = 0;
let conversionRate = 0;
let dateRange = { start: null, end: null };
let orderChart: Chart;
let showModal = false;
let orderStatus = 'open';
let selectedClient: string | null = null;
let selectedCategory: string | null = null;
let pmNames: string[] = [];
let selectedPM: string = 'all';
let isLoadingKPIData = false;
let allOrders = []; 
let visibleOrders = []; 
let pageSize = 20; 
let currentPage = 0;
let isLoadingMoreOrders = false;

let isLoadingReferences = false;

interface OrderDetail {
  SONumber: string;
  SOId: string;
  clientName: string;
  SOCategory: string;
  SOAmount: number;
  referenceNumber?: string;
}

let searchTerm = '';
let sortColumn = 'SONumber';
let sortDirection: 'asc' | 'desc' = 'asc';
let filterCategory = 'All';

$: filteredAndSortedOrders = modalContent.orderDetails
  ? modalContent.orderDetails
      .filter(order => 
        (filterCategory === 'All' || order.SOCategory === filterCategory) &&
        (order.SONumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.SOCategory.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const aValue = a[sortColumn].toLowerCase();
        const bValue = b[sortColumn].toLowerCase();
        const compareResult = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? compareResult : -compareResult;
      })
  : [];

$: categories = ['All', ...new Set(modalContent.orderDetails.map(order => order.SOCategory))];

function toggleSort(column: string) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }
  saveState();
}

let agingData: {
  summary: { [key: number]: { onTime: number; overdue: number } };
  details: Array<{
    SONumber: string;
    SOId: string;
    stage: number;
    ageInHours: number;
    isOverdue: boolean;
    lastUpdated: string;
  }>;
} = { summary: {}, details: [] };

onMount(() => {
  loadState();
  if (!modalContent.orderDetails.length) {
    fetchDashboardData();
  }
});

if (browser) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadState();
    }
  });

  window.addEventListener('beforeunload', () => {
    saveState();
  });
}

onDestroy(() => {
  saveState();
});

interface ModalContent {
  title: string;
  totalOrders: number;
  totalSum: number;
  categorizedData: {
    byClient: { [key: string]: { orders: number; sum: number; soNumbers: string[] } };
    byCategory: { [key: string]: { orders: number; sum: number; soNumbers: string[] } };
  };
  soNumbers: Array<{ SONumber: string; SOId: string }>;
  details?: Array<{
    SONumber: string;
    SOId: string;
    clientName: string;
    category: string;
    cost: number;
    engName: string;
    scheduleDate: Date;
    vendorName: string;
  }>;
  agingData: { [key: string]: any },
  orderDetails: OrderDetail[];
}

let modalContent: ModalContent = {
  title: 'Modal Title',
  totalOrders: 0,
  totalSum: 0,
  categorizedData: {
    byClient: {},
    byCategory: {}
  },
  soNumbers: [],
  agingData: {},
  orderDetails: []

};

function loadState() {
  if (!browser) return;
  
  try {
    const savedState = localStorage.getItem('dashboardState');
    if (savedState) {
      const state: DashboardState = JSON.parse(savedState);
      
      // Restore all state values
      activeTab = state.activeTab;
      orderStatus = state.orderStatus;
      selectedPM = state.selectedPM;
      showModal = state.showModal;
      selectedClient = state.selectedClient;
      selectedCategory = state.selectedCategory;
      searchTerm = state.searchTerm;
      sortColumn = state.sortColumn;
      sortDirection = state.sortDirection;
      filterCategory = state.filterCategory;
      modalContent = state.modalContent;
      
      // Restore dateRange if it exists
      if (state.dateRange) {
        dateRange = state.dateRange;
      }
      
      // Immediately fetch dashboard data with restored filters
      fetchDashboardData();
    }
  } catch (error) {
    console.error('Error loading dashboard state:', error);
    // If there's an error, clear the corrupted state
    localStorage.removeItem('dashboardState');
  }
}

function saveState() {
  if (!browser) return;
  
  try {
    const state: DashboardState = {
      activeTab,
      orderStatus,
      selectedPM,
      showModal,
      selectedClient,
      selectedCategory,
      searchTerm,
      sortColumn,
      sortDirection,
      filterCategory,
      modalContent,
      dateRange
    };
    
    localStorage.setItem('dashboardState', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving dashboard state:', error);
  }
}


function sortStages(a: any, b: any) {
  return a.stage - b.stage;
}

function showSONumbers(item: string, type: 'client' | 'category') {
  if (type === 'client') {
    selectedClient = selectedClient === item ? null : item;
    selectedCategory = null;
  } else {
    selectedCategory = selectedCategory === item ? null : item;
    selectedClient = null;
  }
  saveState();
}


async function fetchDashboardData() {
  const response = await fetch('/api/dashboard-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...dateRange, orderStatus, pmNameFilter: selectedPM })
  });
  const data = await response.json();
 
  totalOrders = data.totalOrders;
  totalRevenue = data.totalRevenue;
  activeInstallations = data.activeInstallations;
  activeServices = data.activeServices;
  installationDetails = data.installationDetails;
  serviceDetails = data.serviceDetails;
  orderCategories = data.orderCategories;
  ordersByStage = data.ordersByStage;
  recentOrders = data.recentOrders;
  topCustomers = data.topCustomers;
  ordersByMonth = data.ordersByMonth;
  averageOrderValue = data.averageOrderValue;
  conversionRate = data.conversionRate;
  agingData = data.agingData;
  pmNames = data.pmNames;
  updateChart();
}

function getAgingColor(isOverdue: boolean): string {
  return isOverdue ? 'bg-red-500 text-white' : 'bg-green-500 text-white';
}

function handleOrderStatusChange(event) {
  orderStatus = (event.target as HTMLSelectElement).value;
  saveState();
  fetchDashboardData();
}

function processInstallationData(details: any[], totalInstallations: number): ModalContent {
  let totalSum = 0;
  let byClient: { [key: string]: { orders: number; sum: number; soNumbers: string[] } } = {};
  let byCategory: { [key: string]: { orders: number; sum: number; soNumbers: string[] } } = {};
  let soNumbers: Array<{ SONumber: string; SOId: string }> = [];
  let orderDetails: OrderDetail[] = [];

  for (let installation of details) {
    totalSum += installation.cost;
    soNumbers.push({ SONumber: installation.SONumber, SOId: installation.SOId });

    if (!byClient[installation.clientName]) {
      byClient[installation.clientName] = { orders: 0, sum: 0, soNumbers: [] };
    }
    byClient[installation.clientName].orders++;
    byClient[installation.clientName].sum += installation.cost;
    byClient[installation.clientName].soNumbers.push(installation.SONumber);

    if (!byCategory[installation.category]) {
      byCategory[installation.category] = { orders: 0, sum: 0, soNumbers: [] };
    }
    byCategory[installation.category].orders++;
    byCategory[installation.category].sum += installation.cost;
    byCategory[installation.category].soNumbers.push(installation.SONumber);

    // Add to orderDetails
    orderDetails.push({
      SONumber: installation.SONumber,
      SOId: installation.SOId,
      clientName: installation.clientName,
      SOCategory: installation.category
    });
  }

  return {
    title: "Total Installations",
    totalOrders: totalInstallations,
    totalSum,
    categorizedData: { byClient, byCategory },
    soNumbers,
    agingData: agingData.details,
    orderDetails
  };
}

function processServiceData(details: any[], totalServices: number): ModalContent {
  let totalSum = 0;
  let byClient: { [key: string]: { orders: number; sum: number; soNumbers: string[] } } = {};
  let byCategory: { [key: string]: { orders: number; sum: number; soNumbers: string[] } } = {};
  let soNumbers: Array<{ SONumber: string; SOId: string }> = [];
  let orderDetails: OrderDetail[] = [];

  for (let service of details) {
    totalSum += service.cost;
    soNumbers.push({ SONumber: service.SONumber, SOId: service.SOId });

    // Process by client
    if (!byClient[service.clientName]) {
      byClient[service.clientName] = { orders: 0, sum: 0, soNumbers: [] };
    }
    byClient[service.clientName].orders++;
    byClient[service.clientName].sum += service.cost;
    byClient[service.clientName].soNumbers.push(service.SONumber);

    // Process by category
    if (!byCategory[service.category]) {
      byCategory[service.category] = { orders: 0, sum: 0, soNumbers: [] };
    }
    byCategory[service.category].orders++;
    byCategory[service.category].sum += service.cost;
    byCategory[service.category].soNumbers.push(service.SONumber);

    // Add to orderDetails
    orderDetails.push({
      SONumber: service.SONumber,
      SOId: service.SOId,
      clientName: service.clientName,
      SOCategory: service.category,
    });
  }

  return {
    title: "Total Services",
    totalOrders: totalServices,
    totalSum,
    categorizedData: { byClient, byCategory },
    soNumbers,
    agingData: agingData.details,
    orderDetails
  };
}

function updateChart() {
  if (orderChart) orderChart.destroy();
  const orderCtx = document.getElementById('orderCategoryChart') as HTMLCanvasElement;
  orderChart = new Chart(orderCtx, {
    type: 'doughnut',
    data: {
      labels: orderCategories.map(c => c.category),
      datasets: [{
        data: orderCategories.map(c => c.count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Order Categories' },
        legend: { position: 'right' }
      }
    }
  });
}

function handleDateRangeChange(event: any) {
  dateRange = event.detail;
  fetchDashboardData();
}

// Initialize cache object in localStorage if it doesn't exist
function initializeCache() {
  if (!localStorage.getItem('referenceNumberCache')) {
    localStorage.setItem('referenceNumberCache', JSON.stringify({}));
  }
}

// Function to save a reference number to cache
function cacheReferenceNumber(soId, referenceNumber) {
  const cache = JSON.parse(localStorage.getItem('referenceNumberCache') || '{}');
  cache[soId] = referenceNumber;
  localStorage.setItem('referenceNumberCache', JSON.stringify(cache));
}

// Function to get reference number from cache
function getCachedReferenceNumber(soId) {
  const cache = JSON.parse(localStorage.getItem('referenceNumberCache') || '{}');
  return cache[soId] || null;
}

// Function to handle table scrolling and load more orders as needed
function handleTableScroll(event) {
  const container = event.target;
  const scrollPosition = container.scrollTop + container.clientHeight;
  const scrollHeight = container.scrollHeight;
  
  // If we're close to the bottom and not already loading more
  if (scrollHeight - scrollPosition < 200 && !isLoadingMoreOrders) {
    loadMoreOrders();
  }
}

// Function to load the next batch of orders
async function loadMoreOrders() {
  if (currentPage * pageSize >= allOrders.length) return;
  
  isLoadingMoreOrders = true;
  
  // Get the next batch of orders
  const nextBatch = allOrders.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  
  // First show orders without reference numbers
  const ordersWithCachedRefs = nextBatch.map(order => {
    // Try to get reference number from cache
    const cachedRef = getCachedReferenceNumber(order.SOId);
    return {
      ...order,
      referenceNumber: cachedRef || ''
    };
  });
  
  // Add to visible orders
  visibleOrders = [...visibleOrders, ...ordersWithCachedRefs];
  currentPage++;
  
  // Then fetch reference numbers only for orders that don't have cached values
  const ordersNeedingRefs = nextBatch.filter(order => !getCachedReferenceNumber(order.SOId));
  
  if (ordersNeedingRefs.length > 0) {
    const orderIds = ordersNeedingRefs.map(o => o.SOId);
    
    try {
      const refResponse = await fetch('/api/reference-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds })
      });
      
      const batchData = await refResponse.json();
      
      // Update visible orders with the new reference numbers
      batchData.references.forEach(ref => {
        // Update in the visible orders array
        const orderIndex = visibleOrders.findIndex(o => o.SOId === ref.SOId);
        if (orderIndex !== -1) {
          visibleOrders[orderIndex].referenceNumber = ref.referenceNumber;
          // Force svelte to update
          visibleOrders = [...visibleOrders];
        }
        
        // Also update in the allOrders array
        const allOrderIndex = allOrders.findIndex(o => o.SOId === ref.SOId);
        if (allOrderIndex !== -1) {
          allOrders[allOrderIndex].referenceNumber = ref.referenceNumber;
        }
        
        // Cache the reference number
        cacheReferenceNumber(ref.SOId, ref.referenceNumber);
      });
    } catch (error) {
      console.error('Error fetching reference numbers:', error);
    }
  }
  
  isLoadingMoreOrders = false;
}



async function handleCardClick(event: any) {
  const { title, value } = event.detail;
  isLoadingKPIData = true;
  
  try {
    const stage = parseInt(title.split(' ')[1]); 
    if (!isNaN(stage)) {

      // Initialize cache
      initializeCache();
      
      // Reset pagination variables
      currentPage = 0;
      visibleOrders = [];

      // Initially, only fetch the basic order data without attempting to get reference numbers
      const response = await fetch('/api/stage-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage, 
          ...dateRange, 
          orderStatus, 
          pmNameFilter: selectedPM,
          skipReferenceNumbers: true 
        })
      });
      
      const data = await response.json();
      allOrders = data.orders;
      modalContent = processModalData(data.orders, getStageTitle(stage), value);
      showModal = true;

      // Load the first page of orders
      loadMoreOrders();
      
      // Set loading to false immediately after showing the modal with basic data
      isLoadingKPIData = false;
      
      // Then load reference numbers asynchronously without blocking the UI
      if (data.orders.length > 0) {
        isLoadingReferences = true;
        
        // Load reference numbers in batches to avoid timeout
        const batchSize = 20;
        const allOrders = [...data.orders];
        const orderDetailsWithReferences = [...modalContent.orderDetails];
        
        for (let i = 0; i < allOrders.length; i += batchSize) {
          const batchOrderIds = allOrders.slice(i, i + batchSize).map(o => o.SOId);
          
          // Create a new endpoint that only fetches reference numbers for specific orders
          const refResponse = await fetch('/api/reference-numbers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIds: batchOrderIds })
          });
          
          const batchData = await refResponse.json();
          
          // Update our order details with the new reference numbers
          batchData.references.forEach(ref => {
            const index = orderDetailsWithReferences.findIndex(o => o.SOId === ref.SOId);
            if (index !== -1) {
              orderDetailsWithReferences[index].referenceNumber = ref.referenceNumber;
            }
          });
          
          // Update the UI after each batch
          modalContent = {
            ...modalContent,
            orderDetails: orderDetailsWithReferences
          };
        }
        
        isLoadingReferences = false;
      }
    } else if (title === "Total Installations") {
      modalContent = processInstallationData(installationDetails, value);
      showModal = true;
      isLoadingKPIData = false;
    } else if (title === "Total Services") {
      modalContent = processServiceData(serviceDetails, value);
      showModal = true;
      isLoadingKPIData = false;
    } else {
      modalContent = { 
        title, 
        totalOrders: value, 
        totalSum: 0, 
        categorizedData: { byClient: {}, byCategory: {} },
        soNumbers: [],
        agingData: agingData.details,
        orderDetails: []
      };
      showModal = true;
      isLoadingKPIData = false;
    }
  } catch (error) {
    console.error('Error loading data:', error);
    isLoadingKPIData = false;
  }
}
function processModalData(orders: any[], title: string, totalOrders: number): ModalContent {
  let totalSum = 0;
  let byClient: { [key: string]: { orders: number; sum: number; soNumbers: string[] } } = {};
  let byCategory: { [key: string]: { orders: number; sum: number; soNumbers: string[] } } = {};
  let soNumbers: Array<{ SONumber: string; SOId: string }> = [];

  for (let order of orders) {
    totalSum += order.Total;
    soNumbers.push({ SONumber: order.SONumber, SOId: order.SOId });

    // Process by client
    if (!byClient[order.clientName]) {
      byClient[order.clientName] = { orders: 0, sum: 0, soNumbers: [] };
    }
    byClient[order.clientName].orders++;
    byClient[order.clientName].sum += order.Total;
    byClient[order.clientName].soNumbers.push(order.SONumber);

    // Process by category
    if (!byCategory[order.SOCategory]) {
      byCategory[order.SOCategory] = { orders: 0, sum: 0, soNumbers: [] };
    }
    byCategory[order.SOCategory].orders++;
    byCategory[order.SOCategory].sum += order.Total;
    byCategory[order.SOCategory].soNumbers.push(order.SONumber);
  }

  const orderDetails: OrderDetail[] = orders.map(order => ({
    SONumber: order.SONumber,
    SOId: order.SOId,
    clientName: order.clientName,
    SOCategory: order.SOCategory,
    SOAmount: order.Total,
    referenceNumber: order.referenceNumber || ''
  }));

  return {
    title,
    totalOrders,
    totalSum,
    categorizedData: { byClient, byCategory },
    soNumbers,
    agingData: agingData.details,
    orderDetails
  };
}


function getStageTitle(stage: number): string {
  switch (stage) {
    case 0: return "Site Not Ready";
    case 1: return "Logistic";
    case 2: return "Material to Procure";
    case 3: return "Ongoing";
    case 4: return "Return Pickup";
    case 5: return "Share With Account";
    case 7: return "Dropped";
    default: return "Unknown Stage";
  }
}

function closeModal() {
  showModal = false;
  saveState();
}

  interface Order {
    SONumber: string;
    clientName: string;
    Total: number;
    SOCategory: string;
    PMName: string;
    clientExpectedDate: string;
  }

  let errorMessage = '';
  async function handleSOClick(soId: string) {
    try {
      isLoading = true;
      errorMessage = '';
      await goto(`/salesOrder/${soId}`, { replaceState: false });
    } catch (error) {
      console.error('Navigation error:', error);
      errorMessage = 'Failed to navigate to the sales order page. Please try again.';
    } finally {
      isLoading = false;
    }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function handlePMFilterChange() {
  saveState();
  fetchDashboardData();
}

  let isLoading = false;

onDestroy(() => {
  if (browser) {
    saveState();
    document.removeEventListener('visibilitychange', loadState);
    window.removeEventListener('beforeunload', saveState);
  }
});

</script>

<div class="min-h-screen bg-slate-100 p-8">
  <div class="max-w-7xl mx-auto">
    <header class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold text-slate-800">Dashboard</h1>
        <div class="flex items-center space-x-4 mb-4">
          <div class="relative">
            <select
              class="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              on:change={handleOrderStatusChange}
            >
              <option value="all">All Orders</option>
              <option value="open" selected>Open Orders</option>
              <option value="closed">Closed Orders</option>
              <option value="void">Void Orders</option>
              <option value="draft">Draft Orders</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <Filter class="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div class="relative">
            <select
              class="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              bind:value={selectedPM}
              on:change={handlePMFilterChange}
            >
              <option value="all">All PMs</option>
              {#each pmNames as pmName}
                <option value={pmName}>{pmName}</option>
              {/each}
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <Filter class="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KPICard title="Total Orders" title2="" value={totalOrders} icon="shopping-cart" color="bg-blue-700" />
      <KPICard title="Total Revenue" title2="" value={`₹${totalRevenue.toLocaleString()}`} icon="currency-rupee" color="bg-teal-600" />
      <KPICard title="Total Installations" title2="" value={activeInstallations} icon="tools" color="bg-amber-700" on:click={handleCardClick} />
      <KPICard title="Total Services" title2="" value={activeServices} icon="cogs" color="bg-rose-700" on:click={handleCardClick} />
    </div>
    

    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4 text-gray-800">Orders by Stage</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {#each ordersByStage.sort(sortStages) as { stage, count }}
	{#if getStageTitle(stage) != 'Unknown Stage'}
          <KPISTAGECard
            title={`Stage ${stage}`} 
            title2={getStageTitle(stage)}
            value={count} 
            icon="layer-group" 
            color={getStageColor(stage)} 
            on:click={handleCardClick}
          />
	{/if}
        {/each}
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4 text-gray-800">Order Aging Summary</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each Object.entries(agingData.summary) as [stage, data]}
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="text-md font-semibold mb-2">{getStageTitle(parseInt(stage))}</h3>
            <div class="flex justify-between">
              <div class={`px-2 py-1 rounded ${getAgingColor(false)}`}>
                On Time: {data.onTime}
              </div>
              <div class={`px-2 py-1 rounded ${getAgingColor(true)}`}>
                Overdue: {data.overdue}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

<!-- <div class="bg-white rounded-lg shadow-md p-6 mb-8">
  <h2 class="text-2xl font-semibold mb-4 text-gray-800">Detailed Order Aging</h2>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SO Number</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age (Hours)</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each agingData.details as order}
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                on:click={() => handleSOClick(order.SOId)}>
              {order.SONumber}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStageTitle(order.stage)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.ageInHours}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAgingColor(order.isOverdue)}`}>
                {order.isOverdue ? 'Overdue' : 'On Time'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.lastUpdated)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div> -->

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Order Categories</h2>
        <canvas id="orderCategoryChart"></canvas>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Top Customers</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left p-2">Customer</th>
                <th class="text-right p-2">Total Orders</th>
                <th class="text-right p-2">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {#each topCustomers as customer}
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-2">{customer.name}</td>
                  <td class="text-right p-2">{customer.totalOrders}</td>
                  <td class="text-right p-2">₹{customer.totalRevenue.toLocaleString()}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
  </div>
</div>

{#if showModal}
  <Modal title={modalContent.title} on:close={closeModal} size="xl" scrollableContent={true}>
    <svelte:fragment slot="header">
      <div class="bg-slate-100 p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-medium text-slate-800 mb-2">Total Orders</h3>
            <p class="text-3xl font-bold text-blue-700">{modalContent.totalOrders}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-medium text-slate-800 mb-2">Total Sum</h3>
            <p class="text-3xl font-bold text-teal-600">₹{modalContent.totalSum.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </svelte:fragment>
      
    <div class="bg-white p-4">
      <Tabs tabs={['By Client', 'By Category', 'SO Numbers', 'Detailed View']} bind:activeTab>
        <div class="overflow-x-auto">
          <div class="inline-block min-w-full align-middle">
          {#if activeTab === 0}
            <div class="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sum</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each Object.entries(modalContent.categorizedData.byClient) as [client, data]}
                    <tr class="hover:bg-gray-50 transition-colors duration-150">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" on:click={() => showSONumbers(client, 'client')}>
                        {client}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.orders}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{data.sum.toLocaleString()}</td>
                    </tr>
                    {#if selectedClient === client}
                      <tr>
                        <td colspan="3" class="px-6 py-4">
                          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {#each data.soNumbers as soNumber}
                              {@const soData = modalContent.soNumbers.find(so => so.SONumber === soNumber)}
                              {@const agingInfo = modalContent.agingData.find(item => item.SONumber === soNumber)}
                              {#if soData}
                                <div 
                                  class="p-2 rounded text-xs font-medium cursor-pointer transition-colors duration-150 bg-blue-400 text-white"
                                  on:click={() => handleSOClick(soData.SOId)}
                                >
                                  {soNumber}
                                  {#if agingInfo}
                                    <span class="block mt-1">
                                      Age: {agingInfo.ageInHours}h
                                    </span>
                                  {/if}
                                </div>
                              {/if}
                            {/each}
                          </div>
                        </td>
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if activeTab === 1}
            <div class="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sum</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each Object.entries(modalContent.categorizedData.byCategory) as [category, data]}
                    <tr class="hover:bg-gray-50 transition-colors duration-150">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" on:click={() => showSONumbers(category, 'category')}>
                        {category}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.orders}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{data.sum.toLocaleString()}</td>
                    </tr>
                    {#if selectedCategory === category}
                      <tr>
                        <td colspan="3" class="px-6 py-4">
                          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {#each data.soNumbers as soNumber}
                              {@const soData = modalContent.soNumbers.find(so => so.SONumber === soNumber)}
                              {@const agingInfo = modalContent.agingData.find(item => item.SONumber === soNumber)}
                              {#if soData}
                                <div 
                                  class="p-2 rounded text-xs font-medium cursor-pointer transition-colors duration-150 bg-blue-400 text-white"
                                  on:click={() => handleSOClick(soData.SOId)}
                                >
                                  {soNumber}
                                  {#if agingInfo}
                                    <span class="block mt-1">
                                      Age: {agingInfo.ageInHours}h
                                    </span>
                                  {/if}
                                </div>
                              {/if}
                            {/each}
                          </div>
                        </td>
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if activeTab === 2}
              <div class="bg-white rounded-lg shadow-sm p-4">
                <h3 class="text-lg font-medium text-gray-900 mb-4">SO Numbers</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {#each modalContent.soNumbers as { SONumber, SOId }}
                    {@const agingInfo = modalContent.agingData.find(item => item.SONumber === SONumber)}
                    <div 
                      class="rounded-lg p-3 text-sm font-medium cursor-pointer transition-colors duration-150 {getAgingColor(agingInfo?.isOverdue)}"
                      on:click={() => handleSOClick(SOId)}
                    >
                      {SONumber}
                      {#if agingInfo}
                        <span class="block text-xs mt-1">
                          {agingInfo.isOverdue ? 'Overdue' : 'On Time'} ({agingInfo.ageInHours}h)
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
          {:else if activeTab === 3}
            <div class="mb-4 m-1 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div class="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search..."
                  bind:value={searchTerm}
                  class="pl-8 pr-4 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                />
                <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              <select
                bind:value={filterCategory}
                class="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none pr-8 bg-white"
              >
                {#each categories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
            </div>
            <div class="overflow-hidden border border-gray-200 shadow sm:rounded-lg">
<div class="h-[500px] overflow-auto" id="orders-table-container" on:scroll={handleTableScroll}>
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50 sticky top-0 z-10">
    <tr>
      {#each ['SONumber', 'Client Name', 'Category', 'Amount', 'Reference Number'] as column}
        <th
          scope="col"
          class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          on:click={() => toggleSort(column === 'Client Name' ? 'clientName' : column === 'Reference Number' ? 'referenceNumber' : column)}
        >
          <div class="flex items-center space-x-1">
            <span>{column}</span>
            <div class="flex flex-col">
              <ChevronUp size={12} class={sortColumn === (column === 'Client Name' ? 'clientName' : column === 'Reference Number' ? 'referenceNumber' : column) && sortDirection === 'asc' ? 'text-blue-500' : 'text-gray-300'} />
              <ChevronDown size={12} class={sortColumn === (column === 'Client Name' ? 'clientName' : column === 'Reference Number' ? 'referenceNumber' : column) && sortDirection === 'desc' ? 'text-blue-500' : 'text-gray-300'} />
            </div>
          </div>
        </th>
      {/each}
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    {#each filteredAndSortedOrders as order}
      <tr class="hover:bg-gray-50 transition-colors duration-150">
        <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" on:click={() => handleSOClick(order.SOId)}>
          {order.SONumber}
        </td>
        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{order.clientName}</td>
        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{order.SOCategory}</td>
        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">₹{order.SOAmount}</td>
        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
          {#if order.referenceNumber}
            {order.referenceNumber}
          {:else if isLoadingReferences}
            <span class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          {:else}
            -
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
  {#if isLoadingMoreOrders}
    <div class="flex justify-center py-4">
      <span class="inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading more...
      </span>
    </div>
  {/if}
</div>
</div>
          {/if}
          </div>
        </div>
      </Tabs>
    </div>
  </Modal>
{/if}



{#if isLoadingKPIData}
  <CustomLoader message="Loading data..." />
{/if}

{#if isLoading}
  <CustomLoader message="Loading Sales Order..." />
{/if}

<style>
  :global(body) {
    background-color: #f1f5f9;
  }
</style>

<script context="module">
function getStageColor(stage) {
  const colors = [
    'bg-gray-500',   // Stage 0
    'bg-blue-600',   // Stage 1
    'bg-teal-600',   // Stage 2
    'bg-green-600',  // Stage 3
    'bg-amber-600',  // Stage 4
    'bg-rose-500',   // Stage 5
    'bg-purple-500', // Stage 6
    'bg-red-500'     // Stage 7
  ];
  // Return a distinct color for unknown stages
  return colors[stage] || 'bg-slate-800';
}
</script>
