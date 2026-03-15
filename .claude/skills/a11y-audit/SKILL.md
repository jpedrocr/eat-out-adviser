---
name: a11y-audit
description: Audit a component or page for WCAG 2.1 AA/AAA compliance and project-specific accessibility requirements (wheelchair users, touch targets, scoring criteria)
---

# Accessibility Audit

Perform a comprehensive accessibility audit of a React component, page, or feature in the Eat Out Adviser codebase. This project's core mission is physical accessibility for wheelchair users.

## Arguments

- `target` (required): File path or component name to audit
- `scope` (optional): `component` (default), `page`, or `feature`

## Audit Checklist

### 1. WCAG 2.1 AA/AAA Compliance

- **Perceivable**: Text alternatives, captions, adaptable content, distinguishable contrast
- **Operable**: Keyboard accessible, enough time, no seizures, navigable, input modalities
- **Understandable**: Readable, predictable, input assistance
- **Robust**: Compatible with assistive technologies

### 2. Project-Specific Requirements

From the project's accessibility-first constraint:

- [ ] **Touch targets**: Minimum 44x44px (WCAG 2.5.5 AAA)
- [ ] **jsx-a11y strict mode**: All rules from `eslint-plugin-jsx-a11y` strict config pass
- [ ] **ARIA patterns**: Correct roles, states, and properties
- [ ] **Keyboard navigation**: Full keyboard operability, visible focus indicators
- [ ] **Screen reader**: Meaningful content order, live regions where needed
- [ ] **Colour contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (AA), prefer 7:1 (AAA)
- [ ] **Motion**: Respects `prefers-reduced-motion`
- [ ] **Text resize**: Content usable at 200% zoom

### 3. Scoring UI Components (if applicable)

When auditing components related to the accessibility rating display (ACCESSIBILITY_RATING.md):

- [ ] **Traffic light colours**: Not relying solely on colour — include text labels and icons
- [ ] **Score badges**: Readable by screen readers with appropriate ARIA labels
- [ ] **Warning alerts**: Using `role="alert"` or `aria-live="assertive"` for critical warnings
- [ ] **Category bars**: Progress bars with `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] **Comparison view**: Global vs personalised scores clearly distinguishable without colour alone

### 4. Portuguese Language Accessibility

- [ ] **`lang="pt"` attribute**: Set on html element or component wrapper
- [ ] **Portuguese ARIA labels**: All labels, descriptions in Portuguese
- [ ] **Number formatting**: Portuguese locale (comma for decimal, dot for thousands)
- [ ] **Date formatting**: Portuguese locale (`DD/MM/YYYY` or relative dates in Portuguese)

## Audit Process

1. **Read the target file(s)** and all imported components
2. **Run ESLint** on the target: `pnpm exec eslint {target} --rule 'jsx-a11y/*: error'`
3. **Static analysis**: Check each item in the checklist above
4. **Identify issues**: Categorise as Critical (blocks access), Major (degrades experience), Minor (improvement)
5. **Suggest fixes**: Provide concrete code changes for each issue
6. **If Playwright is available**: Suggest axe-core test to add for the component

## Output Format

````markdown
## Accessibility Audit: {component name}

### Summary

- Critical: X issues
- Major: X issues
- Minor: X issues

### Critical Issues

1. **[WCAG X.X.X]** Description — Fix: `code suggestion`

### Major Issues

...

### Minor Issues

...

### Recommended axe-core Test

```typescript
test("{component} passes axe-core", async ({ page }) => {
  // suggested test
});
```
````
