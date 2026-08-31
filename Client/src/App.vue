<script setup>
import { onMounted } from 'vue'
import { useAuth } from './stores/auth.js'

const { fetchMe } = useAuth()

onMounted(() => fetchMe())
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="router-fade" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </transition>
    </router-view>
  </div>
</template>
