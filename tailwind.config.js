/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Nano Architect colors
                primary: '#3b82f6',
                secondary: '#8b5cf6',
                dark: '#0f172a',
                surface: '#1e293b',

                // Blueprint Visualizer colors (if any specific ones needed, usually slate/blue based)
            }
        },
    },
    plugins: [],
}
