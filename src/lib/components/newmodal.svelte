<script lang="ts">
  // Imports
  import { createEventDispatcher, onMount } from 'svelte';
  import type { SalesOrder } from '$lib/types';
  import type { PageData } from '../../routes/$types';

  // Props and event dispatcher
  export let data: PageData;
  export let salesOrder: SalesOrder;
  const dispatch = createEventDispatcher();

  // Variables for dropped and monitoring states
  let isDropped = false;
  let isMonitoring = false;
  let showDroppedPopup = false;
  let showMonitoringPopup = false;
  let droppedRemarks = '';
  let monitoringRemarks = '';
  let submissionTime: Date | null = null;
  let showDropdown = false;
  let dropdownContainer: HTMLDivElement | null = null;


function toggleDropdown() {
  showDropdown = !showDropdown;
}

function handleClickOutside(event: MouseEvent): void {
  if (dropdownContainer && !dropdownContainer.contains(event.target as Node)) {
    showDropdown = false;
  }
}

onMount(() => {
  window.addEventListener('click', handleClickOutside);

  return () => {
    window.removeEventListener('click', handleClickOutside);
  };
});

  // Functions for dropped and monitoring
  function handleDroppedToggle(): void {
    showDroppedPopup = true;
    showDropdown = false;
  }

  function handleMonitoringToggle(): void {
    showMonitoringPopup = true;
    showDropdown = false;
  }

  function submitDropped(): void {
  if (droppedRemarks.trim()) {
    isDropped = true;
    isMonitoring = false;
    submissionTime = new Date();
    showDroppedPopup = false;
    currentStage = stageData.filter(stage => stage.completed).length - 1;
  } else {
    alert("Please provide remarks before submitting.");
  }
}

function submitMonitoring(): void {
  if (monitoringRemarks.trim()) {
    isMonitoring = true;
    isDropped = false;
    submissionTime = new Date();
    showMonitoringPopup = false;
    currentStage = stageData.filter(stage => stage.completed).length - 1;
  } else {
    alert("Please provide remarks before submitting.");
  }
}

  // Interfaces
  interface LineItem {
    id: string;
	isAvailabilityFrozen: any;
  needToPurchaseLocally: boolean;
	isAvailable: boolean;
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    item_total: number;
    status: string;
    serialNo?: string;
  invoiceNo?: string;
  attachment?: File;
  returnPickup?: boolean;
  returnQuantity?: number;
  }

  interface DCBox {
	status: any;
    customName: string;
    trackingNo: string;
    dispatchedDate: string;
    deliveryDate: string;
    dcAmount: number;
    attachment: File | null;
    lineItemCount: number;
    isSaved: boolean;
    lineItemIndices: number[];
    fileName: string;
    filePreviewUrl: string | null;
    billType: 'DC' | 'E-way';
    isTypeSet: boolean;
    isEditing: boolean;
  }

  // Stage and form variables
  let currentStage = 0;
  let stageData = [
  { title: 'Stage 0. Site Not Ready', completed: false, visible: true },
  { title: 'Stage 1. Logistics', completed: false, visible: true },
  { title: 'Stage 2. Material to Procure', completed: false, visible: true },
  { title: 'Stage 3. On Going', completed: false, visible: true },
  { title: 'Stage 4. Return Pickup', completed: false, visible: false },
  { title: 'Stage 5. Share with Account', completed: false, visible: true }
];

  let soCategory = '';
  let projectManagerName = '';
  let clientExpectedDate: string = '';
  let isEditing = true;
  let partialDelivery = false;
  let canAccessNextStage = false;
  let allItemsSaved = false;
  let newlyAvailableItems: Array<{ id: string, name: string, status: 'available' | 'need_to_purchase' }> = [];  let notAvailableItems: LineItem[] = [];
   // Map line items with status
   let lineItemsWithStatus: LineItem[] = salesOrder.line_items.map(item => ({
  ...item,
  id: `${item.name}_${item.quantity}`,
  status: '',
  isAvailable: false,
  isAvailabilityFrozen: false,
  needToPurchaseLocally: false // New property
}));

let minDate: string;

function updateMinDate() {
  minDate = new Date().toISOString().split('T')[0];
}

onMount(() => {
  updateMinDate();
  const interval = setInterval(updateMinDate, 60000); // Update every minute
  return () => clearInterval(interval);
});


  let dcOrderTotal = { subtotal: 0, igst: 0, total: 0 };
  let frozenLineItems: { [key: string]: boolean } = {};  // Initialize dcBoxes array
  let dcBoxes: DCBox[] = [{
	  customName: '',
    status: '',
	  trackingNo: '',
	  dispatchedDate: '',
	  deliveryDate: '',
	  dcAmount: 0,
	  attachment: null,
	  lineItemCount: 0,
	  isSaved: false,
	  lineItemIndices: [],
	  fileName: '',
	  filePreviewUrl: null,
    billType: 'DC', // Default to DC
    isTypeSet: false,
    isEditing: false, 
  }];
  let dcCounter = 1;

  // Reactive declarations
  $: allStatusesFilled = lineItemsWithStatus.every(item => item.status !== '');
  $: partialDelivery = lineItemsWithStatus.some(item => item.status === 'not_available');
  $: projectManagers = data.user;
  

  // Lifecycle hooks
  onMount(() => {
    stageStartTimes[0] = getCurrentDateTime();
  });

  // Stage navigation functions
  function closeModal() {
    dispatch('close');
  }

  function goToNextStage() {
    if (currentStage < stageData.length - 1) {
      do {
        currentStage++;
      } while (currentStage < stageData.length && !stageData[currentStage].visible);
    }
  }

  function goToPreviousStage() {
    if (currentStage > 0) {
      do {
        currentStage--;
      } while (currentStage > 0 && !stageData[currentStage].visible);
    }
  }

  function editStage() {
    isEditing = true;
  }

 // Form submission and validation
function handleSubmit(event: Event) {
  event.preventDefault();
   if (currentStage === 1) {
    if (!allLineItemsFrozen()) {
      alert('Please ensure all line items are saved (Available, Need to purchase locally, or Not Required).');
      return;
    }

    if (!allStatusesFilled) {
      alert('Please select a status for all line items before submitting.');
      return;
    }

    const unfilledDCs = dcBoxes.filter(dc => !dc.isSaved && !isCurrentDCFilled());
    if (unfilledDCs.length > 0) {
      alert('Please fill and save all DC details before submitting.');
      return;
    }

    showConfirmationPopup = true;
  } else {
  if (currentStage === 2) {
    if (allItemsSaved) {
      showConfirmationPopup = true;
    } else {
      alert("Please save all items before submitting the stage.");
    }
  } else {

  if (currentStage === (stageData[4].visible ? 5 : 4)) {
    // Share with Account stage
    const allItemsHaveStatus = [...shipments, returnPickup]
      .filter(item => item.isSaved)
      .every(item => item.accountStatus && item.accountRemark.trim());
    
    if (allItemsHaveStatus) {
      showConfirmationPopup = true;
    } else {
      alert("Please select a status and fill up the remark for all items.");
    }
  } else {
    showConfirmationPopup = true;
  }
  
}

}

}

function confirmSubmit() {
  showConfirmationPopup = false;
  lastSubmittedTimes[currentStage] = getCurrentDateTime();
  // Set the start time for the next stage
  if (currentStage < stageData.length - 1) {
    stageStartTimes[currentStage + 1] = getCurrentDateTime();
  }
  
  switch (currentStage) {
    case 0:
    if (!soCategory || !projectManagerName || !clientExpectedDate) {
      alert('Please fill in SO Category, Client Expected Date of Handover, and Project Manager Name.');
      return;
      }
      break;
   case 1:
  if (!allLineItemsFrozen()) {
    alert('Please ensure all line items are saved (Available, Need to purchase locally, or Not Required).');
    return;
  }

  if (!allStatusesFilled) {
    alert('Please select a status for all line items before submitting.');
    return;
  }

  // Check if all items are marked as "Not Required"
      const allNotRequired = lineItemsWithStatus.every(item => item.status === 'not_required');
      
      // Only check isCurrentDCFilled() if not all items are "Not Required"
      if (!allNotRequired && !isCurrentDCFilled()) {
        alert('Please fill all fields in the current DC before submitting.');
        return;
      }

  const unfilledDCs = dcBoxes.filter(dc => !dc.isSaved && !isCurrentDCFilled());
  if (unfilledDCs.length > 0) {
    alert('Please fill and save all DC details before submitting.');
    return;
  }

  updateDCAmount(dcBoxes.length - 1);
  updateDCOrderTotal();
  saveCurrentState();
  alert('Logistics stage completed successfully.');
  break;
    case 2:
      if (allItemsSaved) {
        alert('Material to Procure stage completed successfully.');
        stageData[currentStage].completed = true;
        goToNextStage();
      } else {
        alert("Please save all items before submitting the stage.");
      }
      break;
    case 3:
      alert("Ongoing stage has completed");
      break;
    case 4:
      if (stageData[4].visible) {
        if (returnPickup.isSaved) {
          alert("Return Pickup details submitted successfully.");
          stageData[4].completed = true;
          currentStage = 5; // Move to Share with Account stage
        } else {
          alert("Please save the Return Pickup details before submitting.");
          return;
        }
      } else {
        // Handle the case when Return Pickup is not visible (skipped)
        alert("Moving to Share with Account stage.");
        currentStage = 5;
      }
      break;
    case (stageData[4].visible ? 5 : 4):
      const approvedItems = [...shipments, returnPickup]
        .filter(item => item.isSaved && item.accountStatus === 'approved')
        .map(item => item.name || `Shipment ${item.index + 1}`);
      const rejectedItems = [...shipments, returnPickup]
        .filter(item => item.isSaved && item.accountStatus === 'rejected')
        .map(item => item.name || `Shipment ${item.index + 1}`);
      
      if (approvedItems.length > 0) {
        alert(`Approved items: ${approvedItems.join(', ')}`);
      }
      if (rejectedItems.length > 0) {
        alert(`Rejected items: ${rejectedItems.join(', ')}`);
        showRejectionAlert = true;
      }
      break;
  }

  stageData[currentStage].completed = true;
  // Automatically move to the next stage
  goToNextStage();
}

  // Helper functions
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }



  // DC box related functions

  let totalSavedDCAmount = 0;
  
  function calculateDCAmount(dcIndex: number) {
    return lineItemsWithStatus
      .filter((item, index) => 
        (item.status === 'available' || item.status === 'need_to_purchase') && 
        !frozenLineItems[index] &&
        index >= (dcIndex > 0 ? dcBoxes[dcIndex - 1].lineItemCount : 0)
      )
      .reduce((sum, item) => sum + item.item_total, 0);
  }

  function updateDCOrderTotal() {
  if (allItemsNotAvailable) {
    dcOrderTotal.subtotal = 0;
  } else {
    // Calculate total of unsaved line items
    dcOrderTotal.subtotal = lineItemsWithStatus
      .filter((item) => !frozenLineItems[item.id] && (item.status === 'available' || item.status === 'need_to_purchase'))
      .reduce((sum, item) => sum + item.item_total, 0);
  }

  // Update the UI
  dcOrderTotal = dcOrderTotal; // Trigger reactivity
}


function getTotalSavedDCAmount() {
  return dcBoxes
    .filter(dc => dc.isSaved)
    .reduce((sum, dc) => sum + dc.dcAmount, 0);
}

function updateTotalSavedDCAmount() {
  totalSavedDCAmount = dcBoxes
    .filter(dc => dc.isSaved)
    .reduce((sum, dc) => sum + dc.dcAmount, 0);
}

  function saveCurrentState() {
    console.log('Saving current state:', {
      lineItems: lineItemsWithStatus,
      dcOrderTotal,
      partialDelivery,
      dcBoxes
    });
    // Implement actual saving logic here
  }

  // Add a new function to handle editing
function handleEdit(index: number) {
  dcBoxes[index].isEditing = true;
  dcBoxes = [...dcBoxes]; // Trigger reactivity
}

function canSaveDC(dc: DCBox | undefined): boolean {
  if (!dc) return false;
  return lineItemsWithStatus.every(item => item.status !== '') && isCurrentDCFilled();
}

  function handleSave() {
    const currentDCIndex = dcBoxes.length - 1;
    const currentDC = dcBoxes[currentDCIndex];

    if (!canSaveDC(currentDC)) {
    alert('Please select a status for all line items before saving.');
    return;
  }

  // If all items are Not Available, handle it differently
  if (allItemsNotAvailable) {
    lineItemsWithStatus.forEach(item => {
      item.isAvailabilityFrozen = true;
    });
    notAvailableItems = [...lineItemsWithStatus];
    alert('All items have been marked as Not Available and saved.');
    canAccessNextStage = true;
    return;
  }

  // If the bill type hasn't been set yet (user didn't interact with the form),
  // set it now based on the current subtotal
  if (!currentDC.isTypeSet) {
    currentDC.billType = dcOrderTotal.subtotal >= 50000 ? 'E-way' : 'DC';
    currentDC.isTypeSet = true;
  }

    // Rest of the save logic
    lastSavedTimes[currentStage] = getCurrentDateTime();

    // Set the DC amount to the current total before saving if it's not already saved
    if (!currentDC.isSaved) {
      currentDC.dcAmount = dcOrderTotal.subtotal;
    }

    // Associate newly available or purchasable items with the current DC
  lineItemsWithStatus.forEach((item, index) => {
    if ((item.status === 'available' || item.status === 'need_to_purchase') && !frozenLineItems[item.id]) {
      frozenLineItems[item.id] = true;
      currentDC.lineItemIndices.push(index);
    }

    if ((item.status === 'not_required') && !frozenLineItems[item.id]) {
      frozenLineItems[item.id] = true;
    }
  });

  // Ensure all items in the current DC are marked as frozen
  currentDC.lineItemIndices.forEach(index => {
    frozenLineItems[lineItemsWithStatus[index].id] = true;
  });

    notAvailableItems = lineItemsWithStatus.filter(item => item.status === 'not_available');

    currentDC.isSaved = true;
  dcBoxes = [...dcBoxes]; // Trigger reactivity

    // Reset the total amount for the next DC
    updateDCOrderTotal();
    
    // Update the total of saved DCs
    updateTotalSavedDCAmount();
    
    saveCurrentState();
    canAccessNextStage = true;

    if (allItemsNotAvailable) {
      alert('All items are marked as Not Available. You cannot add more DCs.');
    } else {
      alert('Progress saved. You can now add more DCs or proceed to the next stage.');
    }

    function moveToMaterialToProcureStage() {
  currentStage = 2; // Move to stage 2 (Material to Procure)
  // You might want to perform any necessary initialization for stage 2 here
}
  }

  function moveToMaterialToProcureStage() {
  currentStage = 2; // Move to stage 2 (Material to Procure)
  // You might want to perform any necessary initialization for stage 2 here
  // For example:
  notAvailableItems = lineItemsWithStatus.filter(item => item.status === 'not_available');
}

// Add a new function to handle save after editing
function handleSaveEdit(index: number) {
  const editedDC = dcBoxes[index];

  if (!canSaveDC(editedDC)) {
    alert('Please fill all required fields before saving.');
    return;
  }

  editedDC.isSaved = true;
  editedDC.isEditing = false;
  dcBoxes = [...dcBoxes]; // Trigger reactivity

  updateDCAmount(index);
  updateTotalSavedDCAmount();
  saveCurrentState();

  alert('DC order updated successfully.');
}

function handleSaveAllNotAvailable() {
  // Update notAvailableItems for the next stage
  notAvailableItems = lineItemsWithStatus.filter(item => item.status === 'not_available');
  
  // Handle not required items
  const notRequiredItems = lineItemsWithStatus.filter(item => item.status === 'not_required');
  
  // Trigger reactivity
  lineItemsWithStatus = [...lineItemsWithStatus];
  
  // Show confirmation message
  if (notAvailableItems.length > 0) {
    alert(`${notAvailableItems.length} item(s) have been marked as Not Available and will proceed to Material to Procure stage.`);
  }
  
  if (notRequiredItems.length > 0) {
    alert(`${notRequiredItems.length} item(s) have been marked as Not Required and will be removed from the order.`);
  }
   
  // Save the current state
  saveCurrentState();
  
  // Determine next action based on remaining items
  if (notAvailableItems.length > 0) {
    goToNextStage();
  }
}



function allLineItemsFrozen() {
  return lineItemsWithStatus.every(item => 
    frozenLineItems[item.id] || 
    item.status === 'not_available' || 
    item.status === 'not_required'
  );
}

  // Function to remove DC
  function removeDC(index: number) {
    if (index > 0 && !dcBoxes[index].isSaved) {
      dcBoxes.splice(index, 1);
      dcBoxes = dcBoxes; // Trigger reactivity
    }
  }

  // Function to add more DC
  function addMoreDC() {
  const currentDC = dcBoxes[dcBoxes.length - 1];
  if (!currentDC.isSaved) {
    alert('Please save the current DC before adding a new one.');
    return;
  }

  dcCounter++;
  dcBoxes = [...dcBoxes, {
	  customName: '',
	  trackingNo: '',
	  dispatchedDate: '',
	  deliveryDate: '',
	  dcAmount: 0,
	  attachment: null,
	  lineItemCount: 0,
	  lineItemIndices: [],
	  isSaved: false,
	  fileName: '',
	  filePreviewUrl: null,
	  status: '' ,
    billType: 'DC', // Default to DC
    isTypeSet: false,
    isEditing: false, 
  }];

  // Recalculate the total for the new DC
  updateDCOrderTotal();
}

function setBillType(index: number) {
  if (!dcBoxes[index].isTypeSet) {
    dcBoxes[index].billType = dcOrderTotal.subtotal >= 50000 ? 'E-way' : 'DC';
    dcBoxes[index].isTypeSet = true;
    dcBoxes = [...dcBoxes]; // Trigger reactivity
  }
}

  // Function to check if current DC is filled  
function isCurrentDCFilled(): boolean {
  const currentDC = dcBoxes[dcBoxes.length - 1];
  return Boolean(
    currentDC &&
    currentDC.customName.trim() !== '' &&
    currentDC.trackingNo.trim() !== '' &&
    currentDC.dispatchedDate !== '' &&
    currentDC.deliveryDate !== '' &&
    (currentDC.attachment || currentDC.fileName || currentDC.filePreviewUrl) &&
    currentDC.status !== ''
  );
}

// Function to update DC amount
function updateDCAmount(dcIndex: number) {
  const dc = dcBoxes[dcIndex];
  if (!dc.isSaved) {
    dc.dcAmount = dc.lineItemIndices.reduce((sum, index) => {
      const item = lineItemsWithStatus[index];
      return sum + item.item_total;
    }, 0);
    dcBoxes = dcBoxes; // Trigger reactivity
  }
}

  // File handling functions
  // Reactive statement for partial delivery and DC order total
  $: {
    partialDelivery = lineItemsWithStatus.some(item => item.status === 'not_available');
    updateDCOrderTotal();
  }

  // Function to set max dispatch date
  function setMaxDispatchDate() {
    const dispatchedDateInput = document.getElementById('dispatched-date') as HTMLInputElement;
    if (dispatchedDateInput) {
      dispatchedDateInput.max = new Date().toISOString().split('T')[0];
    }
  }

  // Function to update min delivery date
  function updateMinDeliveryDate() {
    const dispatchedDateInput = document.getElementById('dispatched-date') as HTMLInputElement;
    const deliveryDateInput = document.getElementById('delivery-date') as HTMLInputElement;
    
    if (dispatchedDateInput && deliveryDateInput) {
      deliveryDateInput.min = dispatchedDateInput.value;
      
      // If the current delivery date is before the new min date, reset it
      if (deliveryDateInput.value && deliveryDateInput.value < deliveryDateInput.min) {
        deliveryDateInput.value = '';
      }
    }
  }

  // Function to validate file input
  function validateFileInput(input: HTMLInputElement) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    const file = input.files?.[0];
    
    if (file && !allowedTypes.includes(file.type)) {
      alert('Please select a PDF or image file.');
      input.value = ''; // Clear the input
    }
  }

  // Function to setup event listeners
  function setupEventListeners() {
    const dispatchedDateInput = document.getElementById('dispatched-date') as HTMLInputElement;
    const attachmentInput = document.getElementById('attachment') as HTMLInputElement;
    
    if (dispatchedDateInput) {
      dispatchedDateInput.addEventListener('change', updateMinDeliveryDate);
    }
    
    if (attachmentInput) {
      attachmentInput.addEventListener('change', () => validateFileInput(attachmentInput));
    }
  }
    
  // Variables for date handling
  let dispatchedDate: string = '';
  let deliveryDate: string = '';

  // Reactive statement for date validation
  $: if (dispatchedDate) {
    // Ensure delivery date is not before dispatched date
    if (deliveryDate && deliveryDate < dispatchedDate) {
      deliveryDate = '';
    }
  }

  // Variables for file handling
  let filePreviewUrl: string | null = null;
  let fileName: string = '';
  let showCustomNameModal = false;
let customFileName = '';

  // Function to handle file change
  function handleFileChange(event: Event, dcIndex: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
    showCustomNameModal = true;
    customFileName = file.name;
  }


    if (file) {
      dcBoxes[dcIndex].fileName = file.name;
      dcBoxes[dcIndex].filePreviewUrl = URL.createObjectURL(file);
      dcBoxes[dcIndex].attachment = file;
    } else {
      dcBoxes[dcIndex].fileName = '';
      dcBoxes[dcIndex].filePreviewUrl = null;
      dcBoxes[dcIndex].attachment = null;
    }
    dcBoxes = [...dcBoxes]; // Trigger reactivity
  }



  // Function to open preview modal
  function openPreviewModal(file: File | null, fileUrl: string | null) {
  const modal = document.getElementById('previewModal');
  const previewImage = document.getElementById('previewImage') as HTMLImageElement;
  const previewIframe = document.getElementById('previewIframe') as HTMLIFrameElement;
  
  if (modal && previewImage && previewIframe) {
    modal.style.display = 'block';
    const url = fileUrl || (file ? URL.createObjectURL(file) : null);
    
    if (!url) {
      alert('No file to preview');
      return;
    }

    if (file?.type === 'application/pdf' || (fileUrl && fileUrl.endsWith('.pdf'))) {
      previewIframe.src = url;
      previewIframe.style.display = 'block';
      previewImage.style.display = 'none';
    } else if (file?.type.startsWith('image/') || (fileUrl && /\.(jpeg|jpg|gif|png)$/i.test(fileUrl))) {
      previewImage.src = url;
      previewImage.style.display = 'block';
      previewIframe.style.display = 'none';
    } else {
      alert('Unsupported file type for preview');
      modal.style.display = 'none';
      return;
    }
  }
}

  function openPreviewModalDC(dcIndex: number) {
    const dc = dcBoxes[dcIndex];
    if (dc.filePreviewUrl) {
      const modal = document.getElementById('previewModal');
      const previewImage = document.getElementById('previewImage') as HTMLImageElement;
      const previewIframe = document.getElementById('previewIframe') as HTMLIFrameElement;
      
      if (modal && previewImage && previewIframe) {
        modal.style.display = 'block';
        if (dc.fileName.toLowerCase().endsWith('.pdf')) {
          previewIframe.src = dc.filePreviewUrl;
          previewIframe.style.display = 'block';
          previewImage.style.display = 'none';
        } else {
          previewImage.src = dc.filePreviewUrl;
          previewImage.style.display = 'block';
          previewIframe.style.display = 'none';
        }
      }
    }
  }

  // Function to close preview modal
 function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  const previewImage = document.getElementById('previewImage') as HTMLImageElement;
  const previewIframe = document.getElementById('previewIframe') as HTMLIFrameElement;
  
  if (modal) {
    modal.style.display = 'none';
  }
  
  if (previewImage) {
    previewImage.src = '';
  }
  
  if (previewIframe) {
    previewIframe.src = '';
  }
}

 
  // For downloading from a URL (Stage 1)
  function downloadFileFromUrl(url: string | null, fileName: string) {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      console.error('No file available for download');
    }
  }

  // Function to go to next page
  function goToNextPage() {
    if (currentStage < stageData.length - 1) {
      currentStage++;
    }
  }

  // Stage 2 related functions
  let showSaveButton = false;
let showLogisticsAlert = false;


function handleAvailabilityChange(itemId: string, newStatus: 'available' | 'need_to_purchase') {
  const item = notAvailableItems.find(item => item.id === itemId);
  if (item) {
    if (newStatus === 'available') {
      item.isAvailable = true;
      item.needToPurchaseLocally = false;
    } else if (newStatus === 'need_to_purchase') {
      item.needToPurchaseLocally = true;
      item.isAvailable = false;
    }
    
    // Reset the serialNo and invoiceNo when changing status
    item.serialNo = '';
    item.invoiceNo = '';
    item.attachment = undefined;

    // Add the item to newlyAvailableItems
    if (!newlyAvailableItems.some(newItem => newItem.id === item.id)) {
      newlyAvailableItems.push({
        id: item.id,
        name: item.name,
        status: newStatus
      });
    }

    // Trigger reactivity
    notAvailableItems = notAvailableItems;
    newlyAvailableItems = newlyAvailableItems;
    showSaveButton = true;
    allItemsSaved = false;
  }
}

function handleAttachmentChange(event: Event, itemId: string) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file) {
    const item = notAvailableItems.find(item => item.id === itemId);
    if (item) {
      item.attachment = file;
      notAvailableItems = notAvailableItems; // Trigger reactivity
    }
  }
}


function handleSaveMaterialToProcure() {
  const itemsToUpdate = notAvailableItems.filter(item => item.isAvailable || item.needToPurchaseLocally);
  
  if (itemsToUpdate.length === 0) {
    alert("No changes to save.");
    return;
  }

  const invalidItems = itemsToUpdate.filter(item => !item.serialNo || !item.invoiceNo);
  if (invalidItems.length > 0) {
    alert("Please fill in both Serial No. and Invoice No. for all selected items.");
    return;
  }

  const itemSummary = itemsToUpdate.map(item => 
    `${item.name}: ${item.isAvailable ? 'Available' : 'Need to purchase locally'}`
  ).join('\n');

  if (confirm(`Are you sure you want to update the following items?\n\n${itemSummary}`)) {
    itemsToUpdate.forEach(item => {
      item.isAvailabilityFrozen = true;
      const index = lineItemsWithStatus.findIndex(lineItem => lineItem.id === item.id);
      if (index !== -1) {
        lineItemsWithStatus[index].status = item.isAvailable ? 'available' : 'need_to_purchase';
        lineItemsWithStatus[index].serialNo = item.serialNo;
        lineItemsWithStatus[index].invoiceNo = item.invoiceNo;
        lineItemsWithStatus[index].attachment = item.attachment;
      }
      
      if (!newlyAvailableItems.some(newItem => newItem.id === item.id)) {
        newlyAvailableItems.push({
          id: item.id,
          name: item.name,
          status: item.isAvailable ? 'available' : 'need_to_purchase'
        });
      }
    });
    
    notAvailableItems = notAvailableItems.filter(item => !item.isAvailable && !item.needToPurchaseLocally);
    showSaveButton = false;
    showLogisticsAlert = true;
    
    // Update the reactive variables
    lineItemsWithStatus = [...lineItemsWithStatus];
    notAvailableItems = [...notAvailableItems];
    newlyAvailableItems = [...newlyAvailableItems];
    
    const availableItems = itemsToUpdate.filter(item => item.isAvailable).map(item => item.name);
    const purchaseLocallyItems = itemsToUpdate.filter(item => item.needToPurchaseLocally).map(item => item.name);
    
    let alertMessage = "";
    if (availableItems.length > 0) {
      alertMessage += `The following items are now available:\n${availableItems.join(", ")}\n\n`;
    }
    if (purchaseLocallyItems.length > 0) {
      alertMessage += `The following items need to be purchased locally:\n${purchaseLocallyItems.join(", ")}\n\n`;
    }
    alertMessage += "Please complete the order in the Logistics stage.";
    
    alert(alertMessage);

    // Check if all items are saved
    allItemsSaved = notAvailableItems.length === 0;

  }
  stageData[currentStage].completed = true;
  // Automatically move to the next stage
  goToPreviousStage();
}

function openPreviewModalMaterial(item: LineItem) {
  const modal = document.getElementById('previewModal');
  const previewImage = document.getElementById('previewImage') as HTMLImageElement;
  const previewIframe = document.getElementById('previewIframe') as HTMLIFrameElement;
  
  if (modal && previewImage && previewIframe && item.attachment) {
    modal.style.display = 'block';
    const fileUrl = URL.createObjectURL(item.attachment);
    
    if (item.attachment.type === 'application/pdf') {
      previewIframe.src = fileUrl;
      previewIframe.style.display = 'block';
      previewImage.style.display = 'none';
    } else if (item.attachment.type.startsWith('image/')) {
      previewImage.src = fileUrl;
      previewImage.style.display = 'block';
      previewIframe.style.display = 'none';
    } else {
      alert('Unsupported file type for preview');
      modal.style.display = 'none';
      return;
    }
  }
}

  // Stage 3 related functions
  interface Shipment {
  // ... other properties ...
  installationFile?: File;
  installationFileName?: string;
  serviceFile?: File;
  serviceFileName?: string;
  // ... other properties ...
}


  let shipments: any[] = [{ isSaved: false, activeTab: 'installation', rejected: false, rejectionRemark: '' }];

  function validateMobileNumber(number: string): boolean {
    const regex = /^\d{10}$/;
    return regex.test(number);
  }

  function handleMobileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
  }

  function editShipment(index: number) {
  shipments[index].isEditing = true;
  shipments = [...shipments]; // Trigger reactivity
}

function cancelEdit(index: number) {
  // Revert changes
  shipments[index] = { ...shipments[index], isEditing: false };
  // If you want to revert to the original data, you might need to keep a copy of the original data
  // and restore it here
  shipments = [...shipments]; // Trigger reactivity
}

function saveShipment(index: number) {
  const shipment = shipments[index];
  if (isShipmentValid(shipment)) {
    shipment.isSaved = true;
    shipment.isEditing = false;
    shipments = [...shipments];
    shipment.accountStatus = '';
    shipment.accountRemark = '';
    alert(`${shipment.activeTab === 'installation' ? 'Installation' : 'Service'} details ${shipment.isEditing ? 'updated' : 'saved'} successfully.`);
    console.log('Saved shipment:', shipment);

    // Update the Share with Account stage
    updateShareWithAccountStage();
  } else {
    alert(`Please fill up all the ${shipment.activeTab === 'installation' ? 'installation' : 'service'} details before saving.`);
    console.log('Invalid shipment:', shipment);
  }
  lastSavedTimes[currentStage] = getCurrentDateTime();
}

function updateShareWithAccountStage() {
  // This function will update the Share with Account stage
  // It will be called whenever a shipment is saved in the Ongoing stage
  stageData[stageData[4].visible ? 5 : 4].visible = true;
}

  function isShipmentValid(shipment: any): boolean {
    if (shipment.activeTab === 'installation') {
      return shipment.engineerName && shipment.scheduleDate && 
             shipment.mobileNumber && validateMobileNumber(shipment.mobileNumber) &&
             shipment.vendorName && shipment.installationRemarks && shipment.installationFile;
    } else {
      return shipment.serviceEngineerName && shipment.serviceScheduleDate && 
             shipment.serviceMobileNumber && validateMobileNumber(shipment.serviceMobileNumber) &&
             shipment.serviceVendorName && shipment.serviceRemarks && 
             shipment.serviceFile && shipment.serviceTicketId;
    }
  }

  function handleStage3FileChange(event: Event, type: 'installation' | 'service', index: number) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file && (!shipments[index].isSaved || shipments[index].isEditing)) {
    if (type === 'installation') {
      shipments[index].installationFile = file;
      shipments[index].installationFileName = file.name;
    } else {
      shipments[index].serviceFile = file;
      shipments[index].serviceFileName = file.name;
    }
    shipments = [...shipments]; // Trigger reactivity
  }
  lastSavedTimes[currentStage] = getCurrentDateTime();
}

  // Return pickup related functions

function previewFile(file: File | string | null) {
  if (!file) return;

  if (typeof file === 'string') {
    openPreviewModal(null, file);
  } else {
    openPreviewModal(file, null);
  }
}

function downloadFile(file: File | undefined, fileName: string) {
  if (!file) {
    console.error('No file to download');
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



let returnPickup = {
  name: '',
  mobile: '',
  remark: '',
  file: null as File | any,
  fileName: '',
  filePreviewUrl: null as string | null,
  isSaved: false,
  isDataSaved: false,
  rejected: false,
  rejectionRemark: '',
  accountStatus: '',
  accountRemark: '',
  isEditing: false,
  dcNumber: '',
  trackingNo: '',
  dcAmount: '',
  dispatchedDate: '',
  deliveryDate: '',
  dcaccountRemark: '',
  selectedItems: []  as LineItem[],
  approved: false,
  approvalRemark: '',
};

let returnPickupRequested = false;
let showReturnPickupConfirmation = false;
let showConfirmationPopup = false;
let returnPickupDetailsSaved = false;
let returnPickupName = '';
  let returnPickupMobile = '';
  let returnPickupRemark = '';

  function toggleReturnPickup() {
  if (returnPickupRequested && !returnPickupDetailsSaved) {
    // If cancelling and details are not saved, reset the state
    returnPickupRequested = false;
    returnPickupName = '';
    returnPickupMobile = '';
    returnPickupRemark = '';
  } else if (!returnPickupRequested) {
    // If requesting, show the details form
    returnPickupRequested = true;
  }
  // If details are saved, do nothing (button should be disabled anyway)
}

function saveReturnPickupDetails() {
  if (returnPickupName && returnPickupMobile.length === 10 && returnPickupRemark) {
    const selectedItems = lineItemsWithStatus.filter(item => item.returnPickup);
    if (selectedItems.length > 0) {
      showReturnPickupConfirmation = true;
    } else {
      alert("Please select at least one item for return pickup.");
    }
  } else {
    alert("Please fill in all fields correctly before saving.");
  }
}

function editQuantity(item: LineItem) {
  const newQuantity = prompt(`Enter new quantity for ${item.name}:`, item.returnQuantity?.toString() ?? item.quantity.toString());
  if (newQuantity !== null) {
    const quantity = parseFloat(newQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      item.returnQuantity = quantity;
    } else {
      alert("Please enter a valid quantity.");
    }
  }
}

function confirmReturnPickup() {
  showReturnPickupConfirmation = false;
  returnPickupDetailsSaved = true;
  returnPickup.name = returnPickupName;
  returnPickup.mobile = returnPickupMobile;
  returnPickup.remark = returnPickupRemark;
  returnPickup.selectedItems = lineItemsWithStatus
    .filter(item => item.returnPickup)
    .map(item => ({
      ...item,
      quantity: item.returnQuantity ?? item.quantity,
      item_total: (item.returnQuantity ?? item.quantity) * item.rate
    }));
  alert("Return Pickup request confirmed. Details have been saved and can no longer be edited.");
}

function previewReturnPickupFile() {
  if (returnPickup.file) {
    openPreviewModal(returnPickup.file, null);
  } else if (returnPickup.filePreviewUrl) {
    openPreviewModal(null, returnPickup.filePreviewUrl);
  }
}

function handleReturnPickupMobileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/\D/g, '').slice(0, 10);
}

function handleReturnPickupFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file && !returnPickup.isSaved) {
    returnPickup.file = file;
    returnPickup.fileName = file.name;
    returnPickup = {...returnPickup}; // Trigger reactivity
  }
  lastSavedTimes[currentStage] = getCurrentDateTime();
}

function saveReturnPickup() {
  if (isReturnPickupComplete()) {
    returnPickup.isSaved = true;
    returnPickup.isDataSaved = true;
    alert("Return Pickup details saved successfully. You can no longer edit this entry.");
  } else {
    alert("Please fill up all the Return Pickup details.");
  }
}

function isReturnPickupComplete(): boolean {
  return (
    returnPickup.name.trim() !== '' &&
    returnPickup.mobile.length === 10 &&
    returnPickup.remark.trim() !== '' &&
    returnPickup.file !== null &&
    returnPickup.dcNumber.trim() !== '' &&
    returnPickup.trackingNo.trim() !== '' &&
    returnPickup.dcAmount.trim() !== '' &&
    returnPickup.dispatchedDate !== '' &&
    returnPickup.deliveryDate !== '' &&
    returnPickup.dcaccountRemark.trim() !== ''
  );
}

function formatAmountreturn(event: Event) {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/[^\d.]/g, '');
  
  // Allow only one decimal point
  const parts = value.split('.');
  if (parts.length > 2) {
    parts.pop();
    value = parts.join('.');
  }
  
  // Format with commas for thousands
  const [wholePart, decimalPart] = value.split('.');
  let formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // Combine whole part and decimal part (if exists)
  let formatted = formattedWholePart;
  if (decimalPart !== undefined) {
    formatted += '.' + decimalPart;
  }

  // Update the input value and the returnPickup object
  input.value = formatted;
  returnPickup.dcAmount = formatted;
}

let stageStartTimes: { [key: number]: string } = {};
let lastSavedTimes: { [key: number]: string } = {};
let lastSubmittedTimes: { [key: number]: string } = {};


function getCurrentDateTime(): string {
  return new Date().toLocaleString();
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function updateDeliveryDateMin() {
  if (returnPickup.dispatchedDate > returnPickup.deliveryDate) {
    returnPickup.deliveryDate = returnPickup.dispatchedDate;
  }
}

// Share with account related variables
let accountStatus = '';
let accountRemark = '';
let showRejectionAlert = false;
let canEditOngoing = false;
let canEditReturnPickup = false;

function handleKeydown(event: { key: string; }) {
  if (event.key === 'Enter' || event.key === ' ') {
    closePreviewModal();
  }
}

// Reactive statements
$: {
  stageData[4].visible = returnPickupRequested;
  stageData = stageData; // Trigger reactivity
}

$: {
  partialDelivery = lineItemsWithStatus.some(item => item.status === 'not_available');
  updateDCOrderTotal();
}

$: {
  if (showRejectionAlert) {
    canEditOngoing = true;
    canEditReturnPickup = true;
  }
}

$: {
  if (partialDelivery) {
    stageData[2].visible = true;
  } else {
    stageData[2].visible = false;
  }
}

$: allItemsNotAvailable = lineItemsWithStatus.every(item => item.status === 'not_available');
$: allItemsNotAvailableOrNotRequired = lineItemsWithStatus.every(item => 
  item.status === 'not_available' || item.status === 'not_required'
);

$: canSubmitLogistics = allLineItemsFrozen() && allStatusesFilled && dcBoxes.every(dc => dc.isSaved || isCurrentDCFilled());

$: visibleStages = (isDropped || isMonitoring)
      ? stageData.filter(stage => stage.completed)
      : stageData;

</script>


<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
     on:click|self={closeModal}
     on:keydown={(e) => e.key === 'Escape' && closeModal()}
     role="button"
     tabindex="0">
  <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">

    <div class="relative flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Stages</h2>
      <div class="relative" bind:this={dropdownContainer}>
        <button 
          class="text-2xl font-bold focus:outline-none"
          on:click={toggleDropdown}
        >
          ⋮
        </button>
        {#if showDropdown}
          <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
            <button 
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              on:click={handleDroppedToggle}
            >
              Dropped (Void)
            </button>
            <button 
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              on:click={handleMonitoringToggle}
            >
              Monitoring Billing
            </button>
          </div>
        {/if}
      </div>
    </div>
    
    {#if isDropped || isMonitoring}
      <div class="status-box bg-yellow-100 border border-yellow-200 rounded-lg p-6 mb-12 text-center font-medium text-lg shadow-md">
        <p>{isDropped ? "SO is Void :" : "Bill is getting Monitored :"}</p>
        <p class="mt-2 text-sm">{isDropped ? droppedRemarks : monitoringRemarks}</p>
      </div>
    {/if}

      <!-- Stage navigation -->
      <div class="mb-4 flex space-x-2">
        {#each visibleStages as stage, index}
          {#if stage.visible !== false}
            <button
              class="px-3 py-1 rounded {
                stage.completed ? 'bg-blue-500 text-white' : 
                currentStage === index ? 'border-2 border-blue-500 text-blue-500' : 'bg-gray-200'
              } hover:opacity-80"
              on:click={() => currentStage = index}
            >
              {stage.title}
            </button>
          {/if}
        {/each}
      </div>


    {#if showDroppedPopup}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">Dropped (Void)</h2>
        <label class="block mb-4">
          <span class="text-gray-700">Remarks:</span>
          <textarea
            bind:value={droppedRemarks}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows="3"
          ></textarea>
        </label>
        <div class="flex justify-end">
          <button
            on:click={() => showDroppedPopup = false}
            class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            on:click={submitDropped}
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!droppedRemarks.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
    {/if}
    
    {#if showMonitoringPopup}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">Monitoring Billing</h2>
        <label class="block mb-4">
          <span class="text-gray-700">Remarks:</span>
          <textarea
            bind:value={monitoringRemarks}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows="3"
          ></textarea>
        </label>
        <div class="flex justify-end">
          <button
            on:click={() => showMonitoringPopup = false}
            class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            on:click={submitMonitoring}
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!monitoringRemarks.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
    {/if}

    <form on:submit={handleSubmit}>
      <!-- Stage header -->
      <h3 class="text-xl font-bold mb-4">{stageData[currentStage].title}</h3>

      {#if currentStage === 0}
  <!-- API data fields -->
  <div class="grid grid-cols-2 gap-4 mb-4">
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="so_number">
        SO Number
      </label>
      <input id="so_number" type="text" value={salesOrder.salesorder_number} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
    </div>
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="so_date">
        SO Date
      </label>
      <input id="so_date" type="text" value={new Date(salesOrder.date).toLocaleDateString()} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
    </div>
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="client_name">
        Client Name
      </label>
      <input id="client_name" type="text" value={salesOrder.customer_name} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
    </div>
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="purchase_order">
        Purchase Order
      </label>
      <input id="purchase_order" type="text" value={salesOrder.reference_number} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
    </div>
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="so_subtotal">
        SO Subtotal
      </label>
      <input id="so_subtotal" type="text" value={formatCurrency(salesOrder.sub_total)} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
    </div>
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="so_total">
        SO Total
      </label>
      <input id="so_total" type="text" value={formatCurrency(salesOrder.total)} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
    </div>
  </div>

  <!-- Stage-specific fields -->
  <div class="mb-4 grid grid-cols-2 gap-4">
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="so_category">
        SO Category *
      </label>
      <input 
        id="so_category" 
        bind:value={soCategory} 
        class="w-full px-3 py-2 border rounded-md" 
      >
      
    </div>
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="project_manager">
        Project Manager Name *
      </label>
      <input 
        id="project_manager" 
        bind:value={projectManagerName} 
        class="w-full px-3 py-2 border rounded-md" 
      >
    </div>

    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="client_expected_date">
        Client Expected Date of Handover *
      </label>
      <input 
        type="date" 
        id="client_expected_date" 
        bind:value={clientExpectedDate} 
        min={minDate}
        class="w-full px-3 py-2 border rounded-md" 
        disabled={!isEditing} 
        required
      >
    </div>
  </div>

   
        
        {:else if currentStage === 1}
          <!-- Logistics stage content -->
          {#if showLogisticsAlert}
  <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 relative" role="alert">
    <p class="font-bold">The following items have new statuses:</p>
    
    {#if newlyAvailableItems.some(item => item.status === 'available')}
      <p class="font-semibold mt-2">Available Items:</p>
      <ul class="list-disc list-inside mt-1">
        {#each newlyAvailableItems.filter(item => item.status === 'available') as item}
          <li>{item.name}</li>
        {/each}
      </ul>
    {/if}
    
    {#if newlyAvailableItems.some(item => item.status === 'need_to_purchase')}
      <p class="font-semibold mt-2">Need to Purchase Locally:</p>
      <ul class="list-disc list-inside mt-1">
        {#each newlyAvailableItems.filter(item => item.status === 'need_to_purchase') as item}
          <li>{item.name}</li>
        {/each}
      </ul>
    {/if}
    
    <p class="mt-2">Please complete the order for these items in the Logistics stage.</p>
    <button 
      class="absolute top-0 right-0 mt-2 mr-2 text-yellow-700 hover:text-yellow-900"
      on:click={() => {
        showLogisticsAlert = false;
        newlyAvailableItems = [];
      }}
    >
      ×
    </button>
  </div>
{/if}
          <div class="mb-4">
            <h4 class="text-lg font-bold mb-2">Line Items</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each lineItemsWithStatus as item, index (item.id)}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select bind:value={lineItemsWithStatus[index].status} class=" w-32 px-2 py-1 border rounded-md" disabled={frozenLineItems[item.id]} >
                        <option value="">Select status</option>
                        <option value="available">Available</option>
                        <option value="not_available">Not Available</option>
                        <option value="need_to_purchase">Need to purchase locally</option>
                        <option value="not_required">Not Required</option>
                      </select>
                    </td>
                  </tr>
                {/each}
                </tbody>
              </table>
            </div>
          </div>

            <!-- New reactive statement to check if all items are Not Available or Not Required -->

      
          
        <!-- Partial Delivery toggle -->
  {#if lineItemsWithStatus.some(item => item.status === 'not_available')}
  <div class="mt-4">
    <label class="inline-flex items-center">
      <input type="checkbox" bind:checked={partialDelivery} class="form-checkbox">
      <span class="ml-2">Partial Delivery</span>
    </label>
  </div>
{/if}


<!-- DC Order Total section -->
<div class="flex justify-between items-center mt-4">
  <div class="flex-1">
    <h4 class="text-lg font-bold mb-2 inline-block mr-2">Current Unsaved Total:</h4>
    <p class="inline-block">{formatCurrency(dcOrderTotal.subtotal)}</p>
  </div>
  <div class="w-px h-10 bg-gray-300 mx-4"></div>
  <div class="flex-1 text-right">
    <h4 class="text-lg font-bold mb-2 inline-block mr-2">Total of Saved DCs or E-ways:</h4>
    <p class="inline-block">{formatCurrency(totalSavedDCAmount)}</p>
  </div>
</div>

{#if allItemsNotAvailableOrNotRequired}
  <div class="mt-4 mb-4 text-center text-lg font-bold text-red-600">
    {#if allItemsNotAvailable}
      All items are marked as Not Available. Please save before proceeding.
    {:else}
      All items are marked as Not Available or Not Required. Please save before proceeding.
    {/if}
  </div>
  <div class="flex justify-center mt-4">
    <button 
      type="button" 
      on:click={handleSaveAllNotAvailable} 
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    >
      Save All
    </button>
  </div>
{:else}
<!-- Display current unsaved total -->
<!-- <div class="mt-4">
  <h4 class="text-lg font-bold mb-2 inline-block mr-2">Current Unsaved Total:</h4>
  <p class="inline-block">{formatCurrency(dcOrderTotal.subtotal)}</p>
</div> -->
{#each dcBoxes as dc, index}
<div class="bg-white bg-opacity-50 p-6 rounded-lg shadow-md mb-8 relative">
  {#if !dc.isSaved && index !== 0}
    <button
      type="button"
      class="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl font-bold"
      on:click={() => removeDC(index)}
    >
      ×
    </button>
  {/if}
  
  <div class="bg-white bg-opacity-50 p-6 rounded-lg shadow-md mb-8">
    <h4 class="text-lg font-bold mb-4">DC or E-way Bill Details</h4>
    <div class="flex items-center mb-4 space-x-4">
      <div class="flex-1">
        <label for="dc-number-{index}" class="block text-sm font-medium text-gray-700">
          {dc.billType === 'E-way' ? 'E-way Number:' : 'DC Number:'}
        </label>
        <input 
          type="text" 
          id="dc-number-{index}"
          bind:value={dc.customName} 
          placeholder={dc.billType === 'E-way' ? "Enter E-way number" : "Enter DC number"}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          disabled={dc.isSaved}
          on:focus={() => setBillType(index)}
        >
      </div>
    <div class="flex-1">
      <label for="dc-status-{index}" class="block text-sm font-medium text-gray-700">Status:</label>
      <select 
        id="dc-status-{index}" 
        bind:value={dc.status} 
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        disabled={dc.isSaved}
      >
        <option value="">Select status</option>
        <option value="draft">Draft</option>
        <option value="open">Open</option>
        <option value="delivered">Delivered</option>
        <option value="returned">Returned</option>
        <option value="void">Void</option>

      </select>
    </div>
  </div>
</div>

<!-- DC Boxes -->

  <!-- <div class="flex items-center mb-4">
    <span class="text-xl font-semibold mr-2">{dcOrderTotal.subtotal >= 50000 ? 'E-way :' : 'DC :'}</span>
    <input 
      type="text" 
      bind:value={dc.customName} 
      placeholder={dcOrderTotal.subtotal >= 50000 ? "Enter E-way number" : "Enter DC number"}
      class="border-b-2 border-gray-300 focus:border-blue-500 outline-1 px-2 py-1"
      required disabled={dc.isSaved}
    >
  </div> -->
  <div class="flex justify-center mb-8">
    <div class="bill-type-buttons flex gap-6">
      <button
        class="px-8 py-3 border rounded-lg shadow-md {dc.billType === 'DC' ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
      >
        DC Bill
      </button>
      <button
        class="px-8 py-3 border rounded-lg shadow-md {dc.billType === 'E-way' ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
      >
        E-way Bill
      </button>
    </div>
  </div>

  <div class="space-y-4">
    <div class="flex space-x-4">
      <div class="flex-1">
        <label for="tracking-no-{index}" class="block text-sm font-medium text-gray-700">POD Number:</label>
        <input type="text" id="tracking-no-{index}" bind:value={dc.trackingNo} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={dc.isSaved}>
      </div>

      <div class="flex-1">
        <label for="dispatched-date-{index}" class="block text-sm font-medium text-gray-700">Dispatched Date:</label>
        <input type="date" id="dispatched-date-{index}" bind:value={dc.dispatchedDate} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" max={new Date().toISOString().split('T')[0]} required disabled={dc.isSaved}>
      </div>

      <div class="flex-1">
        <label for="delivery-date-{index}" class="block text-sm font-medium text-gray-700">Estimated Delivery Date:</label>
        <input type="date" id="delivery-date-{index}" bind:value={dc.deliveryDate} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" min={dc.dispatchedDate} required disabled={dc.isSaved}>
      </div>

      <div class="flex-1">
        <label for="dc-amount-{index}" class="block text-sm font-medium text-gray-700">
          {dc.billType === 'E-way' ? 'E-way Bill Amount:' : 'DC Amount:'}
        </label>
        <p id="dc-amount-{index}" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-100 rounded-md shadow-sm">
          {formatCurrency(dc.isSaved ? dc.dcAmount : dcOrderTotal.subtotal)}
        </p>
      </div>
    </div>

    <div class="flex-1">
      <label for="attachment-{index}" class="block text-sm font-medium text-gray-700">Attachment:</label>
      {#if !dc.isSaved}
        <input 
          type="file" 
          id="attachment-{index}" 
          on:change={(e) => handleFileChange(e, index)}
          class="mt-1 block w-full" 
          accept="application/pdf,image/*" 
        >
      {/if}
      {#if dc.attachment || dc.fileName}
        <div class="mt-2">
          <span class="text-sm text-gray-600">{dc.fileName || 'File uploaded'}</span>
          <button 
            type="button" 
            on:click={() => openPreviewModalDC(index)}
            class="text-blue-600 hover:text-blue-800 ml-2"
          >
            Preview
          </button>
          <button 
            type="button" 
            on:click={() => downloadFileFromUrl(dc.filePreviewUrl, dc.fileName)}
            class="text-green-600 hover:text-green-800 ml-2"
          >
            Download
          </button>
        </div>
      {/if}
    </div>
    
    {#if showCustomNameModal}
    <div class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
          <div class="bg-gray-50 px-4 py-3 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Enter Custom File Name
            </h3>
          </div>
          <div class="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div class="mt-2">
                  <input 
                    type="text" 
                    bind:value={customFileName}
                    placeholder="Enter custom file name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              on:click={() => {
                dc.fileName = customFileName;
                showCustomNameModal = false;
                // Update the file preview
                dc.attachment = dc.attachment; // Trigger update
              }}
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Yes
            </button>
            <button 
              type="button" 
              on:click={() => showCustomNameModal = false}
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
<!-- Preview Modal -->
<div id="previewModal" class="modal" style="display:none; position:fixed; z-index:1; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.4);">
  <div class="modal-content" style="background-color:#fefefe; margin:15% auto; padding:20px; border:1px solid #888; width:80%;">
    <button type="button" class="close" on:click={closePreviewModal} on:keydown={handleKeydown} style="background:none; border:none; color:#aaa; float:right; font-size:28px; font-weight:bold; cursor:pointer;" aria-label="Close preview">&times;</button>
    <img id="previewImage" alt="File preview" style="max-width:100%; max-height:70vh; display:none;">
    <iframe id="previewIframe" style="width:100%; height:70vh; display:none;" title="File preview content"></iframe>
  </div>
</div>

    <!-- Line Items Table -->
{#if dc.isSaved}
<div class="mt-6">
  <h4 class="text-lg font-bold mb-2">Line Items in this {dcOrderTotal.subtotal >= 50000 ? 'E-way Bill' : 'DC'}</h4>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each dc.lineItemIndices as itemIndex, i}
          {@const item = lineItemsWithStatus[itemIndex]}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {item.status === 'need_to_purchase' ? 'Need to purchase locally' : 'Available'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
{/if}
  </div>
</div>
{/each}

 <!-- Add this block at the end of the logistics stage content -->
 
 <!-- Existing Save and Add more buttons -->
 <div class="flex justify-between mt-4">
  <div class="space-x-2">
    <button 
      type="button" 
      on:click={handleSave} 
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      disabled={!canSaveDC(dcBoxes[dcBoxes.length - 1])}
    >
      Save
    </button>

    {#if !allItemsNotAvailable}
      <button 
        type="button" 
        on:click={addMoreDC} 
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Add more +
      </button>

    {/if}
  
   </div>
 </div>
{/if}


{:else if currentStage === 2}
<!-- Material to Procure stage content -->
<div class="mb-4">
  <h4 class="text-xl font-bold mb-4 text-center">Not Available Items to Procure</h4>
  {#if notAvailableItems.length > 0}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Need to purchase locally</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each notAvailableItems as item, index (item.id)}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <input 
                  type="checkbox" 
                  bind:checked={item.isAvailable} 
                  on:change={() => handleAvailabilityChange(item.id, 'available')}
                  disabled={item.isAvailabilityFrozen || item.needToPurchaseLocally}
                >
                {#if item.isAvailable}
                  <span class="ml-2 text-green-500">✓</span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <input 
                  type="checkbox" 
                  bind:checked={item.needToPurchaseLocally} 
                  on:change={() => handleAvailabilityChange(item.id, 'need_to_purchase')}
                  disabled={item.isAvailabilityFrozen || item.isAvailable}
                >
                {#if item.needToPurchaseLocally}
                  <span class="ml-2 text-blue-500">✓</span>
                {/if}
              </td>
            </tr>
            {#if item.isAvailable || item.needToPurchaseLocally}
              <tr>
                <td colspan="7" class="px-6 py-4">
                  <div class="flex space-x-4">
                    <div class="flex-1">
                      <label for="serial-no-{item.id}" class="block text-sm font-medium text-gray-700">Serial No.: *</label>
                      <input 
                        type="text" 
                        id="serial-no-{item.id}" 
                        bind:value={item.serialNo} 
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        required
                      >
                    </div>
                    <div class="flex-1">
                      <label for="invoice-no-{item.id}" class="block text-sm font-medium text-gray-700">Invoice No.: *</label>
                      <input 
                        type="text" 
                        id="invoice-no-{item.id}" 
                        bind:value={item.invoiceNo} 
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        required
                      >
                    </div>
                    <div class="flex-1">
                      <label for="attachment-{item.id}" class="block text-sm font-medium text-gray-700">Attachment:</label>
                      <input 
                        type="file" 
                        id="attachment-{item.id}" 
                        on:change={(e) => handleAttachmentChange(e, item.id)}
                        class="mt-1 block w-full"
                        accept="application/pdf,image/*"
                      >
                      {#if item.attachment}
                        <div class="mt-2">
                          <span class="text-sm text-gray-600">{item.attachment.name}</span>
                          <button 
                            type="button" 
                            on:click={() => openPreviewModalMaterial(item)}
                            class="text-blue-600 hover:text-blue-800 ml-2"
                          >
                            Preview
                          </button>
                        </div>
                      {/if}
                    </div>
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="text-center">No items marked as not available.</p>
  {/if}
</div>

{#if showSaveButton}
  <div class="flex justify-end mt-4">
    <button 
      type="button" 
      on:click={handleSaveMaterialToProcure}
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
    >
      Save
    </button>
  </div>
{/if}

{#if allItemsSaved}
  <div class="text-center mt-4 text-lg font-bold text-green-600">
    All items have been saved. You can now submit the stage.
  </div>
{/if}

<!-- Preview Modal -->
<div id="previewModal" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style="display:none;">
  <div class="modal-content relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
    <div class="flex justify-between items-center pb-3">
      <p class="text-2xl font-bold">File Preview</p>
      <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" on:click={closePreviewModal}>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
    <div class="mt-4">
      <img id="previewImage" alt="File preview" class="max-w-full max-h-[70vh] mx-auto" style="display:none;">
      <iframe id="previewIframe" class="w-full h-[70vh]" style="display:none;" title="File preview content"></iframe>
    </div>
  </div>
</div>

{:else if currentStage === 3}
<!-- On Going stage content -->
<div class="relative pb-16">
 
<div class="mb-4">
 {#each shipments as shipment, index}
     <div class="mb-8 p-4 border rounded-lg relative">
      {#if shipment.rejected}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Rejected:</strong>
        <span class="block sm:inline"> {shipment.rejectionRemark}</span>
      </div>
    {:else if shipment.approved}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Approved:</strong>
        <span class="block sm:inline"> {shipment.accountRemark}</span>
      </div>
    {/if}
       
       <!-- Dynamic header based on active tab -->
       <h5 class="text-lg font-semibold mb-4">
         {shipment.activeTab === 'installation' ? 'Installation Report' : 'Service Report'} 
       </h5>

       <!-- Toggle buttons for Installation and Service -->
       <div class="flex justify-center mb-4">
         <button
           class="px-4 py-2 {shipment.activeTab === 'installation' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l"
           on:click={() => {
             if (!shipment.isSaved || shipment.isEditing) {
               shipment.activeTab = 'installation';
               shipments = [...shipments];
             }
           }}
           disabled={shipment.isSaved && !shipment.isEditing}
         >
           Installation
         </button>
         <button
           class="px-4 py-2 {shipment.activeTab === 'service' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r"
           on:click={() => {
             if (!shipment.isSaved || shipment.isEditing) {
               shipment.activeTab = 'service';
               shipments = [...shipments];
             }
           }}
           disabled={shipment.isSaved && !shipment.isEditing}
         >
           Service
         </button>
       </div>

     {#if shipment.activeTab === 'installation'}
       <!-- Installation fields -->
       <div class="space-y-4">
         <div class="grid grid-cols-2 gap-4">
           <div>
             <label for="engineer-name-{index}" class="block text-sm font-medium text-gray-700">Engineer Name:</label>
             <input type="text" id="engineer-name-{index}" bind:value={shipment.engineerName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved && !shipment.isEditing}>
           </div>
           <div>
             <label for="schedule-date-{index}" class="block text-sm font-medium text-gray-700">Installation Completion Date :</label>
             <input 
               type="date" 
               id="schedule-date-{index}" 
               bind:value={shipment.scheduleDate} 
               min={new Date().toISOString().split('T')[0]} 
               class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
               required 
               disabled={shipment.isSaved && !shipment.isEditing}
             >
           </div>
         </div>
         <div class="grid grid-cols-2 gap-4">
           <div>
             <label for="mobile-number-{index}" class="block text-sm font-medium text-gray-700">Mobile Number:</label>
             <input 
               type="tel" 
               id="mobile-number-{index}" 
               bind:value={shipment.mobileNumber} 
               on:input={handleMobileInput}
               class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
               pattern="[0-9]{10}"
               maxlength="10"
               required
               disabled={shipment.isSaved && !shipment.isEditing}
             >
           </div>
           <div>
             <label for="vendor-name-{index}" class="block text-sm font-medium text-gray-700">Vendor Name:</label>
             <input type="text" id="vendor-name-{index}" bind:value={shipment.vendorName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved && !shipment.isEditing}>
           </div>
         </div>
         <div>
           <label for="installation-remarks-{index}" class="block text-sm font-medium text-gray-700">Installation Remarks:</label>
           <textarea id="installation-remarks-{index}" bind:value={shipment.installationRemarks} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" disabled={shipment.isSaved && !shipment.isEditing}></textarea>
         </div>
         <div>
          <label for="installation-report-{index}" class="block text-sm font-medium text-gray-700">Installation Report Attachment:</label>
          {#if !shipment.isSaved || shipment.isEditing}
            <input type="file" id="installation-report-{index}" on:change={(e) => handleStage3FileChange(e, 'installation', index)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full" required>
          {/if}
          {#if shipment.installationFile}
            <div class="mt-2">
              <span class="text-sm text-gray-600">{shipment.installationFileName || 'File uploaded'}</span>
              <button 
                type="button" 
                on:click={() => previewFile(shipment.installationFile || shipment.installationFileName)}
                class="text-blue-600 hover:text-blue-800 ml-2"
              >
                Preview
              </button>
              <button 
                type="button" 
                on:click={() => downloadFile(shipment.installationFile, shipment.installationFileName)}
                class="text-green-600 hover:text-green-800 ml-2"
              >
                Download
              </button>
             </div>
           {/if}
         </div>
       </div>
     {:else}
       <!-- Service fields -->
       <div class="space-y-4">
         <div class="grid grid-cols-2 gap-4">
           <div>
             <label for="service-engineer-name-{index}" class="block text-sm font-medium text-gray-700">Engineer Name:</label>
             <input type="text" id="service-engineer-name-{index}" bind:value={shipment.serviceEngineerName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved && !shipment.isEditing}>
           </div>
           <div>
             <label for="service-schedule-date-{index}" class="block text-sm font-medium text-gray-700">Service Completion Date :</label>
             <input 
               type="date" 
               id="service-schedule-date-{index}" 
               bind:value={shipment.serviceScheduleDate} 
               min={new Date().toISOString().split('T')[0]} 
               class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
               required 
               disabled={shipment.isSaved && !shipment.isEditing}
             >
           </div>
         </div>
         <div class="grid grid-cols-2 gap-4">
           <div>
             <label for="service-mobile-number-{index}" class="block text-sm font-medium text-gray-700">Mobile Number:</label>
             <input 
                 type="tel" 
                 id="service-mobile-number-{index}" 
                 bind:value={shipment.serviceMobileNumber} 
                 on:input={handleMobileInput}
                 class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                 pattern="[0-9]{10}"
                 maxlength="10"
                 required
                 disabled={shipment.isSaved && !shipment.isEditing}
               >
           </div>
           <div>
             <label for="service-vendor-name-{index}" class="block text-sm font-medium text-gray-700">Vendor Name:</label>
             <input type="text" id="service-vendor-name-{index}" bind:value={shipment.serviceVendorName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved && !shipment.isEditing}>
           </div>
         </div>
         <div>
           <label for="service-remarks-{index}" class="block text-sm font-medium text-gray-700">Service Remarks:</label>
           <textarea id="service-remarks-{index}" bind:value={shipment.serviceRemarks} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" disabled={shipment.isSaved && !shipment.isEditing}></textarea>
         </div>
         <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="service-report-{index}" class="block text-sm font-medium text-gray-700">Service Report Attachment:</label>
            {#if !shipment.isSaved || shipment.isEditing}
              <input type="file" id="service-report-{index}" on:change={(e) => handleStage3FileChange(e, 'service', index)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full" required>
            {/if}
            {#if shipment.serviceFile}
              <div class="mt-2">
                <span class="text-sm text-gray-600">{shipment.serviceFileName || 'File uploaded'}</span>
                <button 
                  type="button" 
                  on:click={() => previewFile(shipment.installationFile || shipment.installationFileName)}
                  class="text-blue-600 hover:text-blue-800 ml-2"
                >
                  Preview
                </button>
                <button 
                  type="button" 
                  on:click={() => downloadFile(shipment.serviceFile, shipment.serviceFileName)}
                  class="text-green-600 hover:text-green-800 ml-2"
                >
                  Download
                </button>
               </div>
             {/if}
           </div>
           <div>
             <label for="service-ticket-id-{index}" class="block text-sm font-medium text-gray-700">Service Ticket Id:</label>
             <input type="text" id="service-ticket-id-{index}" bind:value={shipment.serviceTicketId} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved && !shipment.isEditing}>
           </div>
         </div>
       </div>
     {/if}

     {#if !shipment.isSaved || shipment.isEditing}
       <button 
         type="button" 
         on:click={() => saveShipment(index)}
         class="mt-4 absolute bottom-2 right-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
       >
         {shipment.isEditing ? 'Update' : 'Save'}
       </button>
       {#if shipment.isEditing}
         <button 
           type="button" 
           on:click={() => cancelEdit(index)}
           class="mt-4 absolute bottom-2 right-24 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
         >
           Cancel
         </button>
       {/if}
     {:else}
       <button 
         type="button" 
         on:click={() => editShipment(index)}
         class="mt-4 absolute bottom-2 right-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
       >
         Edit
       </button>
     {/if}
   </div>
 {/each}

</div>

<!-- ... rest of the code ... -->

<!-- Preview Modal -->
<div id="previewModal" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style="display:none;">
  <div class="modal-content relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
    <div class="flex justify-between items-center pb-3">
      <p class="text-2xl font-bold">File Preview</p>
      <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" on:click={closePreviewModal}>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
    <div class="mt-4">
      <img id="previewImage" alt="File preview" class="max-w-full max-h-[70vh] mx-auto" style="display:none;">
      <iframe id="previewIframe" class="w-full h-[70vh]" style="display:none;" title="File preview content"></iframe>
    </div>
  </div>
</div>
        
        <!-- Return Pickup toggle button -->
       <button 
          type="button" 
          on:click={() => {
            returnPickupRequested = !returnPickupRequested;
            stageData = [...stageData]; // Trigger reactivity
          }}
          class="mt-4 mb-4 px-4 py-2 {returnPickupRequested ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded absolute bottom-2 left-2"
          disabled={returnPickupDetailsSaved}
        >
          {returnPickupRequested ? 'Cancel Return Pickup' : 'Request Return Pickup'}
        </button>
       <!-- Return Pickup Details box -->
       {#if returnPickupRequested && !showReturnPickupConfirmation}
  <div class="mb-8 p-4 border rounded-lg relative">
    <h4 class="text-lg font-bold mb-4">Return Pickup Details</h4>
    <div class="space-y-4">
      <div class="flex space-x-4">
        <div class="flex-1">
          <label for="return-pickup-name" class="block text-sm font-medium text-gray-700">Name:</label>
          <input 
            type="text" 
            id="return-pickup-name" 
            bind:value={returnPickupName} 
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
            required
            disabled={returnPickupDetailsSaved}
          >
        </div>
        <div class="flex-1">
          <label for="return-pickup-mobile" class="block text-sm font-medium text-gray-700">Mobile Number:</label>
          <input 
            type="tel" 
            id="return-pickup-mobile" 
            bind:value={returnPickupMobile} 
            on:input={handleReturnPickupMobileInput}
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
            pattern="[0-9]{10}"
            maxlength="10"
            required
            disabled={returnPickupDetailsSaved}
          >
        </div>
      </div>
      <div>
        <label for="return-pickup-remark" class="block text-sm font-medium text-gray-700">Project Manager's Remark:</label>
        <textarea 
          id="return-pickup-remark" 
          bind:value={returnPickupRemark} 
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          rows="3" 
          required
          disabled={returnPickupDetailsSaved}
        ></textarea>
      </div>
      
       <!-- Line Items -->
<div class="mt-4">
  <h5 class="text-md font-semibold mb-2">Line Items for Return Pickup</h5>
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Pickup</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#each lineItemsWithStatus as item (item.id)}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative group">
            {item.returnQuantity ?? item.quantity} {item.unit}
            {#if !returnPickupDetailsSaved}
            <button
            type="button"
            class="hidden group-hover:inline-flex items-center ml-2 cursor-pointer text-xs bg-transparent border-none p-0"
            on:click={() => editQuantity(item)}
            on:keydown={(e) => e.key === 'Enter' && editQuantity(item)}
            aria-label="Edit quantity"
          >
            <span aria-hidden="true">✏️</span>
            <span>Edit</span>
          </button>
            {/if}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatCurrency((item.returnQuantity ?? item.quantity) * item.rate)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <input 
              type="checkbox" 
              bind:checked={item.returnPickup}
              disabled={returnPickupDetailsSaved}
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

      {#if !returnPickupDetailsSaved}
        <button 
          type="button" 
          on:click={saveReturnPickupDetails}
          class="mt-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 absolute down-2 right-2"
        >
          Save
        </button>
      {/if}

    </div>
  </div>
{/if}

 {#if showReturnPickupConfirmation}
 <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
   <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
     <h3 class="text-lg font-bold mb-4">Confirmation</h3>
     <p class="mb-4">Are you sure you want to request a Return Pickup?</p>
     <div class="flex justify-end">
       <button 
         on:click={() => showReturnPickupConfirmation = false}
         class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
       >
         Cancel
       </button>
       <button 
         on:click={confirmReturnPickup}
         class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
       >
         Confirm
       </button>
     </div>
   </div>
 </div>
{/if}
   </div>

   
   {:else if currentStage === 4 && stageData[4].visible}
     <!-- Return Pickup Stage -->
  <div class="mb-8 p-4 border rounded-lg relative">
    {#if returnPickup.rejected}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Rejected:</strong>
        <span class="block sm:inline"> {returnPickup.rejectionRemark}</span>
      </div>
    {:else if returnPickup.approved}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Approved:</strong>
        <span class="block sm:inline"> {returnPickup.approvalRemark}</span>
      </div>
    {/if}
    <h4 class="text-lg font-bold mb-4">Return Pickup Report</h4>

    <div class="space-y-4">
      <div class="flex space-x-4">
        <div class="flex-1">
          <label for="return-pickup-name" class="block text-sm font-medium text-gray-700">Name:</label>
          <input 
            type="text" 
            id="return-pickup-name" 
            bind:value={returnPickup.name} 
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
            required
            disabled={returnPickup.isSaved}
          >
        </div>
        <div class="flex-1">
          <label for="return-pickup-mobile" class="block text-sm font-medium text-gray-700">Mobile Number:</label>
          <input 
            type="tel" 
            id="return-pickup-mobile" 
            bind:value={returnPickup.mobile} 
            on:input={handleReturnPickupMobileInput}
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
            pattern="[0-9]{10}"
            maxlength="10"
            required
            disabled={returnPickup.isSaved}
          >
        </div>
      </div>

      <div>
        <label for="return-pickup-remark" class="block text-sm font-medium text-gray-700">Project Manager's Remark:</label>
        <textarea 
          id="return-pickup-remark" 
          bind:value={returnPickup.remark} 
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          rows="3" 
          required
          disabled={returnPickup.isSaved}
        ></textarea>
      </div>

       <!-- Selected Line Items for Return Pickup -->
  <div class="mt-4">
    <h5 class="text-md font-semibold mb-2">Items for Return Pickup</h5>
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each lineItemsWithStatus.filter(item => item.returnPickup) as item (item.id)}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.returnQuantity ?? item.quantity} {item.unit}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency((item.returnQuantity ?? item.quantity) * item.rate)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
    </div>

    <!-- Additional fields -->
    <div class="flex space-x-4 mt-4">
      <div class="flex-1">
        <label for="dc-number" class="block text-sm font-medium text-gray-700">DC Number:</label>
        <input 
          type="text" 
          id="dc-number" 
          bind:value={returnPickup.dcNumber} 
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          required
          disabled={returnPickup.isSaved}
        >
      </div>
      <div class="flex-1">
        <label for="tracking-no" class="block text-sm font-medium text-gray-700">Courier's tracking no.:</label>
        <input 
          type="text" 
          id="tracking-no" 
          bind:value={returnPickup.trackingNo} 
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          required
          disabled={returnPickup.isSaved}
        >
      </div>
      <div class="flex-1">
        <label for="dc-amount" class="block text-sm font-medium text-gray-700">DC Amount:</label>
        <input 
          type="text" 
          id="dc-amount" 
          bind:value={returnPickup.dcAmount} 
          on:input={formatAmountreturn}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          required
          disabled={returnPickup.isSaved}
        >
      </div>
    </div>
    <div class="flex space-x-4 mt-4">
      <div class="flex-1">
        <label for="dispatched-date" class="block text-sm font-medium text-gray-700">Dispatched date:</label>
        <input 
          type="date" 
          id="dispatched-date" 
          bind:value={returnPickup.dispatchedDate} 
          on:change={updateDeliveryDateMin}
          max={getCurrentDate()}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          required
          disabled={returnPickup.isSaved}
        >
      </div>
      <div class="flex-1">
        <label for="delivery-date" class="block text-sm font-medium text-gray-700">Delivery date:</label>
        <input 
          type="date" 
          id="delivery-date" 
          bind:value={returnPickup.deliveryDate} 
          min={returnPickup.dispatchedDate}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          required
          disabled={returnPickup.isSaved}
        >
      </div>
    </div>
    <div class="mt-4">
      <label for="return-pickup-remark" class="block text-sm font-medium text-gray-700">Remark:</label>
      <textarea 
        id="return-pickup-remark" 
        bind:value={returnPickup.dcaccountRemark} 
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        rows="3" 
        required
        disabled={returnPickup.isSaved}
      ></textarea>
    </div>
    <div class="mt-4">
      <label for="attachment" class="block text-sm font-medium text-gray-700">Attachment:</label>
      {#if !returnPickup.isSaved}
        <input 
          type="file" 
          id="attachment" 
          on:change={handleReturnPickupFileChange}
          class="mt-1 block w-full" 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          required
        >
      {/if}
      {#if returnPickup.file}
        <div class="mt-2">
          <span class="text-sm text-gray-600">{returnPickup.fileName || 'File uploaded'}</span>
          <button 
            type="button" 
            on:click={previewReturnPickupFile}
            class="text-blue-600 hover:text-blue-800 ml-2"
          >
            Preview
          </button>
          <button 
  type="button" 
  on:click={() => downloadFile(returnPickup.file, returnPickup.fileName || '')}
  class="text-green-600 hover:text-green-800 ml-2"
>
  Download
</button>
        </div>
      {/if}
    </div>

    {#if !returnPickup.isSaved}
      <button 
        type="button" 
        on:click={saveReturnPickup}
        class="mt-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 absolute bottom-2 right-2"
      >
        Save
      </button>
    {/if}
  </div>


<!-- Preview Modal -->
<div id="previewModal" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style="display:none;">
  <div class="modal-content relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
    <div class="flex justify-between items-center pb-3">
      <p class="text-2xl font-bold">File Preview</p>
      <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" on:click={closePreviewModal}>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
    <div class="mt-4">
      <img id="previewImage" alt="File preview" class="max-w-full max-h-[70vh] mx-auto" style="display:none;">
      <iframe id="previewIframe" class="w-full h-[70vh]" style="display:none;" title="File preview content"></iframe>
    </div>
  </div>
</div>


{:else if currentStage === (stageData[4].visible ? 5 : 4)}
  <!-- Share with Account stage content -->
  <h4 class="text-lg font-bold mb-2">Installation and Service Reports</h4>
  <!-- Ongoing Shipments -->
  {#each shipments.filter(s => s.isSaved) as shipment, index}
    <div class="mb-6 p-4 border rounded-lg relative">
      <h5 class="text-md font-semibold mb-2">
        {shipment.activeTab === 'installation' ? 'Installation Report' : 'Service Report'}
      </h5>
      
      <!-- Installation/Service Report Details -->
      <div>
        <label for="report-remarks-{index}" class="block text-sm font-medium text-gray-700">
          {shipment.activeTab === 'installation' ? 'Installation' : 'Service'} Remarks:
        </label>
        <textarea 
          id="report-remarks-{index}" 
          value={shipment.activeTab === 'installation' ? shipment.installationRemarks : shipment.serviceRemarks} 
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          rows="3" 
          disabled
        ></textarea>
      </div>
      <div class="mt-2">
        <label for="report-attachment-{index}" class="block text-sm font-medium text-gray-700">
          {shipment.activeTab === 'installation' ? 'Installation' : 'Service'} Report Attachment:
        </label>
        {#if shipment.activeTab === 'installation' ? shipment.installationFile : shipment.serviceFile}
          <div class="mt-2">
            <span class="text-sm text-gray-600">
              {shipment.activeTab === 'installation' ? shipment.installationFileName : shipment.serviceFileName || 'File uploaded'}
            </span>
            <button 
              type="button" 
              on:click={() => previewFile(shipment.activeTab === 'installation' ? shipment.installationFile : shipment.serviceFile)}
              class="text-blue-600 hover:text-blue-800 ml-2"
            >
              Preview
            </button>
            <button 
              type="button" 
              on:click={() => downloadFile(shipment.activeTab === 'installation' ? shipment.installationFile : shipment.serviceFile, shipment.activeTab === 'installation' ? shipment.installationFileName : shipment.serviceFileName)}
              class="text-green-600 hover:text-green-800 ml-2"
            >
              Download
            </button>
          </div>
        {/if}
      </div>

      <!-- Approval/Rejection toggle buttons -->
      <div class="flex justify-center space-x-4 mt-4">
        <button
          type="button"
          class="px-3 py-1 {shipment.accountStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded"
          on:click={() => {
            if (!shipment.isDataSaved) {
              shipment.accountStatus = 'approved';
              shipment.accountRemark = '';
            }
          }}
          disabled={shipment.isDataSaved}
        >
          Approved
        </button>
        <button
          type="button"
          class="px-3 py-1 {shipment.accountStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'} rounded"
          on:click={() => {
            if (!shipment.isDataSaved) {
              shipment.accountStatus = 'rejected';
              shipment.accountRemark = '';
            }
          }}
          disabled={shipment.isDataSaved}
        >
          Rejected
        </button>
      </div>

      <!-- Remark input field -->
      {#if shipment.accountStatus}
        <div class="mt-4">
          <label for="account-remark-{index}" class="block text-sm font-medium text-gray-700">
            {shipment.accountStatus === 'approved' ? 'Approval' : 'Rejection'} Remark:
          </label>
          <textarea
            id="account-remark-{index}"
            bind:value={shipment.accountRemark}
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            rows="3"
            disabled={shipment.isDataSaved}
          ></textarea>
        </div>
      {/if}

      <!-- Save/Edit button -->
      <button 
        type="button" 
        on:click={() => {
          if (shipment.isDataSaved) {
            // Enter edit mode
            shipment.isDataSaved = false;
            shipment.isEditing = true;
          } else {
            // Validate before saving
            if (!shipment.accountStatus || !shipment.accountRemark || shipment.accountRemark.trim() === '') {
              alert("Please fill up the details before saving");
              return;
            }
            // Save changes
            shipment.isDataSaved = true;
            shipment.isEditing = false;
            // Add any additional save logic here
          }
          shipments = [...shipments]; // Trigger reactivity
        }}
        class="absolute bottom-2 right-2 px-2 py-1 {shipment.isDataSaved ? 'bg-blue-500' : 'bg-green-500'} text-white rounded text-sm"
      >
        {shipment.isDataSaved ? 'Edit' : 'Save'}
      </button>
    </div>
  {/each}

  <h4 class="text-lg font-bold mb-2">Return Pickups Report</h4>

  <!-- Return Pickups -->
  {#if returnPickup.isSaved}
  <div class="mb-6 p-4 border rounded-lg relative">
    <!-- New fields -->
    <div class="mt-4">
      <label for="return-pickup-remark" class="block text-sm font-medium text-gray-700">Return pickup report remarks:</label>
      <textarea 
        id="return-pickup-remark" 
        bind:value={returnPickup.dcaccountRemark} 
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        rows="3" 
        required
        disabled={returnPickup.isSaved && !returnPickup.isEditing}
      ></textarea>
    </div>
    <div class="mt-4">
      <label for="attachment" class="block text-sm font-medium text-gray-700">Return pickup report attachment:</label>
      {#if !returnPickup.isDataSaved}
        <input 
          type="file" 
          id="attachment" 
          on:change={handleReturnPickupFileChange}
          class="mt-1 block w-full" 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          required
        >
      {/if}
      {#if returnPickup.file}
        <div class="mt-2">
          <span class="text-sm text-gray-600">{returnPickup.fileName || 'File uploaded'}</span>
          <button 
            type="button" 
            on:click={previewReturnPickupFile}
            class="text-blue-600 hover:text-blue-800 ml-2"
          >
            Preview
          </button>
          <button 
            type="button" 
            on:click={() => downloadFile(returnPickup.file, returnPickup.fileName || '')}
            class="text-green-600 hover:text-green-800 ml-2"
          >
            Download
          </button>
        </div>
      {/if}
    </div>
  
    <!-- Approval/Rejection toggle buttons -->
    <div class="flex justify-center space-x-4 mb-4">
      <button
        type="button"
        class="px-3 py-1 {returnPickup.accountStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded"
        on:click={() => {
          if (returnPickup.accountStatus === 'rejected') {
            returnPickup.rejected = false;
            returnPickup.rejectionRemark = '';
          }
          returnPickup.accountStatus = 'approved';
          returnPickup.accountRemark = '';
          returnPickup.approved = true;
          returnPickup.approvalRemark = '';
        }}
        disabled={returnPickup.isDataSaved && !returnPickup.isEditing}
      >
        Approved
      </button>
      <button
        type="button"
        class="px-3 py-1 {returnPickup.accountStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'} rounded"
        on:click={() => {
          returnPickup.accountStatus = 'rejected';
          returnPickup.accountRemark = '';
          returnPickup.rejected = true;
          returnPickup.rejectionRemark = '';
          returnPickup.approved = false;
          returnPickup.approvalRemark = '';
        }}
        disabled={returnPickup.isDataSaved && !returnPickup.isEditing}
      >
        Rejected
      </button>
    </div>

    <!-- Remark field -->
    <div class="mb-2">
      <label for="pickup-remark" class="block text-sm font-medium text-gray-700">Remark:</label>
      <textarea 
        id="pickup-remark" 
        bind:value={returnPickup.accountRemark} 
        on:input={() => {
          if (returnPickup.accountStatus === 'rejected') {
            returnPickup.rejectionRemark = returnPickup.accountRemark;
          } else if (returnPickup.accountStatus === 'approved') {
            returnPickup.approvalRemark = returnPickup.accountRemark;
          }
        }}
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        rows="3" 
        required
        disabled={returnPickup.isDataSaved && !returnPickup.isEditing}
      ></textarea>
    </div>

    <!-- Save/Edit button -->
    <button 
      type="button" 
      on:click={() => {
        if (returnPickup.isDataSaved) {
          // Enter edit mode
          returnPickup.isDataSaved = false;
          returnPickup.isEditing = true;
        } else {
          // Validate before saving
          if (!returnPickup.accountStatus || !returnPickup.accountRemark || returnPickup.accountRemark.trim() === '') {
            alert("Please fill up the details before saving");
            return;
          }
          // Save changes
          returnPickup.isDataSaved = true;
          returnPickup.isEditing = false;
          // Add any additional save logic here
        }
      }}
      class="absolute down-2 right-2 px-2 py-1 {returnPickup.isDataSaved ? 'bg-blue-500' : 'bg-green-500'} text-white rounded text-sm"
    >
      {returnPickup.isDataSaved ? 'Edit' : 'Save'}
    </button>
  </div>

  <div id="previewModal" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style="display:none;">
  <div class="modal-content relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
    <div class="flex justify-between items-center pb-3">
      <p class="text-2xl font-bold">File Preview</p>
      <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" on:click={closePreviewModal}>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
    <div class="mt-4">
      <img id="previewImage" alt="File preview" class="max-w-full max-h-[70vh] mx-auto" style="display:none;">
      <iframe id="previewIframe" class="w-full h-[70vh]" style="display:none;" title="File preview content"></iframe>
    </div>
  </div>
</div>
{/if}
{/if}
 

        {#if showConfirmationPopup}
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 class="text-lg font-bold mb-4">Confirmation</h3>
            <p class="mb-4">Are you sure you want to submit {stageData[currentStage].title}?</p>
            <div class="flex justify-end">
              <button 
                on:click={() => showConfirmationPopup = false}
                class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                on:click={confirmSubmit}
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      {/if}

       <!-- Submit and Edit buttons -->
       <div class="flex justify-end mt-4 space-x-2">
        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Submit
        </button>

         <!-- Previous Stage button -->
      <button 
      type="button" 
      on:click={goToPreviousStage}
      class="mt-4 mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded absolute bottom-2 left-3"
      >
      Previous Stage
      </button>

        <!-- Next Stage button -->
        <button 
        type="button" 
        on:click={goToNextStage}
        class="mt-4 mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded absolute bottom-2 left-40"
        >
        Next Stage
        </button>
        {#if stageData[currentStage].completed}
          <button type="button" on:click={editStage} class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
            Edit
          </button>
        {/if}
      </div>

      <!-- Time information -->
<div class="mt-8 text-sm text-gray-500">
  {#if stageStartTimes[currentStage]}
    <p class="absolute bottom-2 left-2">Started on: {stageStartTimes[currentStage]}</p>
  {/if}
  {#if lastSavedTimes[currentStage] && !lastSubmittedTimes[currentStage]}
    <p class="absolute bottom-2 right-2">Last saved on: {lastSavedTimes[currentStage]}</p>
  {:else if lastSubmittedTimes[currentStage]}
    <p class="absolute bottom-2 right-2">Last submitted on: {lastSubmittedTimes[currentStage]}</p>
  {/if}
</div>

    </form>
  </div>
</div>

<style>
  .modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.4);
  }

  .modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 800px;
  }

  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }

  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }
</style>