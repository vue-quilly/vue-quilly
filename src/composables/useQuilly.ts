import type Quill from 'quill/core'
import type { Delta, EmitterSource, QuillOptions, Range } from 'quill/core'
import { getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'

export interface UseQuillyOptions {
  // HTML model, synced with the editor content both ways
  model?: Ref<string | null | undefined>
  // Quill initialization options
  options?: MaybeRefOrGetter<QuillOptions | undefined>
  // Use Quill semantic HTML for the model instead of the editor inner HTML
  isSemanticHtmlModel?: MaybeRefOrGetter<boolean | undefined>
  onTextChange?: (event: { delta: Delta; oldContent: Delta; source: EmitterSource }) => void
  onSelectionChange?: (event: { range: Range; oldRange: Range; source: EmitterSource }) => void
  onEditorChange?: (eventName: 'text-change' | 'selection-change') => void
  onBlur?: (quill: Quill) => void
  onFocus?: (quill: Quill) => void
  onReady?: (quill: Quill) => void
}

export interface UseQuillyReturn {
  // Quill instance, set by initialize()
  quill: ShallowRef<Quill | null>
  // HTML model, the passed one or an internal ref
  model: Ref<string | null | undefined>
  // Editor initialization, returns Quill instance
  initialize: (QuillClass: typeof Quill) => Quill
}

export function useQuilly(
  container: MaybeRefOrGetter<HTMLElement | null | undefined>,
  {
    model = ref<string | null>(),
    options,
    isSemanticHtmlModel,
    onTextChange,
    onSelectionChange,
    onEditorChange,
    onBlur,
    onFocus,
    onReady
  }: UseQuillyOptions = {}
): UseQuillyReturn {
  const quill = shallowRef<Quill | null>(null)
  // Last HTML pasted into or produced by the editor
  const html = ref<string | null>()

  // Editor HTML depending on model type
  const getHTML = (instance: Quill) =>
    toValue(isSemanticHtmlModel) ? instance.getSemanticHTML() : instance.root.innerHTML

  // Convert model HTML to Delta and replace editor content
  const pasteHTML = (instance: Quill) => {
    html.value = model.value
    const oldContent = instance.getContents()
    const delta = instance.clipboard.convert({ html: model.value ?? '' })
    instance.setContents(delta)
    onTextChange?.({ delta, oldContent, source: 'api' })
  }

  // Editor initialization, returns Quill instance
  const initialize = (QuillClass: typeof Quill) => {
    const instance = new QuillClass(toValue(container) as HTMLElement, toValue(options))

    // Set editor initial model
    if (model.value) {
      pasteHTML(instance)
    }

    // Handle editor selection change, report blur and focus
    instance.on('selection-change', (range, oldRange, source) => {
      if (!range) {
        onBlur?.(instance)
      } else {
        onFocus?.(instance)
      }
      onSelectionChange?.({ range, oldRange, source })
    })

    // Handle editor text change
    instance.on('text-change', (delta, oldContent, source) => {
      html.value = getHTML(instance)
      onTextChange?.({ delta, oldContent, source })
    })

    // Handle editor change
    instance.on('editor-change', (eventName: 'text-change' | 'selection-change') => {
      onEditorChange?.(eventName)
    })

    quill.value = instance
    onReady?.(instance)

    return instance
  }

  // Watch model and paste HTML if it was changed outside of the editor
  watch(model, (newValue) => {
    const instance = quill.value
    if (!instance) return
    if (newValue && newValue !== html.value) {
      pasteHTML(instance)
      html.value = getHTML(instance)
    } else if (!newValue) {
      instance.setContents([])
    }
  })

  // Watch editor HTML and update model if has changes
  watch(html, (newValue, oldValue) => {
    const instance = quill.value
    if (!instance) return
    if (newValue && newValue !== oldValue) {
      model.value = newValue
    } else if (!newValue) {
      instance.setContents([])
    }
  })

  // Release the instance together with the component or effect scope
  if (getCurrentScope()) {
    onScopeDispose(() => {
      quill.value = null
    })
  }

  return { quill, model, initialize }
}
