<template>
  <figure class="case-fig" :class="`case-fig--${size}`" aria-hidden="true">
    <!-- 充电桩分布：乡镇网格 + 一个高亮区域 + 选中的点 -->
    <svg v-if="slug === 'charging-map'" viewBox="0 0 320 200" fill="none">
      <g stroke="currentColor" stroke-width="1" opacity=".22">
        <path d="M0 50h320M0 100h320M0 150h320M80 0v200M160 0v200M240 0v200" />
      </g>
      <rect x="86" y="54" width="146" height="92" fill="var(--accent)" opacity=".08" stroke="var(--accent)" stroke-width="1" />
      <g fill="currentColor" opacity=".5">
        <circle cx="40" cy="40" r="2.5" /><circle cx="120" cy="26" r="2.5" /><circle cx="210" cy="38" r="2.5" />
        <circle cx="284" cy="60" r="2.5" /><circle cx="52" cy="118" r="2.5" /><circle cx="268" cy="132" r="2.5" />
        <circle cx="60" cy="176" r="2.5" /><circle cx="146" cy="168" r="2.5" /><circle cx="236" cy="172" r="2.5" />
      </g>
      <g fill="var(--accent)">
        <circle cx="112" cy="82" r="3.5" /><circle cx="168" cy="102" r="3.5" /><circle cx="204" cy="126" r="3.5" />
      </g>
    </svg>

    <!-- 工作站：三层服务 + 连接线 -->
    <svg v-else-if="slug === 'workstation'" viewBox="0 0 320 200" fill="none">
      <g stroke="currentColor" stroke-width="1" opacity=".5">
        <rect x="60" y="24" width="200" height="38" />
        <rect x="60" y="82" width="200" height="38" />
        <rect x="60" y="140" width="200" height="38" />
        <path d="M160 62v20M160 120v20" stroke-dasharray="3 4" />
      </g>
      <circle cx="160" cy="72" r="3" fill="var(--accent)" />
      <circle cx="160" cy="130" r="3" fill="var(--accent)" />
      <g fill="currentColor" opacity=".28">
        <rect x="76" y="38" width="72" height="10" />
        <rect x="76" y="96" width="96" height="10" />
        <rect x="76" y="154" width="60" height="10" />
      </g>
      <rect x="228" y="38" width="16" height="10" fill="currentColor" opacity=".18" />
      <rect x="228" y="96" width="16" height="10" fill="currentColor" opacity=".18" />
      <rect x="228" y="154" width="16" height="10" fill="currentColor" opacity=".18" />
    </svg>

    <!-- 项目榜：排名条 -->
    <svg v-else-if="slug === 'ai-daily'" viewBox="0 0 320 200" fill="none">
      <g>
        <rect x="28" y="34" width="212" height="8" fill="var(--accent)" opacity=".85" />
        <rect x="28" y="62" width="176" height="8" fill="currentColor" opacity=".38" />
        <rect x="28" y="90" width="150" height="8" fill="currentColor" opacity=".3" />
        <rect x="28" y="118" width="120" height="8" fill="currentColor" opacity=".24" />
        <rect x="28" y="146" width="96" height="8" fill="currentColor" opacity=".18" />
      </g>
      <g>
        <rect x="252" y="34" width="40" height="8" fill="var(--accent)" opacity=".5" />
        <rect x="252" y="62" width="32" height="8" fill="currentColor" opacity=".16" />
        <rect x="252" y="90" width="28" height="8" fill="currentColor" opacity=".16" />
        <rect x="252" y="118" width="22" height="8" fill="currentColor" opacity=".16" />
        <rect x="252" y="146" width="18" height="8" fill="currentColor" opacity=".16" />
      </g>
    </svg>

    <!-- 笔记：文档行 + 检索框 -->
    <svg v-else-if="slug === 'notes'" viewBox="0 0 320 200" fill="none">
      <rect x="40" y="26" width="150" height="150" stroke="currentColor" stroke-width="1" opacity=".45" />
      <g fill="currentColor" opacity=".22">
        <rect x="56" y="46" width="96" height="7" />
        <rect x="56" y="66" width="118" height="7" />
        <rect x="56" y="86" width="72" height="7" />
      </g>
      <rect x="52" y="104" width="110" height="7" fill="var(--accent)" opacity=".55" />
      <g fill="currentColor" opacity=".22">
        <rect x="56" y="124" width="104" height="7" />
        <rect x="56" y="144" width="84" height="7" />
      </g>
      <circle cx="232" cy="86" r="26" stroke="var(--accent)" stroke-width="1.5" fill="var(--accent)" fill-opacity=".07" />
      <path d="M251 105l18 18" stroke="var(--accent)" stroke-width="1.5" />
    </svg>

    <!-- 本站：浏览器框 + 两栏 -->
    <svg v-else viewBox="0 0 320 200" fill="none">
      <rect x="34" y="26" width="252" height="148" stroke="currentColor" stroke-width="1" opacity=".45" />
      <path d="M34 52h252" stroke="currentColor" stroke-width="1" opacity=".35" />
      <g fill="currentColor" opacity=".28">
        <circle cx="48" cy="39" r="2.5" /><circle cx="58" cy="39" r="2.5" /><circle cx="68" cy="39" r="2.5" />
      </g>
      <rect x="88" y="34" width="120" height="10" fill="currentColor" opacity=".14" />
      <g fill="currentColor" opacity=".2">
        <rect x="50" y="68" width="140" height="8" />
        <rect x="50" y="88" width="112" height="8" />
        <rect x="50" y="122" width="126" height="8" />
        <rect x="50" y="142" width="96" height="8" />
      </g>
      <rect x="50" y="104" width="80" height="8" fill="var(--accent)" opacity=".55" />
      <rect x="206" y="68" width="60" height="82" stroke="currentColor" stroke-width="1" opacity=".3" />
      <g fill="currentColor" opacity=".16">
        <rect x="216" y="80" width="40" height="6" />
        <rect x="216" y="94" width="30" height="6" />
        <rect x="216" y="108" width="36" height="6" />
      </g>
    </svg>
  </figure>
</template>

<script setup>
defineProps({
  slug: { type: String, required: true },
  size: { type: String, default: 'md' },
})
</script>

<style scoped>
/* 缩略图当「屏幕」用：直角 + 发丝线 + 半透明网格底，跟页面的图纸语言同一套 */
.case-fig {
  margin: 0;
  display: block;
  color: var(--t-ink-2, var(--text-secondary));
  background-color: var(--t-panel-2, var(--bg-elevated));
  background-image:
    linear-gradient(to right, rgba(12, 14, 16, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(12, 14, 16, 0.045) 1px, transparent 1px);
  background-size: 16px 16px;
  border: 1px solid var(--t-line-2, var(--border));
  transition: border-color var(--dur-hover, 160ms) ease;
}
.case-fig svg { display: block; width: 100%; height: 100%; }
.case-fig--md { width: 168px; aspect-ratio: 16 / 10; flex: none; }
.case-fig--lg { width: 100%; max-width: 520px; aspect-ratio: 16 / 10; margin: 32px 0 0; }

/* 案例详情页的大图：像图纸被扫进来，图元再逐个就位。
   只在 lg（详情页）上做，列表缩略图保持静止，避免一屏几十个动效。
   由 CompanyShell 的出场观察器驱动（.co-reveal → .is-in），
   所以图在首屏之下时会等滚到才装配，不会提前演完。 */
.co-page.co-anim .case-fig--lg.co-reveal {
  clip-path: inset(0 0 100% 0);
}
.co-page.co-anim .case-fig--lg.co-reveal svg > * {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
.co-page.co-anim .case-fig--lg.co-reveal.is-in {
  clip-path: inset(0 0 0 0);
  transition: clip-path 620ms var(--ease-out);
}
.co-page.co-anim .case-fig--lg.co-reveal.is-in svg > * {
  opacity: 1;
  transform: none;
  transition: opacity 380ms var(--ease-out), transform 460ms var(--ease-out);
}
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(1) { transition-delay: 160ms; }
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(2) { transition-delay: 230ms; }
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(3) { transition-delay: 300ms; }
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(4) { transition-delay: 370ms; }
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(5) { transition-delay: 430ms; }
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(6) { transition-delay: 490ms; }
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(7) { transition-delay: 550ms; }
.co-page.co-anim .case-fig--lg.is-in svg > *:nth-child(8) { transition-delay: 610ms; }

@media (prefers-reduced-motion: reduce) {
  .co-page.co-anim .case-fig--lg.co-reveal,
  .co-page.co-anim .case-fig--lg.co-reveal svg > * {
    clip-path: none;
    opacity: 1;
    transform: none;
    transition: none;
  }
}
.case-fig--sm { width: 76px; aspect-ratio: 16 / 10; flex: none; }
</style>
