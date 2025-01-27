<script lang="ts">
  import { onMount } from 'svelte';
  import Swiper from 'swiper';
  import { Autoplay, Pagination } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/pagination';
  import type { ActionData } from './$types';
  import { applyAction, enhance } from '$app/forms';
  import '$lib/styles/app.css'
  import { invalidateAll } from '$app/navigation';
  import { fade } from 'svelte/transition';

  export let form: ActionData;

  let showPassword = false;
  let loading = false;

  const slides = [
    { src: "1.svg", title: "Innovative Security", description: "Cutting-edge protection for your digital world" },
    { src: "2.svg", title: "Seamless Integration", description: "Connect and secure all your devices effortlessly" },
    { src: "3.svg", title: "Advanced Analytics", description: "Gain insights with powerful data visualization" },
  ];

  onMount(() => {
    new Swiper('.swiper-container', {
      modules: [Autoplay, Pagination],
      spaceBetween: 30,
      slidesPerView: 1,
      autoplay: { delay: 3000 },
      pagination: { clickable: true },
      loop: true,
    });
  });

  const handleSubmit = () => {
    loading = true;
    return async ({ result }: { result: any }) => {
      // Simulate a delay to show the loader (remove this in production)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      invalidateAll();
      await applyAction(result);
      loading = false;
    };
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="flex bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-5xl">
    <!-- Left side with Swiper -->
    <div class="hidden lg:block w-1/2 bg-sky-700 relative overflow-hidden">
      <div class="absolute inset-0 bg-sky-500 opacity-50"></div>
      <div class="swiper-container w-full h-full z-10">
        <div class="swiper-wrapper">
          {#each slides as { src, title, description }}
            <div class="swiper-slide flex items-center justify-center">
              <div class="text-white text-center z-10 px-8">
                <img {src} alt="" class="w-3/4 h-auto mx-auto mb-8" />
                <h2 class="text-3xl font-bold mb-2">{title}</h2>
                <p class="text-xl">{description}</p>
              </div>
            </div>
          {/each}
        </div>
        <div class="swiper-pagination"></div>
      </div>
    </div>

    <!-- Right side with login form -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12 relative">
      <div class="text-center mb-8">
        <img src="vc2-Photoroom.png" alt="Company Logo" class="h-16 mx-auto mb-4">
        <h1 class="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p class="text-gray-600 mt-2">Please sign in to your account</p>
      </div>

      <form 
        action="?/login" 
        method="POST" 
        use:enhance={handleSubmit}
        class="space-y-6"
      >
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input 
            id="username" 
            name="username" 
            type="text" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Enter your username"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div class="relative">
            <input 
              id="password" 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              required 
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Enter your password"
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
        <!-- In your login page, add this link -->
        <div class="text-sm mt-2">
          <a href="/forgot-password" class="font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
        </div>
        </div>

        {#if form?.invalid}
          <p class="text-red-500 text-sm">Username and password are required.</p>
        {/if}
        {#if form?.credentials}
          <p class="text-red-500 text-sm">You have entered the wrong credentials.</p>
        {/if}
        {#if form?.notApproved}
          <p class="text-red-500 text-sm">Approval is pending.</p>
        {/if}

        <!-- <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">Remember me</label>
          </div>
          <div class="text-sm">
            <a href="#" class="font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
          </div>
        </div> -->

        <button 
          type="submit" 
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <!-- <p class="mt-4 text-center text-sm text-gray-600">
        Forgot your password? 
        <a href="/forgot-password" class="font-medium text-blue-600 hover:text-blue-500">Reset it here</a>
      </p> -->

      <p class="mt-6 text-center text-sm text-gray-600">
        Don't have an account? 
        <a href="/register" class="font-medium text-blue-600 hover:text-blue-500">Sign up now</a>
      </p>
    </div>
  </div>
</div>

{#if loading}
  <div transition:fade="{{ duration: 200 }}" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="loader-container p-8 bg-white rounded-lg shadow-xl">
      <div class="loader"></div>
      <p class="mt-4 text-gray-700 font-semibold">Signing In...</p>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    @apply antialiased text-gray-900;
  }

  .swiper-container {
    height: 100%;
  }

  .swiper-slide {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .loader {
    border: 6px solid #f3f3f3;
    border-top: 6px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>