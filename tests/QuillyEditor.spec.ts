import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Quill, { Delta, QuillOptions } from 'quill'
import { QuillyEditor } from '../src'

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
