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
        
        // Dark mode colors - Enhanced sleek black theme
        'dark-bg-primary': '#000000',        // Pure black for maximum sleekness
        'dark-bg-secondary': '#0A0A0A',      // Near black with subtle variation
        'dark-bg-tertiary': '#1A1A1A',       // Subtle dark gray for elevated elements
        'dark-bg-elevated': '#111111',       // Slightly elevated black
        'dark-bg-accent': '#0F0F0F',         // Accent background
        
        'dark-text-primary': '#FFFFFF',      // Pure white for maximum contrast
        'dark-text-secondary': '#E5E5E5',    // High contrast light gray
        'dark-text-tertiary': '#9CA3AF',     // Muted gray for secondary text
        'dark-text-accent': '#D4D4D8',       // Accent text
        
        'dark-border-light': '#1F1F1F',      // Subtle borders for dark theme
        'dark-border-medium': '#2A2A2A',     // Medium borders for definition
        'dark-border-strong': '#404040',     // Strong borders for emphasis
        'dark-border-accent': '#262626',     // Accent borders
        
        // Functional colors - Enhanced for dark theme
        success: '#10B981',                  // Emerald green
        'success-bg': '#064E3B',
        warning: '#F59E0B',                  // Amber
        'warning-bg': '#451A03',
        error: '#EF4444',                    // Red
        'error-bg': '#450A0A',
        info: '#3B82F6',                     // Blue
        'info-bg': '#1E3A8A',
        
        // Live/Active states - Enhanced visibility
        'live-indicator': '#FF0000',         // Pure red for live content
        'live-pulse': '#FF4444',             // Pulsing red
        'active-indicator': '#00FF88',       // Bright green for active states
        
        // Interactive states - Sleeker blue palette
        interactive: '#0066FF',              // Vivid blue for primary actions
        'interactive-hover': '#0052CC',      // Darker blue for hover states
        'interactive-active': '#003D99',     // Deep blue for active states
        
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
        
        // Glass effect colors - Enhanced for sophistication
        'glass-light': 'rgba(255, 255, 255, 0.08)',
        'glass-dark': 'rgba(0, 0, 0, 0.4)',
        'glass-strong': 'rgba(255, 255, 255, 0.12)',
        'glass-subtle': 'rgba(255, 255, 255, 0.04)',
        
        // Glass borders - Sharper definition
        'glass-border-light': 'rgba(255, 255, 255, 0.15)',
        'glass-border-dark': 'rgba(255, 255, 255, 0.05)',
        
        // CSS Variable-based colors for theme switching
        'interactive': '#0066FF',
        'interactive-hover': '#0052CC',
        'team-primary': 'var(--team-primary, #0066FF)',
        'team-secondary': 'var(--team-secondary, #0052CC)',
        'success': '#22C55E',
        'error': '#EF4444',
        'warning': '#F59E0B',
        'live-indicator': '#DC2626',
        
        // Dark theme specific colors
        'dark-bg': {
          'primary': '#000000',
          'secondary': '#0A0A0A',
          'tertiary': '#1A1A1A',
          'elevated': '#111111',
        },
        'dark-text': {
          'primary': '#FFFFFF',
          'secondary': '#E5E5E5',
          'tertiary': '#9CA3AF',
          'inverse': '#000000',
        },
        'dark-border': {
          'light': '#1F1F1F',
          'medium': '#2A2A2A',
          'strong': '#404040',
        },
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
        'md': '0.25rem',      // 4px - Minimal for sleek look
        'lg': '0.375rem',     // 6px - Sleek modern
        'xl': '0.5rem',       // 8px - Moderate curves
        '2xl': '0.75rem',     // 12px - More pronounced
        '3xl': '1rem',        // 16px - Soft curves
        'card': '0.75rem',    // 12px for cards - modern look
        'button': '0.375rem', // 6px for buttons - sleek
        'input': '0.375rem',  // 6px for inputs - consistent
        'modal': '0.75rem',   // 12px for modals - modern
        'full': '9999px',
      },
      boxShadow: {
        // Enhanced shadow system for sleek design
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        
        // Interactive shadows with color
        'interactive': '0 4px 14px 0 rgba(0, 102, 255, 0.25)',
        'interactive-lg': '0 8px 25px 0 rgba(0, 102, 255, 0.4)',
        
        // Team color shadows
        'team': '0 4px 14px 0 rgba(var(--team-primary), 0.25)',
        'team-lg': '0 8px 25px 0 rgba(var(--team-primary), 0.4)',
        
        // Error/success shadows
        'error': '0 4px 14px 0 rgba(239, 68, 68, 0.25)',
        'success': '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
        
        // Live indicator shadows
        'live': '0 4px 14px 0 rgba(255, 0, 0, 0.25)',
        'active': '0 2px 8px 0 rgba(0, 255, 136, 0.5)',
        
        // Glass effect shadows
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-live': 'pulse-live 2s infinite',
        'pulse-gentle': 'pulse-gentle 3s infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'scale-98': 'scale98 100ms ease-out',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
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
        scale98: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' },
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

