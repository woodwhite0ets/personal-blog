<template>
  <CompanyShell>
    <div class="co-main co-page--privacy">
      <CompanyMasthead
        title="隐私政策"
        lead="本页说明这个站点会收集什么、存在哪、用多久，以及你能怎么要求删除。"
      />

      <section class="co-sec">
        <CompanySecHead title="收集什么" index="01" latin="WHAT WE COLLECT" />
        <ul class="co-proof">
          <li>
            <span class="co-proof-k">你填的内容</span>
            <span class="co-proof-v">联系页表单里的称呼、联系方式、需求描述。只有你主动提交时才会收到。</span>
          </li>
          <li>
            <span class="co-proof-k">访问日志</span>
            <span class="co-proof-v">服务器记录的 IP、浏览器标识、请求时间与路径，用于排障与安全防护。</span>
          </li>
          <li>
            <span class="co-proof-k">不收集的</span>
            <span class="co-proof-v">没有广告或统计类追踪脚本，不做用户画像，不读取你设备上的其他信息。</span>
          </li>
        </ul>
      </section>

      <section class="co-sec">
        <CompanySecHead title="怎么用、存在哪" index="02" latin="HOW IT IS USED" />
        <ul class="co-proof">
          <li>
            <span class="co-proof-k">用途</span>
            <span class="co-proof-v">只用于回复你的咨询、评估需求与履行合同。不做营销群发，不向第三方出售或出租。</span>
          </li>
          <li>
            <span class="co-proof-k">存储</span>
            <span class="co-proof-v">表单内容经邮件系统转达，不在站点数据库留存；访问日志保存在境内服务器上。</span>
          </li>
          <li>
            <span class="co-proof-k">期限</span>
            <span class="co-proof-v">咨询往来按邮件常规期限保留；日志按月轮转清理。合同相关记录按法律要求的年限保存。</span>
          </li>
          <li>
            <span class="co-proof-k">本站本地存储</span>
            <span class="co-proof-v">浏览器里只保存显示偏好（动效开关、正文字号），不含身份信息，可随时清理。</span>
          </li>
        </ul>
      </section>

      <section class="co-sec">
        <CompanySecHead title="会交给别人吗" index="03" latin="THIRD PARTIES" />
        <p class="co-note">
          为完成你委托的功能，可能用到模型服务或其他云服务。涉及你的数据离开你指定的机器时，
          会事先书面写清哪一段数据出网、出到哪家、用途是什么，由你确认后才执行。
        </p>
      </section>

      <section class="co-sec">
        <CompanySecHead title="你的权利" index="04" latin="YOUR RIGHTS" />
        <p class="co-note">
          你可以要求查询、更正或删除我们保存的与你有关的信息，也可以撤回此前的同意。
          发邮件到 <a href="mailto:1903784785@qq.com">1903784785@qq.com</a> 说明即可，一般一天内回复。
        </p>
        <p class="co-note">本政策如修改，会更新本页日期；涉及收集范围的实质变化会在此处说明。</p>
        <p class="co-note">最后更新：2026-11-14</p>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'
</script>
