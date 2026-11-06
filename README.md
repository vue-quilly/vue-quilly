# vue-quilly

Tiny Vue component, that helps to create [Quill v2](https://quilljs.com/) based WYSIWYG editors in Vue-powered apps.

[![npm version](https://img.shields.io/npm/v/vue-quilly?logo=npm&logoColor=fff)](https://www.npmjs.com/package/vue-quilly)
[![npm downloads](https://img.shields.io/npm/dm/vue-quilly?color=green)](https://npm.chart.dev/vue-quilly)
[![NPM Type Definitions](https://img.shields.io/npm/types/vue-quilly)](https://www.npmjs.com/package/vue-quilly?activeTab=code)
[![GitHub License](https://img.shields.io/github/license/alekswebnet/vue-quilly)](https://github.com/alekswebnet/vue-quilly?tab=readme-ov-file#license)

## Features

- 🚀 Built on top of [Quill v2](https://github.com/quilljs/quill) and Vue 3
- 📦 Uses `quill/core` to prevent importing all Quill modules (minimal bundle size)
- 🔄 Works with both HTML and Quill Delta format
- 🔷 TypeScript support
- ⚙️ Highly customizable - build your own editor
- ⚡ Framework ready - works with Vue 3 and Nuxt 4

## Documentation

📖 **[Full Documentation](https://vue-quilly-docs.vercel.app/)**

- [Getting Started](https://vue-quilly-docs.vercel.app/guide/getting-started.html)
- [Usage](https://vue-quilly-docs.vercel.app/guide/basic-usage.html)
- [API Reference](https://vue-quilly-docs.vercel.app/api/component.html)
- [Examples](https://vue-quilly-docs.vercel.app/examples/)
- [Comparison with VueQuill](https://vue-quilly-docs.vercel.app/guide/vs-vuequill.html)

## Quick Start

### Installation

```bash
npm install vue-quilly quill@2
# or
pnpm add vue-quilly quill@2
# or
yarn add vue-quilly quill@2
```

### Basic Usage

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { QuillyEditor } from 'vue-quilly'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const editor = ref<InstanceType<typeof QuillyEditor>>()
const content = ref('<p>Hello Quilly!</p>')
let quill: Quill | undefined

const options = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image']
    ]
  }
}

onMounted(() => {
  quill = editor.value?.initialize(Quill)
})
</script>

<template>
  <QuillyEditor ref="editor" v-model="content" :options="options" />
</template>
```

### Loading Quill after mount

Pass the Quill class or a loader as `quill-class`. The editor reads it once after mount and initializes itself, with no `initialize()` call:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { QuillyEditor } from 'vue-quilly'
import 'quill/dist/quill.snow.css'

const content = ref('<p>Hello Quilly!</p>')
const options = { theme: 'snow' }
const loadQuill = () => import('quill')
</script>

<template>
  <QuillyEditor v-model="content" :options="options" :quill-class="loadQuill" />
</template>
```

With a loader, Quill loads in its own chunk after mount and never on the server, so this works in Nuxt and other SSR setups without `<ClientOnly>`.

To use plugins, register them in a module of your own and load that module instead of `quill`. The module runs once, so each plugin registers once, and plugins that import Quill stay out of the page bundle and off the server:

```ts
// quill-setup.ts
import Quill from 'quill'
import QuillResize from 'quill-resize-module'

Quill.register('modules/resize', QuillResize)

export default Quill
```

```ts
const loadQuill = () => import('./quill-setup')
```

### Composable

`useQuilly` runs the same editor logic without the component, on a container you render yourself:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuilly } from 'vue-quilly'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const container = ref<HTMLElement>()
const content = ref('<p>Hello Quilly!</p>')

const { initialize } = useQuilly(container, {
  model: content,
  options: { theme: 'snow' },
  onTextChange: ({ source }) => console.log('changed by', source)
})

onMounted(() => {
  initialize(Quill)
})
</script>

<template>
  <div ref="container"></div>
</template>
```

It takes the component's props as options (`model` instead of `v-model`, `options`, `isSemanticHtmlModel`, `quillClass`) and its events as callbacks (`onTextChange`, `onSelectionChange`, `onEditorChange`, `onFocus`, `onBlur`, `onReady`). It returns `initialize`, the `model` ref and the Quill instance as a `quill` ref.

## Live Demo

🎯 **[Try it live](https://vue-quilly.vercel.app/)** - See various editors built with `vue-quilly`

## Examples

- [Demo Source Code](https://github.com/vue-quilly/website) - Complete examples with different configurations
- [Nuxt 4 Integration](https://github.com/alekswebnet/vue-quilly/tree/main/nuxt) - SSR setup example
- [Browser CDN Setup](https://codepen.io/redrobot753/pen/VwJwPLP) - CodePen example

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=alekswebnet/vue-quilly&type=date&legend=top-left)](https://www.star-history.com/#alekswebnet/vue-quilly&type=date&legend=top-left)

## License

[MIT](https://choosealicense.com/licenses/mit/)
