import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, effectScope, h, nextTick, ref } from 'vue'
import Quill from 'quill'
import { useQuilly, UseQuillyOptions, UseQuillyReturn } from '../src'

enableAutoUnmount(afterEach)

// Call useQuilly in a host component that renders the container, then initialize Quill
const setup = async (params?: UseQuillyOptions) => {
  let editor!: UseQuillyReturn
  const wrapper = mount(
    defineComponent(() => {
      const container = ref<HTMLElement>()
      editor = useQuilly(container, params)
      return () => h('div', { ref: container })
    }),
    { attachTo: document.body }
  )
  const quill = editor.initialize(Quill)
  await nextTick()
  return { wrapper, editor, quill }
}

describe('useQuilly', () => {
  it('initializes Quill in the container and exposes the instance', async () => {
    const onReady = vi.fn()
    const { wrapper, editor, quill } = await setup({ options: { placeholder: 'Write here' }, onReady })

    expect(quill.container).toBe(wrapper.element)
    expect(quill.root.dataset.placeholder).toBe('Write here')
    expect(editor.quill.value).toBe(quill)
    expect(onReady).toHaveBeenCalledWith(quill)
  })

  it('keeps the model ref and the editor in sync', async () => {
    const model = ref('<p>Hello</p>')
    const { quill } = await setup({ model })
    expect(quill.root.innerHTML).toBe('<p>Hello</p>')

    quill.insertText(5, ' Quilly', 'user')
    await nextTick()
    expect(model.value).toBe('<p>Hello Quilly</p>')

    model.value = '<h1>Title</h1>'
    await nextTick()
    expect(quill.root.innerHTML).toBe('<h1>Title</h1>')
  })

  it('reports Quill events through callbacks', async () => {
    const onTextChange = vi.fn()
    const onSelectionChange = vi.fn()
    const onEditorChange = vi.fn()
    const { quill } = await setup({ onTextChange, onSelectionChange, onEditorChange })

    // Select while the editor is empty: selecting text needs layout APIs that jsdom lacks
    quill.setSelection(0, 0, 'user')
    quill.insertText(0, 'Hi', 'user')

    expect(onSelectionChange).toHaveBeenCalledWith({ range: { index: 0, length: 0 }, oldRange: null, source: 'user' })
    expect(onTextChange).toHaveBeenCalledWith(expect.objectContaining({ source: 'user' }))
    expect(onTextChange.mock.calls[0][0].delta.ops).toEqual([{ insert: 'Hi' }])
    expect(onEditorChange).toHaveBeenCalledWith('selection-change')
    expect(onEditorChange).toHaveBeenCalledWith('text-change')
  })

  it('creates its own model when none is passed', async () => {
    const { editor, quill } = await setup()

    quill.insertText(0, 'Hi', 'user')
    await nextTick()

    expect(editor.model.value).toBe('<p>Hi</p>')
  })

  it('works on a plain element in an effect scope and releases Quill when it stops', () => {
    const element = document.body.appendChild(document.createElement('div'))
    const scope = effectScope()
    const editor = scope.run(() => useQuilly(element))!

    editor.initialize(Quill)
    expect(editor.quill.value?.container).toBe(element)

    scope.stop()
    expect(editor.quill.value).toBeNull()
    element.remove()
  })
})
