/**
 * 公司站联系表单
 *
 * POST /api/contact  { name, contact, message, website }
 *   website 是蜜罐字段：正常浏览器里它被 CSS 藏起来，填了就是机器人。
 *
 * 只发信、不落库：不保存访客留言，邮箱里就是唯一副本。
 * 限流在 index.js 挂（contactLimiter，每 IP 十分钟 3 条），这里只做字段校验。
 */
const express = require('express');
const { sendContactEmail } = require('../config/mail');

const router = express.Router();

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

router.post('/', async (req, res) => {
  const body = req.body || {};

  // 蜜罐：填了直接当成功返回，不给机器人试探的反馈
  if (clean(body.website, 80)) {
    return res.json({ ok: true });
  }

  const name = clean(body.name, 40);
  const contact = clean(body.contact, 80);
  const message = String(body.message == null ? '' : body.message).trim().slice(0, 2000);

  if (!name || !contact || message.length < 5) {
    return res.status(400).json({ message: '请把称呼、联系方式和需求都写一下' });
  }
  // 联系方式允许邮箱、微信、手机号；统一挡掉明显的垃圾串
  if (!/^[\w@.\-+一-龥]{3,80}$/.test(contact)) {
    return res.status(400).json({ message: '联系方式看起来不太对，换个写法试试' });
  }

  const meta = [req.get('referer') ? 'woodwhite.top' : '直接提交', req.ip].filter(Boolean).join(' · ');

  try {
    await sendContactEmail({ name, contact, message, meta });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[contact] 发送失败:', err.message);
    // 邮件没发出去要如实说，别让访客以为已送达
    return res.status(503).json({ message: '邮件暂时发不出去，可以直接发邮件或加微信' });
  }
});

module.exports = router;
