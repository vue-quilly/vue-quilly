// Checks the built types the way a node16/nodenext consumer sees them, run `pnpm build` first.
// 'vue-quilly' resolves to dist through the package's own exports map.
// A type that fails to resolve becomes `any`, the assignment below then passes
// and tsc reports the unused @ts-expect-error.
import { QuillyEditor, useQuilly } from 'vue-quilly'

// @ts-expect-error QuillyEditor is a component, not `any`
export const editor: symbol = QuillyEditor

// @ts-expect-error quill.value is `Quill | null`, not `any`
export const quill: symbol = useQuilly(null).quill.value
