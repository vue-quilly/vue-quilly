// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  vite: {
    optimizeDeps: {
      include: [
        'vue-quilly',
        'quill/core',
        'katex',
        'quill',
      ]
    }
  }
})
