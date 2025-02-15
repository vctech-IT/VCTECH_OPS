<script lang="ts">
  export let message = "Please wait...";
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
    <div class="loader mb-4"></div>
    <p class="text-gray-700 text-lg font-medium">{message}</p>
  </div>
</div>

<style>
  .loader {
    width: 48px;
    height: 48px;
    border: 5px solid #e5e7eb;
    border-bottom-color: #3b82f6;
    border-radius: 50%;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
