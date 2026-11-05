<script setup lang="ts">
import Quill, { Delta, EmitterSource, QuillOptions, Range } from 'quill/core'
import { computed, ref, toRef } from 'vue'
import { useQuilly } from '../composables/useQuilly'
import type { QuillClassSource } from '../composables/useQuilly'

const props = defineProps<{
  // HTML model value, supports v-model
  modelValue?: string | null
  // Quill initialization options
  options?: QuillOptions
  isSemanticHtmlModel?: boolean
  // Quill class or loader, the editor initializes itself after mount
  quillClass?: QuillClassSource
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (
    e: 'text-change',
    { delta, oldContent, source }: { delta: Delta; oldContent: Delta; source: EmitterSource }
  ): void
  (
    e: 'selection-change',
    { range, oldRange, source }: { range: Range; oldRange: Range; source: EmitterSource }
  ): void
  (e: 'editor-change', eventName: 'text-change' | 'selection-change'): void
  (e: 'blur', quill: Quill): void
  (e: 'focus', quill: Quill): void
  (e: 'ready', quill: Quill): void
}>()

const container = ref<HTMLElement>()

// Editor logic lives in useQuilly, v-model is bridged to its model ref
const { initialize } = useQuilly(container, {
  model: computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value ?? '')
  }),
  options: () => props.options,
  isSemanticHtmlModel: () => props.isSemanticHtmlModel,
  quillClass: toRef(props, 'quillClass'),
  onTextChange: (event) => emit('text-change', event),
  onSelectionChange: (event) => emit('selection-change', event),
  onEditorChange: (eventName) => emit('editor-change', eventName),
  onBlur: (quill) => emit('blur', quill),
  onFocus: (quill) => emit('focus', quill),
  onReady: (quill) => emit('ready', quill)
})

// Expose init function
defineExpose<{
  initialize: (QuillClass: typeof Quill) => Quill
}>({
  initialize
})
</script>

<template>
  <div ref="container"></div>
</template>
