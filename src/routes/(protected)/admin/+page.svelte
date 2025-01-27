<script lang="ts">
  import { enhance } from '$app/forms';
  import { fade, slide, scale } from 'svelte/transition';
  import { invalidate } from '$app/navigation';
  import type { PageData } from './$types';
  import { onMount, onDestroy } from 'svelte';
  import { Toaster, toast } from 'svelte-french-toast';
  import ClientOnlyTooltip from '$lib/components/ClientOnlyTooltip.svelte';

  export let data: PageData;

  $: ({ pendingUsers, approvedUsers, roles, pendingUsersCount } = data);

  let activeTab = 'pending';
  let editingUser: any = null;
  let deleteConfirmUser: any = null;
  let deleteConfirmUsername = '';
  let isLoading = false;
  let showNotification = false;
  let deleteError = '';
  let activeRole = 'ALL';

  let loadingStates: { [key: string]: boolean } = {};

  function handleFormSubmit(action: string, userId: string) {
    return async () => {
      loadingStates[userId] = true;
      try {
        await invalidate('app:users');
        toast.success(`User ${action === 'approve' ? 'approved' : 'declined'} successfully`);
      } finally {
        loadingStates[userId] = false;
      }
    };
  }

  $: filteredUsers = activeRole === 'ALL' 
    ? approvedUsers 
    : approvedUsers.filter(user => user.role.name === activeRole);

  const roleColors: any = {
    ADMIN: 'bg-red-100 text-red-800',
    USER: 'bg-blue-100 text-blue-800',
    OPERATION: 'bg-green-100 text-green-800',
    WAREHOUSE: 'bg-yellow-100 text-yellow-800',
    MATERIALPROCURE: 'bg-purple-100 text-purple-800',
    ACCOUNTANT: 'bg-pink-100 text-pink-800',
    MANAGER: 'bg-indigo-100 text-indigo-800'
  };

  function formatDate(date: Date) {
    return new Date(date).toLocaleString();
  }

  function startEdit(user: any) {
    editingUser = { ...user };
  }

  function cancelEdit() {
    editingUser = null;
  }

  function startDelete(user: any) {
    deleteConfirmUser = user;
    deleteConfirmUsername = '';
    deleteError = '';
  }

  function cancelDelete() {
    deleteConfirmUser = null;
    deleteConfirmUsername = '';
    deleteError = '';
  }

  async function handleEditSubmit(event: Event) {
    event.preventDefault();
    isLoading = true;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await fetch('?/editUser', {
        method: 'POST',
        body: formData
      });
      editingUser = null;
      await invalidate('app:users');
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteSubmit(event: Event) {
    event.preventDefault();
    if (deleteConfirmUsername !== deleteConfirmUser.username) {
      deleteError = 'Username does not match';
      return;
    }
    isLoading = true;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await fetch('?/deleteUser', {
        method: 'POST',
        body: formData
      });
      deleteConfirmUser = null;
      deleteConfirmUsername = '';
      await invalidate('app:users');
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    if (pendingUsers.length > 0) {
      showNotification = true;
    }
  });

    onMount(() => {
    if (pendingUsersCount > 0) {
      toast.success(`There are ${pendingUsersCount} pending user${pendingUsersCount > 1 ? 's' : ''} waiting for approval.`, {
        duration: 5000,
        position: 'top-right',
      });
    }
  });

  function closeNotification() {
    showNotification = false;
  }

  function toggleTab(tab: string) {
    activeTab = tab;
    if (tab === 'pending' && pendingUsers.length > 0) {
      showNotification = true;
    } else {
      showNotification = false;
    }
  }

  function calculateLoggedInTime(lastLogin: Date | null, lastLogout: Date | null): string {
    if (!lastLogin) return 'Never logged in';
    
    const loginTime = new Date(lastLogin).getTime();
    const logoutTime = lastLogout ? new Date(lastLogout).getTime() : Date.now();
    
    if (loginTime > logoutTime) return 'Logged In';

    const diffInSeconds = Math.floor((logoutTime - loginTime) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} second(s)`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute(s)`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour(s)`;
    return `${Math.floor(diffInSeconds / 86400)} day(s)`;
  }

  function timeSinceLastLogout(date: Date | null): string {
    if (!date) return 'N/A';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 0) return 'Invalid logout time';
    if (diffInSeconds < 60) return `${diffInSeconds} second(s) ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute(s) ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour(s) ago`;
    return `${Math.floor(diffInSeconds / 86400)} day(s) ago`;
  }

  let intervalId: number;

  onMount(() => {
      intervalId = setInterval(() => {
      approvedUsers = approvedUsers.map(user => ({
        ...user,
        loggedInTime: calculateLoggedInTime(user.lastLogin, user.lastLogout),
        timeSinceLastLogout: timeSinceLastLogout(user.lastLogout)
      }));
    }, 1000);

    if (pendingUsersCount > 0) {
      toast.success(`There are ${pendingUsersCount} pending user${pendingUsersCount > 1 ? 's' : ''} waiting for approval.`, {
        duration: 5000,
        position: 'top-right',
      });
    }
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });
</script>

<Toaster />

<div class="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
  <h1 class="text-3xl sm:text-4xl font-bold mb-8 text-indigo-900 text-center">User Management Dashboard</h1>

  {#if showNotification && pendingUsers.length > 0}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg shadow-md" role="alert" transition:slide>
      <p class="font-bold">Attention!</p>
      <p>There are {pendingUsers.length} pending user{pendingUsers.length > 1 ? 's' : ''} waiting for approval.</p>
      <button on:click={closeNotification} class="mt-2 text-sm underline hover:text-red-900">Dismiss</button>
    </div>
  {/if}

  <div class="mb-6 bg-white shadow-lg rounded-lg p-4">
    <div class="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
      <button
        class="py-2 px-6 font-medium rounded-full transition-all duration-300 {activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
        on:click={() => toggleTab('pending')}
      >
        Pending Approvals
        {#if pendingUsers.length > 0}
          <span class="ml-2 bg-red-500 text-white rounded-full text-xs px-2 py-1">{pendingUsers.length}</span>
        {/if}
      </button>
      <button
        class="py-2 px-6 font-medium rounded-full transition-all duration-300 {activeTab === 'approved' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
        on:click={() => toggleTab('approved')}
      >
        Approved Users
      </button>
    </div>

    {#if activeTab === 'approved'}
      <div class="flex flex-wrap justify-center gap-2 mt-4">
        <button
          class="py-1 px-3 text-sm font-medium rounded-full transition-all duration-300 {activeRole === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
          on:click={() => activeRole = 'ALL'}
        >
          All Roles
        </button>
        {#each Object.keys(roleColors) as role}
          <button
            class="py-1 px-3 text-sm font-medium rounded-full transition-all duration-300 {activeRole === role ? roleColors[role] : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
            on:click={() => activeRole = role}
          >
            {role}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if activeTab === 'pending'}
    {#if pendingUsers.length === 0}
      <p class="text-center text-gray-600 bg-white shadow-md rounded-lg p-4">No pending users to approve.</p>
    {:else}
      <div class="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each pendingUsers as user (user.id)}
              <tr transition:fade="{{ duration: 300 }}">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img class="h-10 w-10 rounded-full" src={user.image || 'https://via.placeholder.com/40'} alt={user.username} />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{user.username}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{user.email}</div>
                  <div class="text-sm text-gray-500">{user.phoneNo}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {roleColors[user.role.name]}">
                    {user.role.name}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex flex-col sm:flex-row gap-2">
                  <form method="POST" action="?/approve" use:enhance={handleFormSubmit('approve', user.id)} class="inline-block">
                    <input type="hidden" name="userId" value={user.id} />
                    <ClientOnlyTooltip content="Approve user">
                      <button type="submit" class="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 transform hover:scale-105" disabled={loadingStates[user.id]}>
                        {#if loadingStates[user.id]}
                          <span class="loader"></span>
                        {:else}
                          Approve
                        {/if}
                      </button>
                    </ClientOnlyTooltip>
                  </form>
                  <form method="POST" action="?/decline" use:enhance={handleFormSubmit('decline', user.id)} class="inline-block">
                    <input type="hidden" name="userId" value={user.id} />
                    <ClientOnlyTooltip content="Decline user">
                      <button type="submit" class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 transform hover:scale-105" disabled={loadingStates[user.id]}>
                        {#if loadingStates[user.id]}
                          <span class="loader"></span>
                        {:else}
                          Decline
                        {/if}
                      </button>
                    </ClientOnlyTooltip>
                  </form>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:else}
    {#if filteredUsers.length === 0}
      <p class="text-center text-gray-600 bg-white shadow-md rounded-lg p-4">No approved users found for the selected role.</p>
    {:else}
      <div class="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logged in Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Logout</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Since Last Logout</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredUsers as user (user.id)}
              <tr transition:fade="{{ duration: 300 }}">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img class="h-10 w-10 rounded-full" src={user.image || 'https://via.placeholder.com/40'} alt={user.username} />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{user.username}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{user.email}</div>
                  <div class="text-sm text-gray-500">{user.phoneNo}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if editingUser && editingUser.id === user.id}
                    <select bind:value={editingUser.roleId} class="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                      {#each roles as role}
                        <option value={role.id}>{role.name}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {roleColors[user.role.name]}">
                      {user.role.name}
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never logged in'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.loggedInTime}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLogout ? formatDate(user.lastLogout) : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.timeSinceLastLogout}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex flex-col sm:flex-row gap-2">
                    {#if editingUser && editingUser.id === user.id}
                      <form on:submit={handleEditSubmit} class="inline-block">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="roleId" value={editingUser.roleId} />
                        <ClientOnlyTooltip content="Save changes">
                          <button type="submit" class="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 transform hover:scale-105" disabled={isLoading}>
                            {#if isLoading}
                              <span class="loader"></span>
                            {:else}
                              Save
                            {/if}
                          </button>
                        </ClientOnlyTooltip>
                      </form>
                      <ClientOnlyTooltip content="Cancel editing">
                        <button on:click={cancelEdit} class="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 transform hover:scale-105" disabled={isLoading}>Cancel</button>
                      </ClientOnlyTooltip>
                    {:else}
                      <ClientOnlyTooltip content="Edit user">
                        <button on:click={() => startEdit(user)} class="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 transform hover:scale-105" disabled={isLoading}>
                          Edit
                        </button>
                      </ClientOnlyTooltip>
                      <ClientOnlyTooltip content="Delete user">
                        <button on:click={() => startDelete(user)} class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 transform hover:scale-105" disabled={isLoading}>
                          Delete
                        </button>
                      </ClientOnlyTooltip>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

{#if deleteConfirmUser}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal" transition:fade>
    <div class="relative top-20 mx-auto p-5 border w-full max-w-sm sm:max-w-md md:max-w-lg shadow-lg rounded-md bg-white" transition:scale>
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            Type <span class="font-bold">{deleteConfirmUser.username}</span> to confirm deletion.
          </p>
          <input
            type="text"
            bind:value={deleteConfirmUsername}
            class="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
            placeholder="Type username here"
          />
          {#if deleteError}
            <p class="text-red-500 text-sm mt-2">{deleteError}</p>
          {/if}
        </div>
        <div class="items-center px-4 py-3 flex flex-col sm:flex-row justify-between gap-2">
  <form on:submit={handleDeleteSubmit} class="w-full sm:w-1/2">
    <input type="hidden" name="userId" value={deleteConfirmUser.id} />
    <button
      type="submit"
      class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
      disabled={deleteConfirmUsername !== deleteConfirmUser.username || isLoading}
    >
      {#if isLoading}
        <span class="loader"></span>
      {:else}
        Delete
      {/if}
    </button>
  </form>
  <button
    on:click={cancelDelete}
    class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full sm:w-1/2 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
    disabled={isLoading}
  >
    Cancel
  </button>
</div>
      </div>
    </div>
  </div>
{/if}

<style>
  .loader {
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 5px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>