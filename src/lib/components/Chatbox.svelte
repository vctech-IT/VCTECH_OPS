<!-- src/lib/components/ChatBox.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { Send, MessageCircle, X, Loader, Maximize2 } from 'svelte-lucide';
  import { MinusCircle } from 'lucide-svelte';

  export let salesOrderNumber: string;
  export let currentUsername: string;
  export let salesOrderId: string;
  let lastSeenMessageId: string | null = null;
  let unseenMessages: string[] = [];

  let messages: any[] = [];
  let newMessage = '';
  let chatContainer: HTMLDivElement;
  let isLoading = false;
  let error: string | null = null;
  let isOpen = false;
  let isMinimized = false;
  let unreadCount = 0;
  let showToast = false;
  let toastMessage = '';
  let toastType: 'success' | 'error' | 'info' = 'info';
  let pollingInterval: ReturnType<typeof setInterval>; // Fixed TypeScript type

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toastMessage = message;
    toastType = type;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 3000);
  };

    async function markMessagesAsSeen() {
    if (!isOpen || unseenMessages.length === 0) return;

    try {
      const response = await fetch('/api/chat/seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageIds: unseenMessages,
          username: currentUsername
        })
      });

      if (!response.ok) throw new Error('Failed to update seen status');
      
      // Clear the unseen messages array after successful update
      unseenMessages = [];
    } catch (err) {
      console.error('Failed to mark messages as seen:', err);
    }
  }

  const scrollToBottom = () => {
    if (chatContainer) {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 100);
    }
  };

  const formatTimestamp = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  async function fetchMessages() {
    isLoading = true;
    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(salesOrderId)}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const newMessages = await response.json();
      
      // Check for new unseen messages
      const newUnseenMessages = newMessages
        .filter(msg => 
          msg.username !== currentUsername && 
          !msg.seenBy.includes(currentUsername)
        )
        .map(msg => msg.id);
      
      unseenMessages = [...new Set([...unseenMessages, ...newUnseenMessages])];
      
      if (newUnseenMessages.length > 0 && !isOpen) {
        unreadCount = unseenMessages.length;
        showNotification('New message received', 'info');
      }
      
      messages = newMessages;
      
      // If chat is open, mark messages as seen
      if (isOpen && !isMinimized) {
        markMessagesAsSeen();
      }
    } catch (err) {
      error = 'Failed to load chat history';
      showNotification('Failed to load messages', 'error');
    } finally {
      isLoading = false;
    }
  }


  async function sendMessage() {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          SOId: salesOrderId,
          SONumber: salesOrderNumber,
          username: currentUsername,
          message: newMessage
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const sentMessage = await response.json();
      messages = [...messages, sentMessage];
      newMessage = '';
      scrollToBottom();
      showNotification('Message sent', 'success');
    } catch (err) {
      showNotification('Failed to send message', 'error');
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      isMinimized = false;
      unreadCount = 0;
      markMessagesAsSeen();
    }
  }

  function toggleMinimize(event: MouseEvent) {
    event.stopPropagation();
    isMinimized = !isMinimized;
  }

  onMount(() => {
    fetchMessages();
    pollingInterval = setInterval(fetchMessages, 10000);
  });

  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  });

  $: if (messages && isOpen && !isMinimized) {
    scrollToBottom();
    markMessagesAsSeen();
  }
</script>

<!-- Toast Notification -->
{#if showToast}
  <div
    transition:fly={{ y: 50, duration: 200 }}
    class="fixed bottom-24 right-4 z-50 max-w-sm"
  >
    <div class="bg-white rounded-lg shadow-lg border-l-4 {
      toastType === 'success' ? 'border-green-500' :
      toastType === 'error' ? 'border-red-500' :
      'border-blue-500'
    } p-4">
      <p class="text-sm text-gray-700">{toastMessage}</p>
    </div>
  </div>
{/if}

<!-- Floating Chat Button and Container -->
<div class="fixed bottom-16 right-6 z-40 flex flex-col items-end space-y-4">
  {#if !isOpen}
    <button
      on:click={toggleChat}
      class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center transform hover:scale-105 transition-all duration-200"
    >
      <MessageCircle size={24} />
      {#if unreadCount > 0}
        <span
          class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
          transition:fade
        >
          {unreadCount}
        </span>
      {/if}
    </button>
  {/if}

  {#if isOpen}
    <div
      transition:fly={{ y: 50, duration: 300, easing: quintOut }}
      class="bg-white rounded-lg shadow-xl w-[480px] {isMinimized ? 'h-auto' : 'h-[600px]'} flex flex-col"
    >
      <!-- Chat Header -->
      <div
        class="px-4 py-3 bg-gray-50 rounded-t-lg flex justify-between items-center border-b"
      >
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Sales Order Chat</h3>
          <p class="text-sm text-gray-500">Order #{salesOrderNumber}</p>
        </div>
        <div class="flex items-center space-x-2">
          <button
            on:click={toggleMinimize}
            class="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            {#if isMinimized}
              <Maximize2 size={18} />
            {:else}
              <MinusCircle size={18} />
            {/if}
          </button>
          <button
            on:click={toggleChat}
            class="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {#if !isMinimized}
        <!-- Chat Messages -->
        <div
          bind:this={chatContainer}
          class="flex-1 px-4 py-3 overflow-y-auto space-y-4 bg-white"
        >
          {#if isLoading && messages.length === 0}
            <div class="flex justify-center items-center h-full">
              <Loader class="animate-spin text-gray-600" size={24} />
            </div>
          {:else if error}
            <div class="text-red-500 text-center p-4 bg-red-50 rounded-lg" transition:fade>
              {error}
            </div>
          {:else if messages.length === 0}
            <div class="text-gray-500 text-center p-4" transition:fade>
              <p>No messages yet</p>
              <p class="text-sm mt-1">Start the conversation!</p>
            </div>
          {:else}
            {#each messages as message, i (message.id)}
              <div
                class="flex flex-col {message.username === currentUsername ? 'items-end' : 'items-start'} mb-1"
                transition:fly={{ y: 20, duration: 300 }}
              >
                <!-- Username -->
                {#if i === 0 || messages[i - 1].username !== message.username}
                  <span class="text-xs font-medium text-gray-500 mb-1 px-2">
                    {message.username}
                  </span>
                {/if}
                
                <div class="flex flex-col max-w-[90%]">
                  <!-- Message Bubble -->
                  <div
                    class="px-4 py-2 rounded-2xl {
                      message.username === currentUsername
                        ? 'bg-sky-100 text-gray-800'
                        : 'bg-gray-100 text-gray-800'
                    }"
                  >
                    <div class="text-[14px] leading-relaxed break-words">
                      {message.message}
                    </div>
                  </div>
                  <!-- Timestamp -->
                  <div class="text-[11px] text-gray-400 mt-1 {
                    message.username === currentUsername ? 'text-right mr-1' : 'ml-1'
                  }">
                    {formatTimestamp(message.createdAt)}
                  </div>
                </div>
                  <!-- Seen indicator -->
                  {#if message.username === currentUsername && message.seenBy.length > 0}
                    <div class="text-[11px] text-gray-400 mt-1 text-right mr-1">
                      Seen by {message.seenBy.join(', ')}
                    </div>
                  {/if}
              </div>
            {/each}
          {/if}
        </div>

        <!-- Message Input - Restored to original compact size -->
        <div class="p-3 bg-white border-t">
          <form
            on:submit|preventDefault={sendMessage}
            class="flex items-center space-x-2"
          >
            <textarea
              bind:value={newMessage}
              on:keypress={handleKeyPress}
              placeholder="Type your message..."
              class="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-sky-400 bg-gray-50 text-gray-700 placeholder-gray-400"
              rows="1"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              class="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      {/if}
    </div>
  {/if}
</div>