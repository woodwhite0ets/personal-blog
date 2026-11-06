<template>
  <div class="co-page">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav variant="company" />
    <slot />
    <CompanyFooter />
  </div>
</template>

<script setup>
// 公司站外壳：纸底色 + 气团 + 顶栏 + 页脚，四个公司页共用。
// 样式从 company.css 引入 → 只随公司路由加载，博客页面不再携带这一层。
import './company.css'
import SiteNav from '../common/SiteNav.vue'
import CompanyFooter from './CompanyFooter.vue'
</script>
