const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const svgCaptcha = require('svg-captcha');
const { setKey } = require('../utils/redis');
const { v4: uuidv4 } = require('uuid');

/**
 * 获取验证码
 * GET /captcha
 */
router.get('/', async (req, res) => {
    try {
        const captcha = svgCaptcha.create({
            size: 4,                    // 验证码长度
            ignoreChars: '0O1Il9quv',   // 验证码字符中排除 0O1Il9quv
            noise: 3,                   // 干扰线条数量
            color: true,                // 是否有颜色，
            width: 100,                 // 宽
            height: 50                  // 高
        });

        console.log(captcha.text);

        res.type('svg');
        res.status(200).send(captcha.data);
    } catch (error) {
        failure(res, error);
    }

});

module.exports = router;
