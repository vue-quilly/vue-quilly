import type Quill from 'quill/core'
import type { Delta, EmitterSource, QuillOptions, Range } from 'quill/core'
import {
  getCurrentInstance,
  getCurrentScope,
  onMounted,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  unref,
  watch
} from 'vue'
import type { MaybeRef, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'

// Quill constructor, from 'quill' or 'quill/core'
export type QuillClass = typeof Quill

// Function that loads Quill, e.g. () => import('quill')
export type QuillLoader = () => Promise<QuillClass | { default: QuillClass }>

// Quill class or loader the editor initializes itself with after mount
export type QuillClassSource = QuillClass | QuillLoader

export interface UseQuillyOptions {
  // HTML model, synced with the editor content both ways
  model?: Ref<string | null | undefined>
  // Quill initialization options
  options?: MaybeRefOrGetter<QuillOptions | undefined>
  // Use Quill semantic HTML for the model instead of the editor inner HTML
  isSemanticHtmlModel?: MaybeRefOrGetter<boolean | undefined>
  // Quill class or loader, read on mount to initialize the editor without initialize().
  // A ref, not a getter: a loader is a function too
  quillClass?: MaybeRef<QuillClassSource | undefined>
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

// Loaded classes per loader, so editors sharing a loader load Quill and register plugins once
const loadedClasses = new WeakMap<QuillLoader, Promise<QuillClass>>()

// The Quill class has a static import(), a loader doesn't
const isQuillClass = (value: unknown): value is QuillClass =>
  typeof value === 'function' && typeof (value as QuillClass).import === 'function'

// Resolve a class or loader to the Quill class, unwrapping a module's default export
const resolveQuillClass = (source: QuillClassSource): Promise<QuillClass> => {
  if (isQuillClass(source)) return Promise.resolve(source)
  let loaded = loadedClasses.get(source)
  if (!loaded) {
    loaded = source().then((result) => (isQuillClass(result) ? result : result.default))
    loadedClasses.set(source, loaded)
    // Forget a failed load so a later mount can retry
    loaded.catch(() => loadedClasses.delete(source))
  }
  return loaded
}

export function useQuilly(
  container: MaybeRefOrGetter<HTMLElement | null | undefined>,
  {
    model = ref<string | null>(),
    options,
    isSemanticHtmlModel,
    quillClass,
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
  // Set on dispose, stops a pending load from creating an editor
  let isDisposed = false

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
    // With quillClass, the load on mount and manual calls share one editor
    if (quill.value && unref(quillClass)) {
      return quill.value
    }

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

  // Initialize from quillClass after mount, so Quill never loads on the server
  if (getCurrentInstance()) {
    onMounted(() => {
      const source = unref(quillClass)
      if (!source) return
      // Returning the promise sends a failed load to the app error handler
      return resolveQuillClass(source).then((QuillClass) => {
        if (!isDisposed && !quill.value && toValue(container)) {
          initialize(QuillClass)
        }
      })
    })
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
      isDisposed = true
      quill.value = null
    })
  }

  return { quill, model, initialize }
}
