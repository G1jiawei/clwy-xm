const express = require('express');
const router = express.Router();
const axios = require('axios');
const { sequelize, User, Order } = require('../models');
const { success, failure } = require('../utils/responses');
const { BadRequest, NotFound } = require('http-errors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userAuth = require('../middlewares/user-auth');
const logger = require("../utils/logger");
const moment = require('moment');

/**
 * 微信小程序登录
 * POST /wechat/sign_in
 */
router.post('/sign_in', async (req, res) => {
    try {

        const { code } = req.body;

        if (!code) {
            throw new BadRequest('请提供微信登录 code');
        }


        // 通过 code 获取微信用户 openid
        const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
            params: {
                appid: process.env.WECHAT_APPID,
                secret: process.env.WECHAT_SECRET,
                js_code: code,
                grant_type: 'authorization_code'
            }
        });

        const { errcode, errmsg, openid } = response.data;

        if (errcode) {
            throw new BadRequest('微信登录失败：' + errmsg);
        }

        // success(res, '登录成功。', { openid });

        // 查找或创建用户
        let user = await User.findOne({
            where: { openid: openid }
        });

        if (!user) {
            // 首次登录，创建新用户
            const key = uuidv4();

            // 微信用户无邮箱、无用户名、无密码信息，随机生成
            user = await User.create({
                openid: openid,
                nickname: '微信用户',
                email: `wx-${key}@clwy.cn`,
                username: `wx-${key}`,
                password: Math.random().toString(36).slice(-8),
                sex: 2,
                role: 0,
            });
        }


        // 生成 JWT token
        const token = jwt.sign(
            {
                userId: user.id,
            },
            process.env.SECRET,
            { expiresIn: '30d' }
        );

        success(res, '登录成功。', { token });


    } catch (error) {
        failure(res, error);
    }
});

/**
 * 获取用户信息
 * GET /wechat/me
 */

router.get('/me', userAuth, async (req, res) => {
    try {
        const user = await getUser(req);
        success(res, '查询用户成功。', { user });
    } catch (error) {
        failure(res, error);
    }
})

/**
 * 更新用户信息
 * put /wechat/update_info
 */
router.put('/update_info', userAuth, async (req, res) => {
    try {
        const body = filterBody(req);
        const user = await getUser(req);
        await user.update(body);

        success(res, '更新用户信息成功。', { user });
    } catch (error) {
        failure(res, error);
    }
});

/**
 * 公共方法：查询当前用户
 * @param req
 * @returns {Promise<Model<any, TModelAttributes>>}
 */
async function getUser(req) {
    const id = req.userId;

    const user = await User.findByPk(id, {
        attributes: ['id', 'nickname', 'avatar', 'sex', 'role', 'company', 'introduce']
    });

    if (!user) {
        throw new NotFound(`ID: ${id}的用户未找到。`);
    }

    return user;
}

/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{nickname: (string|*), sex: (number|*), company: *, introduce: *, avatar: *}}
 */
function filterBody(req) {
    return {
        nickname: req.body.nickname,
        sex: req.body.sex,
        company: req.body.company,
        introduce: req.body.introduce,
        avatar: req.body.avatar,
    };
}


module.exports = router;
