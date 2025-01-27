<!-- <script lang="ts">
  import { page } from '$app/stores'
  import Header from '$lib/components/Header.svelte';
</script>

<svelte:head>
  <title>SvelteKit Auth</title>
</svelte:head>

<nav>
  {#if !$page.data.user}
    <a href="/login">Login</a>
    <a href="/register">Register</a>
  {/if}

  {#if $page.data.user}
    <a href="/admin">Admin</a>

    <form action="/logout" method="POST">
      <button type="submit">Log out</button>
    </form>
  {/if}
</nav>
{#if $page.data.user}
<Header/>
{/if}
<main>
  <slot />
</main> -->



<script lang="ts">
import Header from '$lib/components/Header.svelte';
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/stores';
</script>
<div class="flex h-screen bg-gray-50">
      {#if $page.data.user}
        <Sidebar />
      {/if}
  <div class="flex flex-col flex-1 overflow-hidden">
      
      {#if $page.data.user}
        <Header />
      {/if}
    <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
      <slot />
    </main>
    {#if $page.data.user}
    <Footer />
    {/if}
  </div>
</div>