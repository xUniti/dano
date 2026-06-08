<script lang="ts">
  import "../app.css";
  import AppShell from "$lib/components/AppShell.svelte";
  import { theme } from "$lib/stores/theme.svelte";

  // Apply persisted theme (dark/light + accent) before paint.
  if (typeof document !== "undefined") theme.init();

  let { children } = $props();
</script>

<AppShell>
  {@render children()}
</AppShell>
