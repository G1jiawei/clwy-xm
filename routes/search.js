const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const { coursesIndex, chaptersIndex} = require('../utils/meilisearch');
const { BadRequest } = require('http-errors');

/**
 * 搜索课程
 * GET /search?q=node&type=courses
 * GET /search?q=node&type=chapters
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;
    const { q, type } = query;

    const option = {
      // 关键词高亮
      attributesToHighlight: ['*'],
      offset: offset,
      limit: pageSize,
    };

    // 搜索类型
    let results;
    switch (type) {
      case 'courses':
        results = await coursesIndex.search(q, option);
        break;
      case 'chapters':
        results = await chaptersIndex.search(q, option);
        break;
      default:
        throw new BadRequest('搜索类型错误。');
    }

    // 搜索到的结果
    const data = {};
    data[type] = results.hits;

    success(res, '搜索成功。', {
      ...data,
      pagination: {
        total: results.estimatedTotalHits,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
