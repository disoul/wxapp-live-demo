/*
 * wechat.js
 * Copyright (C) 2018 disoul <disoul@DiSouldeMacBook-Pro.local>
 *
 * Distributed under terms of the MIT license.
 */
const express = require('express');
const tfa = require('2fa');
const router = express.Router();

const auth = require('../auth');
const PILI = require('../pili.js');
const { getStreamKey } = require('../utils/pili');

const TFA_KEY = 'roadyn0oho6swuxf5gspvo21oyg1fqzp';

router.use('/api', auth);
/**
 * 获取rtmp的推流或播放地址
 */
router.get('/api/rtmp/:type', (req, res) => {
  const type = req.params.type;
  const userId = req.user.userId;
  const streamKey = getStreamKey(userId);
  let rtmpURL;

  switch (type) {
    case 'play':
      rtmpURL = PILI.getRTMPPlayURL(streamKey);
      break;
    case 'publish':
      rtmpURL = PILI.getRTMPPublishURL(streamKey);
      break;
    default:
      res.status(403).json({ error: 'unsupport type' });
      return;
  }

  res.json({url: rtmpURL});
});

router.get('/api/auth/:code', async (req, res) => {
  const opt = {
    drift: 20,
    step: 30,
  };
  const passcode = req.params.code;
  const counter = Math.floor(Date.now() / 1000 / opt.step);
  const validHOTP = tfa.verifyHOTP(TFA_KEY, passcode, counter, opt);
  if (validHOTP) {
    res.json({ status: 'ok' });
  } else {
    res.json({ status: 'error', msg: '密码不正确，请确认是否过期' });
  }
})

/**
 * 直播鉴黄的回调请求
 * TODO: 应该有token检查
 */
router.post('/r18', async (req, res) => {
  const body = req.body;
  console.log('R18警告', body);

  // 永久禁播R18主播
  await PILI.disableStream(body.stream, -1);

  res.status(204).send();
});

module.exports = router;
