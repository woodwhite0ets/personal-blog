<template>
  <figure class="case-fig" :class="`case-fig--${size}`" aria-hidden="true">
    <!-- 充电桩分布：乡镇网格 + 一个高亮区域 + 选中的点 -->
    <svg v-if="slug === 'charging-map'" viewBox="0 0 320 200" fill="none">
      <g stroke="currentColor" stroke-width="1" opacity=".22">
        <path d="M0 50h320M0 100h320M0 150h320M80 0v200M160 0v200M240 0v200" />
      </g>
      <rect x="86" y="54" width="146" height="92" rx="8" fill="var(--accent)" opacity=".08" stroke="var(--accent)" stroke-width="1" />
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
        <rect x="60" y="24" width="200" height="38" rx="8" />
        <rect x="60" y="82" width="200" height="38" rx="8" />
        <rect x="60" y="140" width="200" height="38" rx="8" />
        <path d="M160 62v20M160 120v20" stroke-dasharray="3 4" />
      </g>
      <circle cx="160" cy="72" r="3" fill="var(--accent)" />
      <circle cx="160" cy="130" r="3" fill="var(--accent)" />
      <g fill="currentColor" opacity=".28">
        <rect x="76" y="38" width="72" height="10" rx="5" />
        <rect x="76" y="96" width="96" height="10" rx="5" />
        <rect x="76" y="154" width="60" height="10" rx="5" />
      </g>
      <rect x="228" y="38" width="16" height="10" rx="5" fill="currentColor" opacity=".18" />
      <rect x="228" y="96" width="16" height="10" rx="5" fill="currentColor" opacity=".18" />
      <rect x="228" y="154" width="16" height="10" rx="5" fill="currentColor" opacity=".18" />
    </svg>

    <!-- 项目榜：排名条 -->
    <svg v-else-if="slug === 'ai-daily'" viewBox="0 0 320 200" fill="none">
      <g>
        <rect x="28" y="34" width="212" height="8" rx="4" fill="var(--accent)" opacity=".85" />
        <rect x="28" y="62" width="176" height="8" rx="4" fill="currentColor" opacity=".38" />
        <rect x="28" y="90" width="150" height="8" rx="4" fill="currentColor" opacity=".3" />
        <rect x="28" y="118" width="120" height="8" rx="4" fill="currentColor" opacity=".24" />
        <rect x="28" y="146" width="96" height="8" rx="4" fill="currentColor" opacity=".18" />
      </g>
      <g>
        <rect x="252" y="34" width="40" height="8" rx="4" fill="var(--accent)" opacity=".5" />
        <rect x="252" y="62" width="32" height="8" rx="4" fill="currentColor" opacity=".16" />
        <rect x="252" y="90" width="28" height="8" rx="4" fill="currentColor" opacity=".16" />
        <rect x="252" y="118" width="22" height="8" rx="4" fill="currentColor" opacity=".16" />
        <rect x="252" y="146" width="18" height="8" rx="4" fill="currentColor" opacity=".16" />
      </g>
    </svg>

    <!-- 笔记：文档行 + 检索框 -->
    <svg v-else-if="slug === 'notes'" viewBox="0 0 320 200" fill="none">
      <rect x="40" y="26" width="150" height="150" rx="8" stroke="currentColor" stroke-width="1" opacity=".45" />
      <g fill="currentColor" opacity=".22">
        <rect x="56" y="46" width="96" height="7" rx="3.5" />
        <rect x="56" y="66" width="118" height="7" rx="3.5" />
        <rect x="56" y="86" width="72" height="7" rx="3.5" />
      </g>
      <rect x="52" y="104" width="110" height="7" rx="3.5" fill="var(--accent)" opacity=".55" />
      <g fill="currentColor" opacity=".22">
        <rect x="56" y="124" width="104" height="7" rx="3.5" />
        <rect x="56" y="144" width="84" height="7" rx="3.5" />
      </g>
      <circle cx="232" cy="86" r="26" stroke="var(--accent)" stroke-width="1.5" fill="var(--accent)" fill-opacity=".07" />
      <path d="M251 105l18 18" stroke="var(--accent)" stroke-width="1.5" />
    </svg>

    <!-- 本站：浏览器框 + 两栏 -->
    <svg v-else viewBox="0 0 320 200" fill="none">
      <rect x="34" y="26" width="252" height="148" rx="10" stroke="currentColor" stroke-width="1" opacity=".45" />
      <path d="M34 52h252" stroke="currentColor" stroke-width="1" opacity=".35" />
      <g fill="currentColor" opacity=".28">
        <circle cx="48" cy="39" r="2.5" /><circle cx="58" cy="39" r="2.5" /><circle cx="68" cy="39" r="2.5" />
      </g>
      <rect x="88" y="34" width="120" height="10" rx="5" fill="currentColor" opacity=".14" />
      <g fill="currentColor" opacity=".2">
        <rect x="50" y="68" width="140" height="8" rx="4" />
        <rect x="50" y="88" width="112" height="8" rx="4" />
        <rect x="50" y="122" width="126" height="8" rx="4" />
        <rect x="50" y="142" width="96" height="8" rx="4" />
      </g>
      <rect x="50" y="104" width="80" height="8" rx="4" fill="var(--accent)" opacity=".55" />
      <rect x="206" y="68" width="60" height="82" rx="8" stroke="currentColor" stroke-width="1" opacity=".3" />
      <g fill="currentColor" opacity=".16">
        <rect x="216" y="80" width="40" height="6" rx="3" />
        <rect x="216" y="94" width="30" height="6" rx="3" />
        <rect x="216" y="108" width="36" height="6" rx="3" />
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
.case-fig {
  margin: 0;
  display: block;
  color: var(--text-faint);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.case-fig svg { display: block; width: 100%; height: 100%; }
.case-fig--md { width: 168px; aspect-ratio: 16 / 10; flex: none; }
.case-fig--sm { width: 76px; aspect-ratio: 16 / 10; flex: none; border-radius: 8px; }
</style>
