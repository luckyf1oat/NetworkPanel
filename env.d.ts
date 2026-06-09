/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.ttf' {
  const src: string
  export default src
}
