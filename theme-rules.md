# Theme Rules: Hybrid Sports-Forward Minimalism with Glassmorphic Overlays

## 🎨 **Theme Philosophy**
**Clean minimalism meets dynamic sports energy**: A design system that adapts to team colors while maintaining readability, performance, and accessibility across all lighting conditions.

---

## 🌈 **Color System**

### **Base Colors (Light Mode)**
```css
/* Primary Background Colors */
--bg-primary: #FFFFFF        /* bg-white */
--bg-secondary: #F8FAFC      /* bg-slate-50 */
--bg-tertiary: #F1F5F9       /* bg-slate-100 */
--bg-elevated: #FFFFFF       /* bg-white with shadow */

/* Text Colors */
--text-primary: #0F172A      /* text-slate-900 */
--text-secondary: #475569    /* text-slate-600 */
--text-tertiary: #94A3B8     /* text-slate-400 */
--text-inverse: #FFFFFF      /* text-white */

/* Border Colors */
--border-light: #E2E8F0      /* border-slate-200 */
--border-medium: #CBD5E1     /* border-slate-300 */
--border-strong: #94A3B8     /* border-slate-400 */
```

### **Base Colors (Dark Mode)**
```css
/* Primary Background Colors */
--bg-primary: #0F172A        /* bg-slate-900 */
--bg-secondary: #1E293B      /* bg-slate-800 */
--bg-tertiary: #334155       /* bg-slate-700 */
--bg-elevated: #1E293B       /* bg-slate-800 with shadow */

/* Text Colors */
--text-primary: #F8FAFC      /* text-slate-50 */
--text-secondary: #CBD5E1    /* text-slate-300 */
--text-tertiary: #64748B     /* text-slate-500 */
--text-inverse: #0F172A      /* text-slate-900 */

/* Border Colors */
--border-light: #334155      /* border-slate-700 */
--border-medium: #475569     /* border-slate-600 */
--border-strong: #64748B     /* border-slate-500 */
```

### **Functional Colors**
```css
/* Status Colors (Light & Dark Mode Compatible) */
--success: #22C55E           /* bg-green-500 */
--success-bg: #DCFCE7        /* bg-green-100 (light) / #14532D (dark) */
--warning: #F59E0B           /* bg-amber-500 */
--warning-bg: #FEF3C7        /* bg-amber-100 (light) / #451A03 (dark) */
--error: #EF4444             /* bg-red-500 */
--error-bg: #FEE2E2          /* bg-red-100 (light) / #450A0A (dark) */
--info: #3B82F6              /* bg-blue-500 */
--info-bg: #DBEAFE           /* bg-blue-100 (light) / #172354 (dark) */

/* Live/Active States */
--live-indicator: #DC2626    /* bg-red-600 */
--live-pulse: #FCA5A5        /* bg-red-300 */
--active-indicator: #10B981  /* bg-emerald-500 */

/* Interactive States */
--interactive: #3B82F6       /* bg-blue-500 */
--interactive-hover: #2563EB /* bg-blue-600 */
--interactive-active: #1D4ED8 /* bg-blue-700 */
```

### **Sports Team Color Integration**
```css
/* Dynamic Team Colors (Injected via JavaScript) */
--team-primary: var(--dynamic-team-primary, #3B82F6)
--team-secondary: var(--dynamic-team-secondary, #1E40AF)
--team-accent: var(--dynamic-team-accent, #DBEAFE)

/* Team Color Usage Classes */
.team-primary { color: var(--team-primary) }
.bg-team-primary { background-color: var(--team-primary) }
.border-team-primary { border-color: var(--team-primary) }
.team-gradient { background: linear-gradient(135deg, var(--team-primary), var(--team-secondary)) }
```

### **Glassmorphic Colors**
```css
/* Glass Effect Backgrounds */
--glass-light: rgba(255, 255, 255, 0.25)     /* Light mode glass */
--glass-dark: rgba(15, 23, 42, 0.25)         /* Dark mode glass */
--glass-strong: rgba(255, 255, 255, 0.4)     /* Higher opacity glass */
--glass-blur: blur(16px)                     /* Standard blur amount */
--glass-blur-strong: blur(24px)              /* Stronger blur */

/* Glass Border Colors */
--glass-border-light: rgba(255, 255, 255, 0.3)
--glass-border-dark: rgba(255, 255, 255, 0.1)
```

---

## 📝 **Typography System**

### **Font Families**
```css
/* Primary Font Stack */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--font-mono: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace

/* Sports-Specific Font (for scores, stats) */
--font-display: 'Inter', system-ui, sans-serif /* font-sans */
--font-numeric: 'Inter', system-ui, sans-serif /* font-mono for tabular numbers */
```

### **Font Sizes & Line Heights**
```css
/* Heading Scales */
--text-xs: 0.75rem;     line-height: 1rem      /* text-xs */
--text-sm: 0.875rem;    line-height: 1.25rem   /* text-sm */
--text-base: 1rem;      line-height: 1.5rem    /* text-base */
--text-lg: 1.125rem;    line-height: 1.75rem   /* text-lg */
--text-xl: 1.25rem;     line-height: 1.75rem   /* text-xl */
--text-2xl: 1.5rem;     line-height: 2rem      /* text-2xl */
--text-3xl: 1.875rem;   line-height: 2.25rem   /* text-3xl */
--text-4xl: 2.25rem;    line-height: 2.5rem    /* text-4xl */
--text-5xl: 3rem;       line-height: 1         /* text-5xl */
--text-6xl: 3.75rem;    line-height: 1         /* text-6xl */
```

### **Font Weights**
```css
--font-light: 300       /* font-light */
--font-normal: 400      /* font-normal */
--font-medium: 500      /* font-medium */
--font-semibold: 600    /* font-semibold */
--font-bold: 700        /* font-bold */
--font-extrabold: 800   /* font-extrabold */
--font-black: 900       /* font-black */
```

### **Typography Usage Classes**
```css
/* Headline Styles */
.headline-1 { font-size: 3rem; font-weight: 800; line-height: 1; }         /* Scores, major stats */
.headline-2 { font-size: 2.25rem; font-weight: 700; line-height: 2.5rem; } /* Breaking news */
.headline-3 { font-size: 1.875rem; font-weight: 600; line-height: 2.25rem; } /* Section headers */

/* Body Text Styles */
.body-large { font-size: 1.125rem; font-weight: 400; line-height: 1.75rem; }  /* Primary content */
.body-medium { font-size: 1rem; font-weight: 400; line-height: 1.5rem; }      /* Standard text */
.body-small { font-size: 0.875rem; font-weight: 400; line-height: 1.25rem; }  /* Secondary text */

/* UI Text Styles */
.button-text { font-size: 1rem; font-weight: 600; line-height: 1.5rem; }      /* Button labels */
.caption { font-size: 0.75rem; font-weight: 500; line-height: 1rem; }         /* Image captions */
.label { font-size: 0.875rem; font-weight: 500; line-height: 1.25rem; }       /* Form labels */
```

---

## 📏 **Spacing System**

### **Base Spacing Scale (8pt Grid)**
```css
--space-1: 0.25rem    /* 4px - space-1 */
--space-2: 0.5rem     /* 8px - space-2 */
--space-3: 0.75rem    /* 12px - space-3 */
--space-4: 1rem       /* 16px - space-4 */
--space-5: 1.25rem    /* 20px - space-5 */
--space-6: 1.5rem     /* 24px - space-6 */
--space-8: 2rem       /* 32px - space-8 */
--space-10: 2.5rem    /* 40px - space-10 */
--space-12: 3rem      /* 48px - space-12 */
--space-16: 4rem      /* 64px - space-16 */
--space-20: 5rem      /* 80px - space-20 */
--space-24: 6rem      /* 96px - space-24 */
```

### **Component-Specific Spacing**
```css
/* Card Spacing */
--card-padding: 1rem              /* p-4 */
--card-gap: 0.75rem               /* gap-3 */
--card-margin: 1rem               /* m-4 */

/* Button Spacing */
--button-padding-x: 1rem          /* px-4 */
--button-padding-y: 0.5rem        /* py-2 */
--button-large-padding-x: 1.5rem  /* px-6 */
--button-large-padding-y: 0.75rem /* py-3 */

/* Input Spacing */
--input-padding-x: 0.75rem        /* px-3 */
--input-padding-y: 0.5rem         /* py-2 */

/* Safe Area Spacing */
--safe-area-top: env(safe-area-inset-top)
--safe-area-bottom: env(safe-area-inset-bottom)
--safe-area-left: env(safe-area-inset-left)
--safe-area-right: env(safe-area-inset-right)
```

---

## 🔲 **Border Radius System**

### **Radius Scale**
```css
--radius-none: 0              /* rounded-none */
--radius-sm: 0.125rem         /* rounded-sm */
--radius-base: 0.25rem        /* rounded */
--radius-md: 0.375rem         /* rounded-md */
--radius-lg: 0.5rem           /* rounded-lg */
--radius-xl: 0.75rem          /* rounded-xl */
--radius-2xl: 1rem            /* rounded-2xl */
--radius-3xl: 1.5rem          /* rounded-3xl */
--radius-full: 9999px         /* rounded-full */
```

### **Component Radius Usage**
```css
/* UI Element Specific Radius */
--button-radius: 0.5rem       /* rounded-lg */
--card-radius: 0.75rem        /* rounded-xl */
--input-radius: 0.5rem        /* rounded-lg */
--modal-radius: 1rem          /* rounded-2xl */
--avatar-radius: 9999px       /* rounded-full */
--badge-radius: 9999px        /* rounded-full */
```

---

## 🎭 **Shadow System**

### **Shadow Definitions**
```css
/* Light Mode Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)                    /* shadow-sm */
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) /* shadow */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) /* shadow-md */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) /* shadow-lg */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) /* shadow-xl */

/* Dark Mode Shadows (Lighter for contrast) */
--shadow-dark-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3)
--shadow-dark-base: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)
--shadow-dark-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)
--shadow-dark-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)
--shadow-dark-xl: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)

/* Glassmorphic Shadows */
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37)
--glass-shadow-strong: 0 12px 40px 0 rgba(31, 38, 135, 0.5)
```

### **Component Shadow Usage**
```css
/* UI Element Shadows */
--card-shadow: var(--shadow-md)
--button-shadow: var(--shadow-sm)
--modal-shadow: var(--shadow-xl)
--floating-shadow: var(--shadow-lg)
--glass-overlay-shadow: var(--glass-shadow)
```

---

## 🎨 **Glassmorphic Components**

### **Glass Effect Classes**
```css
/* Base Glass Effect */
.glass-light {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--glass-shadow);
}

.glass-dark {
  background: rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--glass-shadow);
}

/* Glass Variants */
.glass-strong {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(24px);
}

.glass-subtle {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
}

/* Glass Navigation */
.glass-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}
```

### **AR Overlay Styles**
```css
/* Camera Overlay Elements */
.ar-overlay {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 0.75rem;
}

.ar-control {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border-radius: 50%;
  width: 60px;
  height: 60px;
}

.ar-info-panel {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 0.75rem;
  padding: 1rem;
  max-width: 280px;
}
```

---

## 🎭 **Animation & Transitions**

### **Transition Timing**
```css
/* Standard Timing Functions */
--ease-out: cubic-bezier(0, 0, 0.2, 1)        /* Entering elements */
--ease-in: cubic-bezier(0.4, 0, 1, 1)         /* Exiting elements */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)   /* Bidirectional */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55) /* Playful interactions */

/* Duration Scale */
--duration-fast: 150ms        /* Quick interactions */
--duration-normal: 250ms      /* Standard transitions */
--duration-slow: 350ms        /* Complex animations */
--duration-slower: 500ms      /* Page transitions */
```

### **Animation Classes**
```css
/* Fade Animations */
.fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

.fade-out {
  animation: fadeOut var(--duration-normal) var(--ease-in);
}

/* Slide Animations */
.slide-up {
  animation: slideUp var(--duration-normal) var(--ease-out);
}

.slide-down {
  animation: slideDown var(--duration-normal) var(--ease-out);
}

/* Pulse Animations (for live content) */
.pulse-live {
  animation: pulseLive 2s infinite;
}

.pulse-gentle {
  animation: pulseGentle 3s infinite;
}

/* Scale Animations */
.scale-in {
  animation: scaleIn var(--duration-fast) var(--ease-out);
}
```

### **Keyframe Definitions**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulseLive {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

## 🎯 **Component Specifications**

### **Button Styles**
```css
/* Primary Button */
.btn-primary {
  background: var(--interactive);
  color: var(--text-inverse);
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-radius);
  font-weight: var(--font-semibold);
  transition: all var(--duration-fast) var(--ease-out);
}

/* Team Color Button */
.btn-team {
  background: var(--team-primary);
  color: white;
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-radius);
  font-weight: var(--font-semibold);
}

/* Glass Button */
.btn-glass {
  @extend .glass-light;
  color: var(--text-primary);
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-radius);
  font-weight: var(--font-medium);
}
```

### **Card Styles**
```css
/* Standard Card */
.card {
  background: var(--bg-elevated);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-light);
}

/* Sports News Card */
.card-news {
  @extend .card;
  border-left: 4px solid var(--team-primary);
}

/* Live Game Card */
.card-live {
  @extend .card;
  border: 2px solid var(--live-indicator);
  position: relative;
}

.card-live::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, var(--live-indicator), var(--live-pulse));
  border-radius: var(--card-radius);
  z-index: -1;
  animation: pulseLive 2s infinite;
}
```

### **Input Styles**
```css
/* Standard Input */
.input {
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--input-radius);
  padding: var(--input-padding-y) var(--input-padding-x);
  font-size: var(--text-base);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.input:focus {
  border-color: var(--interactive);
  outline: none;
}

/* Glass Input */
.input-glass {
  @extend .glass-light;
  border: 2px solid var(--glass-border-light);
  padding: var(--input-padding-y) var(--input-padding-x);
  border-radius: var(--input-radius);
}
```

---

## 📱 **Responsive Breakpoints**

### **Screen Size Definitions**
```css
/* Mobile First Breakpoints */
--mobile: 0px          /* Default - mobile first */
--tablet: 768px        /* md: tablets */
--desktop: 1024px      /* lg: desktops */
--wide: 1280px         /* xl: wide screens */

/* Usage with NativeWind/Tailwind */
/* sm:class - applies at 640px and up */
/* md:class - applies at 768px and up */
/* lg:class - applies at 1024px and up */
/* xl:class - applies at 1280px and up */
```

---

## 🎨 **Theme Implementation Guidelines**

### **NativeWind/Tailwind Configuration**
```javascript
// tailwind.config.js extensions
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add custom colors here
        'glass-light': 'rgba(255, 255, 255, 0.25)',
        'glass-dark': 'rgba(15, 23, 42, 0.25)',
        'team-primary': 'var(--team-primary)',
        'live-pulse': '#FCA5A5',
      },
      backdropBlur: {
        'glass': '16px',
        'glass-strong': '24px',
      },
      animation: {
        'pulse-live': 'pulseLive 2s infinite',
        'fade-in': 'fadeIn 250ms ease-out',
        'slide-up': 'slideUp 250ms ease-out',
      },
    },
  },
}
```

### **Dark Mode Implementation**
```css
/* Automatic dark mode detection */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0F172A;
    --text-primary: #F8FAFC;
    /* ... other dark mode overrides */
  }
}

/* Manual dark mode class */
.dark {
  --bg-primary: #0F172A;
  --text-primary: #F8FAFC;
  /* ... other dark mode overrides */
}
```

### **Team Color Dynamic Loading**
```javascript
// JavaScript for dynamic team colors
const applyTeamColors = (primaryColor, secondaryColor) => {
  document.documentElement.style.setProperty('--team-primary', primaryColor);
  document.documentElement.style.setProperty('--team-secondary', secondaryColor);
  document.documentElement.style.setProperty('--team-accent', `${primaryColor}20`); // 20% opacity
};

// Example usage
applyTeamColors('#FF6B35', '#F7931E'); // Cleveland Browns colors
```

---

## ✅ **Theme Consistency Checklist**

### **Color Compliance**
- [ ] All colors maintain 4.5:1 contrast ratio minimum
- [ ] Team colors work in both light and dark modes
- [ ] Glass effects remain readable over all background types
- [ ] Status colors (success, error, warning) are consistent across components

### **Typography Compliance**
- [ ] All text uses defined font sizes and weights
- [ ] Line heights provide adequate spacing for mobile reading
- [ ] Sports statistics use tabular numbers for alignment
- [ ] Interactive elements use consistent text styling

### **Spacing Compliance**
- [ ] All spacing uses 8pt grid system
- [ ] Touch targets meet 44pt minimum requirement
- [ ] Consistent spacing between related elements
- [ ] Proper safe area handling on devices with notches

### **Component Compliance**
- [ ] All components use defined shadow system
- [ ] Border radius applied consistently across similar elements
- [ ] Glass effects maintain consistent backdrop blur values
- [ ] Animations use defined timing functions and durations

### **Responsive Compliance**
- [ ] All components adapt properly across screen sizes
- [ ] Text remains readable on smallest supported devices
- [ ] Touch targets remain accessible on all screen sizes
- [ ] Glass effects perform well on lower-end devices 