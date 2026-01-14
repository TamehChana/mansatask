# Fintech Theme Update Guide

## Overview
Transforming the UI to match professional fintech aesthetic (Stripe/Wise/Plaid/Brex style).

## Color System

### Primary Colors
- **Primary (Navy)**: `#0A2540` - Use `bg-primary`, `text-primary`
- **Accent (Teal)**: `#17A2B8` - Use `bg-accent`, `text-accent`
- **Success**: `#2ECC71` - Use `text-success`, `bg-success`
- **Warning**: `#F5A623` - Use `text-warning`, `bg-warning`
- **Error**: `#E5533D` - Use `text-error`, `bg-error`

### Backgrounds
- **Background**: `#F8FAFC` - Use `bg-background`
- **Surface (Cards)**: `#FFFFFF` - Use `bg-surface`

### Text Colors
- **Primary Text**: `#0F172A` - Use `text-text-primary`
- **Secondary Text**: `#64748B` - Use `text-text-secondary`

## Typography

### Font Sizes (use Tailwind classes)
- **H1**: `text-h1` (36px, semibold)
- **H2**: `text-h2` (28px, semibold)
- **H3**: `text-h3` (22px, semibold)
- **Body**: `text-body` (16px)
- **Small**: `text-small` (14px)

### Font Family
- Inter font (loaded via Google Fonts in globals.css)
- System UI fallback

## Component Patterns

### Headers
**OLD:**
```tsx
<header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
  <h1 className="text-3xl font-bold text-white">Title</h1>
  <p className="text-blue-100 mt-1">Subtitle</p>
</header>
```

**NEW:**
```tsx
<header className="bg-surface border-b border-gray-200">
  <h1 className="text-h1 text-text-primary">Title</h1>
  <p className="text-text-secondary mt-2 text-body">Subtitle</p>
</header>
```

### Buttons
**OLD:**
```tsx
<button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
  Button
</button>
```

**NEW:**
```tsx
<button className="bg-primary text-white px-6 py-3 rounded-button hover:bg-primary-dark transition-fast shadow-soft hover:shadow-soft-md">
  Button
</button>
```

### Cards
**OLD:**
```tsx
<div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
```

**NEW:**
```tsx
<div className="bg-surface rounded-card shadow-soft hover:shadow-soft-md transition-fast p-6 border border-gray-100 hover-lift">
```

### Links/Accents
**OLD:**
```tsx
<span className="text-blue-600 hover:text-blue-700">Link</span>
```

**NEW:**
```tsx
<span className="text-accent hover:text-accent-dark">Link</span>
```

## Spacing System (8px base)
- Use: `px-6 py-8` for headers (24px/32px)
- Use: `px-6 py-8` for main content
- Use: `p-6` for cards (24px padding)
- Use: `gap-4` for flex/grid gaps (16px)

## Shadows
- **Soft**: `shadow-soft` - For cards
- **Soft Medium**: `shadow-soft-md` - For hover states
- **Soft Large**: `shadow-soft-lg` - For elevated elements

## Transitions
- **Fast**: `transition-fast` (150ms)
- **Normal**: `transition-normal` (200ms)

## Max Widths
- **Content**: `max-w-content` (1200px)
- **Content Large**: `max-w-content-lg` (1280px)

## Key Principles
1. **No heavy gradients** - Use solid colors with subtle depth
2. **Soft shadows only** - No dramatic shadows
3. **Clean borders** - Light gray borders (`border-gray-100`, `border-gray-200`)
4. **Fast transitions** - 150-200ms max
5. **Generous whitespace** - 8px spacing system
6. **Professional typography** - Inter font, clear hierarchy


