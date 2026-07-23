<script setup>
import { onMounted } from 'vue'
import { useAuth } from './stores/auth.js'

const { fetchMe } = useAuth()

onMounted(() => fetchMe())
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>
