<script>


	import { onMount } from 'svelte'
	import PolyhedraDemo from './PolyhedraDemo.svelte'
	import BabylonHedra from './BabylonHedra.svelte'

	onMount( e => {})

	const BABYLON = false

</script>

{#if BABYLON}
	<BabylonHedra />
{:else}
	<PolyhedraDemo />
{/if}