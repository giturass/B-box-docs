import { defineConfig } from 'vitepress'

const base = '/B-box-docs/'
const origin = 'https://giturass.github.io'

export default defineConfig({
  lang: 'zh-CN',
  title: 'B-box 指南',
  description: '从第一条请求开始，掌握 B-box 的 MITM、HTTP 改写、JavaScript 脚本与 Cron。',
  base,
  cleanUrls: false,
  lastUpdated: true,
  sitemap: { hostname: origin + base },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: base + 'favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#167b67' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:site_name', content: 'B-box 指南' }],
    ['meta', { property: 'og:type', content: 'website' }],
  ],
  transformHead({ pageData }) {
    const path = pageData.relativePath.replace(/\.md$/, '.html').replace(/(^|\/)index\.html$/, '$1')
    return [
      ['link', { rel: 'canonical', href: origin + base + path }],
      ['meta', { property: 'og:title', content: pageData.title + ' · B-box 指南' }],
      ['meta', { property: 'og:description', content: pageData.description || 'B-box 的 MITM、HTTP 改写与脚本使用指南。' }],
      ['meta', { property: 'og:url', content: origin + base + path }],
    ]
  },
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: false,
  },
  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'B-box / 指南',
    nav: [
      { text: '开始使用', link: '/guide/quick-start', activeMatch: '/guide/' },
      { text: 'MITM', link: '/mitm/overview', activeMatch: '/mitm/' },
      { text: 'HTTP 改写', link: '/rewrite/overview', activeMatch: '/rewrite/' },
      { text: '脚本', link: '/scripts/overview', activeMatch: '/scripts/' },
      { text: '示例', link: '/examples/', activeMatch: '/examples/' },
    ],
    sidebar: [
      { text: '入门', items: [
        { text: '认识 B-box', link: '/guide/introduction' },
        { text: '跑通第一条请求', link: '/guide/quick-start' },
        { text: '编辑与应用配置', link: '/guide/configuration' },
      ] },
      { text: 'MITM 与请求记录', items: [
        { text: '开启 HTTPS 解密', link: '/mitm/overview' },
        { text: '生成与安装证书', link: '/mitm/certificate' },
        { text: '域名与范围匹配', link: '/mitm/hosts' },
        { text: '记录、详情与导出', link: '/mitm/capture' },
      ] },
      { text: 'HTTP 改写', items: [
        { text: '处理顺序与规则选择', link: '/rewrite/overview' },
        { text: 'Header Rewrite', link: '/rewrite/headers' },
        { text: 'URL Rewrite 与 Map Remote', link: '/rewrite/url-and-remote' },
        { text: 'Body Rewrite 与 jq', link: '/rewrite/body' },
        { text: 'Map Local / API Mock', link: '/rewrite/map-local' },
      ] },
      { text: 'JavaScript 与 Cron', items: [
        { text: '第一条脚本', link: '/scripts/overview' },
        { text: '请求、响应与动态 Mock', link: '/scripts/http' },
        { text: '脚本 API', link: '/scripts/api' },
        { text: 'Cron 定时任务', link: '/scripts/cron' },
        { text: '持久存储与共享数据', link: '/scripts/storage' },
      ] },
      { text: '示例与参考', items: [
        { text: '可下载示例', link: '/examples/' },
        { text: '文件与远程资源', link: '/reference/resources' },
        { text: '默认值与限制', link: '/reference/limits' },
        { text: '兼容性说明', link: '/reference/compatibility' },
        { text: '常见问题与排错', link: '/reference/troubleshooting' },
        { text: '资料来源与版本', link: '/reference/sources' },
      ] },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/giturass/B-box-docs', ariaLabel: '文档源码' }],
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text) => text.match(/[\p{Script=Han}]|[\p{L}\p{N}_$-]+/gu) || [],
          },
          searchOptions: { prefix: true, fuzzy: 0.15, combineWith: 'AND' },
        },
        locales: { root: { translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详细结果', resetButtonTitle: '清空搜索', backButtonTitle: '返回',
            noResultsText: '没有找到结果，试试 MITM、证书、改写或脚本。',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        } } },
      },
    },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    editLink: { pattern: 'https://github.com/giturass/B-box-docs/edit/main/docs/:path', text: '在 GitHub 编辑此页' },
    lastUpdated: { text: '文档更新', formatOptions: { dateStyle: 'medium' } },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '文档目录',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    skipToContentLabel: '跳转到内容',
    notFound: { title: '这一页还没有到达', quote: '链接可能已经变更，可以搜索文档或回到首页。', linkLabel: '返回首页', linkText: '返回首页' },
    footer: {
      message: 'B-box 中文指南 · 基于实际源码整理',
      copyright: 'GPL-3.0-or-later · sing-box / FlClash 项目名称归各自权利人',
    },
  },
})
