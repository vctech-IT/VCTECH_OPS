<!-- src/lib/components/LoadingOverlay.svelte -->
<script lang="ts">
    import { loading } from '$lib/stores/Loadings';
</script>

{#if $loading.isLoading}
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
        <div class="h-8 w-8 animate-spin border-4 border-blue-600 border-t-transparent rounded-full"></div>
        <p class="text-gray-700 font-medium">{$loading.message}</p>
    </div>
</div>
{/if}