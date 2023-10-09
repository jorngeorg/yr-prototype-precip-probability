/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        '21': 'repeat(21, minmax(0, 1fr))'
      }
    },
  },
  plugins: [],
}

