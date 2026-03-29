---
description: Diagnose and fix Next.js hydration errors in the project
allowed-tools: Read, Grep, Glob, Edit, Bash
argument-hint: [specific component or file path, optional]
---

You are an expert Next.js developer. Your job is to find and fix all hydration errors in this project.

## What to do

### 1. Scan for hydration error sources

Search the codebase for common hydration mismatch patterns:

- `typeof window !== 'undefined'` used directly in render logic
- `Math.random()`, `Date.now()`, or `new Date()` used in JSX without `useMemo` or state
- Browser-only APIs (`localStorage`, `sessionStorage`, `navigator`, `document`) accessed during render
- Mismatched HTML structure between server and client (e.g. `<div>` inside `<p>`)
- Components using `useLayoutEffect` without a client-only guard
- Third-party components that are not SSR-safe rendered without `dynamic()` import
- Conditional rendering based on `window`, `navigator`, or other browser globals
- CSS-in-JS or className logic that differs between server and client

Focus on: $ARGUMENTS (if provided), otherwise scan the entire project.

### 2. For each issue found

- Show the file path and the problematic code
- Explain why it causes a hydration mismatch
- Apply the appropriate fix from the patterns below

### 3. Fix patterns to apply

**Browser-only code → use `useEffect` or `useState` with mounted guard:**
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null // or a skeleton/placeholder
```

**Dynamic values (dates, random IDs) → initialize in state:**
```tsx
const [value, setValue] = useState<string>('')
useEffect(() => setValue(Date.now().toString()), [])
```

**Non-SSR-safe third-party component → use `next/dynamic` with ssr disabled:**
```tsx
import dynamic from 'next/dynamic'
const MyComponent = dynamic(() => import('./MyComponent'), { ssr: false })
```

**`useLayoutEffect` on server → suppress with client check:**
```tsx
import { useEffect, useLayoutEffect } from 'react'
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
```

**Invalid HTML nesting → fix the JSX structure:**
- `<p>` cannot contain `<div>`, `<ul>`, `<section>`, etc.
- `<a>` cannot be nested inside another `<a>`
- `<button>` cannot contain `<button>`
- Fix by changing the outer or inner element to a valid container

**className or content differing by environment → move to client state:**
```tsx
const [theme, setTheme] = useState('') // not read from localStorage during SSR
useEffect(() => setTheme(localStorage.getItem('theme') ?? 'light'), [])
```

### 4. After applying fixes

- Re-check the edited files for any remaining hydration-prone patterns
- Make sure no `use client` directive is missing on components that use browser APIs
- Confirm `suppressHydrationWarning` is only used as a last resort (e.g. on timestamp elements), not as a blanket fix
- Summarize all changes made: file, issue, and fix applied