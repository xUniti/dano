<script lang="ts">
  interface Props {
    class?: string;
  }
  let { class: cls = "h-4 w-full" }: Props = $props();
</script>

<div class="animate-pulse rounded-md bg-fg/10 {cls}"></div>
