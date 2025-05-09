const express = require('express');
const router = express.Router();
const {User} = require('../../models');
const {Op} = require("sequelize");
const { NotFound } = require('http-errors');
const { success, failure } = require('../../utils/responses');


/* 查询用户 */
router.get('/', async function (req, res, next) {

    try {
        const query = req.query;

        //当前第几页，不传默认第一页
        const currentPage = Math.abs(Number(query.currentPage)) || 1;

        //每页显示几条，不传默认10
        const pageSize = Math.abs(Number(query.pageSize)) || 10;

        //计算offset 起始页
        const offset = (currentPage - 1) * pageSize;

        const condition = {
            where: {},
            order: [['id', 'DESC']],
            limit: pageSize,
            offset: offset
        };

        if (query.email) {
            condition.where.email = query.email;
        }

        if (query.username) {
            condition.where.username = query.username;
        }

        if (query.nickname) {
            condition.where.nickname = {
                [Op.like]: `%${ query.nickname }%`
            };
        }

        if (query.role) {
            condition.where.role = query.role;
        }



        const {count, rows} = await User.findAndCountAll(condition);

        success(res, '查询用户列表成功', {
            users: rows,
            pagination: {
                total: count,
                currentPage,
                pageSize
            }
        });
    } catch (error) {
        failure(res, error)
    }
});

/**
 * 查询当前登录的用户详情
 * GET /admin/users/me
 */
router.get('/me', async function (req, res) {
    try {
        const user = req.user;
        success(res, '查询当前用户信息成功。', { user });
    } catch (error) {
        failure(res, error);
    }
});


/**
 * 通过 id 查询用户详情
 * GET /admin/users/:id
 */
router.get('/:id', async function (req, res) {
    // ...
});




/**
 * 查询用户详细
 * GET/admin/users/:id
 */
router.get('/:id', async function (req, res, next) {
    try {
        const user = await getUser(req);


        success(res, '查询用户成功', {user});

    } catch (error) {
        failure(res, error)
    }

});
/**
 * 创建用户
 * POST / admin/users
 */
router.post('/', async function (req, res, next) {
    try {
        // 白名单过滤 用户提交的其他东西不管
        const body = filterBody(req)


        const user = await User.create(body);
        success(res, '创建用户成功', {user}, 201);
    } catch (error) {
        failure(res, error)
    }
});

/**
 * 删除用户
 * DELETE / admin/users/:id
 */
router.delete('/:id', async function (req, res, next) {
    try {
        const user = await getUser(req);


        await user.destroy();
        success(res, '删除用户成功')

    } catch (error) {
        failure(res, error)
    }
});

/**更新用户
 * PUT / admin/users/:id
 */
router.put('/:id', async function (req, res, next) {
    try {
        const user = await getUser(req);

        // 白名单过滤 用户提交的其他东西不管
        const body = filterBody(req)


        await user.update(body);
        success(res, '更新用户成功', {user})

    } catch (error) {
        failure(res, error)
    }
})


/**
 * 公共方法：查询当前用户
 */
async function getUser(req) {
    //获取用户id
    const {id} = req.params;

    //查询用户
    const user = await User.findByPk(id);

    //没有找到的话 抛出异常
    if (!user) {
        throw new NotFound(`id:${id}的用户未找到`);
    } else {
        return user;
    }
}

/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{password, role: (number|string|*), introduce: ({type: *}|*), sex: ({allowNull: boolean, type: *, validate: {notNull: {msg: string}, notEmpty: {msg: string}, isIn: {args: [number[]], msg: string}}}|{defaultValue: number, allowNull: boolean, type: *}|*), nickname: (string|*), company: ({type: *}|*), avatar: ({type: *, validate: {isUrl: {msg: string}}}|*), email: (string|*), username}}
 */
function filterBody(req) {
    return {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname,
        sex: req.body.sex,
        company: req.body.company,
        introduce: req.body.introduce,
        role: req.body.role,
        avatar: req.body.avatar
    };
}


module.exports = router;
