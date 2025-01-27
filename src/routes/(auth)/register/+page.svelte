<script lang="ts">
  import { onMount } from 'svelte';
  import Swiper from 'swiper';
  import { Autoplay, Pagination } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/pagination';
  import type { ActionData } from './$types';
  import "$lib/styles/app.css"
  import { enhance } from '$app/forms';
  import Swal from 'sweetalert2';

  let submitting = false;
  let verifying = false;
  let verificationCode = '';

  let userEmail = '';

  export let form: ActionData;

async function handleSubmit(event) {
  submitting = true;
  Swal.fire({
    title: 'Registering...',
    text: 'Please wait',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  return async ({ result }) => {
    submitting = false;
    Swal.close(); // Close the loading alert

    if (result.type === 'success') {
      await Swal.fire({
        title: 'Registration Successful!',
        text: 'Your account has been created successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      window.location.href = '/login';
    } else if (result.type === 'failure') {
      let errorMessage = 'An error occurred during registration.';
      
      if (result.data?.user) {
        errorMessage = 'This username is already taken.';
      } else if (result.data?.emailid) {
        errorMessage = 'This email is already in use.';
      } else if (result.data?.phoneno) {
        errorMessage = 'This contact number is already in use.';
      }

      await Swal.fire({
        title: 'Registration Failed',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };
}

  let emailValid = true;
  let phoneValid = true;
  let showPassword = false;
  let showConfirmPassword = false;
  let passwordsMatch = true;
  let password = '';
  let confirmPassword = '';

$: passwordsMatch = password === confirmPassword;
$: showPasswordMismatchError = !passwordsMatch && password && confirmPassword;

  const slides = [
    { src: "1.svg", title: "Join Our Community", description: "Start your journey with us today" },
    { src: "2.svg", title: "Secure & Private", description: "Your data is safe with our advanced security" },
    { src: "3.svg", title: "24/7 Support", description: "We're here to help you anytime" },
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

  const roles = [
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'MATERIALPROCURE', label: 'Material Procure' },
    { value: 'WAREHOUSE', label: 'Warehouse' },
    { value: 'OPERATION', label: 'Operation' },
    { value: 'USER', label: 'User' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' }, 
  ];

  function validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }

  function checkPasswordsMatch() {
    const password = document.getElementById('password') as HTMLInputElement;
    const confirmPassword = document.getElementById('confirmPassword') as HTMLInputElement;
    if (password.value && confirmPassword.value) {
      passwordsMatch = password.value === confirmPassword.value;
    } else {
      passwordsMatch = true; // Reset to true if either field is empty
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="flex bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-5xl">
    <!-- Left side with Swiper -->
    <div class="hidden lg:block w-2/5 bg-sky-700 relative overflow-hidden">
      <div class="absolute inset-0 bg-sky-500 opacity-50"></div>
      <div class="swiper-container w-full h-full z-10">
        <div class="swiper-wrapper">
          {#each slides as { src, title, description }}
            <div class="swiper-slide flex items-center justify-center h-full">
              <div class="text-white text-center z-10 px-8 flex flex-col items-center justify-center h-full">
                <img {src} alt="" class="w-3/4 h-auto mb-8 object-contain" />
                <h2 class="text-3xl font-bold mb-2">{title}</h2>
                <p class="text-xl">{description}</p>
              </div>
            </div>
          {/each}
        </div>
        <div class="swiper-pagination"></div>
      </div>
    </div>

    <!-- Right side with registration form -->
    <div class="w-full lg:w-3/5 flex flex-col justify-center p-5 lg:p-7">
      <div class="text-center mb-8">
        <img src="vc2-Photoroom.png" alt="Company Logo" class="h-16 mx-auto mb-4">
        <h1 class="text-3xl font-bold text-gray-900">Create an Account</h1>
      </div>

      <form action="?/register" method="POST" use:enhance={handleSubmit} class="space-y-3">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input 
            id="username" 
            name="username" 
            type="text" 
            required 
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Choose a username"
          />
        </div>
        
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Enter your email"
            on:blur={(e) => emailValid = validateEmail(e.currentTarget.value)}
          />
          {#if !emailValid}
            <p class="text-red-500 text-xs mt-1">Please enter a valid email address</p>
          {/if}
        </div>

        <div>
          <label for="phoneNo" class="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <div class="flex">
            <span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
              +91
            </span>
            <input 
              id="phoneNo" 
              name="phoneNo" 
              type="tel" 
              required 
              class="w-full px-3 py-2 text-sm rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="10-digit mobile number"
              maxlength="10"
            />
          </div>
          {#if !phoneValid}
            <p class="text-red-500 text-xs mt-1">Please enter a valid 10-digit mobile number</p>
          {/if}
        </div>

        <div class="flex space-x-4">
          <div class="w-1/2">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div class="relative">
              <input 
                id="password" 
                name="password" 
                type={showPassword ? 'text' : 'password'} 
                required 
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Create password"
                on:input={checkPasswordsMatch}
                on:blur={checkPasswordsMatch}
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

          <div class="w-1/2">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
            <div class="relative">
              <input 
                id="confirmPassword" 
                name="confirmPassword" 
                type={showConfirmPassword ? 'text' : 'password'} 
                required 
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Confirm password"
                on:input={checkPasswordsMatch}
                on:blur={checkPasswordsMatch}
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
        </div>
        {#if !passwordsMatch && document.getElementById('password')?.value && document.getElementById('confirmPassword')?.value}
        <p class="text-red-500 text-xs mt-1">Passwords do not match</p>
      {/if}

        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select 
            id="role" 
            name="role" 
            required 
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {#each roles as role}
              <option value={role.value}>{role.label}</option>
            {/each}
          </select>
        </div>

        <button 
          type="submit" 
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          disabled={!emailValid || !phoneValid || !passwordsMatch || submitting}
        >
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p class="mt-8 text-center text-sm text-gray-600">
        Already have an account? 
        <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">Sign in</a>
      </p>
    </div>
  </div>
</div>

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
</style>