/**
 * 首屏仪表盘的真实读数（构建时快照）。
 * 每个数字都能在外面核到：文章数来自 /api/posts 的 total，
 * 运行天数与巡检项来自工作站自己的巡检记录，项目数来自 projects.js。
 * 改了数据就更新 measuredAt，别让它变成装饰。
 */
export const systemStatus = {
  measuredAt: '2026-11-12',
  metrics: [
    { key: '连续运行', value: 95, unit: '天', note: '未重启', bar: 0.82 },
    { key: '定时巡检', value: 6, unit: '项', note: '每天执行' },
    { key: '入站端口', value: 0, unit: '个', note: '只走出站隧道' },
    { key: '本批可接', value: 2, unit: '个', note: '排满即停' },
  ],
  lights: [
    { label: '接单中', state: 'on' },
    { label: '可开票', state: 'on' },
    { label: '数据不出内网', state: 'on' },
  ],
}
