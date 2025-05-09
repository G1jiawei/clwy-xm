'use strict';
const {
  Model
} = require('sequelize');
const moment = require('moment');
moment.locale('zh-cn');
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Article.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    createdAt: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue("createdAt")).format("LL");
      }
    },
    updatedAt: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue("updatedAt")).format("LL");
      }
    },
  }, {
    sequelize,
    modelName: 'Article',
  });
  return Article;
};