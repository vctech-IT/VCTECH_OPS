<!-- src/routes/(auth)/forgot-password/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { ActionData } from './$types';
  import { fade } from 'svelte/transition';
  import Swal from 'sweetalert2';

  export let form: ActionData;
  let loading = false;

  const handleSubmit = () => {
    loading = true;
    return async ({ result }) => {
      loading = false;
      
      if (result.type === 'success') {
        await Swal.fire({
          title: 'Reset Link Sent!',
          text: 'Please check your email for password reset instructions.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3B82F6'
        }).then((result) => {
          if (result.isConfirmed) {
            goto('/login');
          }
        });
      } else if (result.type === 'failure') {
        await Swal.fire({
          title: 'Error',
          text: result.data?.error || 'An error occurred. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3B82F6'
        });
      }
    };
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md p-8">
    <div class="text-center mb-8">
      <img src="/vc2-Photoroom.png" alt="Company Logo" class="h-16 mx-auto mb-4">
      <h1 class="text-3xl font-bold text-gray-900">Forgot Password</h1>
      <p class="text-gray-600 mt-2">Enter your email to reset your password</p>
    </div>

    <form 
      action="?/forgotPassword" 
      method="POST" 
      use:enhance={handleSubmit}
      class="space-y-6"
    >
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          placeholder="Enter your email"
        />
      </div>

      <button 
        type="submit" 
        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-600">
      Remember your password? 
      <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">Sign in</a>
    </p>
  </div>
</div>

{#if loading}
  <div 
    transition:fade="{{ duration: 200 }}" 
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
      <div class="flex justify-center">
        <div class="spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
      </div>
      <p class="mt-4 text-gray-700 font-medium">Sending reset link...</p>
      <p class="mt-2 text-sm text-gray-500">Please wait a moment</p>
    </div>
  </div>
{/if}

<style>
  .spinner {
    width: 40px;
    height: 40px;
    position: relative;
  }

  .double-bounce1, .double-bounce2 {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #3B82F6;
    opacity: 0.6;
    position: absolute;
    top: 0;
    left: 0;
    animation: sk-bounce 2.0s infinite ease-in-out;
  }

  .double-bounce2 {
    animation-delay: -1.0s;
  }

  @keyframes sk-bounce {
    0%, 100% { 
      transform: scale(0.0);
    } 
    50% { 
      transform: scale(1.0);
    }
  }
</style>