/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/*.jsx", "./src/**/*.jsx"],
  theme: {
    extend: {fontFamily: {
      roboto: ['Roboto', 'sans-serif'],
    },},
  },
  plugins: [require('flowbite/plugin')],
}
