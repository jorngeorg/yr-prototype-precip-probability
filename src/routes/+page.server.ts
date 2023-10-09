import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';


export const load = (async ({fetch, url}) => {
	const lat = url.searchParams.get('lat')
	const lon = url.searchParams.get('lon')
	const name = url.searchParams.get('name')
	const interval = url.searchParams.get('interval')
	// const placesWithForecast = await Promise.all(
	// 	PLACES.map(async (place) => {
	// 		const res = await fetch(`https://staging.forti.met.no/api/subseasonal/v2/complete?lat=${place.lat}&lon=${place.lon}`)
	// 		const forecast = await res.json()
	// 		return {
	// 			name: place.name,
	// 			forecast
	// 		}
	// 	})
	// )
	const res = await fetch(`https://staging.forti.met.no/api/subseasonal/v2/complete?lat=${lat || 59}&lon=${lon || 11}`)
	const forecast = await res.json()

	if (forecast) {
		return { forecast, locationName: name, interval }
	} else {
		throw error(503, 'Feil ved lasting av data...');
	}
}) satisfies PageLoad;