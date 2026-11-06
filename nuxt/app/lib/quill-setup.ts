import Quill from 'quill'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Quill's formula format renders with window.katex
Object.assign(window, { katex })

export default Quill
