import { createApp } from "vue";
import App from "./AppShell.vue";
import "./styles.css";
import theme from "./composables/useTheme";

// Thema vor dem Mounten setzen, damit beim ersten Paint kein falsches Thema
// sichtbar wird (Flash of Unstyled Content).
if (typeof window !== "undefined") {
  theme.initTheme();
}

createApp(App).mount("#app");
