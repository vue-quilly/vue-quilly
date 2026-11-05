import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import Quill, { Delta, QuillOptions } from 'quill'
import { QuillyEditor } from '../src'
import type { QuillClassSource } from '../src'

enableAutoUnmount(afterEach)

// Mount the editor with v-model wired like a parent component would, then initialize Quill
const mountEditor = async (
  props: { modelValue?: string; options?: QuillOptions; isSemanticHtmlModel?: boolean } = {}
) => {
  const wrapper = mount(QuillyEditor, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: string) => {
        wrapper.setProps({ modelValue: value })
      }
    },
    attachTo: document.body
  })
  const quill = wrapper.vm.initialize(Quill)
  await nextTick()
  return { wrapper, quill }
}

describe('QuillyEditor', () => {
  it('initializes Quill with the given options and emits ready', async () => {
    const { wrapper, quill } = await mountEditor({ options: { placeholder: 'Write here', readOnly: true } })

    expect(quill.container).toBe(wrapper.element)
    expect(quill.root.dataset.placeholder).toBe('Write here')
    expect(quill.isEnabled()).toBe(false)
    expect(wrapper.emitted('ready')).toEqual([[quill]])
  })

  it('renders the initial modelValue', async () => {
    const { quill } = await mountEditor({ modelValue: '<p>Hello <strong>Quilly</strong></p>' })

    expect(quill.root.innerHTML).toBe('<p>Hello <strong>Quilly</strong></p>')
  })

  it('updates modelValue when the editor content changes', async () => {
    const { wrapper, quill } = await mountEditor({ modelValue: '<p>Hello</p>' })

    quill.insertText(5, ' Quilly', 'user')
    await nextTick()

    expect(wrapper.props('modelValue')).toBe('<p>Hello Quilly</p>')
  })

  it('replaces the editor content when modelValue changes', async () => {
    const { wrapper, quill } = await mountEditor({ modelValue: '<p>Hello</p>' })

    await wrapper.setProps({ modelValue: '<h1>Title</h1>' })

    expect(quill.root.innerHTML).toBe('<h1>Title</h1>')
  })

  it('clears the editor when modelValue is emptied', async () => {
    const { wrapper, quill } = await mountEditor({ modelValue: '<p>Hello</p>' })

    await wrapper.setProps({ modelValue: '' })

    expect(quill.getText()).toBe('\n')
  })

  it('emits semantic HTML when isSemanticHtmlModel is set', async () => {
    const { wrapper, quill } = await mountEditor({ isSemanticHtmlModel: true })

    quill.setContents(new Delta().insert('Item').insert('\n', { list: 'bullet' }))
    await nextTick()

    // Quill renders all lists as <ol> internally, semantic HTML restores <ul>
    expect(quill.root.innerHTML).toContain('<ol><li data-list="bullet">')
    expect(wrapper.props('modelValue')).toBe('<ul><li>Item</li></ul>')
  })

  it('emits focus and blur on selection changes', async () => {
    const { wrapper, quill } = await mountEditor()

    quill.setSelection(0, 0)
    expect(wrapper.emitted('focus')).toEqual([[quill]])
    expect(wrapper.emitted('blur')).toBeUndefined()

    quill.blur()
    expect(wrapper.emitted('blur')).toEqual([[quill]])
  })
})

// Mount the editor with quillClass and wait for Quill to load
const mountWithQuillClass = async (quillClass: QuillClassSource, mountOptions: object = {}) => {
  const wrapper = mount(QuillyEditor, {
    props: { modelValue: '<p>Hello</p>', quillClass },
    attachTo: document.body,
    ...mountOptions
  })
  await flushPromises()
  return wrapper
}

// Loader that resolves only when the test calls resolve()
const deferredLoader = () => {
  let done!: (QuillClass: typeof Quill) => void
  const loader = () => new Promise<typeof Quill>((resolve) => (done = resolve))
  return { loader, resolve: (QuillClass: typeof Quill) => done(QuillClass) }
}

describe('QuillyEditor with quillClass', () => {
  it.each([
    ['a Quill class', Quill],
    ['a loader returning the class', async () => Quill],
    ['a loader returning a module', async () => ({ default: Quill })]
  ])('initializes from %s after mount', async (_, quillClass) => {
    const wrapper = await mountWithQuillClass(quillClass)
    const [[quill]] = wrapper.emitted('ready') as [[Quill]]

    expect(quill.container).toBe(wrapper.element)
    expect(quill.root.innerHTML).toBe('<p>Hello</p>')
  })

  it('initializes from a dynamic import', async () => {
    const wrapper = mount(QuillyEditor, { props: { quillClass: () => import('quill') }, attachTo: document.body })

    await vi.waitFor(() => expect(wrapper.emitted('ready')).toHaveLength(1))
  })

  it('runs a shared loader once for several editors', async () => {
    const loader = vi.fn(async () => Quill)
    const first = await mountWithQuillClass(loader)
    const second = await mountWithQuillClass(loader)

    expect(loader).toHaveBeenCalledTimes(1)
    expect(first.emitted('ready')).toHaveLength(1)
    expect(second.emitted('ready')).toHaveLength(1)
  })

  it('creates no editor when unmounted before Quill loads', async () => {
    const { loader, resolve } = deferredLoader()
    const onReady = vi.fn()
    const show = ref(true)
    mount(
      defineComponent(() => () => (show.value ? h(QuillyEditor, { quillClass: loader, onReady }) : null)),
      { attachTo: document.body }
    )

    show.value = false
    await nextTick()
    resolve(Quill)
    await flushPromises()

    expect(onReady).not.toHaveBeenCalled()
    expect(document.querySelector('.ql-container')).toBeNull()
  })

  it('shares one editor between the load and initialize()', async () => {
    const { loader, resolve } = deferredLoader()
    const wrapper = mount(QuillyEditor, { props: { quillClass: loader }, attachTo: document.body })

    // Initialize manually before the load finishes, then again after it
    const quill = wrapper.vm.initialize(Quill)
    resolve(Quill)
    await flushPromises()

    expect(wrapper.vm.initialize(Quill)).toBe(quill)
    expect(wrapper.emitted('ready')).toEqual([[quill]])
    expect(wrapper.element.querySelectorAll('.ql-editor')).toHaveLength(1)
  })

  it('reports a failed load to the app error handler and retries on the next mount', async () => {
    const error = new Error('Quill failed to load')
    const loader = vi.fn<() => Promise<typeof Quill>>().mockRejectedValueOnce(error).mockResolvedValue(Quill)
    const errorHandler = vi.fn()

    const failed = await mountWithQuillClass(loader, { global: { config: { errorHandler } } })
    expect(errorHandler).toHaveBeenCalledWith(error, expect.anything(), expect.anything())
    expect(failed.emitted('ready')).toBeUndefined()

    const retried = await mountWithQuillClass(loader)
    expect(loader).toHaveBeenCalledTimes(2)
    expect(retried.emitted('ready')).toHaveLength(1)
  })

  it('renders an empty container on the server without loading Quill', async () => {
    const loader = vi.fn(async () => Quill)
    const html = await renderToString(createSSRApp({ render: () => h(QuillyEditor, { quillClass: loader }) }))

    expect(html).toBe('<div></div>')
    expect(loader).not.toHaveBeenCalled()
  })
})
