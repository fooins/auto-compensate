# Auto Compensate 1.0.0 发布操作<!-- omit in toc -->

- [1. 部署](#1-部署)
- [2. 回滚（若需要）](#2-回滚若需要)

## 1. 部署

1. 设备初始化：

   - 容器服务：创建 auto-compensate 集群（Job）。

2. 设置 GitHub 流水线[密钥信息](https://github.com/organizations/fooins/settings/secrets/actions)：

   - PROD_CONFIG_AUTO_COMPENSATE: 生产环境配置。
   - TENCENT_CLOUD_ACCOUNT_ID: 腾讯云账户 ID。
   - TKE_CLUSTER_ID: TKE 集群唯一标识。
   - TKE_KUBE_CONFIG: TKE 连接配置信息。
   - TKE_REGISTRY_PASSWORD: TKE 镜像仓库密码。
   - TKE_REGISTRY_SERVER: TKE 镜像仓库地址（包含路径）。

3. 手动触发流水线 “[部署到生产环境(TKE)](https://github.com/fooins/auto-compensate/actions/workflows/deploy-to-prod-tke.yaml)”。

## 2. 回滚（若需要）

1. 删除 auto-compensate 集群（Job）。
