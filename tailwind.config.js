/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        sm: ['1rem', { lineHeight: '1.5rem' }], // 16px
        base: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        lg: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        xl: ['1.5rem', { lineHeight: '2rem' }], // 24px
        '2xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        '4xl': ['3rem', { lineHeight: '1' }], // 48px
      },
      colors: {
        // Map 'orange' (used in code) to the new Orange/Terracotta palette
        orange: {
          50: '#FCF9F2',
          100: '#F8EED9',
          200: '#F2DAB0',
          300: '#ECC687',
          400: '#F4B869',
          500: '#e57c34', 
          600: '#ad591c', 
          700: '#88431D',
          800: '#6F381A',
          900: '#3D1C0C',
          950: '#2A1208',
        },
        // Map 'yellow' to new star color
        yellow: {
          400: '#EAB308', 
          500: '#D3A107',
        },
        // Keep brand aliases for clarity if needed, though orange mapping handles most
        brand: {
          brown: '#ad591c',
          yellow: '#F6D177',
          orange: '#EFB476',
          cream: '#f5f2ee',
        }
      }
    },
  },
  plugins: [],
}