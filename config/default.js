// 默认配置文件
// 包含全量配置项，会被实际配置合并和覆盖
module.exports = {
  // 数据库
  db: {
    // 主机名或IP
    host: '127.0.0.1',
    // 端口号
    port: 3306,
    // 用户名
    username: '',
    // 密码
    password: '',
    // 数据库名
    database: 'insbiz',
  },
  // Redis
  redis: {
    // 主机名
    host: '127.0.0.1',
    // 端口号
    port: 6379,
    // 密码
    password: '123456',
    // 数据库索引
    db: 0,
  },
  // 队列信息
  queue: {
    // 队列名
    key: 'auto-compensate',
    // 消费者组名
    group: 'auto-compensate-group-1',
    // 每次读取的条数
    count: 10,
  },
};
