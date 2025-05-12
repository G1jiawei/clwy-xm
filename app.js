const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const adminAuth = require('./middlewares/admin-auth');
const userAuth = require('./middlewares/user-auth');
const cors = require('cors')
require('dotenv').config();
// 启动邮件消费者
const { mailConsumer } = require('./utils/rabbit-mq');
(async () => {
    await mailConsumer();
})();
//前台路由路径
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const coursesRouter = require('./routes/courses');
const chaptersRouter = require('./routes/chapters');
const articlesRouter = require('./routes/articles');
const settingsRouter = require('./routes/settings');
const searchRouter = require('./routes/search');
const authRouter = require('./routes/auth');
const likesRouter = require('./routes/likes');
const uploadsRouter = require('./routes/uploads');
const adminAttachmentsRouter = require('./routes/admin/attachments');
const captchaRouter = require('./routes/captcha');
const membershipsRouter = require('./routes/memberships');

//后台路由路径
const adminArticlesRouter = require('./routes/admin/articles');
const adminCategoriesRouter = require('./routes/admin/categories');
const adminSettingsRouter = require('./routes/admin/settings');
const adminUsersRouter = require('./routes/admin/users');
const adminCoursesRouter = require('./routes/admin/courses');
const adminChaptersRouter = require('./routes/admin/chapters');
const adminChartsRouter = require('./routes/admin/charts');
const adminAuthRouter = require('./routes/admin/auth');
const adminLogsRouter = require('./routes/admin/logs');
const adminMembershipsRouter = require('./routes/admin/memberships');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// CORS 跨域配置
app.use(cors());
//使用前台路由配置
app.use('/', indexRouter);
app.use('/categories', categoriesRouter);
app.use('/courses', coursesRouter);
app.use('/chapters', userAuth, chaptersRouter);
app.use('/articles', articlesRouter);
app.use('/settings', settingsRouter);
app.use('/search', searchRouter);
app.use('/auth', authRouter);
app.use('/users', userAuth, usersRouter);
app.use('/likes', userAuth, likesRouter);
app.use('/uploads', userAuth, uploadsRouter);
app.use('/admin/attachments', adminAuth, adminAttachmentsRouter);
app.use('/captcha', captchaRouter);
app.use('/memberships', membershipsRouter);


//使用后台路由配置
app.use('/admin/articles', adminAuth, adminArticlesRouter);
app.use('/admin/categories', adminAuth, adminCategoriesRouter);
app.use('/admin/settings', adminAuth, adminSettingsRouter);
app.use('/admin/users', adminAuth, adminUsersRouter);
app.use('/admin/courses', adminAuth, adminCoursesRouter);
app.use('/admin/chapters', adminAuth, adminChaptersRouter);
app.use('/admin/charts', adminAuth, adminChartsRouter);
app.use('/admin/auth', adminAuthRouter);
app.use('/admin/logs', adminAuth, adminLogsRouter);
app.use('/admin/memberships', adminAuth, adminMembershipsRouter);


module.exports = app;
