<script lang="ts">
    import CalculusHelper from '../CalculusHelper'
    import type {DonutSlice} from '$lib/types'
    
    const helper = new CalculusHelper();

    export let data: DonutSlice[]
    export let radius: number
    export let viewBox: number
    export let borderSize: number
</script>

<svg viewBox="0 0 100 100">
    {#if data}
        <svg viewBox={'0 0 ' + viewBox + ' ' + viewBox}>
            {#each helper.getSlicesWithCommandsAndOffsets(data, radius, viewBox, borderSize) as slice}
                <path
                    fill={slice.color}
                    d={slice.commands}
                    transform={'rotate(' + slice.offset + ')'}
                    >
                        <title>{slice.label}</title>
                </path>
            {/each}
      </svg>    
    {/if}
</svg>