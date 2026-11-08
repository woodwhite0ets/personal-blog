/**
 * 公司页的「给爬虫看」版本
 *
 * 前端是 SPA，#app 默认为空：Google 能执行 JS，百度基本不能。公司站的案例页
 * 又恰好是最可能被搜到的内容（"乐清 充电桩 分布图"这类长尾），所以对爬虫
 * 直接把正文塞进 #app，人仍然拿到正常 SPA。
 *
 * 内容全部来自 Client/src/data/projects.js（与页面同一个真源），这里只做
 * 语义化拼装，不新增任何文案。
 */
const { loadProjects } = require('./injectSeo');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const CRAWLER_RE = /googlebot|bingbot|baiduspider|yandex|duckduckbot|sogou|360spider|bytespider|applebot|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|slackbot|discordbot|bot\b|spider|crawler/i;

function isCrawler(req) {
  return CRAWLER_RE.test(req.get('user-agent') || '');
}

const STYLE = `body{margin:0;font-family:-apple-system,"PingFang SC",system-ui,sans-serif;color:#16181c;background:#fff;line-height:1.7}
main{max-width:720px;margin:0 auto;padding:48px 20px}
h1{font-size:2rem;line-height:1.2;margin:0 0 12px}h2{font-size:1.15rem;margin:32px 0 8px}
p,li{color:#4c535b}a{color:#b8452f}dl{display:flex;gap:24px;flex-wrap:wrap;margin:20px 0}
dt{font-size:.75rem;color:#687078}dd{margin:0}ul{padding-left:1.2em}`;

function shell(inner) {
  return `<style>${STYLE}</style><main>${inner}</main>`;
}

function casePage(p) {
  const sections = (p.sections || []).map((s) => `<h2>${esc(s.title)}</h2><p>${esc(s.body)}</p>`).join('');
  const links = (p.links || []).length
    ? `<h2>原始记录</h2><ul>${p.links.map((l) => `<li>${esc(l.label)}</li>`).join('')}</ul>`
    : '';
  return shell(`
    <h1>${esc(p.name)}</h1>
    <p>${esc(p.subtitle)}</p>
    <dl>
      <div><dt>状态</dt><dd>${esc(p.status)}</dd></div>
      <div><dt>时间</dt><dd>${esc(p.period)}</dd></div>
      <div><dt>技术栈</dt><dd>${esc((p.stack || []).join(' · '))}</dd></div>
    </dl>
    <p>${esc(p.summary)}</p>
    <p><strong>结果：</strong>${esc(p.result)}</p>
    ${sections}
    ${links}
  `);
}

function workList(projects) {
  const items = projects.map((p) => `
    <li>
      <h2>${esc(p.name)}</h2>
      <p>${esc(p.subtitle)}</p>
      <p>结果：${esc(p.result)}｜${esc(p.status)}｜${esc(p.period)}</p>
    </li>`).join('');
  return shell(`
    <h1>案例</h1>
    <p>${projects.length} 个项目在生产环境运行，每条写清解决什么问题、怎么做的、结果是什么。</p>
    <ul>${items}</ul>
  `);
}

/**
 * 返回 { html } 或 null（非公司页、或数据缺失）
 */
async function companyBodyHtml(pathname) {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';

  if (path === '/work') {
    const projects = await loadProjects();
    return projects.length ? workList(projects) : null;
  }

  const m = path.match(/^\/work\/([^/]+)$/);
  if (!m) return null;
  const projects = await loadProjects();
  let slug = m[1];
  try { slug = decodeURIComponent(slug); } catch (e) { /* 保留原样 */ }
  const project = projects.find((p) => p.slug === slug);
  return project ? casePage(project) : null;
}

module.exports = { companyBodyHtml, isCrawler };
