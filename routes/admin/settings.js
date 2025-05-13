const express = require('express');
const router = express.Router();
const { NotFound } = require('http-errors');
const { delKey, flushAll } = require('../../utils/redis');
const { Setting, Course, Chapter } = require('../../models');
const { coursesIndex, chaptersIndex } = require('../../utils/meilisearch');

const { success, failure } = require('../../utils/responses');

/**
 * 查询系统设置详情
 * GET /admin/settings
 */
router.get('/', async function (req, res) {
  try {
    const setting = await getSetting();
    success(res, '查询系统设置成功。', { setting });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新系统设置
 * PUT /admin/settings
 */
router.put('/', async function (req, res) {
  try {
    const setting = await getSetting();
    const body = filterBody(req);

    await setting.update(body);

    // 删除缓存
    await delKey('setting');

    success(res, '更新系统设置成功。', { setting });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 清除所有缓存
 */
router.get('/flush-all', async function (req, res) {
  try {
    await flushAll();
    success(res, '清除所有缓存成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 重建 meilisearch 索引
 * GET /admin/settings/meilisearch_reindex
 */
router.get('/meilisearch_reindex', async function (req, res) {
  try {
    // 课程
    const courses = await Course.findAll({
      attributes: ['id', 'name', 'image', 'content', 'likesCount', 'updatedAt']
    });
    await coursesIndex.addDocuments(courses);

    // 章节
    const chapters = await Chapter.findAll({
      attributes: ['id', 'title', 'content', 'updatedAt'],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'image']
        }
      ]
    });
    await chaptersIndex.addDocuments(chapters);

    success(res, '重建索引成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：查询当前系统设置
 */
async function getSetting() {
  const setting = await Setting.findOne();
  if (!setting) {
    throw new NotFound('初始系统设置未找到，请运行种子文件。');
  }

  return setting;
}

/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{copyright: (string|*), icp: (string|string|DocumentFragment|*), name}}
 */
function filterBody(req) {
  return {
    name: req.body.name,
    icp: req.body.icp,
    copyright: req.body.copyright,
  };
}

module.exports = router;
