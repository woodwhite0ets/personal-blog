<template>
  <CompanyShell>
    <div class="co-main co-page--stack">
      <CompanyMasthead
        title="能力与基础设施"
        lead="不外包算力，也不把数据交出去：所有东西跑在自己的一台机器上。"
      />
      <section class="co-sec">
        <CompanySecHead title="自己的机器" index="01" latin="SELF HOSTED" />
        <div class="co-infra">
          <p class="co-infra-lead">自己的机器，自己的链路：一台旧服务器上自托管模型、检索、CI 与知识库，7×24 在跑。不需要向第三方买算力，也不把数据交出去。</p>
          <dl class="co-gauge">
            <div class="co-gauge-cell"><dt>核</dt><dd><span class="co-gauge-v">{{ gauges[0] }}</span><span class="co-gauge-u">Xeon</span></dd><p>本地推理三实例</p></div>
            <div class="co-gauge-cell"><dt>内存</dt><dd><span class="co-gauge-v">{{ gauges[1] }}</span><span class="co-gauge-u">G</span></dd><p>三实例并发不换页</p></div>
            <div class="co-gauge-cell"><dt>存储</dt><dd><span class="co-gauge-v">{{ gauges[2] }}</span><span class="co-gauge-u">T</span></dd><p>NVMe 系统盘 + 数据盘</p></div>
            <div class="co-gauge-cell"><dt>入站端口</dt><dd><span class="co-gauge-v">{{ gauges[3] }}</span><span class="co-gauge-u">—</span></dd><p>对外只走出站隧道</p></div>
          </dl>
          <ul class="co-meter" aria-label="运行中的负载">
            <li>
              <span class="co-meter-k">systemd 定时任务</span>
              <span class="co-meter-bar" style="--v: 100%"><i></i></span>
              <span class="co-meter-v">6 / 6 在跑</span>
            </li>
            <li>
              <span class="co-meter-k">对外服务单元</span>
              <span class="co-meter-bar" style="--v: 100%"><i></i></span>
              <span class="co-meter-v">14 / 14 active</span>
            </li>
            <li>
              <span class="co-meter-k">入站端口开放</span>
              <span class="co-meter-bar" style="--v: 4%"><i></i></span>
              <span class="co-meter-v">0 个</span>
            </li>
            <li>
              <span class="co-meter-k">连续运行</span>
              <span class="co-meter-bar" style="--v: 96%"><i></i></span>
              <span class="co-meter-v">95 天</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="在跑的东西" index="02" latin="WHAT RUNS" />
        <table class="co-spec">
          <tbody>
            <tr><th>算力</th><td>24 核 Xeon · 62G 内存 · NVMe + 1.8T，旧服务器，7×24 连续运行 95 天未重启</td></tr>
            <tr><th>推理</th><td>llama.cpp 三个实例：对话、嵌入、重排。没有按次计费的推理账单</td></tr>
            <tr><th>检索</th><td>bge-m3 向量 + bge-reranker 重排，pgvector 存索引；知识库按项目分目录，52 条手写结论</td></tr>
            <tr><th>自动化</th><td>六个 systemd timer：巡检、索引重建、跨端同步、会话清理、日报；GitHub 项目榜每天 08:00 自动出榜</td></tr>
            <tr><th>安全</th><td>SSH 仅密钥、ufw 默认拒绝入站、零入站端口，对外服务只走出站隧道</td></tr>
            <tr><th>交付链</th><td>自建 Git（Forgejo）+ CI，改动当天可上线；部署脚本带健康检查与回滚步骤</td></tr>
          </tbody>
        </table>
      </section>

      <section class="co-sec">
        <CompanySecHead title="这套东西能带来什么" index="03" latin="WHAT IT BUYS" />
        <ul class="co-proof">
          <li><span class="co-proof-k">交付速度</span><span class="co-proof-v">依赖本地模型与自建 CI，不用等第三方额度，改动当天能上线。</span></li>
          <li><span class="co-proof-k">数据边界</span><span class="co-proof-v">检索与本地推理跑在自己机器上。需要接外部模型时，哪一段数据出网、出到哪家，会提前写清。</span></li>
          <li><span class="co-proof-k">成本</span><span class="co-proof-v">固定硬件成本，没有按次计费的推理账单。</span></li>
        </ul>
      </section>
      <CompanyCta
        title="数据要留在自己机器上的，可以聊"
        note="这套基础设施是自建的，能按你的合规要求把数据放在你指定的机器上。"
        hint="说清数据规模和使用场景，我给方案。"
      />
    </div>
  </CompanyShell>
</template>

<script setup>
import { useCountUp } from '../../composables/useCountUp.js'
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'
import CompanyCta from './CompanyCta.vue'

// 四格读数和首屏状态面板同一套自检（24 核 / 62G / 1.8T / 0 个入站端口）
const gauges = useCountUp([24, 62, '1.8', 0], { duration: 700, delay: 120 })
</script>
