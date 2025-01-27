<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

  let heartbeatInterval: NodeJS.Timeout;

  async function sendHeartbeat() {
    try {
      const response = await fetch('/api/heartbeat', { method: 'POST' });
      if (!response.ok) {
        // If the server responds with an error, log the user out
        logout();
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  async function logout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      goto('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  function handleBeforeUnload() {
    navigator.sendBeacon('/api/logout');
  }

  onMount(() => {
    if (browser) {
      heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  });

  onDestroy(() => {
    if (browser) {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  });
</script>