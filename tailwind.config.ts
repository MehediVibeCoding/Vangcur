import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      xs: '359px',
      sm2: '411px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        brand: {
          bg: '#C3DEFC',
          light: '#44A7FC',
          'light-hover': '#3C93DE',
          primary: '#0058C7',
          accent: '#005EFC',
          surface: '#FFFFFF',
        },
        ink: '#1A1A1A',
        muted: '#6B7280',
        'surface-muted': '#F3F4F6',
        'border-base': '#E5E7EB',
        gold: '#D4A853',
        success: '#10B981',
        info: '#3B82F6',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-dm-sans)', "'Noto Sans Bengali'", 'var(--font-bengali)', 'sans-serif'],
      },
      boxShadow: {
        sh1: '0 1px 4px rgba(0,0,0,.07)',
        sh2: '0 4px 18px rgba(0,0,0,.10)',
        sh3: '0 8px 36px rgba(0,0,0,.13)',
      },
      borderRadius: {
        brand: '12px',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(.4,0,.2,1)',
      },
      transitionDuration: {
        brand: '250ms',
      },
      keyframes: {
        cartJiggle: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '10%': { transform: 'rotate(-12deg) scale(1.15)' },
          '25%': { transform: 'rotate(10deg) scale(1.12)' },
          '40%': { transform: 'rotate(-8deg) scale(1.08)' },
          '55%': { transform: 'rotate(6deg) scale(1.05)' },
          '70%': { transform: 'rotate(-4deg) scale(1.02)' },
          '85%': { transform: 'rotate(2deg) scale(1.01)' },
        },
        sectionReveal: {
          from: { opacity: '0', transform: 'translateX(-14px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        badgeHotGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.35)' },
          '60%': { transform: 'scale(.9)' },
          '80%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        liquidWobble: {
          '0%, 100%': { transform: 'scaleX(1)' },
          '25%': { transform: 'scaleX(.93)' },
          '50%': { transform: 'scaleX(1.06)' },
          '75%': { transform: 'scaleX(.97)' },
        },
        truckDrive: {
          '0%': { right: '-64px', opacity: '0' },
          '12%': { right: '20px', opacity: '1' },
          '34%': { right: '20px', opacity: '1' },
          '46%': { right: '6px', opacity: '1' },
          '58%': { right: '68px', opacity: '1' },
          '80%': { right: '68px', opacity: '1' },
          '96%': { right: '-90px', opacity: '1' },
          '100%': { right: '-90px', opacity: '0' },
        },
        packageDrop: {
          '0%, 14%': { opacity: '0', transform: 'translateY(-14px) scale(.5)' },
          '24%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '38%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '52%': { opacity: '0', transform: 'translateY(0) translateX(46px) scale(.35)' },
          '100%': { opacity: '0' },
        },
        truckHeadlight: {
          '0%, 44%': { opacity: '0' },
          '50%, 78%': { opacity: '1' },
          '92%, 100%': { opacity: '0' },
        },
        roadDash: {
          '0%, 44%': { opacity: '0', backgroundPositionX: '0px' },
          '50%': { opacity: '1', backgroundPositionX: '0px' },
          '80%': { opacity: '1', backgroundPositionX: '-140px' },
          '92%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'cart-jiggle': 'cartJiggle .7s cubic-bezier(.36,.07,.19,.97) both',
        'section-reveal': 'sectionReveal .5s cubic-bezier(.4,0,.2,1) both',
        'badge-hot-glow': 'badgeHotGlow 2.2s ease-in-out infinite',
        heartbeat: 'heartbeat .45s ease forwards',
        ripple: 'ripple .55s linear forwards',
        'liquid-wobble': 'liquidWobble .65s ease-in-out',
        'truck-drive': 'truckDrive 2.6s cubic-bezier(.4,0,.2,1) forwards',
        'package-drop': 'packageDrop 2.6s cubic-bezier(.4,0,.2,1) forwards',
        'truck-headlight': 'truckHeadlight 2.6s cubic-bezier(.4,0,.2,1) forwards',
        'road-dash': 'roadDash 2.6s cubic-bezier(.4,0,.2,1) forwards',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('hover', '@media (hover: hover) and (pointer: fine) { &:hover }');
      addVariant('group-hover', '@media (hover: hover) and (pointer: fine) { :merge(.group):hover & }');
      addVariant('peer-hover', '@media (hover: hover) and (pointer: fine) { :merge(.peer):hover ~ & }');
    }),
  ],
};

export default config;
