// wisp-design-tokens.ts
// SINGLE SOURCE OF TRUTH for all Wisp styling

export const WispDesign = {
    // ====================
    // COLORS
    // ====================
    colors: {
        // Backgrounds
        bg: {
            primary: '#000000',     // Pure black - landing hero
            secondary: '#0a0a0a',   // Very dark gray - docs content
            tertiary: '#171717',    // Dark gray - cards, sidebar
            code: '#1a1a1a',        // Code blocks
            elevated: '#262626',    // Hover states
        },

        // Text
        text: {
            primary: '#ffffff',     // Headings
            secondary: '#e5e5e5',   // Body text
            muted: '#a1a1aa',       // Descriptions, labels
            disabled: '#737373',    // Disabled states
        },

        // Brand - Teal/Cyan accent
        brand: {
            teal: '#00d4ff',        // Primary accent - USE SPARINGLY
            tealSoft: 'rgba(0, 212, 255, 0.1)',   // Backgrounds
            tealBorder: 'rgba(0, 212, 255, 0.2)', // Borders
            tealGlow: 'rgba(0, 212, 255, 0.15)',  // Subtle glow - REDUCED from 0.3
        },

        // Borders
        border: {
            subtle: 'rgba(255, 255, 255, 0.05)',   // Barely visible
            default: 'rgba(255, 255, 255, 0.1)',   // Standard
            strong: 'rgba(255, 255, 255, 0.2)',    // Emphasized
        },

        // Semantic
        semantic: {
            success: '#00ff88',
            warning: '#ffaa00',
            error: '#ff4444',
            info: '#00d4ff',
        },
    },

    // ====================
    // TYPOGRAPHY
    // ====================
    typography: {
        fonts: {
            sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        },

        sizes: {
            xs: '0.75rem',      // 12px
            sm: '0.875rem',     // 14px
            base: '1rem',       // 16px
            lg: '1.125rem',     // 18px
            xl: '1.25rem',      // 20px
            '2xl': '1.5rem',    // 24px
            '3xl': '1.875rem',  // 30px
            '4xl': '2.5rem',    // 40px
            '5xl': '3rem',      // 48px
            '6xl': '4rem',      // 64px - Hero
        },

        weights: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },

        lineHeights: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.7,
        },

        letterSpacing: {
            tight: '-0.02em',
            normal: '0',
            wide: '0.05em',    // For uppercase buttons
        },
    },

    // ====================
    // SPACING
    // ====================
    spacing: {
        xs: '0.5rem',     // 8px
        sm: '1rem',       // 16px
        md: '1.5rem',     // 24px
        lg: '2rem',       // 32px
        xl: '2.5rem',     // 40px
        '2xl': '4rem',    // 64px
        '3xl': '6rem',    // 96px
        '4xl': '8rem',    // 128px
    },

    // ====================
    // EFFECTS
    // ====================
    effects: {
        // Border radius
        radius: {
            sm: '4px',
            md: '6px',
            lg: '8px',
            xl: '12px',
            full: '9999px',    // Pill buttons
        },

        // Blur
        blur: {
            sm: 'blur(4px)',
            md: 'blur(8px)',
            lg: 'blur(12px)',
        },

        // Transitions
        transition: {
            fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
            base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
            slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
        },

        // Shadows - SUBTLE ONLY
        shadow: {
            sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
            md: '0 4px 6px rgba(0, 0, 0, 0.5)',
            lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
            teal: '0 8px 24px rgba(0, 212, 255, 0.15)', // REDUCED glow
        },
    },

    // ====================
    // COMPONENT PATTERNS
    // ====================
    components: {
        // Hero button (glassmorphic with teal accent)
        heroButton: {
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            borderRadius: '9999px',
            padding: '0.875rem 2rem',
            fontSize: '0.9375rem',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: '500ms cubic-bezier(0.4, 0, 0.2, 1)',

            hover: {
                background: 'rgba(0, 212, 255, 0.1)',
                borderColor: 'rgba(0, 212, 255, 0.4)',
                color: '#00d4ff',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0, 212, 255, 0.15)', // REDUCED
            },
        },

        // Feature card (glassmorphic)
        featureCard: {
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '2.5rem 2rem',
            transition: '500ms cubic-bezier(0.4, 0, 0.2, 1)',

            hover: {
                transform: 'translateY(-8px)',
                borderColor: 'rgba(0, 212, 255, 0.2)',
                background: 'rgba(10, 10, 10, 0.8)',
            },
        },

        // Code block
        codeBlock: {
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1.25rem',
            fontSize: '0.875rem',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.7,
        },

        // Inline code
        inlineCode: {
            background: '#1a1a1a',
            color: '#00d4ff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.15rem 0.375rem',
            borderRadius: '4px',
            fontSize: '0.875em',
            fontFamily: "'JetBrains Mono', monospace",
        },

        // Link
        link: {
            color: '#00d4ff',
            textDecoration: 'none',
            transition: '150ms cubic-bezier(0.4, 0, 0.2, 1)',

            hover: {
                textDecoration: 'underline',
            },
        },
    },

    // ====================
    // USAGE GUIDE
    // ====================
    usage: {
        // Landing page (index.tsx)
        landingPage: {
            hero: {
                background: '#000000',       // Pure black
                titleColor: '#ffffff',
                subtitleColor: '#a1a1aa',
                button: 'Use heroButton pattern',
            },
            features: {
                background: '#050505',       // Slightly lighter for contrast
                cardBackground: 'rgba(10, 10, 10, 0.6)',
                tealAccent: 'Top border and icon on hover',
            },
        },

        // Documentation pages
        documentation: {
            background: '#0a0a0a',         // Slightly lighter than landing
            sidebar: '#171717',
            codeBlocks: '#1a1a1a',
            text: '#e5e5e5',
            headings: '#ffffff',
            links: '#00d4ff',
            accentUsage: 'Links, active nav, TOC, inline code only',
        },

        // Rules
        rules: [
            'Teal is an ACCENT - use sparingly on interactive elements only',
            'No teal text except links and inline code',
            'No glows except on buttons and hover states',
            'Glow intensity reduced to 0.15 max',
            'Use glassmorphism (backdrop-filter) for depth',
            'Keep backgrounds pure black or very dark gray',
            'Use Inter for body text, JetBrains Mono for code/buttons',
            'Transitions should be 500ms for important interactions',
        ],
    },
} as const;

// ====================
// CSS VARIABLES
// ====================
export const cssVariables = `
:root {
  /* Backgrounds */
  --wisp-bg-primary: #000000;
  --wisp-bg-secondary: #0a0a0a;
  --wisp-bg-tertiary: #171717;
  --wisp-bg-code: #1a1a1a;
  --wisp-bg-elevated: #262626;
  
  /* Text */
  --wisp-text-primary: #ffffff;
  --wisp-text-secondary: #e5e5e5;
  --wisp-text-muted: #a1a1aa;
  --wisp-text-disabled: #737373;
  
  /* Brand */
  --wisp-teal: #00d4ff;
  --wisp-teal-soft: rgba(0, 212, 255, 0.1);
  --wisp-teal-border: rgba(0, 212, 255, 0.2);
  --wisp-teal-glow: rgba(0, 212, 255, 0.15);
  
  /* Borders */
  --wisp-border-subtle: rgba(255, 255, 255, 0.05);
  --wisp-border-default: rgba(255, 255, 255, 0.1);
  --wisp-border-strong: rgba(255, 255, 255, 0.2);
  
  /* Typography */
  --wisp-font-sans: 'Inter', -apple-system, sans-serif;
  --wisp-font-mono: 'JetBrains Mono', monospace;
  
  /* Effects */
  --wisp-blur: blur(12px);
  --wisp-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --wisp-transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --wisp-transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Radius */
  --wisp-radius-sm: 4px;
  --wisp-radius-md: 6px;
  --wisp-radius-lg: 8px;
  --wisp-radius-xl: 12px;
  --wisp-radius-full: 9999px;
}
`;
