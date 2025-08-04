# React Safety Guide: Preventing Runtime Errors

## Overview

This guide explains how to prevent common React runtime errors like `Cannot read properties of null (reading 'map')` and other null/undefined access issues.

## The Problem

React components can crash when they try to access properties of `null` or `undefined` values. Common scenarios:

```javascript
// ❌ This will crash if tier.cards is null
{tier.cards.map(card => <Card key={card.id} card={card} />)}

// ❌ This will crash if tier is undefined
<span>{tier.name}</span>

// ❌ This will crash if tiers is null
{tiers.map(tier => <TierRow key={tier.id} tier={tier} />)}
```

## Solutions

### 1. Default Props

Always provide default values for component props:

```javascript
// ✅ Good: Default props prevent crashes
const TierRow = ({ 
  tier = {}, 
  isFirst = false, 
  onAddCard = () => {},
  onDragStart = () => {}
}) => {
  // Component logic
}
```

### 2. Nullish Coalescing Operator (??)

Use `??` for default values when you want to distinguish between `null`/`undefined` and falsy values:

```javascript
// ✅ Good: Only uses default if value is null/undefined
const cards = tier.cards ?? []
const name = tier.name ?? 'Unnamed Tier'
const color = tier.color ?? 'bg-gray-200'
```

### 3. Logical OR Operator (||)

Use `||` for default values when you want to use default for any falsy value:

```javascript
// ✅ Good: Uses default for null, undefined, empty string, 0, false
const cards = tier.cards || []
const name = tier.name || 'Unnamed Tier'
```

### 4. Optional Chaining (?.)

Use `?.` to safely access nested properties:

```javascript
// ✅ Good: Won't crash if tier is null/undefined
const tierName = tier?.name
const cardCount = tier?.cards?.length
const firstCard = tier?.cards?.[0]
```

### 5. Array Safety

Always ensure arrays exist before calling array methods:

```javascript
// ✅ Good: Safe array operations
{(tier.cards || []).map(card => <Card key={card.id} card={card} />)}
{(tiers || []).map(tier => <TierRow key={tier.id} tier={tier} />)}
```

### 6. Early Returns

Use early returns to handle missing data gracefully:

```javascript
// ✅ Good: Early return for missing data
const TierRow = ({ tier }) => {
  if (!tier) {
    return <div>Loading tier...</div>
  }

  return (
    <div>
      <span>{tier.name}</span>
      {tier.cards?.map(card => <Card key={card.id} card={card} />)}
    </div>
  )
}
```

### 7. Conditional Rendering

Use conditional rendering to show/hide content based on data availability:

```javascript
// ✅ Good: Conditional rendering
{cards && cards.length > 0 && (
  <div>
    {cards.map(card => <Card key={card.id} card={card} />)}
  </div>
)}

{!cards && <div>No cards available</div>}
```

## Best Practices

### 1. Always Provide Default Props

```javascript
// ✅ Good: Comprehensive default props
const MyComponent = ({
  data = [],
  isLoading = false,
  onAction = () => {},
  config = {}
}) => {
  // Component logic
}
```

### 2. Use TypeScript (if possible)

TypeScript provides compile-time safety:

```typescript
interface Tier {
  id: string
  name: string
  cards?: Card[]
  color?: string
}

const TierRow: React.FC<{ tier: Tier }> = ({ tier }) => {
  // TypeScript will warn about missing properties
}
```

### 3. Validate Props

```javascript
// ✅ Good: Prop validation
const TierRow = ({ tier }) => {
  if (!tier || typeof tier !== 'object') {
    console.warn('TierRow: tier prop is required and must be an object')
    return <div>Invalid tier data</div>
  }

  return (
    <div>
      <span>{tier.name || 'Unnamed Tier'}</span>
      {(tier.cards || []).map(card => <Card key={card.id} card={card} />)}
    </div>
  )
}
```

### 4. Use Error Boundaries

Wrap components in error boundaries to catch and handle errors gracefully:

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>
    }

    return this.props.children
  }
}

// Usage
<ErrorBoundary>
  <TierBoard />
</ErrorBoundary>
```

## Common Patterns

### 1. Safe Object Access

```javascript
// ✅ Good: Safe object property access
const name = tier?.name || 'Default Name'
const color = tier?.color || 'bg-gray-200'
const cards = tier?.cards || []
```

### 2. Safe Array Operations

```javascript
// ✅ Good: Safe array operations
const cardCount = cards?.length || 0
const firstCard = cards?.[0] || null
const filteredCards = (cards || []).filter(card => card.active)
```

### 3. Safe Function Calls

```javascript
// ✅ Good: Safe function calls
const handleClick = (callback) => {
  if (typeof callback === 'function') {
    callback()
  }
}

// Usage
<button onClick={() => handleClick(onAction)}>Click me</button>
```

### 4. Loading States

```javascript
// ✅ Good: Loading state handling
const TierBoard = ({ tiers, isLoading }) => {
  if (isLoading) {
    return <div>Loading tiers...</div>
  }

  if (!tiers || tiers.length === 0) {
    return <div>No tiers available</div>
  }

  return (
    <div>
      {tiers.map(tier => <TierRow key={tier.id} tier={tier} />)}
    </div>
  )
}
```

## Debugging Tips

### 1. Console Logging

```javascript
// ✅ Good: Debug logging
const TierRow = ({ tier }) => {
  console.log('TierRow props:', { tier })
  
  if (!tier) {
    console.warn('TierRow: tier prop is missing')
    return <div>Missing tier data</div>
  }

  return (
    <div>
      <span>{tier.name}</span>
      {(tier.cards || []).map(card => <Card key={card.id} card={card} />)}
    </div>
  )
}
```

### 2. React DevTools

Use React DevTools to inspect component props and state:
- Install React Developer Tools browser extension
- Check the Components tab to see prop values
- Use the Profiler to identify performance issues

### 3. Error Boundaries

Implement error boundaries to catch runtime errors:

```javascript
// ✅ Good: Error boundary with logging
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Check the console for details.</div>
    }

    return this.props.children
  }
}
```

## Summary

To prevent React runtime errors:

1. **Always provide default props** for all component parameters
2. **Use nullish coalescing (`??`)** for default values
3. **Use optional chaining (`?.`)** for safe property access
4. **Ensure arrays exist** before calling array methods
5. **Add early returns** for missing data
6. **Use conditional rendering** to handle loading/empty states
7. **Implement error boundaries** to catch and handle errors gracefully
8. **Add proper logging** for debugging
9. **Consider using TypeScript** for compile-time safety

By following these patterns, you can create robust React components that won't crash due to missing or null data. 