<!-- src/routes/salesOrder/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { SalesOrder } from '$lib/types';
  import '$lib/styles/app.css';
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import StageUpdateModal from '$lib/components/StageUpdateModal.svelte';
  import CustomLoader from '$lib/components/CustomLoader.svelte';
  import { writable } from 'svelte/store';
  import { ArrowLeft, Download, ChevronDown, ChevronUp } from 'svelte-lucide';
  import { logStore, type LogEntry } from '../../../../lib/stores/LogStore';
  import { fly } from 'svelte/transition';
  import { Clock, User, Activity } from 'svelte-lucide';
  import { invalidate } from '$app/navigation';
  import  StageModal  from '$lib/components/StageModalRef.svelte';
  import type { ActivityLog } from '$lib/types/activityLog';
  import { ChevronLeft, ChevronRight } from 'svelte-lucide';
  import ChatBox from '$lib/components/Chatbox.svelte';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  import { Paperclip } from 'svelte-lucide';

  export let data: PageData;

let currentPage = 1;
let logsPerPage = 5;
let isLoading = false;
let isLoadingNavigate = false;
let submissionSuccessful = false;



$: paginatedLogs = activityLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
$: totalPages = Math.ceil(activityLogs.length / logsPerPage);

function nextPage() {
  if (currentPage < totalPages) currentPage++;
}

function prevPage() {
  if (currentPage > 1) currentPage--;
}

  let expandedLog: string | null = null;

  const dispatch = createEventDispatcher();

  function handleClose() {
  dispatch('close');
}

function handleClickOutside(event:any) {
  const target = event.target as HTMLElement;
    if (!target.closest('.documents-dropdown') && !target.closest('button[aria-haspopup="true"]')) {
      showDocumentsDropdown = false;
      showMenuDropdown = false;
    }
  if (event.target.classList.contains('modal-overlay')) {
    handleClose();
  }
}

function handleKeydown(event: any) {
  if (event.key === 'Escape') {
    handleClose();
  }
}

onMount(() => {
  document.addEventListener('keydown', handleKeydown);
  return () => {
    document.removeEventListener('keydown', handleKeydown);
  };
});

function toggleLogExpansion(logId: string) {
  expandedLog = expandedLog === logId ? null : logId;
}

  let showMenuDropdown = false;

  function toggleMenuDropdown() {
      showMenuDropdown = !showMenuDropdown;
  }

function getActionIcon(action: string) {
  if (action.toLowerCase().includes('updated')) return 'pencil';
  if (action.toLowerCase().includes('created')) return 'plus-circle';
  if (action.toLowerCase().includes('deleted')) return 'trash-2';
  return 'activity';
}

function formatLogDate(date: Date) {
  return new Date(date).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
  function getActionColor(category: string): string {
  switch (category) {
    case 'line_item_update': return 'bg-blue-500';
    case 'field_update': return 'bg-green-500';
    case 'customer_interaction': return 'bg-yellow-500';
    case 'payment_update': return 'bg-purple-500';
    case 'shipment_update': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getCurrentStageText(stage: number | undefined): string {
  switch(stage) {
      case 0: return 'Site Not Ready';
      case 1: return 'Logistic';
      case 2: return 'Material to Procure';
      case 3: return 'Ongoing';
      case 4: return 'Return Pickup';
      case 5: return 'Share With Account';
      case 6 : return 'Stage Completed';
      default: return 'Update Status';
  }
}

  let currentUsername = data.user.name;
  let currentUserRole = data.user.role;
  
  $: salesOrder = data.salesOrder;
  $: activityLogs = data.activityLogs as ActivityLog[];
  $: currentStage = data.currentStage;

  $: console.log(data);


  let showStageUpdateModal = false;
  let showDocumentsDropdown = false;

  let isExpanded = false;

    // Document preview modal
  let showDocumentPreview = false;
  let previewUrl = '';
  let previewFileName = '';
  let previewDocType = '';
  let isDocLoading = false;
  
  // Function to toggle document dropdown
  function toggleDocumentsDropdown() {
    showDocumentsDropdown = !showDocumentsDropdown;
    if (showMenuDropdown) showMenuDropdown = false;
  }

  
  // Function to check if file can be previewed
  function canPreviewFile(fileType: string): boolean {
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
    return previewableTypes.includes(fileType.toLowerCase());
  }
  
  // Function to handle document viewing
  async function handleDocumentView(doc: any) {
    showDocumentsDropdown = false;
    
    if (!canPreviewFile(doc.file_type)) {
      // If file can't be previewed, download it directly
      handleDocumentDownload(doc);
      return;
    }
    
    try {
      isDocLoading = true;
      const token = await getToken(fetch);
      
      // Prepare the URL for the document
      const docUrl = `https://www.zohoapis.in/books/v3/salesorders/${salesOrder.salesorder_id}/documents/${doc.document_id}?organization_id=60005679410`;
      
      // Fetch the document
      const response = await fetch('/api/proxy-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: docUrl,
          token: token
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      // Get document as blob
      const blob = await response.blob();
      previewUrl = URL.createObjectURL(blob);
      previewFileName = doc.file_name;
      previewDocType = doc.file_type;
      showDocumentPreview = true;
      
    } catch (error) {
      console.error('Error fetching document:', error);
      alert('Failed to load document. Please try downloading instead.');
    } finally {
      isDocLoading = false;
    }
  }
  
  // Function to handle document download
  async function handleDocumentDownload(doc: any) {
    try {
      isDocLoading = true;
      const token = await getToken(fetch);
      
      // Prepare the URL for the document
      const docUrl = `https://www.zohoapis.in/books/v3/salesorders/${salesOrder.salesorder_id}/documents/${doc.document_id}?organization_id=60005679410`;
      
      // Fetch the document through proxy
      const response = await fetch('/api/proxy-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: docUrl,
          token: token
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      // Get document as blob
      const blob = await response.blob();
      
      // Create a download link and trigger download
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again later.');
    } finally {
      isDocLoading = false;
    }
  }
  
  // Function to close document preview
  function closeDocumentPreview() {
    showDocumentPreview = false;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }
  }

  function toggleExpand() {
  isExpanded = !isExpanded;
  }

  function toggleStageUpdateModal() {
      showStageUpdateModal = !showStageUpdateModal;
  }


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



let expandedCategories: Record<string, boolean> = {};

function toggleCategory(category: string) {
  expandedCategories[category] = !expandedCategories[category];
  expandedCategories = expandedCategories; // Trigger reactivity
}

  function getStatusColor(status: string) {
      switch (status.toLowerCase()) {
          case 'open':
              return 'bg-green-100 text-green-800';
          case 'closed':
              return 'bg-gray-100 text-gray-800';
          case 'draft':
              return 'bg-yellow-100 text-yellow-800';
          case 'pending approval':
              return 'bg-blue-100 text-blue-800';
          case 'pending':
              return 'bg-orange-100 text-orange-800';
          default:
              return 'bg-white text-blue-800';
      }
  }

  async function goBack() {
      isLoadingNavigate = true;
      await goto('/salesOrder');
      isLoadingNavigate = false;
  }
  
  function downloadDocument(doc: any) {
      // Implement actual download logic here
      console.log(`Downloading ${doc.file_name}`);
      // You might want to use a service or API call to handle the actual download
  }
  let activeTab = 'details';
  function switchTab(tab: any) {
      activeTab = tab;
  }

let soCategory = "";
let projectManagerName = "";

let salesOrderLogs: LogEntry[] = [];
let Stage0Data: any;
let Stage3Data: any;
let Stage4Data: any;



onMount(() => {
  logStore.loadLogs();
  const unsubscribe = logStore.subscribe(allLogs => {
    salesOrderLogs = allLogs[salesOrder.salesorder_number] || [];
  });

  return unsubscribe;
});

function handleFieldUpdate(fieldName: string, oldValue: string, newValue: string) {
  const logEntry: LogEntry = {
    username: currentUsername,
    role: currentUserRole,
    action: `Updated ${fieldName} from "${oldValue}" to "${newValue}"`,
    timestamp: new Date()
  };
  logStore.addLog(salesOrder.salesorder_number, logEntry);
  
  const unsubscribe = logStore.subscribe(logs => logStore.saveLogs(logs));
  unsubscribe();
}


  async function getToken(fetch: typeof globalThis.fetch): Promise<string> {
      const tokenResponse = await fetch('/api/zohoAuthToken');
      const { token } = await tokenResponse.json();
      return token;
  }

async function downloadSalesOrderPdf() {
  try {
    isDocLoading = true;
    const token = await getToken(fetch);
    
    // Prepare the URL for the PDF
    const pdfUrl = `https://www.zohoapis.in/books/v3/salesorders/pdf?organization_id=60005679410&salesorder_ids=${salesOrder.salesorder_id}`;
    
    // Fetch the PDF through proxy
    const response = await fetch('/api/proxy-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        token: token
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
    }
    
    // Get PDF as blob
    const blob = await response.blob();
    
    // Create a download link and trigger download
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `SalesOrder_${salesOrder.salesorder_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Failed to download PDF. Please try again later.');
  } finally {
    isDocLoading = false;
  }
}

async function handleDropSalesOrder() {
  if (confirm('Are you sure you want to drop this sales order? This action cannot be undone.')) {
      try {
          // Update the database
          const updateResponse = await fetch(`/api/salesorder/${encodeURIComponent(salesOrder.salesorder_number)}/drop`, {
              method: 'POST',
          });

          if (!updateResponse.ok) {
              throw new Error('Failed to update database');
          }

          // Mark as void in Zoho
          // const token = await getToken(fetch);
          // const voidResponse = await fetch(`https://www.zohoapis.in/books/v3/salesorders/${salesOrder.salesorder_id}/status/void?organization_id=60005679410`, {
          //     method: 'POST',
          //     headers: {
          //         'Authorization': `Zoho-oauthtoken ${token}`,
          //         'Content-Type': 'application/json',
          //     },
          //     body: JSON.stringify({}), // Add any required fields here
          // });

          // if (!voidResponse.ok) {
          //     throw new Error('Failed to void sales order in Zoho');
          // }

          // Refresh the page data
          await invalidate(`/sales-order/${encodeURIComponent(salesOrder.salesorder_number)}`);

          alert('Sales order has been dropped successfully');
      } catch (error) {
          console.error('Error dropping sales order:', error);
          alert('Failed to drop sales order. Please try again.');
      }
  }
}
let dropdownRef: HTMLDivElement;

function closeDropdown() {
  showMenuDropdown = false;
}

onMount(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);

  return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
  };
});


$: groupedLogs = paginatedLogs.reduce((acc, log) => {
  if (!acc[log.category]) {
    acc[log.category] = [];
  }
  acc[log.category].push(log);
  return acc;
}, {} as Record<string, ActivityLog[]>);

async function refreshActivityLogs() {
  const response = await fetch(`/api/activity-logs/${salesOrder.salesorder_number}`);
  if (response.ok) {
    const newLogs = await response.json();
    activityLogs = newLogs;
  }
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
          <h1 class="text-2xl font-bold text-white">Sales Order: {salesOrder.salesorder_number}</h1>
      </div>
      <div class="flex items-center space-x-3">
          <span class="px-4 py-2 rounded-full text-sm font-medium bg-white {getStatusColor(salesOrder.status)}">
              {salesOrder.status}
          </span>
      <button 
        class="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-full shadow-sm hover:shadow transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
        on:click={downloadSalesOrderPdf}
        aria-label="Download PDF"
    >
        <Download size={20} class="mr-2" />
        <span>PDF</span>
    </button>

    {#if salesOrder.documents && salesOrder.documents.length > 0}
    <div class="relative">
        <button 
            class="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-full shadow-sm hover:shadow transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
            on:click|stopPropagation={toggleDocumentsDropdown}
            aria-haspopup="true"
            aria-expanded={showDocumentsDropdown}
        >
            <Paperclip size={20} class="mr-2" />
            <span>Attachments ({salesOrder.documents.length})</span>
        </button>
        
        {#if showDocumentsDropdown}
        <div 
            class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10"
            transition:fly="{{ y: -10, duration: 200 }}"
        >
            <div class="max-h-96 overflow-y-auto">
                {#each salesOrder.documents as doc}
<div class="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
    <div class="flex items-center justify-between">
        <!-- Make the entire document info area clickable -->
        <div 
            class="flex items-center space-x-3 flex-grow cursor-pointer"
            on:click={() => canPreviewFile(doc.file_type) ? handleDocumentView(doc) : handleDocumentDownload(doc)}
        >
            <div class="text-gray-800 flex-grow">
                <p class="font-medium text-sm truncate" title={doc.file_name}>{doc.file_name}</p>
                <p class="text-xs text-gray-500">
                    {doc.file_size_formatted} • {doc.uploaded_on_date_formatted}
                </p>
            </div>
        </div>
        <!-- Keep explicit buttons for additional control -->
        <div class="flex space-x-2">
            <button 
                on:click|stopPropagation={() => handleDocumentView(doc)}
                class="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Preview"
                disabled={!canPreviewFile(doc.file_type)}
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
            </button>
            <button 
                on:click|stopPropagation={() => handleDocumentDownload(doc)}
                class="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Download"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
            </button>
        </div>
    </div>
</div>
                {/each}
            </div>
        </div>
        {/if}
    </div>
    {/if}
          {#if salesOrder.status == 'open' || salesOrder.status == 'invoiced' || salesOrder.status == 'partially_invoiced'}
          <button 
              class="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-full shadow-sm hover:shadow transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
              on:click={toggleStageUpdateModal}
          >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{getCurrentStageText(currentStage?.currentStage)}</span>
          </button> 
          {/if}
          <div class="relative" bind:this={dropdownRef}>
              {#if salesOrder.status == 'open' && data.user.role == 'ADMIN'}
                  <button 
                      class="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-3 rounded-full shadow-sm hover:shadow transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      on:click|stopPropagation={toggleMenuDropdown}
                      aria-haspopup="true"
                      aria-expanded={showMenuDropdown}
                  >
                      <ChevronDown size={20} />
                  </button>
              {/if}
              {#if showMenuDropdown}
                  <div 
                      class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                      transition:fly="{{ y: -10, duration: 200 }}"
                  >
                  <button 
                      class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 focus:outline-none focus:bg-red-100 transition duration-150 ease-in-out"
                      on:click={handleDropSalesOrder}
                      disabled={data.isDropped}
                  >
                      {data.isDropped ? 'Sales Order Dropped' : 'Drop Sales Order'}
                  </button>
                  </div>
              {/if}
          </div>
      </div>
  </div>
</div>

          <div class="p-6 space-y-8">
              <!-- Order Summary -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <h2 class="text-lg font-semibold text-blue-800 mb-2">Billing Address</h2>
                      <p class="font-medium">{salesOrder.customer_name}</p>
                      <p>{salesOrder.billing_address.address}</p>
                      <p>{salesOrder.billing_address.city}, {salesOrder.billing_address.state} {salesOrder.billing_address.zip}</p>
                      <p>{salesOrder.billing_address.country}</p>
                      <p class="mt-2 text-blue-600">GSTIN: {salesOrder.gst_no || 'N/A'}</p>
                  </div>

                  <div class="bg-blue-50 p-4 rounded-lg shadow">
                      <h2 class="text-lg font-semibold text-blue-800 mb-2">Shipping Address</h2>
                      <p class="font-medium">{salesOrder.shipping_address.attention || salesOrder.customer_name}</p>
                      <p>{salesOrder.shipping_address.address}</p>
                      {#if salesOrder.shipping_address.street2}
                          <p>{salesOrder.shipping_address.street2}</p>
                      {/if}
                      <p>{salesOrder.shipping_address.city}, {salesOrder.shipping_address.state} {salesOrder.shipping_address.zip}</p>
                      <p>{salesOrder.shipping_address.country}</p>
                      {#if salesOrder.shipping_address.phone}
                          <p class="mt-2 text-blue-600">Phone: {salesOrder.shipping_address.phone}</p>
                      {/if}
                  </div>
              </div>

              <!-- Order Info Section -->
              <div class="bg-blue-50 p-4 rounded-lg shadow mt-6">
                  <h2 class="text-lg font-semibold text-blue-800 mb-2">Order Info</h2>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <p><strong>SO #:</strong> {salesOrder.salesorder_number}</p>
                          <p><strong>Ref#:</strong> {salesOrder.reference_number}</p>
                          <p><strong>SO Category:</strong> {salesOrder.custom_field_hash.cf_so_cat}</p>
                          <p><strong>Project Manager Name:</strong> {salesOrder.custom_field_hash.cf_project_manager_name}</p>
                      </div>
                      <div>
                          <p><strong>Delivery Method:</strong> {salesOrder.delivery_method || 'N/A'}</p>
                          <p><strong>Place of Supply:</strong> {salesOrder.place_of_supply}</p>
                          <p><strong>Date:</strong> {formatDate(salesOrder.submitted_date)}</p>
                      </div>
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
                              {#each salesOrder.line_items as item, index}
                                  <tr class="hover:bg-gray-50">
                                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                      <td class="px-6 py-4 text-sm text-gray-900">
                                          <div class="font-medium">{item.name}</div>
                                          <div class="text-gray-500">{item.description}</div>
                                      </td>
                                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hsn_or_sac}</td>
                                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
                                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
                                  </tr>
                              {/each}
                          </tbody>
                      </table>
                  </div>
              </div>

              <!-- Order Totals -->
              <div class="bg-white p-4 rounded-lg shadow">
                  <h2 class="text-lg font-semibold text-blue-800 mb-4">Order Totals</h2>
                  <div class="space-y-2">
                      <div class="flex justify-between">
                          <span>Sub Total:</span>
                          <span>{formatCurrency(salesOrder.sub_total)}</span>
                      </div>
                      {#each salesOrder.taxes as tax}
                          <div class="flex justify-between">
                              <span>{tax.tax_name}:</span>
                              <span>{tax.tax_amount_formatted}</span>
                          </div>
                      {/each}
                      <div class="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
                          <span>Total:</span>
                          <span>{formatCurrency(salesOrder.total)}</span>
                      </div>
                  </div>
              </div>

              <!-- Additional Information -->
              <div class="bg-white p-4 rounded-lg shadow">
                  <h2 class="text-lg font-semibold text-blue-800 mb-4">Additional Information</h2>
                  <div class="space-y-2">
                      <p><strong>Payment Terms:</strong> {salesOrder.payment_terms}</p>
                      <p><strong>Notes:</strong> {salesOrder.notes}</p>
                      <p><strong>Submitted By:</strong> {salesOrder.submitted_by}</p>
                      <p><strong>Last Modified:</strong> {formatDate(salesOrder.last_modified_time)}</p>
                  </div>
              </div>
          </div>
      </div>
  </div>
</div>

<!-- Activity Logs -->
<div class="bg-white p-6 rounded-lg shadow-lg mt-8">
<h2 class="text-2xl font-semibold text-gray-800 mb-6">Activity Logs</h2>

{#if activityLogs && activityLogs.length > 0}
  {#each Object.entries(groupedLogs) as [category, logs]}
    <div class="mb-8">
      <h3 class="text-lg font-medium text-gray-700 mb-4 capitalize">{category.replace('_', ' ')} Updates</h3>
      <div class="relative">
        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        {#each logs as log (log.id)}
          <div class="mb-6 flex" transition:fade="{{ duration: 300 }}">
            <div class="absolute left-4 w-3 h-3 rounded-full mt-1.5 -ml-1.5 {getActionColor(log.category)}"></div>
            <div class="ml-12">
              <div class="flex items-center mb-1">
                <span class="font-medium text-gray-900 mr-2">{log.username}</span>
                <span class="text-sm text-gray-500">({log.role})</span>
              </div>
              <p class="text-gray-700 mb-2">{log.action}</p>
              {#if log.details}
                <p class="text-sm text-gray-600 mb-2">{log.details}</p>
              {/if}
              <span class="text-sm text-gray-500">{formatLogDate(log.timestamp)}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
  <div class="flex justify-between items-center mt-8">
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 transition-opacity duration-200"
      on:click={prevPage}
      disabled={currentPage === 1}
    >
      <ChevronLeft size={20} />
    </button>
    <span class="text-gray-600">Page {currentPage} of {totalPages}</span>
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 transition-opacity duration-200"
      on:click={nextPage}
      disabled={currentPage === totalPages}
    >
      <ChevronRight size={20} />
    </button>
  </div>
{:else}
  <p class="text-gray-500 italic">No activity logs available.</p>
{/if}
</div>

     

<!-- <StageUpdateModal
  username={data.user.name}
  userRole={data.user.role}
  currentStage={currentStage?.currentStage ?? null}
  data={{
    user: {
    name: data.user.name,
    role: data.user.role,
    email: data.user.email,
    id: data.user.id,
    createdAt: data.user.createdAt,
    phoneNo: data.user.phoneNo,
    image: data.user.image,
    status: data.user.status,
    verificationToken: ''
  }
  }}
  salesOrder={salesOrder}
  Stage0Data={Stage0Data}
  Stage3Data={Stage3Data}
  Stage4Data={Stage4Data}
  Stage5Data={Stage5Data}
  on:close={toggleStageUpdateModal}
/> -->
{#if showStageUpdateModal}
<StageModal
  username={data.user.name}
  userRole={data.user.role}
  currentStage={currentStage?.currentStage ?? null}
  data={{
    user: {
      name: data.user.name,
      role: data.user.role,
      email: data.user.email,
      id: data.user.id,
      createdAt: data.user.createdAt,
      phoneNo: data.user.phoneNo,
      image: data.user.image,
      status: data.user.status
    }
  }}
  salesOrder={salesOrder}
  Stage0Data={Stage0Data}
  on:activityLogged={refreshActivityLogs}
  on:submitSuccess={(event) => {
    if (event.detail) {
      // Set a flag indicating successful submission
      submissionSuccessful = true;
    }
  }}
  on:close={() => {
    showStageUpdateModal = false;
    // If submission was successful, reload after modal closes
    if (submissionSuccessful) {
      isLoading = true;
      window.location.reload();
    }
  }}
/>
{/if}

{#if showDocumentPreview}
<div 
  class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
  on:click|self={closeDocumentPreview}
  transition:fade={{ duration: 200 }}
>
  <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col">
    <div class="flex items-center justify-between p-4 border-b">
      <h3 class="text-lg font-medium">{previewFileName}</h3>
      <button 
        class="text-gray-400 hover:text-gray-600"
        on:click={closeDocumentPreview}
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class="flex-1 overflow-hidden p-0 flex items-center justify-center bg-gray-100" style="min-height: 70vh;">
{#if previewDocType === 'pdf'}
  <iframe 
    src={previewUrl} 
    title={previewFileName} 
    class="w-full h-full border-0" 
    style="min-height: 100%; width: 100%; height: 100vh;"
  ></iframe>
{:else if ['jpg', 'jpeg', 'png', 'gif'].includes(previewDocType.toLowerCase())}
        <div class="w-full h-full flex items-center justify-center overflow-hidden">
          <img 
            src={previewUrl} 
            alt={previewFileName} 
            class="max-w-full max-h-[65vh] object-contain" 
            style="display: block; margin: auto;"
          />
        </div>
      {:else}
        <div class="text-center p-8">
          <p>This file type cannot be previewed.</p>
          <button 
            class="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            on:click={() => {
              const a = document.createElement('a');
              a.href = previewUrl;
              a.download = previewFileName;
              a.click();
            }}
          >
            Download File
          </button>
        </div>
      {/if}
    </div>
    <div class="p-4 border-t flex justify-end">
      <button 
        class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center"
        on:click={() => {
          const a = document.createElement('a');
          a.href = previewUrl;
          a.download = previewFileName;
          a.click();
        }}
      >
        <Download size={18} class="mr-2" />
        Download
      </button>
    </div>
  </div>
</div>
{/if}


<!-- Loading Indicator for Document Operations -->
{#if isDocLoading}
<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
  <div class="bg-white p-6 rounded-lg shadow-xl flex items-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
    <p>Loading document...</p>
  </div>
</div>
{/if}

{#if isLoading}
  <CustomLoader message="Please Wait, Updating Sales Order..." />
{/if}

{#if isLoadingNavigate}
  <CustomLoader message="Please Wait, Redirecting to dashobard..." />
{/if}



<ChatBox 
salesOrderNumber={salesOrder.salesorder_number}
salesOrderId={salesOrder.salesorder_id}
currentUsername={currentUsername}
/>
