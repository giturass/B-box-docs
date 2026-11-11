<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { withBase } from 'vitepress'

const selected = ref(0)
const tabs = [
  { name: 'MITM', label: '让 HTTPS 变得可读', before: 'TLS 加密连接', after: 'GET /profile  →  200 OK', note: '客户端信任 CA，且域名命中后，HTTPS 才能进入 HTTP 处理。', link: '/mitm/overview.html', code: '"mitm": {\n  "enabled": true,\n  "hosts": ["api.example.test"]\n}' },
  { name: 'HTTP 改写', label: '把响应改成你需要的样子', before: '{ "debug": false }', after: '{ "debug": true }', note: '用 jq 修改 JSON 字段。请求与响应可以分别设置规则。', link: '/rewrite/body.html', code: '"body_rewrite": [{\n  "pattern": "/profile$",\n  "phase": "response",\n  "jq": ".debug = true"\n}]' },
  { name: 'JavaScript', label: '直接生成一个动态响应', before: 'GET /profile', after: '{ "ok": true, "method": "GET" }', note: '请求脚本调用 $done({ response: … })，返回 Mock 响应。', link: '/scripts/http.html', code: '$done({ response: {\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    ok: true, method: $request.method\n  })\n}});' },
]
const active = computed(() => tabs[selected.value])
async function moveTab(event: KeyboardEvent, index: number) {
  const key = event.key
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return
  event.preventDefault()
  selected.value = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 : (index + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  await nextTick()
  document.getElementById(`demo-tab-${selected.value}`)?.focus()
}
const topics = [
  { number: '01', title: 'MITM 与请求记录', text: '准备证书、选择域名，再查看请求、响应与 TLS 信息。', tags: 'CA · 域名匹配 · HAR', link: '/mitm/overview.html', glyph: 'lock' },
  { number: '02', title: 'HTTP 改写', text: '修改 Header、URL 和正文，映射远端服务或返回本地 Mock。', tags: 'Rewrite · jq · Map Local', link: '/rewrite/overview.html', glyph: 'rewrite' },
  { number: '03', title: 'JavaScript 与 Cron', text: '编写动态逻辑、发起网络请求，让定时任务与 HTTP 脚本共享数据。', tags: '$done · $httpClient · 存储', link: '/scripts/overview.html', glyph: 'code' },
]
</script>

<template>
  <div class="guide-home">
    <section class="home-hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <div class="eyebrow"><span class="status-dot" /> B-BOX DOCUMENTATION <span class="edition">中文指南</span></div>
        <h1 id="hero-title">从一条请求开始，<br><span>读懂，再改写。</span></h1>
        <p class="hero-description">用 B-box 观察 HTTPS，调整 HTTP 行为，<br class="desktop-break">把重复的工作交给 JavaScript。</p>
        <div class="hero-actions">
          <a class="hero-button primary" :href="withBase('/guide/quick-start.html')">开始使用 <span aria-hidden="true">↗</span></a>
          <a class="hero-button secondary" :href="withBase('/examples/')">查看配置示例 <span aria-hidden="true">→</span></a>
        </div>
        <div class="hero-foundation"><span>sing-box 内核</span><i aria-hidden="true">/</i><span>FlClash 界面组件</span><i aria-hidden="true">/</i><span>Android</span></div>
      </div>
      <div class="request-demo">
        <div class="demo-topbar"><span class="terminal-dots" aria-hidden="true"><i /><i /><i /></span><span>一次请求，三种可能</span><span class="demo-badge">流程示意</span></div>
        <div class="demo-tabs" role="tablist" aria-label="选择功能示意">
          <button v-for="(tab, index) in tabs" :id="`demo-tab-${index}`" :key="tab.name" type="button" role="tab" :aria-selected="selected === index" aria-controls="demo-panel" :tabindex="selected === index ? 0 : -1" @click="selected = index" @keydown="moveTab($event, index)">{{ tab.name }}</button>
        </div>
        <div id="demo-panel" role="tabpanel" :aria-labelledby="`demo-tab-${selected}`" class="demo-panel" tabindex="0">
          <div class="demo-request"><span class="request-method">GET</span><code>api.example.test/profile</code><span aria-hidden="true">↗</span></div>
          <div class="demo-change"><div><small>输入</small><code>{{ active.before }}</code></div><span class="change-arrow" aria-hidden="true">↓</span><div class="demo-output"><small>结果</small><code>{{ active.after }}</code></div></div>
          <pre class="demo-code"><code>{{ active.code }}</code></pre>
          <div class="demo-caption"><p>{{ active.note }}</p><a :href="withBase(active.link)" :aria-label="`阅读${active.name}教程`">阅读教程 <span aria-hidden="true">→</span></a></div>
        </div>
      </div>
    </section>

    <section class="topic-section" aria-labelledby="topics-title">
      <div class="section-heading"><div><p class="eyebrow">THE FIELD GUIDE</p><h2 id="topics-title">围绕请求，掌握三个核心能力。</h2></div><a :href="withBase('/guide/introduction.html')">先认识 B-box <span aria-hidden="true">↗</span></a></div>
      <div class="topic-grid">
        <a v-for="topic in topics" :key="topic.number" class="topic-card" :href="withBase(topic.link)">
          <div class="topic-card-top"><span class="topic-number">{{ topic.number }}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><template v-if="topic.glyph === 'lock'"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></template><template v-else-if="topic.glyph === 'rewrite'"><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/></template><template v-else><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/></template></svg></div>
          <h3>{{ topic.title }}</h3><p>{{ topic.text }}</p><div class="topic-card-bottom"><span>{{ topic.tags }}</span><span aria-hidden="true">↗</span></div>
        </a>
      </div>
    </section>

    <section class="learning-path" aria-labelledby="path-title">
      <div class="path-intro"><p class="eyebrow">YOUR FIRST REQUEST</p><h2 id="path-title">先跑通，<br>再一点点加能力。</h2><p>从无需证书的 HTTP Mock 出发，<br>每一步都有可以检查的结果。</p></div>
      <ol class="path-steps">
        <li><span>01</span><div><a :href="withBase('/guide/quick-start.html')">返回第一条本地响应 <span aria-hidden="true">→</span></a><p>导入演示配置，得到一个来自 Map Local 的 JSON。</p></div></li>
        <li><span>02</span><div><a :href="withBase('/mitm/certificate.html')">为 HTTPS 准备证书 <span aria-hidden="true">→</span></a><p>生成 CA、安装信任，再精确选择需要解密的域名。</p></div></li>
        <li><span>03</span><div><a :href="withBase('/scripts/http.html')">用脚本处理真实逻辑 <span aria-hidden="true">→</span></a><p>修改 JSON、动态 Mock、主动联网与持久存储。</p></div></li>
      </ol>
    </section>

    <section class="home-reference" aria-label="更多帮助">
      <a :href="withBase('/reference/troubleshooting.html')"><span>遇到问题？</span><strong>按现象查找排错路径</strong><span aria-hidden="true">↗</span></a>
      <a :href="withBase('/reference/sources.html')"><span>文档依据</span><strong>源码、版本与官方参考</strong><span aria-hidden="true">↗</span></a>
    </section>
    <p class="home-version">功能说明依据 B-box 2026-11-11 源码整理。使用前请核对已安装版本。<a :href="withBase('/reference/sources.html')">查看版本说明 →</a></p>
  </div>
</template>
