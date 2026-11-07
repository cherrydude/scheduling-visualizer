// Vite stellt die Importtypen bereit, die für die Build- und Laufzeitumgebung gelten.
/// <reference types="vite/client" />

// Vue-Single-File-Components werden für TypeScript als typisierte Komponenten importierbar.
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}
