const express = require('express');
const router = express.Router();
const {Article} = require('../../models');
const {Op} = require("sequelize");
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');


/* 查询文章 */
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

        if (query.title) {
            condition.where.title = {
                [Op.like]: `%${ query.title }%`
            };
        }


        const {count, rows} = await Article.findAndCountAll(condition);

        success(res, '查询文章列表成功', {
            articles: rows,
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
 * 查询文章详细
 * GET/admin/articles/:id
 */
router.get('/:id', async function (req, res, next) {
    try {
        const article = await getArticle(req);


        success(res, '查询文章成功', {article});

    } catch (error) {
        failure(res, error)
    }

});
/**
 * 创建文章
 * POST / admin/articles
 */
router.post('/', async function (req, res, next) {
    try {
        // 白名单过滤 用户提交的其他东西不管
        const body = filterBody(req)


        const article = await Article.create(body);
        success(res, '创建文章成功', {article}, 201);
    } catch (error) {
        failure(res, error)
    }
});

/**
 * 删除文章
 * DELETE / admin/articles/:id
 */
router.delete('/:id', async function (req, res, next) {
    try {
        const article = await getArticle(req);


        await article.destroy();
        success(res, '删除文章成功')

    } catch (error) {
        failure(res, error)
    }
});

/**更新文章
 * PUT / admin/articles/:id
 */
router.put('/:id', async function (req, res, next) {
    try {
        const article = await getArticle(req);

        // 白名单过滤 用户提交的其他东西不管
        const body = filterBody(req)


        await article.update(body);
        success(res, '更新文章成功', {article})

    } catch (error) {
        failure(res, error)
    }
})


/**
 * 公共方法：查询当前文章
 */
async function getArticle(req) {
    //获取文章id
    const {id} = req.params;

    //查询文章
    const article = await Article.findByPk(id);

    //没有找到的话 抛出异常
    if (!article) {
        throw new NotFoundError(`id:${id}的文章未找到`);
    } else {
        return article;
    }
}

/**
 * 公共方法 ：白名单过滤
 * @param req
 */
function filterBody(req) {
    return {
        title: req.body.title,
        content: req.body.content,
    };
}

module.exports = router;
