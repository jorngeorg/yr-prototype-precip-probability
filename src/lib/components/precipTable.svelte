<script>
    import {format, formatISO} from 'date-fns'
    import nb from 'date-fns/locale/nb';
    export let days
    export let dates
</script>

<div class="grid">
    <div class="grid grid-cols-12 gap-8 border-b border-slate-400 px-4 py-2 items-center text-slate-500">
        <div class="col-span-2 text-xs">
            Dag
        </div>
        <div class="grid grid-cols-3 col-span-5 text-xs ">
            <div class="flex justify-end">Sjanse <br/> for nedbør %</div>
            <div class="flex justify-end">Sjanse for <br/> litt nedbør %</div>
            <div class="flex justify-end">Sjanse for <br/> mye nedbør %</div>
        </div>  
        <div class="grid grid-cols-2 col-span-5 text-xs ">
            <div class="flex justify-end">Forventet <br/> maks/min temp</div>
            <div class="flex justify-end">Mulig <br/> maks/min temp</div>
        </div>                
    </div>
    {#each days as day, i}
        <div class="grid grid-cols-12 gap-8 border-b border-slate-200 p-4 items-center hover:bg-slate-100">
            <div class="first-letter:capitalize col-span-2 ">
                {format(dates[i], 'eeee d. MMM', {locale: nb})}
            </div>
            <div class="grid grid-cols-3 col-span-5 text-sm">
            <div class="font-mono flex justify-end text-slate-700">{Math.round(day.precipation.some) + Math.round(day.precipation.heavy)}%</div>
                <div class="font-mono flex justify-end text-blue-700">{Math.round(day.precipation.some)}%</div>
                <div class="font-mono flex justify-end text-purple-800">{Math.round(day.precipation.heavy)}%</div>
            </div>

            <div class="gap-2 grid grid-cols-2 col-span-5 font-mono">
                <div class="text-sm flex justify-end gap-1">
                    <span class={day.temperature.max > 0 ? 'text-red-500' : 'text-blue-500'}>
                        {Math.round(day.temperature.max)}° 
                    </span>
                    <span class="text-slate-300">/</span>
                    <span class={day.temperature.min > 0 ? 'text-red-500' : 'text-blue-500'}>
                        {Math.round(day.temperature.min)}°
                    </span>
                </div>
                <div class="text-sm font-mono flex justify-end gap-1">
                    <span class={day.temperature.possible_max > 0 ? 'text-red-500' : 'text-blue-500'}>
                        {Math.round(day.temperature.possible_max)}° 
                    </span>
                    <span class="text-slate-300">/</span>
                    <span class={day.temperature.possible_min > 0 ? 'text-red-500' : 'text-blue-500'}>
                        {Math.round(day.temperature.possible_min)}°
                    </span>
                </div>

            </div>        
        </div>
    {/each}
</div>