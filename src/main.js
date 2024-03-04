/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { createPinia } from 'pinia'

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


// fix the issue of marker-icon not available in the public folder
const iconRetinaUrl = new URL('/marker-icon-2x.png', import.meta.url).href;
//const iconUrl = new URL('../public/leaflet-images/marker-icon.png', import.meta.url).href;
const iconUrl = new URL('/marker-icon.png', import.meta.url).href;
const shadowUrl = new URL('/marker-shadow.png', import.meta.url).href;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});


// Components
import App from './App.vue'
import router from './router'
// Composables
import { createApp } from 'vue'
const pinia = createPinia()
const app = createApp(App)

registerPlugins(app)

app.mount('#app')
