import DefaultTheme from 'vitepress/theme-without-fonts'
import type { Theme } from 'vitepress'
import GuideHome from './GuideHome.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('GuideHome', GuideHome)
  },
} satisfies Theme
