/** @type {import('tailwindcss').Config} */
export default {
	content: {
		relative: true,
		files: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
	},
	theme: {
		extend: {
			colors: {
				dogaRed: '#df1e24',
				dogaBlue: '#17355f',
			},
		},
	},
	plugins: [],
};
