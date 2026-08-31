// Markdown 正文通用增强：代码块复制按钮 + 图片灯箱
let __lbEsc = null

export function closeLightbox() {
  const lb = document.getElementById('img-lightbox')
  if (lb) lb.classList.remove('open')
  if (__lbEsc) { document.removeEventListener('keydown', __lbEsc); __lbEsc = null }
}

export function openLightbox(src, alt) {
  let lb = document.getElementById('img-lightbox')
  if (!lb) {
    lb = document.createElement('div')
    lb.id = 'img-lightbox'
    lb.className = 'img-lightbox'
    lb.innerHTML = '<div class="img-lightbox-backdrop"></div><figure class="img-lightbox-figure"><button class="img-lightbox-close" aria-label="关闭">✕</button><img class="img-lightbox-img" alt="" /><figcaption class="img-lightbox-cap"></figcaption></figure>'
    document.body.appendChild(lb)
  }
  const imgEl = lb.querySelector('.img-lightbox-img')
  const cap = lb.querySelector('.img-lightbox-cap')
  imgEl.src = src
  cap.textContent = alt || ''
  lb.classList.add('open')
  lb.querySelector('.img-lightbox-backdrop').onclick = closeLightbox
  lb.querySelector('.img-lightbox-close').onclick = closeLightbox
  lb.querySelector('.img-lightbox-figure').onclick = (e) => e.stopPropagation()
  if (__lbEsc) document.removeEventListener('keydown', __lbEsc)
  __lbEsc = (e) => { if (e.key === 'Escape') closeLightbox() }
  document.addEventListener('keydown', __lbEsc)
}

function enhanceMarkdown() {
  document.querySelectorAll('.markdown-body pre').forEach((pre) => {
    if (pre.dataset.copyDone) return
    pre.dataset.copyDone = '1'
    const actions = document.createElement('div')
    actions.className = 'code-actions'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'code-copy-btn'
    btn.setAttribute('aria-label', '复制代码')
    btn.textContent = '复制'
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const code = pre.querySelector('code') || pre
      const text = code.innerText || code.textContent || ''
      try {
        await navigator.clipboard.writeText(text)
      } catch (_) {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.left = '-9999px'
        document.body.appendChild(ta); ta.select()
        try { document.execCommand('copy') } catch (_) {}
        ta.remove()
      }
      btn.textContent = '已复制 ✓'
      btn.classList.add('copied')
      setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied') }, 1500)
    })
    actions.appendChild(btn)
    pre.appendChild(actions)
  })
}

function enhanceImages() {
  document.querySelectorAll('.markdown-body img').forEach((img) => {
    if (img.dataset.lightbox) return
    img.dataset.lightbox = '1'
    img.classList.add('img-zoomable')
    const src = img.currentSrc || img.src
    if (src) img.addEventListener('click', () => openLightbox(src, img.alt || img.title || ''))
  })
}

function enhanceAll() { enhanceMarkdown(); enhanceImages() }

export function initEnhance() {
  enhanceAll()
  // 监听 MD 内容动态插入（路由切换、文档加载等）
  if (!document.body) return
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type !== 'childList') continue
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue
        if (node.matches && (node.matches('.markdown-body, .post-content, .kb-article') || node.querySelector('.markdown-body'))) {
          enhanceAll()
          return
        }
      }
    }
  })
  mo.observe(document.body, { childList: true, subtree: true })
}
