<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { theme } from "$lib/theme.svelte";
  import { zoom } from "$lib/zoom.svelte";
  import { viewMode } from "$lib/viewmode.svelte";
  import { store } from "$lib/store.svelte";

  let { children } = $props();

  onMount(() => {
    theme.init();
    zoom.init();
    viewMode.init();
    store.init();

    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      // "=" shares the key with "+"; also support numpad add/subtract.
      if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
        e.preventDefault(); zoom.in();
      } else if (e.key === "-" || e.code === "NumpadSubtract") {
        e.preventDefault(); zoom.out();
      } else if (e.key === "0" || e.code === "Numpad0") {
        e.preventDefault(); zoom.reset();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

{@render children()}
