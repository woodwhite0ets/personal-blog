<template>
  <CompanyShell>
    <div class="co-main">
      <CompanyMasthead
        title="初创版官网"
        lead="公司注册下来了，产品也做出来了，还差一个能发出去的地址。这一版做的就是这件事：把「你在做什么」讲清楚，范围固定、交期固定，域名、托管和代码都在你名下。"
        :meta="[
          { k: '交付', v: '5–10 个工作日' },
          { k: '归属', v: '域名与代码归你' },
          { k: '范围', v: '按档固定' },
        ]"
      />

      <section class="co-sec">
        <CompanySecHead title="这一版解决什么" />
        <div class="co-cards co-cards--3">
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>一句话就能看懂</h3>
            <p>做什么、给谁做、怎么联系。</p>
            <p class="co-svc-fit">对方第一次搜你公司名字时，看到的是这一页，不是一个空白。</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>产品有地方放</h3>
            <p>截图、一句话说明、可以点的链接。</p>
            <p class="co-svc-fit">以后上新的产品也放得下，不必每次重做一遍。</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>地址是你自己的</h3>
            <p>域名、托管账户、代码都在你名下。</p>
            <p class="co-svc-fit">以后自己维护、或换人接手，都不必先问过我们。</p>
          </div></article>
        </div>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="一次交付包含什么" />
        <p class="co-sec-lead">写进服务确认单，按同一份清单验收。</p>
        <div class="co-standards">
          <div class="co-std">
            <span class="co-std-k">可用 · LIVE</span>
            <span class="co-std-v">一个地址</span>
            <p>站在你自己的域名上跑，手机与桌面都过一遍；分享到微信时有一张像样的预览卡。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">可改 · EDITABLE</span>
            <span class="co-std-v">内容与代码</span>
            <p>完整档连源码一起交，谁都能接手；单页档只交站点，内容改动由我们处理，不用你自己碰代码。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">有售后 · AFTERCARE</span>
            <span class="co-std-v">30 天</span>
            <p>挂机、错字、换图免费处理；之后按次，或一年八次内容修改的年费，随时能改字换图。</p>
          </div>
        </div>
      </section>

      <section id="tiers" class="co-sec">
        <CompanySecHead title="三档" />
        <table class="mkt-table">
          <thead><tr><th>档</th><th>适合</th><th>包含</th><th>起步</th></tr></thead>
          <tbody>
            <tr>
              <td>单页</td>
              <td data-th="适合">产品不多，先要一个能发出去的地址</td>
              <td data-th="包含">一页：定位、产品墙、联系方式；三套配色挑一套；一轮集中修改</td>
              <td class="mkt-price" data-th="起步">699 起<span class="mkt-price-sub">5 个工作日</span></td>
            </tr>
            <tr>
              <td>完整</td>
              <td data-th="适合">有三四个产品，想每个都说清楚</td>
              <td data-th="包含">首页 + 每个产品一页 + 关于 + 联系；中英双语可选；两轮修改</td>
              <td class="mkt-price" data-th="起步">1,299 起<span class="mkt-price-sub">10 个工作日</span></td>
            </tr>
            <tr>
              <td>加项</td>
              <td data-th="适合">赶时间，或手里缺文案与图</td>
              <td data-th="包含">三天内交付 +50%；文案 200/页；图片精修 50/张；加页面 300/页</td>
              <td class="mkt-price" data-th="起步">按项<span class="mkt-price-sub">不打包</span></td>
            </tr>
          </tbody>
        </table>
        <p class="co-note">在校创办的公司另有价目，信里说明即可。域名与服务器成本由你自己持有，不在此价内；内容代写与拍摄不打包。</p>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="流程" />
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>一封信</h3><p>公司名、一句话介绍、三到六个产品，有没有域名。我们回一份确认单和日期。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>确认与首付</h3><p>范围、修改轮次、验收方式写在同一页上；付一半开工，工期从素材齐那天算。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>做与改</h3><p>先出一版预览，你在规定轮次内提修改；方向定了之后的调整最省时间。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>上线与交接</h3><p>挂到你的域名，交源码或编辑说明；尾款结清后进入 30 天保修。</p></li>
        </ol>
      </section>

      <section class="co-sec">
        <CompanySecHead title="域名、托管、备案" />
        <table class="mkt-table">
          <thead><tr><th>事项</th><th>做法</th><th>谁持有</th></tr></thead>
          <tbody>
            <tr><td>域名</td><td data-th="做法">你自己注册，我们只给建议与配置方法</td><td data-th="谁持有">你</td></tr>
            <tr><td>托管</td><td data-th="做法">默认 Cloudflare Pages，免费且证书自动续；需要国内服务器就换成你的主机</td><td data-th="谁持有">你</td></tr>
            <tr><td>备案</td><td data-th="做法">只有国内服务器需要，主体是你，一到三周；我们给材料清单，不代办也不代持</td><td data-th="谁持有">你</td></tr>
          </tbody>
        </table>
        <p class="co-note">这几样刻意都放在你名下：公司做大以后，它们才是你的资产。</p>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="什么不太适合" />
        <div class="mkt-compare">
          <div class="paper-field">
            <h3>建议另找专业的人</h3>
            <ul>
              <li>品牌视觉重塑、整套 VI 与主视觉</li>
              <li>长期内容与投放代运营</li>
              <li>电商、支付、会员积分</li>
              <li>需要承诺搜索排名或转化率的推广</li>
            </ul>
          </div>
          <div class="paper-field">
            <h3>这一档更合适的情况</h3>
            <ul>
              <li>公司已经注册，产品做出来了，缺一个门面</li>
              <li>要的是「先有个能发出去的地址」，不是品牌重塑</li>
              <li>三个工作日内能定下方向，改一轮就收尾</li>
              <li>希望域名与代码在自己手上</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="co-sec">
        <CompanySecHead title="常见问题" />
        <div class="co-faq">
          <details class="co-faq-item" open>
            <summary>和首页那三档定制项目有什么区别？</summary>
            <p>定制项目按范围算，做的是能长期运行的系统；这一版做的是门面，范围和交期都固定。两边计价分开，不会混着报。</p>
          </details>
          <details class="co-faq-item">
            <summary>域名和代码归谁？</summary>
            <p>你。域名自己注册，托管账户在你名下；完整档连源码一起交。以后不跟我们合作，站也还在你手上。</p>
          </details>
          <details class="co-faq-item">
            <summary>交付以后想改内容怎么办？</summary>
            <p>30 天内挂机、错字、换图免费处理；之后按次，或一年八次内容修改的年费。改版式与加页面另算。</p>
          </details>
          <details class="co-faq-item">
            <summary>公司还在注册中，能先做吗？</summary>
            <p>可以先做，但定稿前要拿到公司名与经营范围：页面上的名称、地址、联系方式必须与执照一致，没取得的资质不要写上去。</p>
          </details>
        </div>
      </section>

      <section class="co-cta paper-field">
        <div class="co-cta-in">
          <div class="co-cta-copy">
            <h2 class="co-cta-title">要开始，一封信就够</h2>
            <p class="co-note">写清公司名、一句话介绍、三到六个产品；有域名就说域名，没有也给建议。</p>
          </div>
          <div class="co-cta-contact">
            <p class="co-cta-k">写邮件</p>
            <p class="co-cta-mail"><a href="mailto:1903784785@qq.com?subject=%E5%88%9D%E5%88%9B%E7%89%88%E5%AE%98%E7%BD%91">1903784785@qq.com</a></p>
            <p class="co-cta-hint">一般一天内回信；不着急也可以先收藏这一页。</p>
          </div>
        </div>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'
</script>
