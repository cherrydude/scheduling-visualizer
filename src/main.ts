import { createApp } from 'vue';
import App from './AppShell.vue';
import './styles.css';
import theme from './composables/useTheme';

// initialize theme before mounting to avoid FOUC
if (typeof window !== 'undefined') {
	theme.initTheme();
}

createApp(App).mount('#app');
