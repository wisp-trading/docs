// wisp-design-tokens.ts
// Single source of truth for Wisp brand colors and styles

export const WispDesignSystem = {
    // ===================
    // COLORS
    // ===================
    colors: {
        // Backgrounds - Pure blacks and grays (NO BLUE TINT)
        background: {
            primary: '#000000',      // Pure black - main content, landing hero
            secondary: '#0a0a0a',    // Very dark gray - sections, sidebar
            tertiary: '#1a1a1a',     // Dark gray - code blocks, elevated cards
            elevated: '#2a2a2a',     // Medium dark gray - hover states
        },

        // Text - High contrast whites and grays
        text: {
            primary: '#ffffff',      // Pure white - main headlines
            secondary: '#e5e5e5',    // Off-white - body text, paragraphs
            muted: '#a1a1aa',        // Medium gray - descriptions, labels
            disabled: '#71717a',     // Darker gray - disabled states
        },

        // Brand - Wisp blue (from landing page hero pulse dot)
        brand: {
            blue: '#2563eb',         // Primary brand blue
            blueLight: '#3b9eff',    // Lighter blue for links
            cyan: '#00d4ff',         // Accent cyan (use sparingly)
            gradient: 'linear-gradient(90deg, #0066ff 0%, #00d4ff 100%)', // Only for CTAs
        },

        // Borders - White with varying opacity
        border: {
            subtle: 'rgba(255, 255, 255, 0.1)',   // Barely visible dividers
            default: 'rgba(255, 255, 255, 0.2)',  // Standard borders
            strong: 'rgba(255, 255, 255, 0.3)',   // Emphasized borders (buttons)
        },

        // Semantic colors
        semantic: {
            success: '#00ff88',
            warning: '#ffaa00',
            error: '#ff4444',
            info: '#2563eb',
        },
    },

    // ===================
    // TYPOGRAPHY
    // ===================
    typography: {
        fonts: {
            sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            serif: 'Georgia, "Times New Roman", serif',
            mono: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
        },

        sizes: {
            xs: '0.75rem',     // 12px - labels, meta
            sm: '0.875rem',    // 14px - small text
            base: '1rem',      // 16px - body
            lg: '1.125rem',    // 18px - large body
            xl: '1.25rem',     // 20px - subheadings
            '2xl': '1.5rem',   // 24px - h4
            '3xl': '1.875rem', // 30px - h3
            '4xl': '2.25rem',  // 36px - h2
            '6xl': '3.75rem',  // 60px - h1
            '7xl': '4.5rem',   // 72px - hero
        },

        weights: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },

        lineHeights: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.625,
            loose: 2,
        },
    },

    // ===================
    // SPACING
    // ===================
    spacing: {
        xs: '0.5rem',    // 8px
        sm: '1rem',      // 16px
        md: '1.5rem',    // 24px
        lg: '2rem',      // 32px
        xl: '3rem',      // 48px
        '2xl': '4rem',   // 64px
        '3xl': '6rem',   // 96px
    },

    // ===================
    // EFFECTS
    // ===================
    effects: {
        // Blur (for glassmorphism effects)
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

        // Shadows (subtle, for depth)
        shadow: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            blue: '0 0 20px rgba(37, 99, 235, 0.3)', // Blue glow for brand elements
        },
    },

    // ===================
    // COMPONENTS
    // ===================
    components: {
        // Primary button (from landing page hero)
        button: {
            primary: {
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                padding: '1rem 2rem',
                borderRadius: '9999px', // Fully rounded
                fontSize: '0.875rem',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
                hover: {
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #ffffff',
                },
            },

            // Gradient button (for CTAs)
            gradient: {
                background: 'linear-gradient(90deg, #0066ff 0%, #00d4ff 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                transition: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
                hover: {
                    opacity: 0.9,
                    transform: 'scale(1.02)',
                },
            },
        },

        // Code blocks
        codeBlock: {
            background: '#1a1a1a',
            border: '1px solid rgba(37, 99, 235, 0.2)', // Subtle blue glow
            borderRadius: '0.5rem',
            padding: '1.5rem',
            fontSize: '0.875rem',
            fontFamily: '"JetBrains Mono", monospace',
            lineHeight: 1.7,
        },

        // Inline code
        codeInline: {
            background: '#1a1a1a',
            color: '#00d4ff',
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            fontSize: '0.875em',
            fontFamily: '"JetBrains Mono", monospace',
        },

        // Links
        link: {
            default: {
                color: '#3b9eff',
                textDecoration: 'none',
                transition: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
            },
            hover: {
                color: '#60a5fa',
                textDecoration: 'underline',
            },
        },

        // Cards/Containers
        card: {
            background: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
        },
    },

    // ===================
    // USAGE GUIDELINES
    // ===================
    usage: {
        landingPage: {
            background: '#050505', // Slightly different for orb contrast
            heroText: '#ffffff',
            bodyText: '#e5e5e5',
            accentColor: '#2563eb',
        },

        documentation: {
            background: '#000000',        // Pure black
            sidebar: '#0a0a0a',          // Slightly lighter
            codeBlocks: '#1a1a1a',       // Even lighter
            text: '#e5e5e5',             // Off-white for readability
            headings: '#ffffff',         // Pure white
            links: '#3b9eff',            // Blue
            accents: '#2563eb',          // Brand blue
        },

        doNotUse: [
            'Navy blue backgrounds (#1e293b, #0f172a, etc.)',
            'Cyan as primary color (only as accent)',
            'Gradients on content backgrounds',
            'Low contrast text (#666, #777)',
            'Pure white backgrounds',
        ],
    },
}

// ===================
// CSS VARIABLES
// ===================
export const cssVariables = `
:root {
  /* Backgrounds */
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #1a1a1a;
  --bg-elevated: #2a2a2a;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #e5e5e5;
  --text-muted: #a1a1aa;
  --text-disabled: #71717a;
  
  /* Brand */
  --brand-blue: #2563eb;
  --brand-blue-light: #3b9eff;
  --brand-cyan: #00d4ff;
  --brand-gradient: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%);
  
  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.1);
  --border-default: rgba(255, 255, 255, 0.2);
  --border-strong: rgba(255, 255, 255, 0.3);
  
  /* Semantic */
  --color-success: #00ff88;
  --color-warning: #ffaa00;
  --color-error: #ff4444;
  --color-info: #2563eb;
  
  /* Effects */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
  
  --blur-sm: 4px;
  --blur-md: 8px;
  --blur-lg: 12px;
}
`
