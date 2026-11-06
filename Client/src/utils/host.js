// 两个域名的判定集中在这里：路由守卫、404 页、任何需要区分「公司站 / 博客」的地方都从这取。
// 公司域只承载 / /work /stack /contact；博客域承载其余所有页面。
const COMPANY_HOSTS = ['woodwhite.top', 'www.woodwhite.top']

export function isCompanyHost(host = window.location.hostname) {
  return COMPANY_HOSTS.includes(host)
}

export function isBlogHost(host = window.location.hostname) {
  return host === 'blog.woodwhite.top' || host.startsWith('blog.')
}
