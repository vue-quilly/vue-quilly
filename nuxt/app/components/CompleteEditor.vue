<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { QuillyEditor } from 'vue-quilly'
import type Quill from 'quill'
import type { Delta, Range } from 'quill'
import 'quill/dist/quill.snow.css'

const model = ref<string>(`<h1 class="ql-align-center"><span style="background-color: rgb(255, 235, 204);"> </span><span style="background-color: rgb(255, 235, 204); color: rgb(102, 163, 224);">Lorem Ipsum</span><span style="background-color: rgb(255, 235, 204);"> </span></h1><h2><span style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);">What is Lorem Ipsum?</span></h2><p class="ql-align-justify"><strong style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);">Lorem Ipsum</strong><span style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);">&nbsp;is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of</span><span style="background-color: rgb(255, 255, 255);"> </span><a href="https://github.com/alekswebnet/vue-quilly" rel="noopener noreferrer" target="_blank" style="background-color: rgb(255, 255, 255);">Lorem Ipsum</a><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">.</span></p><ol><li data-list="ordered" class="ql-align-justify"><span class="ql-ui" contenteditable="false"></span>Lorem</li><li data-list="ordered" class="ql-align-justify"><span class="ql-ui" contenteditable="false"></span>Ipsum</li><li data-list="ordered" class="ql-align-justify"><span class="ql-ui" contenteditable="false"></span>Dolor</li></ol><p class="ql-align-justify"><img src="https://picsum.photos/seed/picsum/300/300"></p><iframe class="ql-video" frameborder="0" allowfullscreen="true" src="https://www.youtube.com/embed/2ZahQhb98-E?si=MJDVZOXxjvWrv9Kl"></iframe><p><br></p><p><span class="ql-formula" data-value="e=mc^2">﻿<span contenteditable="false"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>e</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">e=mc^2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">e</span><span class="mspace" style="margin-right: 0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right: 0.2778em;"></span></span><span class="base"><span class="strut" style="height: 0.8141em;"></span><span class="mord mathnormal">m</span><span class="mord"><span class="mord mathnormal">c</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height: 0.8141em;"><span class="" style="top: -3.063em; margin-right: 0.05em;"><span class="pstrut" style="height: 2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span>﻿</span></p>`)
const quill = shallowRef<Quill>()
const editorDelta = ref<Delta>()
const editorRange = ref<Range>()

const options = ref({
  theme: 'snow',
  modules: {
    toolbar: [
      [{ font: [] }, { size: [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'super' }, { script: 'sub' }],
      [{ header: '1' }, { header: '2' }, 'blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['direction', { align: [] }],
      ['link', 'image', 'video', 'formula'],
      ['clean']
    ]
  },
  placeholder: 'Insert text here ...',
  readOnly: false
})

// Quill loads in the browser after mount, so the editor renders on the server without ClientOnly
const loadQuill = () => import('~/lib/quill-setup')

// Replace the content through the Quill API
const setSampleContents = () => {
  quill.value?.setContents([
    { insert: 'Hello' },
    { insert: '\n', attributes: { header: 1 } },
    { insert: 'Some ' },
    { insert: 'initial', attributes: { bold: true } },
    { insert: ' ' },
    { insert: 'content', attributes: { underline: true } },
    { insert: '\n' }
  ])
}

const onModelValueChange = (value: string) => console.log(value)
const onTextChange = (({ delta }: { delta: Delta }) => (editorDelta.value = delta))
const onSelectionChange = ({ range }: { range: Range }) => (editorRange.value = range)
const onEditorChange = (eventName: string) => console.log(eventName)
</script>

<template>
  <QuillyEditor
    v-model="model"
    :options="options"
    :quill-class="loadQuill"
    @ready="quill = $event"
    @update:model-value="onModelValueChange"
    @text-change="onTextChange"
    @selection-change="onSelectionChange"
    @editor-change="onEditorChange"
  />

  <p class="text-label">MODEL:</p>
  <p>{{ model }}</p>
  <button class="pure-button" @click="model = `<h1>Hello world!</h1><p>I am a new paragraph</p>`">Set model</button>
  <button class="pure-button" @click="quill?.setContents([])">Reset model</button>
  <p class="text-label">CONTENTS:</p>
  <p>{{ quill?.getContents() }}</p>
  <button
    class="pure-button"
    @click="setSampleContents"
  >
    Set contents
  </button>
  <button class="pure-button" @click="quill?.setContents([])">Reset contents</button>
  <p class="text-label">LAST CHANGE:</p>
  <p>{{ editorDelta }}</p>
  <p class="text-label">CURRENT SELECTION:</p>
  <p>{{ editorRange }}</p>
  <button class="pure-button" @click="quill?.setSelection({ index: 5, length: 2 })">Set range</button>
  <p class="text-label">CONTENT LENGTH:</p>
  <p>{{ quill?.getLength() }}</p>
  <p class="text-label">Readonly:</p>
  <p><input :value="quill?.isEnabled()" type="checkbox" @input="quill?.enable(!quill?.isEnabled())"/></p>
</template>