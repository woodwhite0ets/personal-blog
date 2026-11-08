<template>
  <CompanyShell>
    <div class="co-main">
      <CompanyMasthead
        title="能力与基础设施"
        lead="不外包算力，也不把数据交出去：所有东西跑在自己的一台机器上。"
      />
      <section class="co-sec">
        <div class="co-infra">
          <p class="co-infra-lead">自己的机器，自己的链路：一台旧服务器上自托管模型、检索、CI 与知识库，7×24 在跑。不需要向第三方买算力，也不把数据交出去。</p>
          <dl class="co-infra-facts">
            <div><dt>算力</dt><dd>24 核 / 62G / NVMe+1.8T，本地推理三实例</dd></div>
            <div><dt>检索</dt><dd>pgvector + 重排，知识库按项目分目录</dd></div>
            <div><dt>交付链</dt><dd>自建 Git 与 CI，systemd 定时巡检与同步</dd></div>
            <div><dt>暴露面</dt><dd>零入站端口，对外只走出站隧道</dd></div>
          </dl>
        </div>
      </section>

      <section class="co-sec">
        <CompanySecHead title="在跑的东西" />
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
        <CompanySecHead title="这套东西能带来什么" />
        <ul class="co-proof">
          <li><span class="co-proof-k">交付速度</span><span class="co-proof-v">依赖本地模型与自建 CI，不用等第三方额度，改动当天能上线。</span></li>
          <li><span class="co-proof-k">数据边界</span><span class="co-proof-v">模型与检索都在自己机器上，敏感数据不出内网。</span></li>
          <li><span class="co-proof-k">成本</span><span class="co-proof-v">固定硬件成本，没有按次计费的推理账单。</span></li>
        </ul>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'
</script>
