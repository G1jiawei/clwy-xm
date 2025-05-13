const { MeiliSearch } = require('meilisearch')

const searchClient = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_API_KEY,
});


// 课程索引
const coursesIndex = searchClient.index('courses');
(async () => {
    // 用于搜索的字段
    await coursesIndex.updateSearchableAttributes(['name', 'content']);

    // 自定义排序规则
    await coursesIndex.updateSortableAttributes(['updatedAt', 'likesCount']);

    // 排序权重顺序
    await coursesIndex.updateRankingRules([
        'sort',
        'words',
        'typo',
        'proximity',
        'attribute',
        'exactness',
    ]);
})();

// 章节索引
const chaptersIndex = searchClient.index('chapters');
(async () => {
    await chaptersIndex.updateSearchableAttributes(['title', 'content']);
    await chaptersIndex.updateSortableAttributes(['updatedAt']);
    await chaptersIndex.updateRankingRules([
        'sort',
        'words',
        'typo',
        'proximity',
        'attribute',
        'exactness',
    ]);
})();

module.exports = { searchClient, coursesIndex, chaptersIndex };
