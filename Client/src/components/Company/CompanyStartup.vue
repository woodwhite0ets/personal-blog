<template>
  <CompanyShell>
    <div class="co-main co-page--startup">
      <CompanyMasthead
        title="初创版官网"
        lead="公司注册好了，产品也有了，缺一个能发出去的地址。按档定价、按档交期，五到十个工作日上线；域名、托管账户、源码都登记在你公司名下。"
        :meta="[
          { k: '交付', v: '5–10 个工作日' },
          { k: '归属', v: '域名与代码归你' },
          { k: '起步', v: '599 元' },
        ]"
      />

      <!-- 01 档位 -->
      <section id="tiers" class="co-sec">
        <CompanySecHead title="档位" index="01" latin="TIERS" />
        <table class="mkt-table">
          <thead><tr><th>档</th><th>适合</th><th>包含</th><th>改动</th><th>起步</th></tr></thead>
          <tbody>
            <tr v-for="t in startupTiers" :key="t.name">
              <td>{{ t.name }}</td>
              <td data-th="适合">{{ t.fit }}</td>
              <td data-th="包含">{{ t.includes }}<span class="mkt-price-sub">{{ t.source }}</span></td>
              <td data-th="改动">{{ t.revisions }}</td>
              <td class="mkt-price" data-th="起步">{{ t.from }}<span class="mkt-price-sub">{{ t.lead }}</span></td>
            </tr>
            <tr>
              <td>加项</td>
              <td data-th="适合">赶时间，或者手里缺文案和图</td>
              <td data-th="包含">
                <span v-for="a in startupAddons" :key="a.name" class="co-addon">
                  <b>{{ a.name }}</b>{{ a.price }}<i>{{ a.note }}</i>
                </span>
              </td>
              <td data-th="改动">—</td>
              <td class="mkt-price" data-th="起步">按项<span class="mkt-price-sub">不打包</span></td>
            </tr>
            <tr>
              <td>{{ carePlan.name }}</td>
              <td data-th="适合">交付满 30 天后，不想自己折腾托管和改字</td>
              <td data-th="包含">{{ carePlan.includes }}<span class="mkt-price-sub">不含：{{ carePlan.excludes }}</span></td>
              <td data-th="改动">8 次/年</td>
              <td class="mkt-price" data-th="起步">{{ carePlan.price }} / 年<span class="mkt-price-sub">在校 {{ carePlan.studentPrice }} · {{ carePlan.renew }}</span></td>
            </tr>
          </tbody>
        </table>
        <p class="co-note">{{ startupNotes.notIncluded }}</p>
        <p class="co-note">{{ startupNotes.hiddenStudent }}</p>

        <!-- 代金券：只在这一档业务里送 -->
        <aside class="co-perk" aria-labelledby="perk-t">
          <p class="co-perk-k">{{ tokenVoucher.label }}</p>
          <h3 id="perk-t" class="co-perk-t">下单就送 AI token 代金券</h3>
          <p class="co-perk-p">{{ tokenVoucher.why }}</p>
          <ul v-if="tokenVoucher.amounts.length" class="co-perk-amounts">
            <li v-for="a in tokenVoucher.amounts" :key="a.tier">
              <span>{{ a.tier }}</span><b>{{ a.value }}</b>
            </li>
          </ul>
          <p v-else class="co-perk-amounts-note">{{ tokenVoucher.amountsNote }}</p>
          <p class="co-perk-fine">{{ tokenVoucher.usable }}。{{ tokenVoucher.terms }}。</p>
        </aside>
      </section>

      <!-- 02 这一版解决什么 -->
      <section class="co-sec co-sec--band">
        <CompanySecHead title="这一版解决什么" index="02" latin="WHAT IT SOLVES" />
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

      <!-- 03 一次交付包含什么 -->
      <section class="co-sec">
        <CompanySecHead title="一次交付包含什么" index="03" latin="DELIVERABLES" />
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

        <div class="co-terms">
          <div class="co-terms-col">
            <h3>让利与抵扣</h3>
            <ul>
              <li v-for="d in startupDiscounts" :key="d.name">
                <span>{{ d.name }}</span><b>{{ d.value }}</b><i>{{ d.note }}</i>
              </li>
            </ul>
          </div>
          <div class="co-terms-col">
            <h3>验收与节奏</h3>
            <ul class="co-terms-plain">
              <li>{{ startupNotes.acceptance }}</li>
              <li>{{ startupNotes.beat }}</li>
              <li>{{ carePlan.note }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 04 流程 -->
      <section class="co-sec co-sec--band">
        <CompanySecHead title="流程" index="04" latin="PROCESS" />
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>一封信</h3><p>公司叫什么，一句话介绍，三到六个产品。有域名就说，没有我给建议。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>确认与首付</h3><p>范围、改几轮、什么时候算开工，写在确认单上。付一半，素材齐了开始算工期。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>做与改</h3><p>先出一版预览。方向定下来之后再改，省时间的正是这一步。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>上线与交接</h3><p>挂到你的域名，交源码或者编辑说明。尾款结清，进入 30 天保修。</p></li>
        </ol>
      </section>

      <!-- 05 域名、托管、备案 -->
      <section class="co-sec">
        <CompanySecHead title="域名、托管、备案" index="05" latin="DOMAIN / HOST" />
        <table class="mkt-table">
          <thead><tr><th></th><th>境外轨（默认）</th><th>境内轨</th></tr></thead>
          <tbody>
            <tr><td>托管</td><td data-th="境外轨">Cloudflare Pages，免费，证书自动续</td><td data-th="境内轨">你自己的境内轻量服务器或对象存储</td></tr>
            <tr><td>域名</td><td data-th="境外轨">你自购，DNS 指过去</td><td data-th="境内轨">你自购，还要实名</td></tr>
            <tr><td>备案</td><td data-th="境外轨">不需要</td><td data-th="境内轨">需要，主体是你，1–3 周（含法人核验）</td></tr>
            <tr><td>上线</td><td data-th="境外轨">配好就上，几分钟</td><td data-th="境内轨">备案通过后 10 分钟</td></tr>
            <tr><td>什么时候走这条</td><td data-th="境外轨">默认就是这条</td><td data-th="境内轨">银行、孵化器、招投标要备案号时才走；工期不含备案等待</td></tr>
          </tbody>
        </table>
        <p class="co-note">域名、托管账户、备案主体都放在你名下。我们给材料清单和配置方法，不代办、不代持。公司做大以后，它们才是你的资产。</p>
      </section>

      <!-- 06 什么不太适合 -->
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

      <!-- 07 常见问题 -->
      <section class="co-sec">
        <CompanySecHead title="常见问题" index="07" latin="FAQ" />
        <div class="co-faq">
          <details class="co-faq-item" open>
            <summary>和首页那几档定制项目有什么区别？</summary>
            <p>定制项目按范围算，做长期跑的系统，起步 3 万。这一档做门面，范围和交期固定，两边分开报价。以后转定制，建站费可以全额抵扣。</p>
          </details>
          <details class="co-faq-item">
            <summary>token 代金券怎么用？</summary>
            <p>随单发给你，用于木白提供的模型接口与本地推理，按实际调用的单价扣减。面额按档位定，下单时确认；有效期与使用规则以券面为准。不兑现、不找零、不转让。</p>
          </details>
          <details class="co-faq-item">
            <summary>域名和代码归谁？</summary>
            <p>你。域名自己注册，托管账户在你名下，完整档连源码一起交。以后不合作，站也在你手上。</p>
          </details>
          <details class="co-faq-item">
            <summary>交付以后想改内容怎么办？</summary>
            <p>30 天内站挂了或者要改字换图，免费修。之后按次（50 元起），或者买一年八次。改版式和加页面另算。</p>
          </details>
          <details class="co-faq-item">
            <summary>什么时候算做完？</summary>
            <p>{{ startupNotes.acceptance }}改稿轮次写在档位里：单页一轮，完整两轮，超出按 200 元一轮。</p>
          </details>
          <details class="co-faq-item">
            <summary>公司还在注册中，能先做吗？</summary>
            <p>能先做。定稿前要拿到公司名和经营范围，页面上的名称和地址要跟执照一致，没取得的资质不要写。</p>
          </details>
          <details class="co-faq-item">
            <summary>要不要备案？</summary>
            <p>默认走境外轨（Cloudflare Pages），不需要备案。只有银行、孵化器、招投标明确要备案号时，才走境内轨：主体是你自己，一到三周。我们不代办、不承诺过审。</p>
          </details>
        </div>
      </section>

      <CompanyCta
        title="要开始，一封信就够"
        note="写清公司叫什么、一句话介绍、三到六个产品。有域名就说，没有我给建议。在校创办的公司另有价目，信里说明一下。"
        hint="一般一天内回信。"
      />
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'
import CompanyCta from './CompanyCta.vue'
import {
  startupTiers,
  startupAddons,
  carePlan,
  tokenVoucher,
  startupDiscounts,
  startupNotes,
} from '../../data/startup.js'
</script>
