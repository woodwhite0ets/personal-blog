// ====== 文章评论数据层 composable ======
// 从 PostDetail 抽取：加载/发表/回复/删除评论、权限与时间格式化
import { ref } from 'vue'
import { useAuth, getToken } from '../stores/auth.js'

export function useComments({ post, slug }) {
  const { currentUser, isLoggedIn, isAdmin } = useAuth()
  const API_BASE = '/api'

  const commentList = ref([])
  const commentLoading = ref(false)
  const commentText = ref('')
  const commentError = ref('')
  const commenting = ref(false)
  const replyingTo = ref(null)
  const replyText = ref('')
  const deletingComment = ref(null)

  async function fetchComments() {
    commentLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/posts/${slug.value}/comments`)
      if (res.ok) {
        const data = await res.json()
        commentList.value = data.comments || []
      }
    } catch { /* ignore */ }
    finally { commentLoading.value = false }
  }

  async function submitComment(parentId = null) {
    const text = parentId ? replyText.value : commentText.value
    if (!text.trim()) return

    commenting.value = true
    commentError.value = ''
    try {
      const body = { content: text.trim() }
      if (parentId) body.parent_id = parentId

      const res = await fetch(`${API_BASE}/posts/${slug.value}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '评论失败')
      }
      const data = await res.json()

      if (parentId) {
        const parent = commentList.value.find(c => c.id === parentId)
        if (parent) {
          if (!parent.replies) parent.replies = []
          parent.replies.push(data.comment)
        }
        replyText.value = ''
        replyingTo.value = null
      } else {
        commentList.value.push(data.comment)
        commentText.value = ''
      }
      if (post.value) post.value.comment_count = (post.value.comment_count || 0) + 1
    } catch (e) {
      commentError.value = e.message
    } finally {
      commenting.value = false
    }
  }

  function startReply(id) {
    replyingTo.value = replyingTo.value === id ? null : id
    replyText.value = ''
  }

  async function deleteComment(id) {
    deletingComment.value = id
    try {
      const res = await fetch(`${API_BASE}/posts/${slug.value}/comments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        commentList.value = commentList.value.filter(c => c.id !== id)
        commentList.value.forEach(c => {
          if (c.replies) c.replies = c.replies.filter(r => r.id !== id)
        })
        if (post.value) post.value.comment_count = Math.max(0, (post.value.comment_count || 1) - 1)
      }
    } catch { /* ignore */ }
    finally { deletingComment.value = null }
  }

  function canDeleteComment(comment) {
    if (!currentUser.value) return false
    return isAdmin.value || (comment.author && comment.author.username === currentUser.value.username)
  }

  function formatDate(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return {
    commentList, commentLoading, commentText, commentError, commenting,
    replyingTo, replyText, deletingComment,
    fetchComments, submitComment, startReply, deleteComment, canDeleteComment, formatDate,
  }
}
