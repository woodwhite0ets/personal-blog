<template>
  <CompanyShell>
    <div class="co-main">
      <CompanyMasthead
        title="初创版官网"
        lead="公司注册好了，产品也有了，缺一个能发出去的地址。这一档把「你在做什么」写在一页上，五个工作日上线，域名和代码都登记在你公司名下。"
        :meta="[
          { k: '交付', v: '5–10 个工作日' },
          { k: '归属', v: '域名与代码归你' },
          { k: '范围', v: '按档固定' },
        ]"
      />

      <section class="co-sec">
        <CompanySecHead title="这一版解决什么" index="01" latin="WHAT IT SOLVES" />
        <div class="co-cards co-cards--3">
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>一句话就能看懂</h3>
            <p>做什么，给谁做，怎么联系。</p>
            <p class="co-svc-fit">别人第一次搜你公司名字，落在这页上。</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>产品有地方放</h3>
            <p>每个产品一张截图加一句话，能点进链接。</p>
            <p class="co-svc-fit">以后上新的产品也放得下。</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>地址是你自己的</h3>
            <p>域名和托管账户登记在你公司名下。</p>
            <p class="co-svc-fit">以后自己维护，或者换人接手，都不用经过我们。</p>
          </div></article>
        </div>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="一次交付包含什么" index="02" latin="DELIVERABLES" />
        <p class="co-sec-lead">写进服务确认单，按同一份清单验收。</p>
        <div class="co-standards">
          <div class="co-std">
            <span class="co-std-k">可用 · LIVE</span>
            <span class="co-std-v">一个地址</span>
            <p>站跑在你自己域名上，手机和电脑都过一遍。转发到微信有预览卡和图标。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">可改 · EDITABLE</span>
            <span class="co-std-v">内容与代码</span>
            <p>完整档连源码一起交。单页档只交站，改字换图找我们。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">有售后 · AFTERCARE</span>
            <span class="co-std-v">30 天</span>
            <p>30 天内站挂了或者要改字换图，免费修。之后按次，或者买一年八次。</p>
          </div>
        </div>
      </section>

      <section id="tiers" class="co-sec">
        <CompanySecHead title="三档" index="03" latin="TIERS" />
        <table class="mkt-table">
          <thead><tr><th>档</th><th>适合</th><th>包含</th><th>起步</th></tr></thead>
          <tbody>
            <tr>
              <td>单页</td>
              <td data-th="适合">产品不多，先要一个能发出去的地址</td>
              <td data-th="包含">一页搞定：定位、产品墙，加一个联系方式。配色三套挑一套，改一轮。</td>
              <td class="mkt-price" data-th="起步">699 起<span class="mkt-price-sub">5 个工作日</span></td>
            </tr>
            <tr>
              <td>完整</td>
              <td data-th="适合">有三四个产品，每个都要说清楚</td>
              <td data-th="包含">首页、每个产品一页，还有关于和联系页。可选中英双语，改两轮。</td>
              <td class="mkt-price" data-th="起步">1,299 起<span class="mkt-price-sub">10 个工作日</span></td>
            </tr>
            <tr>
              <td>加项</td>
              <td data-th="适合">赶时间，或者手里缺文案和图</td>
              <td data-th="包含">三天内交付 +50%；文案 200/页；图片精修 50/张；加页面 300/页</td>
              <td class="mkt-price" data-th="起步">按项<span class="mkt-price-sub">不打包</span></td>
            </tr>
          </tbody>
        </table>
        <p class="co-note">在校创办的公司另有价目，写信说一下。域名和服务器的钱你自己出，不在报价里。文案和拍图不含。</p>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="流程" index="04" latin="PROCESS" />
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>一封信</h3><p>公司叫什么，一句话介绍，三到六个产品。有域名就说，没有我给建议。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>确认与首付</h3><p>范围和改几轮写在确认单上，也写清什么时候算开工。付一半，素材齐了开始算工期。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>做与改</h3><p>先出一版预览。方向定下来之后再改，省时间的正是这一步。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>上线与交接</h3><p>挂到你的域名，交源码或者编辑说明。尾款结清，进入 30 天保修。</p></li>
        </ol>
      </section>

      <section class="co-sec">
        <CompanySecHead title="域名、托管、备案" index="05" latin="DOMAIN / HOST" />
        <table class="mkt-table">
          <thead><tr><th>事项</th><th>做法</th><th>谁持有</th></tr></thead>
          <tbody>
            <tr><td>域名</td><td data-th="做法">你自己注册，我们给配置方法</td><td data-th="谁持有">你</td></tr>
            <tr><td>托管</td><td data-th="做法">默认 Cloudflare Pages，免费，证书自动续。要国内服务器就换成你的主机</td><td data-th="谁持有">你</td></tr>
            <tr><td>备案</td><td data-th="做法">只有国内服务器要备案，主体是你，一到三周。我们给材料清单，不代办</td><td data-th="谁持有">你</td></tr>
          </tbody>
        </table>
        <p class="co-note">这几样都放在你名下。公司做大以后，它们才是你的资产。</p>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="什么不太适合" index="06" latin="NOT A FIT" />
        <div class="mkt-compare">
          <div class="paper-field">
            <h3>建议另找专业的人</h3>
            <ul>
              <li>品牌视觉重塑，或者整套 VI</li>
              <li>长期内容与投放代运营</li>
              <li>电商、支付、会员</li>
              <li>承诺排名和转化率的推广</li>
            </ul>
          </div>
          <div class="paper-field">
            <h3>这一档更合适的情况</h3>
            <ul>
              <li>公司已注册，产品做出来了，缺个门面</li>
              <li>要先有个能发出去的地址</li>
              <li>三个工作日内能定方向，改一轮收尾</li>
              <li>希望域名和代码在自己手上</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="co-sec">
        <CompanySecHead title="常见问题" index="07" latin="FAQ" />
        <div class="co-faq">
          <details class="co-faq-item" open>
            <summary>和首页那三档定制项目有什么区别？</summary>
            <p>定制项目按范围算，做长期跑的系统。这一档做门面，范围和交期固定，两边分开报价。</p>
          </details>
          <details class="co-faq-item">
            <summary>域名和代码归谁？</summary>
            <p>你。域名自己注册，托管账户在你名下，完整档连源码一起交。以后不合作，站也在你手上。</p>
          </details>
          <details class="co-faq-item">
            <summary>交付以后想改内容怎么办？</summary>
            <p>30 天内站挂了或者要改字换图，免费修。之后按次，或者一年八次。改版式和加页面另算。</p>
          </details>
          <details class="co-faq-item">
            <summary>公司还在注册中，能先做吗？</summary>
            <p>能先做。定稿前要拿到公司名和经营范围，页面上的名称和地址要跟执照一致，没取得的资质不要写。</p>
          </details>
        </div>
      </section>

      <section class="co-cta paper-field">
        <div class="co-cta-in">
          <div class="co-cta-copy">
            <h2 class="co-cta-title">要开始，一封信就够</h2>
            <p class="co-note">写清公司叫什么、一句话介绍、三到六个产品。有域名就说，没有我给建议。</p>
          </div>
          <div class="co-cta-contact">
            <p class="co-cta-k">写邮件</p>
            <p class="co-cta-mail"><a href="mailto:1903784785@qq.com?subject=%E5%88%9D%E5%88%9B%E7%89%88%E5%AE%98%E7%BD%91">1903784785@qq.com</a></p>
            <p class="co-cta-hint">一般一天内回信。</p>
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
