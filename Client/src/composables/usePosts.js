// ====== 文章列表数据层 composable ======
// 从 Homepage 抽取：取数 / 分页 / 筛选 / 搜索 / 标签 / 作者统计
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function usePosts() {
  const route = useRoute()
  const router = useRouter()

  const posts = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')
  const currentPage = ref(1)
  const totalPages = ref(1)
  const tags = ref([])
  const contributors = ref([])
  const totalPublished = ref(0)
  const sortMode = ref('latest')

  const pinnedPost = computed(() => posts.value.find(p => p.is_pinned) || null)
  const hasMore = computed(() => currentPage.value < totalPages.value)
  const activeTag = computed(() => route.query.tag || '')
  const activeSearch = computed(() => route.query.search || '')

  const clearTagLink = computed(() => {
    const query = { ...route.query }
    delete query.tag
    return { path: '/HomePage', query }
  })
  const clearSearchLink = computed(() => {
    const query = { ...route.query }
    delete query.search
    return { path: '/HomePage', query }
  })

  let fetchSeq = 0

  async function fetchPosts(page = 1) {
    const mySeq = ++fetchSeq
    if (page === 1) loading.value = true
    error.value = ''
    try {
      const tagFilter = route.query.tag || ''
      const searchFilter = route.query.search || ''
      let url = `/api/posts?page=${page}&status=published&sort=${sortMode.value}&type=owner`
      if (tagFilter) url += `&tag=${encodeURIComponent(tagFilter)}`
      if (searchFilter) url += `&search=${encodeURIComponent(searchFilter)}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '请求失败')
      if (mySeq !== fetchSeq) return
      if (page === 1) {
        posts.value = data.posts
      } else {
        if (mySeq !== fetchSeq) return
        posts.value.push(...data.posts)
      }
      currentPage.value = data.page
      totalPages.value = data.totalPages
    } catch (e) {
      if (mySeq !== fetchSeq) return
      error.value = e.message || '获取文章失败'
    } finally {
      if (mySeq === fetchSeq) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        const data = await res.json()
        tags.value = (data.tags || []).map(t => ({
          name: t.name,
          size: t.post_count >= 5 ? 'lg' : t.post_count >= 3 ? 'md' : t.post_count >= 2 ? 'sm' : 'xs',
        }))
      }
    } catch { /* ignore */ }
  }

  async function fetchContributors() {
    try {
      const res = await fetch('/api/authors')
      if (res.ok) {
        const data = await res.json()
        contributors.value = (data.authors || []).map(a => ({
          username: a.username,
          avatar: a.avatar || '',
          count: a.post_count,
        }))
        totalPublished.value = data.total_published || 0
      }
    } catch { /* ignore */ }
  }

  function switchSort(mode) {
    if (sortMode.value === mode) return
    sortMode.value = mode
    fetchPosts(1)
  }

  async function loadMore() {
    loadingMore.value = true
    await fetchPosts(currentPage.value + 1)
  }

  function refresh() {
    fetchPosts(1)
  }

  watch(() => route.query.tag, () => fetchPosts(1))
  watch(() => route.query.search, () => fetchPosts(1))

  onMounted(() => {
    fetchPosts()
    fetchTags()
    fetchContributors()
  })

  return {
    posts, loading, loadingMore, error, currentPage, totalPages,
    tags, contributors, totalPublished, sortMode,
    pinnedPost, hasMore, activeTag, activeSearch,
    clearTagLink, clearSearchLink,
    switchSort, fetchPosts, loadMore, refresh,
    fetchTags, fetchContributors,
  }
}
