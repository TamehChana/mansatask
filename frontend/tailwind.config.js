/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fintech Color System
        primary: {
          DEFAULT: '#0A2540', // Deep navy
          light: '#1A3A5A',
          dark: '#051A2E',
        },
        accent: {
          DEFAULT: '#17A2B8', // Teal/cyan
          light: '#4FC3D9',
          dark: '#0E7A8A',
        },
        success: {
          DEFAULT: '#2ECC71',
          light: '#58D68D',
          dark: '#1E8E4F',
        },
        warning: {
          DEFAULT: '#F5A623',
          light: '#F7B84D',
          dark: '#C7851A',
        },
        error: {
          DEFAULT: '#E5533D',
          light: '#EB7A6A',
          dark: '#B8422F',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      fontSize: {
        'body': ['16px', { lineHeight: '1.5' }],
        'small': ['14px', { lineHeight: '1.5' }],
        'h1': ['36px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem', // 72px
        '88': '22rem',  // 352px
      },
      borderRadius: {
        'button': '8px',
        'card': '10px',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
      },
      maxWidth: {
        'content': '1200px',
        'content-lg': '1280px',
      },
    },
  },
  plugins: [],
}


