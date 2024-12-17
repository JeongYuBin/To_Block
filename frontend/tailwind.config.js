/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neonblue: '#8CEEED', // #8CEEED
        darkblue: '#0D1A41', // #0D1A41
        transparentdarkblue: 'rgba(13, 57, 84, 0.6)', // #0D3954 with 60% opacity
        transparentblack: 'rgba(0, 0, 0, 0.6)', // #000000 with 60% opacity
        pink: '#EE968C',
      },
    },
  },
  plugins: [],
};
