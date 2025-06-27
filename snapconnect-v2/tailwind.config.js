/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.ts"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base colors - Sleeker, darker palette
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F8FAFC',
        'bg-tertiary': '#F1F5F9',
        'bg-elevated': '#FFFFFF',
        
        // Text colors
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-tertiary': '#94A3B8',
        'text-inverse': '#FFFFFF',
        
        // Border colors
        'border-light': '#E2E8F0',
        'border-medium': '#CBD5E1',
        'border-strong': '#94A3B8',
        
        // Dark mode colors - Sleeker dark theme
        'dark-bg-primary': '#000000',        // Pure black for sleekness
        'dark-bg-secondary': '#0A0A0A',      // Near black
        'dark-bg-tertiary': '#1A1A1A',       // Subtle dark gray
        'dark-bg-elevated': '#111111',       // Slightly elevated
        'dark-bg-accent': '#0F0F0F',         // Accent background
        
        'dark-text-primary': '#FFFFFF',      // Pure white
        'dark-text-secondary': '#E5E5E5',    // High contrast gray
        'dark-text-tertiary': '#9CA3AF',     // Muted gray
        'dark-text-accent': '#D4D4D8',       // Accent text
        
        'dark-border-light': '#1F1F1F',      // Subtle borders
        'dark-border-medium': '#2A2A2A',     // Medium borders
        'dark-border-strong': '#404040',     // Strong borders
        'dark-border-accent': '#262626',     // Accent borders
        
        // Functional colors - More refined
        success: '#10B981',                  // Emerald
        'success-bg': '#064E3B',
        warning: '#F59E0B',                  // Amber
        'warning-bg': '#451A03',
        error: '#EF4444',                    // Red
        'error-bg': '#450A0A',
        info: '#3B82F6',                     // Blue
        'info-bg': '#1E3A8A',
        
        // Live/Active states - More sophisticated
        'live-indicator': '#FF0000',         // Pure red for live
        'live-pulse': '#FF4444',
        'active-indicator': '#00FF88',       // Bright green
        
        // Interactive states - Sleeker blues
        interactive: '#0066FF',              // Vivid blue
        'interactive-hover': '#0052CC',      // Darker blue
        'interactive-active': '#003D99',     // Deep blue
        
        // Sports team colors - Enhanced
        sports: {
          'nfl': '#FF0000',                  // Pure red
          'nba': '#FF6B00',                  // Orange-red  
          'mlb': '#0066FF',                  // Pure blue
          'nhl': '#00CCFF',                  // Cyan blue
        },
        
        // Dynamic team colors
        'team-primary': 'var(--team-primary, #0066FF)',
        'team-secondary': 'var(--team-secondary, #0052CC)',
        'team-accent': 'var(--team-accent, #001A66)',
        
        // Glass effect colors - More subtle
        'glass-light': 'rgba(255, 255, 255, 0.08)',
        'glass-dark': 'rgba(0, 0, 0, 0.4)',
        'glass-strong': 'rgba(255, 255, 255, 0.12)',
        'glass-subtle': 'rgba(255, 255, 255, 0.04)',
        
        // Glass borders - Sharper
        'glass-border-light': 'rgba(255, 255, 255, 0.15)',
        'glass-border-dark': 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        'primary': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'numeric': ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.2rem', letterSpacing: '0.015em' }],
        'base': ['1rem', { lineHeight: '1.4rem', letterSpacing: '0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '0.005em' }],
        'xl': ['1.25rem', { lineHeight: '1.6rem', letterSpacing: '0em' }],
        '2xl': ['1.5rem', { lineHeight: '1.8rem', letterSpacing: '-0.005em' }],
        '3xl': ['1.875rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '4xl': ['2.25rem', { lineHeight: '2.4rem', letterSpacing: '-0.015em' }],
        '5xl': ['3rem', { lineHeight: '3.2rem', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '4rem', letterSpacing: '-0.025em' }],
      },
      spacing: {
        '0.5': '0.125rem',    // 2px
        '1.5': '0.375rem',    // 6px
        '2.5': '0.625rem',    // 10px
        '3.5': '0.875rem',    // 14px
        '4.5': '1.125rem',    // 18px
        '5.5': '1.375rem',    // 22px
        '6.5': '1.625rem',    // 26px
        '7.5': '1.875rem',    // 30px
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',     // 2px - Very subtle
        'md': '0.25rem',      // 4px - Minimal  
        'lg': '0.375rem',     // 6px - Sleek
        'xl': '0.5rem',       // 8px - Moderate
        'card': '0.5rem',     // 8px for cards
        'button': '0.25rem',  // 4px for buttons - much sharper
        'input': '0.25rem',   // 4px for inputs
        'modal': '0.5rem',    // 8px for modals
        'full': '9999px',
      },
      animation: {
        'pulse-live': 'pulseLive 1.5s ease-in-out infinite',
        'pulse-gentle': 'pulseGentle 2.5s ease-in-out infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseLive: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        pulseGentle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: 0 },
          to: { transform: 'scale(1)', opacity: 1 },
        },
        glow: {
          '0%, 100%': { opacity: 0.8 },
          '50%': { opacity: 1 },
        },
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ease-in': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
        'ease-sharp': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '400ms',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

