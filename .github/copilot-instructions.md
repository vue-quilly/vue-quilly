# AI Coding Assistant Instructions for vue-quilly

## Project Overview
vue-quilly is a Vue 3 component wrapper for Quill v2, providing a WYSIWYG editor with the following key features:
- Uses `quill/core` for minimal bundle size, allowing selective module imports
- Supports both HTML and Delta formats for content manipulation
- TypeScript support with full type definitions
- Nuxt 4 compatibility

## Architecture

### Core Component
The main `QuillyEditor.vue` component follows these patterns:
- Uses Vue 3 `<script setup>` with TypeScript
- Props:
  - `modelValue`: HTML string for v-model binding
  - `options`: Quill initialization options
  - `isSemanticHtmlModel`: Flag for semantic HTML output
- Emits both Quill native events and v-model updates

### Project Structure
```
src/
  components/
    QuillyEditor.vue    # Main component
demo/                   # Example implementations
  src/components/       # Different editor configurations
nuxt/                  # Nuxt.js integration example
```

## Development Workflow

### Setup
1. Install dependencies:
```bash
pnpm install
```

2. Development server:
```bash
pnpm dev          # Main package
pnpm -F demo dev  # Demo site
pnpm -F nuxt dev  # Nuxt example
```

### Key Dependencies
- quill@2.0.3: Core editor functionality
- katex: For formula support
- Vue 3.5+ / Nuxt 4+
- TypeScript for type safety

## Common Patterns

### Editor Initialization
```typescript
const editor = ref<InstanceType<typeof QuillyEditor>>()
const quill = editor.value?.initialize(Quill)
```

### Content Management
1. HTML format (v-model):
```typescript
<QuillyEditor v-model="content" />
```

2. Delta format (direct Quill API):
```typescript
quill.setContents(new Delta()
  .insert('Text')
  .insert('\n', { header: 1 }))
```

### Integration Notes
- Always initialize Quill with the component's `initialize()` method
- Import only required Quill modules to keep bundle size minimal
- Use semantic HTML mode when clean HTML output is needed
- Attach to editor events for real-time content/selection tracking

### Nuxt and SSR Integration
- Quill is a client-side only library, ensure proper hydration in SSR context
- Use the Nuxt plugin system for client-side initialization:
  ```typescript
  // plugins/quill.client.ts
  import Quill from 'quill'
  export default defineNuxtPlugin(() => {
    return {
      provide: { Quill }
    }
  })
  ```
- Refer to `/nuxt` directory for a complete Nuxt integration example
- For SSR, ensure content is properly escaped and sanitized before rendering
- Consider using `onMounted` hook for editor initialization to avoid hydration issues

## Testing and Validation
Unit tests live in `tests/` and run with Vitest and Vue Test Utils in jsdom:
```bash
pnpm test
```
CI (`.github/workflows/test.yml`) runs the tests and `pnpm build` on every push and pull request to `main`. For visual checks, also test your changes against the demo implementations in `/demo/src/components/` which showcase different editor configurations.