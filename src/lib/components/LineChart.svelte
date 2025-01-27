<script lang="ts">
import { onMount } from 'svelte';
import Chart from 'chart.js/auto';

export let data: { month: number; year: number; count: number; revenue: number }[];

let chart: Chart;

onMount(() => {
  const ctx = document.getElementById('ordersByMonthChart') as HTMLCanvasElement;
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => `${d.year}-${d.month.toString().padStart(2, '0')}`),
      datasets: [
        {
          label: 'Orders',
          data: data.map(d => d.count),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Revenue',
          data: data.map(d => d.revenue),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  return () => {
    chart.destroy();
  };
});
</script>

<canvas id="ordersByMonthChart"></canvas>