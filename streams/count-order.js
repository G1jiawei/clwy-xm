const { sequelize } = require('../models');

// 定义客户端集合，保存每一个与浏览器建立 SSE 连接的响应对象（res）
const clients = new Set();


/**
 * 初始化订单统计数据流
 * @param res
 * @param req
 */
function initOrderStream(res, req) {
    // 设置 event-stream 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 将当前客户端响应对象添加到集合中
    clients.add(res);

    // 停止响应
    req.on('close', () => {
        clients.delete(res);
    });

}

/**
 * 广播订单统计数据
 * @returns {Promise<void>}
 */
async function broadcastOrderCount() {
    const [results] = await sequelize.query(
        "SELECT DATE_FORMAT(`createdAt`, '%Y-%m') AS `month`, COUNT(*) AS `value` FROM `Orders` GROUP BY `month` ORDER BY `month` ASC"
    );

    const data = {
        months: [],
        values: [],
    };

    results.forEach((item) => {
        data.months.push(item.month);
        data.values.push(item.value);
    });

    // 发送数据给所有客户端
    clients.forEach((client) => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });

}

module.exports = { initOrderStream, broadcastOrderCount };
