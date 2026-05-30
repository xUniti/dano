<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { theme } from "$lib/theme.svelte";
  import { store } from "$lib/store.svelte";

  let { children } = $props();

  onMount(() => {
    theme.init();
    store.init();
  });
</script>

{@render children()}
