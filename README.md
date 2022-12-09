# 自动理赔作业程序（auto-compensate）

这是福保业务倍增阶段用于自动理赔的作业程序。是由于 “高性能&高可用&高扩展” 相关改造的需要，从 [insbiz](https://github.com/fooins/insbiz) 系统独立出来的工程。[相关改造细节>>](https://github.com/fooins/.github/blob/main/profile/业务倍增/业务倍增阶段系统改造.md)

- [数据库表结构](../../../.github/tree/main/profile/成立初期/sql)
- [版本发布记录](./releases)

## 目录结构

```
├─ config  // 配置文件目录
├─ releases  // 发布信息目录
│
├─ src  // 源代码目录
│  ├─ libraries  // 工具包目录
│  ├─ models  // 数据库表模型目录
│  │
│  ├─ dao.js  // 数据库操作对象
│  ├─ service.js  // 服务主要实现
│  └─ start.js  // 程序启动入口
│
└─ test  // 测试相关目录
```

## 使用说明

1. 准备工作：安装 Node.js(16.x)、MySQL(8.x)、Redis(7.x) 和 Git。
2. 克隆代码：`git clone https://github.com/fooins/auto-compensate.git`。
3. 更新配置：修改 `./config/development.js` 文件以覆盖默认配置。
4. 安装依赖：`npm install`。
5. 启动程序：`npm run start:dev`。

## 环境变量

本项目根据 `NODE_ENV` 环境变量来识别当前所处的运行环境类型，用于指导某些程序作出相应的不同的动作，比如日志组件在不同环境下会记录不同级别的日志。启动服务时请务必设置正确的环境变量，特别是生产环境。目前支持以下值：

| 环境变量值  | 说明     |
| ----------- | -------- |
| production  | 生产环境 |
| development | 开发环境 |

## 脚本命令

- `start:dev`：启动开发环境程序服务。主要用于本地开发调试，代码变更后会自动重启。
- `lint`：执行 ESLint 检查并修复可自动修复的错误或警告。
- `test`：执行测试。需要先单独启动服务。
