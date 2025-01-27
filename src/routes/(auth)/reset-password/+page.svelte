<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import Swal from 'sweetalert2';

  export let form: ActionData;
  let loading = false;
  let showPassword = false;
  let showConfirmPassword = false;

  $: token = $page.url.searchParams.get('token');

  const handleSubmit = () => {
    loading = true;
    return async ({ result }) => {
      loading = false;
      
      if (result.type === 'success') {
        await Swal.fire({
          title: 'Password Reset Successful!',
          text: 'Your password has been successfully reset. You can now login with your new password.',
          icon: 'success',
          confirmButtonText: 'Go to Login'
        });
        window.location.href = '/login';
      } else if (result.type === 'failure') {
        await Swal.fire({
          title: 'Error',
          text: result.data?.error || 'An error occurred. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };
  };

  const validatePasswords = (event) => {
    const form = event.target as HTMLFormElement;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Passwords do not match!',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return false;
    }

    if (password.length < 8) {
      Swal.fire({
        title: 'Error',
        text: 'Password must be at least 8 characters long.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return false;
    }

    return true;
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md p-8">
    <div class="text-center mb-8">
      <img src="/vc2-Photoroom.png" alt="Company Logo" class="h-16 mx-auto mb-4">
      <h1 class="text-3xl font-bold text-gray-900">Reset Password</h1>
      <p class="text-gray-600 mt-2">Enter your new password</p>
    </div>

    <form 
      action="?/resetPassword" 
      method="POST" 
      use:enhance={handleSubmit}
      on:submit|preventDefault={(e) => validatePasswords(e) && e.target.submit()}
      class="space-y-6"
    >
      <input type="hidden" name="token" value={token}>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <div class="relative">
          <input 
            id="password" 
            name="password" 
            type={showPassword ? 'text' : 'password'}
            required 
            minlength="8"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Enter new password"
          />
          <button 
            type="button" 
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
            on:click={() => showPassword = !showPassword}
          >
          {#if showPassword}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                {:else}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                {/if}
          </button>
        </div>
      </div>

      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <div class="relative">
          <input 
            id="confirmPassword" 
            name="confirmPassword" 
            type={showConfirmPassword ? 'text' : 'password'}
            required 
            minlength="8"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Confirm new password"
          />
          <button 
            type="button" 
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
            on:click={() => showConfirmPassword = !showConfirmPassword}
          >
          {#if showConfirmPassword}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                {:else}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                {/if}
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  </div>
</div>

{#if loading}
  <div transition:fade="{{ duration: 200 }}" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="loader-container p-8 bg-white rounded-lg shadow-xl">
      <div class="loader"></div>
      <p class="mt-4 text-gray-700 font-semibold">Resetting password...</p>
    </div>
  </div>
{/if}