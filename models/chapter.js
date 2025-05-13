'use strict';
const { Model } = require('sequelize');
const moment = require('moment');
const { chaptersIndex } = require('../utils/meilisearch');
const { delKey } = require('../utils/redis');
moment.locale('zh-cn');
/**
 * 清除缓存
 * @param chapter
 * @returns {Promise<void>}
 */
async function clearCache(chapter) {
  await delKey(`chapters:${chapter.courseId}`);
  await delKey(`chapter:${chapter.id}`);
}
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Chapter.belongsTo(models.Course, { as: 'course' });
    }
  }
  Chapter.init(
    {
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: '课程ID必须填写。' },
          notEmpty: { msg: '课程ID不能为空。' },
          async isPresent(value) {
            const course = await sequelize.models.Course.findByPk(value);
            if (!course) {
              throw new Error(`ID为：${value} 的课程不存在。`);
            }
          },
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '标题必须填写。' },
          notEmpty: { msg: '标题不能为空。' },
          len: { args: [2, 45], msg: '标题长度必须是2 ~ 45之间。' },
        },
      },
      content: DataTypes.TEXT,
      video: {
        type: DataTypes.STRING,
        validate: {
          isUrl: { msg: '视频地址不正确。' },
        },
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: '排序必须填写。' },
          notEmpty: { msg: '排序不能为空。' },
          isInt: { msg: '排序必须为整数。' },
          isPositive(value) {
            if (value <= 0) {
              throw new Error('排序必须是正整数。');
            }
          },
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return moment(this.getDataValue('createdAt')).format('LL');
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return moment(this.getDataValue('updatedAt')).format('LL');
        },
      },
      free: {
        type: DataTypes.BOOLEAN,
        validate: {
          isIn: {
            args: [[true, false]],
            msg: '是否免费章节的值必须是，推荐：true 不推荐：false。',
          },
        },
      },
    },
      {
        hooks: {
          // 在章节创建后
          afterCreate: async (chapter) => {
            await sequelize.models.Course.increment('chaptersCount', { where: { id: chapter.courseId } });
            const course = await chapter.getCourse();
            await chaptersIndex.addDocuments([
              {
                id: chapter.id,
                title: chapter.title,
                content: chapter.content || null,
                updatedAt: chapter.updatedAt,
                course: {
                  id: course.id,
                  name: course.name,
                  image: course.image || null,
                }
              },
            ]);
            await clearCache(chapter);
          },
          // 在章节更新后
          afterUpdate: async (chapter) => {
            const course = await chapter.getCourse();
            await chaptersIndex.updateDocuments([
              {
                id: chapter.id,
                title: chapter.title,
                content: chapter.content,
                updatedAt: chapter.updatedAt,
                course: {
                  id: course.id,
                  name: course.name,
                  image: course.image,
                }
              },
            ]);
            await clearCache(chapter);
          },
          // 在章节删除后
          afterDestroy: async (chapter) => {
            await sequelize.models.Course.decrement('chaptersCount', { where: { id: chapter.courseId } });
            await chaptersIndex.deleteDocument(chapter.id);
            await clearCache(chapter);
          },
        },
        sequelize,
        modelName: 'Chapter',
      }
  );
  return Chapter;
};
