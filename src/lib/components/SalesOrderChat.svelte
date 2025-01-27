<!-- src/lib/components/SalesOrderChat.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { MessageSquare, X } from 'svelte-lucide';
  import Button from '$lib/components/Button.svelte';

  export let salesOrderNumber: string;
  export let username: string;

  let isOpen = false;
  let messages: Array<{ username: string; message: string }> = [];
  let newMessage = '';

  async function fetchMessages() {
    // Replace with actual API call
    const response = await fetch(`/api/chat/${salesOrderNumber}`);
    const data = await response.json();
    messages = data.messages;
  }

  async function sendMessage() {
    if (newMessage.trim() === '') return;

    // Replace with actual API call
    await fetch(`/api/chat/${salesOrderNumber}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage, username }),
    });

    newMessage = '';
    await fetchMessages();
  }

  onMount(fetchMessages);
</script>

<div class="fixed bottom-4 right-4 z-50">
  {#if isOpen}
    <div class="bg-white rounded-lg shadow-lg w-80 h-96 flex flex-col">
      <div class="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 class="font-semibold">Chat - SO #{salesOrderNumber}</h3>
        <Button variant="ghost" size="icon" on:click={() => isOpen = false}>
          <X class="h-4 w-4" />
        </Button>
      </div>
      <div class="flex-grow overflow-y-auto p-3">
        {#each messages as msg}
          <div class="mb-2">
            <span class="font-semibold">{msg.username}: </span>
            <span>{msg.message}</span>
          </div>
        {/each}
      </div>
      <div class="p-3 border-t">
        <div class="flex">
          <input
            type="text"
            bind:value={newMessage}
            class="flex-grow border rounded-l-md p-2"
            placeholder="Type a message..."
          />
          <Button on:click={sendMessage} class="rounded-l-none">Send</Button>
        </div>
      </div>
    </div>
  {:else}
    <Button 
      on:click={() => isOpen = true}
      class="rounded-full w-12 h-12 flex items-center justify-center"
    >
      <MessageSquare class="h-6 w-6" />
    </Button>
  {/if}
</div>