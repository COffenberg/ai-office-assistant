import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
					glass: 'hsl(var(--background-glass))',
				},
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glass: 'hsl(var(--primary-glass))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glass: 'hsl(var(--secondary-glass))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					glass: 'hsl(var(--destructive-glass))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
					glass: 'hsl(var(--muted-glass))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					glass: 'hsl(var(--accent-glass))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					glass: 'hsl(var(--card-glass))',
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					glass: 'hsl(var(--success-glass))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					glass: 'hsl(var(--warning-glass))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				xl: 'var(--radius-xl)',
				lg: 'var(--radius-lg)',
				DEFAULT: 'var(--radius)',
				md: 'var(--radius)',
				sm: 'var(--radius-sm)'
			},
			boxShadow: {
				'glass-sm': 'var(--shadow-glass-sm)',
				'glass': 'var(--shadow-glass)',
				'glass-md': 'var(--shadow-glass-md)',
				'glass-lg': 'var(--shadow-glass-lg)',
				'glass-xl': 'var(--shadow-glass-xl)',
				'hover-lift-sm': 'var(--hover-lift-sm)',
				'hover-lift': 'var(--hover-lift)',
				'hover-lift-lg': 'var(--hover-lift-lg)',
				'focus-glow': 'var(--focus-glow)',
				sm: 'var(--shadow-glass-sm)',
				DEFAULT: 'var(--shadow-glass)',
				md: 'var(--shadow-glass-md)',
				lg: 'var(--shadow-glass-lg)',
				xl: 'var(--shadow-glass-xl)'
			},
			backdropBlur: {
				xs: 'var(--backdrop-blur-sm)',
				sm: 'var(--backdrop-blur-sm)',
				DEFAULT: 'var(--backdrop-blur)',
				md: 'var(--backdrop-blur-md)',
				lg: 'var(--backdrop-blur-lg)'
			},
			transitionDuration: {
				micro: 'var(--transition-micro)',
				smooth: 'var(--transition-smooth)',
				gentle: 'var(--transition-gentle)'
			},
			spacing: {
				18: '4.5rem',
				22: '5.5rem',
				26: '6.5rem',
				30: '7.5rem',
				34: '8.5rem',
				38: '9.5rem'
			},
			fontSize: {
				'2xs': ['0.6875rem', { lineHeight: '1rem', fontWeight: '500' }],
				xs: ['0.75rem', { lineHeight: '1.125rem', fontWeight: '500' }],
				sm: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
				base: ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
				lg: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
				xl: ['1.25rem', { lineHeight: '1.875rem', fontWeight: '600' }],
				'2xl': ['1.5625rem', { lineHeight: '2.125rem', fontWeight: '600' }],
				'3xl': ['1.953rem', { lineHeight: '2.5rem', fontWeight: '700' }],
				'4xl': ['2.441rem', { lineHeight: '3rem', fontWeight: '700' }],
				'5xl': ['3.052rem', { lineHeight: '3.5rem', fontWeight: '700' }],
				'6xl': ['3.815rem', { lineHeight: '4rem', fontWeight: '700' }]
			},
			fontWeight: {
				medium: '500',
				semibold: '600',
				bold: '700'
			},
			letterSpacing: {
				tighter: '-0.02em',
				tight: '-0.01em',
				normal: '0em',
				wide: '0.01em',
				wider: '0.02em'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
						opacity: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					},
					to: {
						height: '0',
						opacity: '0'
					}
				},
				'glass-fade-in': {
					from: {
						opacity: '0',
						transform: 'translateY(8px) scale(0.98)',
						backdropFilter: 'blur(0px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0) scale(1)',
						backdropFilter: 'var(--backdrop-blur)'
					}
				},
				'glass-fade-out': {
					from: {
						opacity: '1',
						transform: 'translateY(0) scale(1)',
						backdropFilter: 'var(--backdrop-blur)'
					},
					to: {
						opacity: '0',
						transform: 'translateY(8px) scale(0.98)',
						backdropFilter: 'blur(0px)'
					}
				},
				'hover-lift': {
					from: {
						transform: 'translateY(0)',
						boxShadow: 'var(--shadow-glass)'
					},
					to: {
						transform: 'translateY(-2px)',
						boxShadow: 'var(--hover-lift)'
					}
				},
				'focus-glow': {
					from: {
						boxShadow: 'var(--shadow-glass)'
					},
					to: {
						boxShadow: 'var(--focus-glow)'
					}
				},
				'scale-in': {
					from: {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					to: {
						opacity: '1',
						transform: 'scale(1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down var(--transition-smooth) ease-out',
				'accordion-up': 'accordion-up var(--transition-smooth) ease-out',
				'glass-fade-in': 'glass-fade-in var(--transition-gentle) ease-out',
				'glass-fade-out': 'glass-fade-out var(--transition-gentle) ease-out',
				'hover-lift': 'hover-lift var(--transition-micro) ease-out',
				'focus-glow': 'focus-glow var(--transition-micro) ease-out',
				'scale-in': 'scale-in var(--transition-smooth) ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
