<script lang="ts">
    import Chart from "chart.js/auto";
    import { onMount } from "svelte";
    import { browser } from '$app/environment';  
    import { eachDayOfInterval, format, parseISO, add, isWeekend } from 'date-fns'
    import nb from 'date-fns/locale/nb/index';
    import classnames from 'classnames'
    import PrecipTable from "$lib/components/precipTable.svelte";
    export let data

    const SHOW_INTERVALS = false
    const SHOW_DAILY_TEMPS = true

    const INTERVALS = [
        {
            title: 'Neste 21 dager',
            start: 0,
            end: 21
        },
        {
            title: 'Neste 14 dager',
            start: 0,
            end: 14
        },
        {
            title: 'Neste 7 dager',
            start: 0,
            end: 7
        }
    ]
    const PLACES = [
        {
            name: 'Jeløy',
            lat: 59.437,
            lon: 10.636
        },
        {
            name: 'Bergen',
            lat: 60.4,
            lon: 5.3
        },
        {
            name: 'Kirkenes',
            lat: 69.7,
            lon: 30.050
        },
        {
            name: 'Trondheim',
            lat: 63.43048, 
            lon: 10.39506
        }
    ]

    let stolper = false
    let smultring = true
    let stabel = true
    let viewType = 'graph'

    const handleViewTypeSelect = (type: string) => {
        console.log('type', type)
        viewType = type
    }

    const { forecast, locationName, interval } = data

    const dates = eachDayOfInterval({
        start: parseISO(forecast.properties.timeseries[0].time), 
        end: parseISO(forecast.properties.timeseries[20].time)
    })

    let currentPlace = PLACES.find((p) => p.name === locationName)
    let currentInterval = INTERVALS[interval]
    let precipBarHeight = 100

    const days = forecast.properties.timeseries
        .slice(0, interval ? INTERVALS[interval].end : INTERVALS[0].end)
        .map(d => {
            const {
                probability_of_heavy_precipitation, 
                probability_of_precipitation,
                air_temperature_max_percentile_10,
                air_temperature_max_percentile_90,
                air_temperature_min_percentile_10,
                air_temperature_min_percentile_90
            } = d.data.next_24_hours.details
            return {
                temperature: {
                    min: air_temperature_min_percentile_10,
                    max: air_temperature_min_percentile_90,
                    possible_min: air_temperature_max_percentile_10,
                    possible_max: air_temperature_max_percentile_90
                },
                precipation: {
                    none: 100 - probability_of_precipitation,
                    some: probability_of_precipitation - probability_of_heavy_precipitation,
                    heavy: probability_of_heavy_precipitation,
                    someHeight: precipBarHeight * ((probability_of_precipitation - probability_of_heavy_precipitation) / 100),
                    heavyHeight: precipBarHeight *  (probability_of_heavy_precipitation / 100)
                }
            }
        })

    const maxTempDay = forecast.properties.timeseries.reduce((prev, current) => 
    (prev.data.next_24_hours.details.air_temperature_max > current.data.next_24_hours.details.air_temperature_max ) ? prev : current
    )
    
    const minTempDay = forecast.properties.timeseries.reduce((prev, current) => 
    (prev.data.next_24_hours.details.air_temperature_min < current.data.next_24_hours.details.air_temperature_min ) ? prev : current
    )
    
    const WEEKLY_SUMMARY_INDEXES = [0, 6, 13]

    const maxTempInPeriod = Math.max(...forecast.properties.timeseries
        .slice(0, interval ? INTERVALS[interval].end : INTERVALS[0].end)
        .map(d => d.data.next_24_hours.details.air_temperature_max))

    const minTempInPeriod = Math.min(...forecast.properties.timeseries
        .slice(0, interval ? INTERVALS[interval].end : INTERVALS[0].end)
        .map(d => d.data.next_24_hours.details.air_temperature_min))


    const maxPrecipationInPeriod = Math.max(...WEEKLY_SUMMARY_INDEXES.map(i => forecast.properties.timeseries[i].data.next_7_days.details.precipitation_amount_percentile_90))
    const minPrecipationInPeriod = Math.min(...WEEKLY_SUMMARY_INDEXES.map(i => forecast.properties.timeseries[i].data.next_7_days.details.precipitation_amount_percentile_10))

    const PRECIP_WEEKLY_SUMMARY_BAR_HEIGHT = 100

    const precipWeeklyScale = PRECIP_WEEKLY_SUMMARY_BAR_HEIGHT / (maxPrecipationInPeriod - minPrecipationInPeriod)

    const precipWeeklySummary = WEEKLY_SUMMARY_INDEXES.map(i => {
        const summary = forecast.properties.timeseries[i].data.next_7_days.details
        return {
            bottom: (summary.precipitation_amount_percentile_10 - minPrecipationInPeriod) * precipWeeklyScale,
            top: (maxPrecipationInPeriod - summary.precipitation_amount_percentile_90) * precipWeeklyScale,
            expectedPos: (summary.precipitation_amount - minPrecipationInPeriod) * precipWeeklyScale,
            min: summary.precipitation_amount_percentile_10,
            max: summary.precipitation_amount_percentile_90,
            expected: summary.precipitation_amount,
        }
    })


    const WEEKLY_SUMMARY_BAR_HEIGHT = 100
    
    const weeklySummaryMaxTempRange = Math.max(...WEEKLY_SUMMARY_INDEXES.map((idx) => 
        Math.abs(forecast.properties.timeseries[idx].data.next_7_days.details.air_temperature_daily_high) - Math.abs(forecast.properties.timeseries[idx].data.next_7_days.details.air_temperature_daily_low)
    ))

    const weeklySummaryMaxTemp = Math.max(...WEEKLY_SUMMARY_INDEXES.map((idx) => 
       forecast.properties.timeseries[idx].data.next_7_days.details.air_temperature_daily_high
    ))

    const weeklySummaryMinTemp = Math.min(...WEEKLY_SUMMARY_INDEXES.map((idx) => 
       forecast.properties.timeseries[idx].data.next_7_days.details.air_temperature_daily_low
    ))


    const WEEKLY_SUMMARY_TEMP_SCALE_FACTOR = WEEKLY_SUMMARY_BAR_HEIGHT / (weeklySummaryMaxTemp - weeklySummaryMinTemp)
    
    const weeklyTempSummary = WEEKLY_SUMMARY_INDEXES.map((idx) => {
        const summary = forecast.properties.timeseries[idx].data.next_7_days.details
        return {
            high: summary.air_temperature_daily_high,
            low: summary.air_temperature_daily_low,
            top:  (weeklySummaryMaxTemp - summary.air_temperature_daily_high) * WEEKLY_SUMMARY_TEMP_SCALE_FACTOR,
            bottom: (summary.air_temperature_daily_low - weeklySummaryMinTemp) * WEEKLY_SUMMARY_TEMP_SCALE_FACTOR
            
        }
    })
    
   const weeklyProbabilityOfFrostBadges = WEEKLY_SUMMARY_INDEXES.map((w) => {
        const probabilityOfFrost =forecast.properties.timeseries[w].data.next_7_days.details.probability_of_frost
        let probabilityOfFrostBadge = {}
    
        if (probabilityOfFrost === 0) {
            probabilityOfFrostBadge = {
                text: 'Ingen',
                textColor: 'text-green-500',
                bg: 'bg-green-50'
            }
        }
    
        if (probabilityOfFrost > 0 && probabilityOfFrost < 10) {
            probabilityOfFrostBadge = {
                text: 'Liten',
                textColor: 'text-amber-500',
                bg: 'bg-amber-50'
            }
        }    
        
        if (probabilityOfFrost > 10 && probabilityOfFrost < 50) {
            probabilityOfFrostBadge = {
                text: 'Middels',
                textColor: 'text-orange-500',
                bg: 'bg-orange-50'
            }
        }    
        
        if (probabilityOfFrost > 50) {
            probabilityOfFrostBadge = {
                text: 'Stort',
                textColor: 'text-red-500',
                bg: 'bg-red-50'
            }
        }            

        probabilityOfFrostBadge.probabilityOfFrost = probabilityOfFrost

        return probabilityOfFrostBadge
    })
    


    const TEMP_GRAPH_HEIGHT = 300
    const yMax = Math.round((maxTempInPeriod + 10) / 5) * 5
    const yMin = Math.round((minTempInPeriod - 10) / 5) * 5
    const yRange = Math.abs(yMax) + Math.abs(yMin)
    const padding = 16
    const ySteps = (TEMP_GRAPH_HEIGHT - (padding * 2)) / yRange
    const widthSteps = 1034 / 21
    const offset = 50

    const tempBars = forecast.properties.timeseries
        .slice(0, interval ? INTERVALS[interval].end : INTERVALS[0].end)
        .map((d) => {
            const details = d.data.next_24_hours.details

            return {
                possible: {
                    y: TEMP_GRAPH_HEIGHT - (details.air_temperature_max_percentile_90 * ySteps) - offset,
                    height: ((details.air_temperature_max_percentile_90 * ySteps) - (details.air_temperature_min_percentile_10 * ySteps))
                },
                expected: {
                    y: TEMP_GRAPH_HEIGHT - (details.air_temperature_max * ySteps) - offset,
                    height: ((details.air_temperature_max * ySteps) - (details.air_temperature_min * ySteps))
                }
            }
        })
    
    const precip_to_color = {
        none: '#fee2e2',
        some: '#bfdbfe',
        heavy: '#3b82f6'
    }

    function handleSelectInterval(idx) {
        currentInterval = INTERVALS[idx]
        console.log(idx)
    }

    function createDoughnut(data, id) {
        var ctx = document.getElementById(`doughnut-chart-${id}`);
        new Chart(ctx, {
            type: "doughnut",
            borderJoin: 'round',
            data: {
                datasets: [
                {
                    backgroundColor: [                
                    "#006EDB",
                    "#A8CEF6",
                    "#f5f5f4",

                    ],
                    data: data,
                    cutout: 11,
                    borderAlign: 'center',
                    borderWidth: 0
                },                      
                ]
            },
            options: {
                title: {
                display: true,
                text: "Predicted world population (millions) in 2050"
                }
            }
        });
  }

//   if (browser) {
//       onMount(days.forEach((d, i) => createDoughnut([d.precipation.heavy, d.precipation.some, d.precipation.none], `${i}`)))
//   }
</script>

<div class="mx-auto max-w-6xl grid gap-4 mb-32 px-4">
    <!-- <div class="py-16 flex gap-4 bg-red-200 px-16 mb-32">
        <span>
            <input type="checkbox"  bind:checked={stabel} on:input={() => stabel = !stabel}/>
            <label>Stabel</label>
        </span>        
        <span>
            <input type="checkbox" bind:checked={stolper} on:input={() => stolper = !stolper}/>            
            <label>Stolper</label>
        </span>
        <span>
            <input type="checkbox"  bind:checked={smultring} on:input={() => smultring = !smultring}/>
            <label>Smultring</label>
        </span>

        <div class="flex gap-2">
            {#each PLACES as {lat, lon, name}}
                <a href={`/?lat=${lat}&lon=${lon}&name=${name}`} class={`rounded-full text-white p-2 ${locationName === name ? 'bg-blue-800 shadow-lg border border-blue-200' : 'bg-blue-500'}`}>
                    {name}
                </a>
            {/each}
        </div>
    </div> -->

    {#if SHOW_INTERVALS}
        <div class="flex gap-2">
            {#each INTERVALS as i, idx}
                <a 
                    class="border border-blue-200 bg-white p-1 rounded text-blue-500"
                    href={`/?lat=${currentPlace.lat}&lon=${currentPlace.lon}&name=${currentPlace.name}&interval=${idx}`}
                >
                    {i.title}
                </a>
            {/each}
        </div>
    {/if}

    <h1 class="text-2xl">
        {format(parseISO(forecast.properties.timeseries[0].time), 'd. MMMM', {locale: nb})} – {format(parseISO(forecast.properties.timeseries[20].time), 'd. MMMM', {locale: nb})}
    </h1>
    <div class="">   
        <div class="p-4 bg-white rounded-xl grid gap-4 border border-slate-200 ">
            <div class="font-medium mb-2">Oppsummering</div>

            <div class="border-b border-b-slate-200 mb-2 hidden md:flex justify-evenly gap-2">
                <div class="flex flex-1 justify-start">
                    <h4 class="text-sm text-slate-500">Periode</h4>
                </div>
                <div class="flex flex-1 justify-start">
                    <h4 class="text-sm text-slate-500">Lav/høy temperatur</h4>
                </div>
                <div class="flex flex-1 justify-start">
                    <h4 class="text-sm text-slate-500">Sjanse for frost</h4>
                </div>
                <div class="flex flex-1 justify-start">
                    <h4 class="text-sm text-slate-500">Nedbør (min/forventet/maks)</h4>
                </div>
            </div>

            
            <div class="flex gap-2">
            
                <!-- Periode -->            
                <div class="flex flex-col gap-6 flex-1 text-slate-500 text-sm">
                    {#each WEEKLY_SUMMARY_INDEXES as w }
                        <div>
                            { 
                                format(parseISO(forecast.properties.timeseries[w].time), 'd. MMM', {locale: nb})
                            }
                            –
                            { 
                                format(add(parseISO(forecast.properties.timeseries[w].time), {weeks: 1}), 'd. MMM', {locale: nb})
                            }
                        </div>
                    {/each}
                </div>
                
                <!-- Temp -->
                <div class="flex flex-col w-full justify-between gap-6 flex-1"> 
                    {#each weeklyTempSummary as w, idx}
                        <div class="flex gap-3 items-center">
                            <div class="text-sm font-medium text-red-500">
                                {Math.round(w.low)}°
                            </div>
                            <div class="bg-slate-100  border border-slate-300 rounded-full relative overflow-hidden h-3" style={`width: ${WEEKLY_SUMMARY_BAR_HEIGHT}px;`}>
                                <div style={`left: ${w.bottom}px; right: ${w.top}px;`} class="bg-red-500 h-full rounded-full absolute"></div>
                            </div>
                            <div class="text-sm font-medium text-red-500">
                                {Math.round(w.high)}°
                            </div>
                        </div>
                    {/each}
                </div>

                <div class="flex flex-col w-full justify-between gap-6 flex-1"> 
                    {#each weeklyProbabilityOfFrostBadges as w }
                        <div>
                            <span class={`${w.textColor} ${w.bg} text-sm px-2 py-1 rounded flex-0 font-medium`}>
                                {Math.round(w.probabilityOfFrost)}%
                            </span>
                        </div>
                    {/each}
                </div>

                <div class="flex flex-col w-full justify-between gap-6 flex-1"> 
                    {#each precipWeeklySummary as p, idx}
                        <div class="flex items-center gap-2 relative">
                            <div class="text-sm font-medium text-blue-500">{Math.round(p.min)}</div>
                            <div style={`width: ${PRECIP_WEEKLY_SUMMARY_BAR_HEIGHT}px;`} class="relative h-3 bg-slate-50 border border-slate-300 rounded-full">
                                <div style={`left: ${p.bottom}px; right: ${p.top}px`} class="h-full bg-blue-200 absolute rounded-full"></div>
                                <div style={`left: ${p.expectedPos}px;`} class="h-full w-2 border-2 border-white bg-blue-500 absolute rounded-full"></div>
                                <!-- <div style={`left: ${p.expectedPos + 3.5}px; top: -5px`} class="w-1 h-2 border-l border-blue-500 absolute"></div> -->
                            </div>
                            <div style={`left: ${p.expectedPos + 18}px; top: -18px`} class="absolute text-sm font-medium text-blue-500">{Math.round(p.expected)}</div>    
                            <div class="text-sm font-medium text-blue-500">{Math.round(p.max)}</div>
                        </div>
                    {/each}
                </div>

            </div>
            <!-- Frost -->
            
        </div>     
        <!-- <div class="p-4 bg-white rounded-xl col-span-3 flex flex-col shadow justify-between">
            <div class="grid gap-2">
                <div class="uppercase text-slate-500 text-sm">Høyeste temperatur</div>
                <div class=" text-red-500 text-3xl">
                    {Math.round(maxTempInPeriod)}°
                </div>
            </div>
            <div class="text-xs text-slate-500">
                <span>{format(parseISO(maxTempDay.time), 'd. MMM', {locale: nb})} blir det varmeste døgnet. Det kan bli temperatur opp til <span class="text-red-500">{Math.round(maxTempDay.data.next_24_hours.details.air_temperature_max_percentile_90)}°</span>.</span>
            </div>
        </div>
        <div class="p-4 bg-white rounded-xl col-span-3 flex flex-col gap-2 shadow justify-between">
            <div class="grid gap-2">
                <div class="uppercase text-slate-500 text-sm">Laveste temperatur</div>
                <div class=" text-red-500 text-3xl">
                    {Math.round(minTempInPeriod)}°
                </div>
            </div>
            <div class="text-xs text-slate-500">
                <span>{format(parseISO(minTempDay.time), 'd. MMM', {locale: nb})} blir det kaldeste døgnet. Det kan bli temperatur ned til <span class={minTempDay.data.next_24_hours.details.air_temperature_min_percentile_10 > 0 ? 'text-red-500' : 'text-blue-500'}>{Math.round(minTempDay.data.next_24_hours.details.air_temperature_min_percentile_10)}°</span>.</span>
            </div>
        </div>     -->
        <!-- <div class="p-4 bg-white rounded-xl col-span-2 flex flex-col gap-2 shadow justify-between">
            <div class="grid gap-2">
                <div class="uppercase text-slate-500 text-sm">Sjanse for frost</div>
                <div>
                    <span class={`${probabilityOfFrostBadge.textColor} ${probabilityOfFrostBadge.bg} text-2xl px-2 py-1  rounded flex-0`}>
                        {probabilityOfFrostBadge.text}
                    </span>
                </div>
            </div>
            <div class="text-xs text-slate-500">
                Det er <span class={probabilityOfFrostBadge.textColor}>{Math.round(probabilityOfFrost)}%</span> sjanse for frost.
            </div>
        </div>             -->
        <!-- <div class="p-4 bg-white rounded-xl col-span-4 grid gap-2 shadow">
            <div class="uppercase text-slate-500 text-sm">Nedbør</div>
            <div class="flex">
                <div class="flex flex-col justify-between mt-4 mb-5 pr-2 border-r border-r-slate-200">
                    <div class="text-xs text-slate-500">{Math.round(precipWeeklyMax)}</div>
                    <div class="text-xs text-slate-500">{Math.round(precipWeeklyMax / 2)}</div>
                    <div class="text-xs text-slate-500">0</div>
                </div>
                <div class="flex justify-evenly flex-1">
                    {#each precipWeeklySummary as p, idx}
                        <div class="flex flex-col items-center gap-2">
                            <div class="text-xs text-slate-500">{idx + 1}. uke</div>
                             <div style={`height: ${PRECIP_WEEKLY_SUMMARY_BAR_HEIGHT}px;`} class="relative w-5">
                                <div style={`bottom: 0px; height: ${p.maxHeight}px`} class="w-full bg-blue-100 absolute rounded-t-sm"></div>
                                <div style={`bottom: 0px; height: ${p.expectedHeight}px`} class="w-full bg-blue-500 absolute rounded-b-sm"></div>
                            </div>
                            <div class="text-xs text-blue-500">{Math.round(p.expected)}–{Math.round(p.max)}mm</div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>     -->
    </div>

    <div class="flex justify-center mt-8">
        <div class="bg-slate-100 p-1 flex rounded gap-2">
            <button 
                class={classnames('rounded p-1 w-32 flex justify-center  hover:bg-slate-200', {'bg-white text-blue-700 shadow-sm pointer-events-none ': viewType === 'graph'})}
                on:click={() => handleViewTypeSelect('graph')}                
            >
                Graf
            </button>
            <button 
                class={classnames('rounded p-1  w-32 flex justify-center text-slate-700  hover:bg-slate-200', {'bg-white text-blue-700 shadow-sm pointer-events-none': viewType === 'table'})}
                on:click={() => handleViewTypeSelect('table')}
            >
                Tabell
            </button>

        </div>
    </div>
    
    {#if viewType === 'table'}
        <PrecipTable days={days} dates={dates} />
    {/if}

    

    {#if viewType === 'graph'}
        <div class="p-4 rounded bg-white grid">
        <div class="grid gap-4">
            <h3 class="font-medium text-slate-700">Sjanse for nedbør</h3>
                <div class="flex justify-evenly ml-11">
                    {#each dates as date}
                        <div class="flex-1 md:flex md:odd:flex justify-center odd:hidden ">
                            <span class={classnames("text-xs text-slate-500 px-1 rounded", {'bg-slate-100 text-slate-600 font-regular' : isWeekend(date)})}>{format(date, 'd')}</span>
                        </div>
                    {/each}
                </div>    
                <div class="flex gap-3">
                    <div class="flex flex-col justify-between pt-2 pb-3 md:pb-9 items-end">
                        <div class="text-xs text-slate-500">100%</div>
                        <div class="text-xs text-slate-500">50%</div>
                        <div class="text-xs text-slate-500">0%</div>
                    </div>            
                    <div class="flex-1 flex flex-row justify-evenly items-end relative">        
                        <div class="absolute top-4 right-0 left-0 bottom-4 md:bottom-10 flex justify-evenly flex-col gap-0 border-t border-slate-200">
                            {#each Array.from(Array(2)) as row}
                                <div class="flex-1 flex justify-evenly ">
                                    {#each Array.from(Array(21)) as cell}
                                        <div class="border-b border-slate-200 flex-1"></div>
                                    {/each}
                                </div>
                            {/each}
                        </div>                    
                        {#each days as day, i}
                        <div class="flex gap-1 group md:gap-2 flex-col flex-1 items-center  border-slate-00 py-4 z-10 relative hover:bg-slate-100">
                            <div class="hidden group-hover:grid absolute rounded overflow-hidden w-72 bg-white shadow-xl z-50 border border-slate-200" style={`top: -${day.precipation.someHeight + 150}px`}>
                                <div class="p-4">
                                    <div class="font-medium text-sm mb-4 first-letter:capitalize">{format(dates[i], 'eeee dd. MMMM', {locale: nb})}</div>
                                    <div class="text-sm text-slate-700 flex justify-between items-center mb-1">
                                        <div class="flex gap-1 items-center">
                                            <!-- <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1.91863 6.59302C1.91863 3.26744 6.00003 1 6.00003 1C6.00003 1 10.0814 3.26744 10.0814 6.59302C10.0814 8.88886 8.25412 10.75 6.00003 10.75C3.74593 10.75 1.91863 8.88886 1.91863 6.59302Z" stroke="#006EDB" stroke-width="1.5" stroke-linecap="round"/>
                                                <path d="M9.74998 4.5C11 8.75 8.20912 10.5 5.99998 10.5C3.79084 10.5 1.99998 9 1.99998 5.75L3.25 3.25L5.99998 1.23496L8 2.5L9.74998 4.5Z" fill="#006EDB"/>
                                            </svg>                                         -->
                                            <div class="flex gap-1 items-center">
                                                <div class="w-2 h-2 bg-purple-900 rounded-full"></div>
                                                <span class="text-sm text-slate-500">Sjanse for mye nedbør</span>
                                            </div>                             
                                        </div>
                                        <div class="font-mono text-xs">{Math.round(day.precipation.heavy)}%</div>
                                    </div>
                                    <div class="text-sm text-slate-700 flex justify-between items-cente">
                                        <div class="flex gap-1 items-center">
                                            <!-- <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2.39826 8.24128C2.39826 4.0843 7.5 1.25 7.5 1.25C7.5 1.25 12.6017 4.0843 12.6017 8.24128C12.6017 11.1111 10.3176 13.4375 7.5 13.4375C4.68239 13.4375 2.39826 11.1111 2.39826 8.24128Z" stroke="#006EDB" stroke-width="1.5" stroke-linecap="round"/>
                                                <path d="M7.50001 13.4375C9.6012 13.4375 12.8125 10.9375 12.1875 8.4375L2.8125 10.2957C3.59431 12.1437 5.39882 13.4375 7.50001 13.4375Z" fill="#006EDB"/>
                                            </svg>                                                                                  -->
                                            <div class="flex gap-1 items-center">
                                                <div class="w-2 h-2 bg-blue-700 rounded-full"></div>
                                                <span class="text-sm text-slate-500">
                                                    Sjanse for litt nedbør
                                                </span>                    
                                            </div>                                           
                                        </div>
                                        <div class="font-mono text-xs">{Math.round(day.precipation.some)}%</div>
                                    </div>
                                  
                                </div> 
                                <div class="bg-slate-50 border-t border-slate-200 p-4 grid gap-1">
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-700">Forventet nedbør</span>
                                        <span class="text-xs text-blue-700 font-mono">{i < 14 ? '30mm' : '–'}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-700">Mulig nedbør</span>
                                        <span class="text-xs text-blue-700 font-mono">{i < 14 ? '3-43mm' : '–'}</span>
                                    </div>                                
                                </div>
                                <!-- <div class="text-sm text-slate-700 flex justify-between items-center mb-1">
                                    <div class="flex gap-1 items-center">
                                        <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.39826 8.74128C2.39826 4.5843 7.5 1.75 7.5 1.75C7.5 1.75 12.6017 4.5843 12.6017 8.74128C12.6017 11.6111 10.3176 13.9375 7.5 13.9375C4.68239 13.9375 2.39826 11.6111 2.39826 8.74128Z" stroke="#006EDB" stroke-width="1.5" stroke-linecap="round"/>
                                        </svg>                                    
                                        <div>
                                            Ingen
                                        </div>                                 
                                    </div>
                                    <div class="font-mono text-xs">{Math.round(day.precipation.none)}%</div>
                                </div>                                                         -->
                            </div>
                            <div class="h-[100px] w-[10px] md:w-[20px] flex flex-col justify-end border-slate-300">
                                <!-- <div 
                                    class="bg-white border-b border-white"
                                    style="height: {(day.precipation.none  / 1.5)}px">
                                </div> -->
                                <div class="rounded-sm overflow-hidden z-0">
                                    <div 
                                        class="bg-blue-500 z-0"
                                        style="height: {(day.precipation.someHeight)}px">
                        
                                    </div>
                                    {#if day.precipation.heavy > 3}
                                    <div 
                                        class="bg-fuchsia-800 border-t-[1px] border-white z-0"
                                        style="height: {(day.precipation.heavyHeight)}px">            
                                    </div>                     
                                    {/if}
                                </div>
                            </div>
                            <div class="hidden md:flex text-xs items-center w-full justify-center text-slate-500">{Math.round(day.precipation.some + day.precipation.heavy)}%</div>
                        </div>
                        {/each}
                    </div> 
                </div>     
                <div class="flex gap-4">
                    <!-- <div class="flex gap-1 items-center">
                        <div class="w-2 h-2 bg-stone-200 rounded-full"></div>
                        <span class="text-sm text-slate-500">Ingen nedbør</span>
                    </div> -->
                    <div class="flex gap-1 items-center">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span class="text-sm text-slate-500">Litt nedbør <small class="text-blue-500">0.5–10mm</small></span>                    
                    </div>
                    <div class="flex gap-1 items-center">
                        <div class="w-2 h-2 bg-purple-900 rounded-full"></div>
                        <span class="text-sm text-slate-500">Mye nedbør <small class="text-blue-500">>10mm</small></span>
                    </div>
                </div>
                
            </div>
        </div>
    {/if}

<!-- Daily temps-->
{#if SHOW_DAILY_TEMPS && viewType == 'graph'}
        
<div class="p-4 rounded bg-white gap-4 grid mt-8">
    <h3 class="font-medium text-slate-700">Temperatur</h3>

    <div class="flex gap-4">
        <div class="flex flex-col justify-between mt-20">
            <div class="text-xs text-slate-500">25°</div>
            <div class="text-xs text-slate-500">20°</div>
            <div class="text-xs text-slate-500">15°</div>
            <div class="text-xs text-slate-500">10°</div>
            <div class="text-xs text-slate-500">5°</div>
        </div>
        <div class="grid gap-8 flex-1">
            <div class="flex justify-evenly">
                {#each dates as date}
                    <div class="flex-1 flex justify-center odd:hidden md:odd:flex">
                        <span class="text-xs text-slate-500">{format(date, 'd')}</span>
                    </div>
                {/each}
            </div>
            <!-- <div>
                <h3 class="mb-2 text-sm text-slate-700">Sjanse for nedbør</h3>      
                <div class="flex flex-col md:flex-row justify-evenly md:items-end ">  
                    {#each days as day, i}
                    <div class="grid gap-2 flex-1 border-slate-200">
                        <div class="flex flex-col gap-2 flex-1 items-center  border-l border-t border-b  pb-2 justify-evenly pb-4 pt-2">                        
                            <div
                                class={` ${smultring ? '' : 'hidden'}`}
                            >                    
                                <canvas 
                                    id={`doughnut-chart-${i}`}
                                    width="45"
                                    height="45"
                                />       
                            </div>
                            <div class="text-xs font-regular items-center flex w-full justify-center text-slate-500">{Math.round(day.precipation.some + day.precipation.heavy)}%</div>
                        </div>
                    </div>
                    {/each}
                </div>   
                <div class="flex gap-4 mt-2">                        
                    <div class="flex gap-1 items-center">
                        <div class="w-2 h-2 bg-slate-200"></div>
                        <span class="text-sm text-slate-500">Ingen nedbør</span>
                    </div>
                    <div class="flex gap-1 items-center">
                        <div class="w-2 h-2 bg-blue-200"></div>
                        <span class="text-sm text-slate-500">Litt nedbør <small class="text-blue-500">0.5–10mm</small></span>
                        
                    </div>
                    <div class="flex gap-1 items-center">
                        <div class="w-2 h-2 bg-blue-500"></div>
                        <span class="text-sm text-slate-500">Mye nedbør <small class="text-blue-500">>10mm</small></span>
                    </div>
                </div>                                 
            </div> -->
            <div>
                <div class={`relative bg-white-50 gap-3`} style={`height: ${TEMP_GRAPH_HEIGHT}px;`}>
                    <div class="absolute top-1 right-0 left-0 bottom-0 flex justify-evenly flex-col gap-0  border-t border-slate-200">
                        {#each Array.from(Array(6)) as row}
                            <div class="flex-1 flex justify-evenly ">
                                {#each Array.from(Array(21)) as cell}
                                    <div class="border-b border-slate-200 flex-1"></div>
                                {/each}
                            </div>
                        {/each}
                    </div>
                    <div class="grid grid-cols-21 h-full">
                        {#each tempBars as tb,idx}
                            <div class="hover:bg-slate-100 flex justify-center z-20">
                                <div class="relative w-5">
                                    <div 
                                        style={`height: ${Math.round(tb.possible.height)}px; top: ${tb.possible.y}px;`} 
                                        class={`w-[10px] md:w-6 rounded-full h-[${Math.round(tb.possible.height)}px] bg-red-100 absolute`}
                                    ></div>
                                    <div 
                                        style={`height: ${Math.round(tb.expected.height)}px; top: ${tb.expected.y}px;`} 
                                        class={`w-[10px] md:w-6 rounded-full h-[${Math.round(tb.expected.height)}px] bg-red-500 absolute`}
                                    ></div>        
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{/if}

</div>