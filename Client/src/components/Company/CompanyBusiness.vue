<template>
  <CompanyShell>
    <div class="co-edit">
      <!-- 报头：标题先出现，无缝隙色块拼版跟在下面通铺（42% 竖轴在下面的长页里起作用） -->
      <header class="e-mast">
        <h1 class="e-title">两条业务线</h1>
        <p class="e-stand">定制交付按范围算，做完能长期跑。初创版官网按档定价，五到十个工作日上线，两边分开报价。</p>
        <div class="e-mosaic">
          <div class="e-tile e-tile--ink">
            <span class="e-fig">5</span>
            <span class="e-cap">个项目在生产环境跑</span>
          </div>
          <div class="e-tile e-tile--field">
            <span class="e-fig">95</span>
            <span class="e-cap">天没有重启过的机器</span>
          </div>
          <div class="e-tile e-tile--ink">
            <span class="e-fig">24/62</span>
            <span class="e-cap">核与 G 内存，自建推理</span>
          </div>
          <div class="e-tile e-tile--accent">
            <span class="e-fig">1</span>
            <span class="e-cap">个人，从需求做到上线后</span>
          </div>
        </div>
      </header>

      <!-- 对比：一张读得清的报表 -->
      <section class="e-sec" aria-labelledby="e-compare">
        <h2 id="e-compare" class="e-sec-h">区别在哪</h2>
        <div class="e-sec-body">
          <table class="e-table">
            <thead>
              <tr>
                <th scope="col"><span class="e-sr">对比项</span></th>
                <th scope="col" class="is-primary">定制交付<span class="e-price">3 万元起</span></th>
                <th scope="col">初创版官网<span class="e-price">699 元起</span></th>
              </tr>
            </thead>
            <tbody>
              <tr><td>适合</td><td>已有系统，或需求清楚的业务问题</td><td>刚注册的公司，缺一个能发出去的地址</td></tr>
              <tr><td>报价</td><td>按范围拆阶段，聊完给具体数字</td><td>按档固定价</td></tr>
              <tr><td>周期</td><td>按阶段推进，每段可验收</td><td>5–10 个工作日</td></tr>
              <tr><td>交付</td><td>代码、部署脚本、运行手册</td><td>站点本身，完整档含源码</td></tr>
              <tr><td>售后</td><td>两周内答疑，之后按次或按月</td><td>30 天保修，之后按次或按年</td></tr>
            </tbody>
          </table>
          <p class="e-linkline">
            <router-link class="e-link" to="/business/startup">看初创版的档位与流程</router-link>
          </p>
          <div class="e-ui e-ui--light" data-ui>
            <p class="e-ui-head">服务确认单上写的四件事</p>
            <dl>
              <div><dt>范围</dt><dd>做什么、做几页，逐条列</dd></div>
              <div><dt>修改</dt><dd>改几轮写死，超出按轮计价</dd></div>
              <div><dt>工期</dt><dd>定金到账且素材齐的那天开始算</dd></div>
              <div><dt>尾款</dt><dd>上线前结清，验收标准同页</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <!-- 整幅色块页：一句判断 + 一块真实的系统近况 -->
      <section class="e-band" aria-labelledby="e-who">
        <div class="e-band-in">
          <h2 id="e-who" class="e-band-h">谁在做</h2>
          <div class="e-band-body">
            <p class="e-band-q">需求、实现、部署和上线后的巡检，由同一个人走完。中间不经手第二个人，改一个地方不用同步三方。</p>
            <div class="e-ui" data-ui>
              <p class="e-ui-head">这台机器的近况</p>
              <dl>
                <div><dt>连续运行</dt><dd>95 天未重启</dd></div>
                <div><dt>推理实例</dt><dd>3 个，对话、嵌入、重排各一</dd></div>
                <div><dt>定时任务</dt><dd>6 个，含巡检与索引重建</dd></div>
                <div><dt>入站端口</dt><dd>0 个</dd></div>
              </dl>
            </div>
            <div class="e-ui" data-ui>
              <p class="e-ui-head">报价怎么拆</p>
              <dl>
                <div><dt>第一阶段</dt><dd>跑通最短那条链路，先能用</dd></div>
                <div><dt>第二阶段</dt><dd>接进现有系统，加权限与日志</dd></div>
                <div><dt>第三阶段</dt><dd>上线、交接、给运行手册</dd></div>
              </dl>
            </div>
            <div class="e-ui" data-ui>
              <p class="e-ui-head">今天的巡检</p>
              <dl>
                <div><dt>服务</dt><dd>14 个单元，全部 active</dd></div>
                <div><dt>证书</dt><dd>两张，剩余 71 天以上</dd></div>
                <div><dt>备份</dt><dd>本地做完，离机副本待跑</dd></div>
              </dl>
            </div>
            <p class="e-note">上面的数字来自这台机器自己的巡检记录，和 <router-link class="e-note-link" to="/stack">能力与基础设施</router-link> 一页同一份。</p>
          </div>
        </div>
      </section>

      <!-- 流程：位置和字号表示顺序，不编号 -->
      <section class="e-sec" aria-labelledby="e-flow">
        <h2 id="e-flow" class="e-sec-h">怎么开始</h2>
        <ol class="e-steps">
          <li class="e-step"><h3>写一封</h3><p>说说背景和想解决的事。不收费，想不清楚也可以先聊。</p></li>
          <li class="e-step"><h3>选线</h3><p>要长期跑的系统，还是先要一个地址。选哪条我会直说。</p></li>
          <li class="e-step"><h3>确认单</h3><p>范围和交期写在同一页，定金到账就排期。</p></li>
          <li class="e-step"><h3>交付与接手</h3><p>交能跑的站或者代码，部署和说明一起给。</p></li>
        </ol>
        <div class="e-ui e-ui--light" data-ui>
          <p class="e-ui-head">一次部署的记录</p>
          <dl>
            <div><dt>构建</dt><dd>1.1 秒，产物 228 KB，gzip 后 79 KB</dd></div>
            <div><dt>上传</dt><dd>rsync 覆盖，保留上一版</dd></div>
            <div><dt>切换</dt><dd>pm2 restart，健康检查通过</dd></div>
            <div><dt>回滚</dt><dd>上一版产物还在，一条命令回退</dd></div>
          </dl>
        </div>
      </section>

      <!-- 收尾：一整幅强调色，动作是被划线的那个短语 -->
      <section class="e-cta" aria-labelledby="e-cta">
        <div class="e-cta-in">
          <h2 id="e-cta" class="e-cta-h">说说你在做什么</h2>
          <p class="e-cta-p">哪条线合适由我判断。写清背景和想解决的事就够，一天内回信。</p>
          <p class="e-cta-p"><a class="e-cta-go" href="mailto:1903784785@qq.com">写信到 1903784785@qq.com</a>，也可以加微信 18157706302。</p>
        </div>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
// /business 试点：按 design-taste-frontend 的 editorial-report 方向排
// （42% 竖轴 + 无缝隙色块拼版 + 整幅色块页 + 报表式对比）。
// 与方向的偏离都写在 company.css 的 .co-edit 段里：标题中文回落系统衬线、
// 底色用中性灰白、拼版里放真实数字而不画假仪表盘。
import CompanyShell from './CompanyShell.vue'
import '@fontsource-variable/literata'
</script>
