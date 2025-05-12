const express = require('express');
const router = express.Router();
const { Article } = require('../../models');
const { Op } = require('sequelize');
const { NotFound } = require('http-errors');
const { getKeysByPattern, delKey } = require('../../utils/redis');
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
      offset: offset,
    };

    // 查询被软删除的数据
    if (query.deleted === 'true') {
      condition.paranoid = false;
      condition.where.deletedAt = {
        [Op.not]: null,
      };
    }

    if (query.title) {
      condition.where.title = {
        [Op.like]: `%${query.title}%`,
      };
    }

    const { count, rows } = await Article.findAndCountAll(condition);

    success(res, '查询文章列表成功', {
      articles: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询文章详情
 * GET /articles/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const { id } = req.params;

    let article = await getKey(`article:${id}`);
    if (!article) {
      article = await Article.findByPk(id);
      if (!article) {
        throw new NotFound(`ID: ${id}的文章未找到。`);
      }
      await setKey(`article:${id}`, article);
    }

    success(res, '查询文章成功。', { article });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建文章
 * POST / admin/articles
 */
router.post('/', async function (req, res, next) {
  try {
    // 白名单过滤 用户提交的其他东西不管
    const body = filterBody(req);

    const article = await Article.create(body);
    await clearCache();

    success(res, '创建文章成功', { article }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除到回收站
 * POST /admin/articles/delete
 */
router.post('/delete', async function (req, res) {
  try {
    const { id } = req.body;

    await Article.destroy({ where: { id: id } });
    await clearCache(id);

    success(res, '已删除到回收站。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 从回收站恢复
 * POST /admin/articles/restore
 */
router.post('/restore', async function (req, res) {
  try {
    const { id } = req.body;

    await Article.restore({ where: { id: id } });
    await clearCache(id);

    success(res, '已恢复成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 彻底删除
 * POST /admin/articles/force_delete
 */
router.post('/force_delete', async function (req, res) {
  try {
    const { id } = req.body;

    await Article.destroy({
      where: { id: id },
      force: true,
    });
    success(res, '已彻底删除。');
  } catch (error) {
    failure(res, error);
  }
});

/**更新文章
 * PUT / admin/articles/:id
 */
router.put('/:id', async function (req, res, next) {
  try {
    const article = await getArticle(req);

    // 白名单过滤 用户提交的其他东西不管
    const body = filterBody(req);

    await article.update(body);
    await clearCache(article.id);

    success(res, '更新文章成功', { article });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：查询当前文章
 */
async function getArticle(req) {
  //获取文章id
  const { id } = req.params;

  //查询文章
  const article = await Article.findByPk(id);

  //没有找到的话 抛出异常
  if (!article) {
    throw new NotFound(`id:${id}的文章未找到`);
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

/**
 * 清除缓存
 * @param id
 * @returns {Promise<void>}
 */
async function clearCache(id = null) {
  // 清除所有文章列表缓存
  let keys = await getKeysByPattern('articles:*');
  if (keys.length !== 0) {
    await delKey(keys);
  }

  // 如果传递了id，则通过id清除文章详情缓存
  if (id) {
    // 如果是数组，则遍历
    const keys = Array.isArray(id) ? id.map((item) => `article:${item}`) : `article:${id}`;
    await delKey(keys);
  }
}

module.exports = router;
