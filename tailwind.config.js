/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // DESIGN_NOTES §1 — bảng màu semantic
      colors: {
        surface: '#F5F2E9',
        card: '#FFFFFF',
        inverse: '#2D2926',
        muted: '#EDE9DC',
        fg: '#2D2926',
        'fg-2': '#5E5954',
        'fg-inv': '#F5F2E9',
        'fg-inv-2': '#A8A296',
        hairline: '#DCD8CB',
        accent: '#7D6B3D',
        'accent-soft': '#C4BCA6',
        danger: '#9B4A3A',
        alive: '#3E6B4F',
        'alive-bg': '#E4EDE5',
        'alive-fg': '#2F5640',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        han: ['"Noto Serif SC"', 'serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      borderRadius: {
        // thẻ 12–16 · nút/ô 8 · pill = full
        card: '14px',
        btn: '8px',
      },
      boxShadow: {
        // hầu như không dùng shadow — chỉ tab bar mobile + modal
        tabbar: '0 4px 24px rgba(45,41,38,0.12)',
        modal: '0 16px 48px rgba(45,41,38,0.18)',
      },
    },
  },
  plugins: [],
}
