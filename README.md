# 🌐 云域名证书管理系统

## 📋 项目简介

这是一个完整的**多云域名和SSL证书管理系统**，支持**阿里云**、**腾讯云**和**AWS**三大云厂商。系统提供了类似宝塔的Web管理界面，实现了泛域名自动绑定、Let's Encrypt证书自动申请和续期等功能。

## 🎯 核心功能

### ✅ 已实现功能
- **多云支持**: 阿里云、腾讯云、AWS统一管理
- **泛域名绑定**: 支持 `*.example.com` 自动绑定
- **DNS管理**: 域名解析记录创建、编辑、删除、同步
- **SSL证书管理**:
  - Let's Encrypt自动申请
  - 自动续期（90天前自动更新）
  - 证书过期提醒
  - 手动上传管理
- **定时任务**: 
  - 证书续期检查（每日2点）
  - DNS记录同步（每6小时）
  - 日志清理（每月1日）
- **操作审计**: 完整的任务日志和操作追踪
- **数据加密**: 云厂商凭证和私钥AES-256加密存储
- **Web管理界面**: 完整的Vue 3实现的管理后台

## 🏗️ 项目架构

### 技术栈

**后端**
- Node.js + Express
- Sequelize ORM
- SQLite / MySQL 数据库
- Winston 日志系统
- node-cron 定时任务

**前端**
- Vue 3 (CDN版本)
- Axios HTTP客户端
- 原生CSS UI

**云服务**
- 阿里云 DNSapi
- 腾讯云 SDK
- AWS Route53 + ACM

### 数据库模型

```
User (用户)
├── id: 主键
├── email: 邮箱（唯一）
├── username: 用户名
├── password: 加密密码
├── role: 角色 (admin/user)
└── 时间戳

CloudConfig (云配置)
├── id: 主键
├── userId: 外键
├── provider: 云厂商 (aliyun/tencentcloud/aws)
├── name: 配置名称
├── credentials: 加密的API凭证
├── description: 描述
├── isActive: 是否激活
└── 时间戳

Domain (域名)
├── id: 主键
├── userId: 外键
├── cloudConfigId: 外键
├── domain: 域名
├── isWildcard: 是否泛域名
├── autoSync: 自动同步DNS
├── status: 状态 (pending/active/failed)
├── lastSyncAt: 最后同步时间
└── 时间戳

Certificate (证书)
├── id: 主键
├── userId: 外键
├── domainId: 外键
├── domain: 域名
├── certificateType: 证书类型 (letsencrypt/manual/selfsigned)
├── certificate: PEM格式证书
├── privateKey: 加密的私钥
├── chain: 证书链
├── status: 状态 (active/expired/renewing/failed)
├── autoRenewal: 自动续期
├── issuedAt: 签发时间
├── expiresAt: 过期时间
├── renewalCount: 续期次数
└── 时间戳

TaskLog (任务日志)
├── id: 主键
├── userId: 外键
├── action: 操作 (CREATE_DOMAIN/UPDATE_CERTIFICATE等)
├── resourceType: 资源类型
├── resourceId: 资源ID
├── status: 状态 (success/failed/pending)
├── details: 详情JSON
└── createdAt: 时间
```

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/khankhansai477-debug/cs.git
cd cs
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的云厂商凭证：
```bash
# 数据库配置
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=cloud_domain_cert

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d

# 阿里云
ALIYUN_ACCESS_KEY_ID=your_key_id
ALIYUN_ACCESS_KEY_SECRET=your_key_secret

# 腾讯云
TENCENTCLOUD_SECRET_ID=your_secret_id
TENCENTCLOUD_SECRET_KEY=your_secret_key

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Let's Encrypt
LETSENCRYPT_EMAIL=admin@example.com
LETSENCRYPT_ENVIRONMENT=production

# 应用配置
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### 4. 启动应用
```bash
# 开发模式
npm run dev

# 或使用启动脚本
bash start.sh

# 或生产模式
npm start
```

### 5. 访问应用

- **管理界面**: http://localhost:3000/client
- **API文档**: http://localhost:3000/api/health

### 📝 默认测试账户

- **邮箱**: admin@example.com
- **密码**: password123
- **角色**: admin

## 📚 API文档

### 认证相关

#### 用户登录
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "role": "admin"
  }
}
```

#### 用户注册
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "user",
  "password": "password123"
}
```

#### 获取用户资料
```bash
GET /api/auth/profile
Authorization: Bearer {token}
```

### 云配置相关

#### 添加云配置
```bash
POST /api/cloud-configs
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "aliyun",
  "name": "生产环境",
  "credentials": {
    "accessKeyId": "your_key_id",
    "accessKeySecret": "your_key_secret"
  },
  "description": "生产环境阿里云配置"
}
```

#### 获取云配置列表
```bash
GET /api/cloud-configs
Authorization: Bearer {token}
```

#### 测试云连接
```bash
POST /api/cloud-configs/{id}/test
Authorization: Bearer {token}
```

#### 更新云配置
```bash
PUT /api/cloud-configs/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述",
  "isActive": true
}
```

#### 删除云配置
```bash
DELETE /api/cloud-configs/{id}
Authorization: Bearer {token}
```

### 域名相关

#### 添加域名
```bash
POST /api/domains
Authorization: Bearer {token}
Content-Type: application/json

{
  "domain": "example.com",
  "cloudConfigId": 1,
  "isWildcard": false,
  "autoSync": true,
  "description": "主域名"
}
```

#### 获取域名列表
```bash
GET /api/domains?status=active&cloudConfigId=1
Authorization: Bearer {token}
```

#### 同步DNS记录
```bash
POST /api/domains/{id}/sync-dns
Authorization: Bearer {token}
```

#### 更新域名
```bash
PUT /api/domains/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "新描述",
  "autoSync": true,
  "isActive": true
}
```

#### 删除域名
```bash
DELETE /api/domains/{id}
Authorization: Bearer {token}
```

### 证书相关

#### 申请证书
```bash
POST /api/certificates
Authorization: Bearer {token}
Content-Type: application/json

{
  "domainId": 1,
  "certificateType": "letsencrypt",
  "autoRenewal": true,
  "description": "Let's Encrypt证书"
}
```

#### 获取证书列表
```bash
GET /api/certificates?status=active
Authorization: Bearer {token}
```

#### 获取证书详情
```bash
GET /api/certificates/{id}
Authorization: Bearer {token}
```

#### 续期证书
```bash
POST /api/certificates/{id}/renew
Authorization: Bearer {token}
```

#### 上传证书
```bash
POST /api/certificates/{id}/upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "chain": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "description": "手动上传的证书"
}
```

### 日志相关

#### 获取任务日志
```bash
GET /api/task-logs?action=CREATE_DOMAIN&status=success&page=1&limit=20
Authorization: Bearer {token}
```

#### 获取日志统计
```bash
GET /api/task-logs/stats/overview?days=7
Authorization: Bearer {token}
```

## 🔧 云厂商配置指南

### 阿里云

1. 登录 [阿里云控制台](https://ram.aliyun.com)
2. 创建AccessKey:
   - 点击"用户" → 创建用户
   - 为用户创建AccessKey
   - 附加权限：AliyunDNSFullAccess
3. 记录 `AccessKeyId` 和 `AccessKeySecret`
4. 在管理界面添加云配置

### 腾讯云

1. 登录 [腾讯云控制台](https://console.tencentcloud.com/cam)
2. 创建API密钥:
   - 点击"访问管理" → "API密钥管理"
   - 创建新密钥
   - 附加权限：DNSPod操作权限
3. 记录 `SecretId` 和 `SecretKey`
4. 在管理界面添加云配置

### AWS

1. 登录 [AWS控制台](https://console.aws.amazon.com/iam)
2. 创建IAM用户:
   - 点击"用户" → "添加用户"
   - 附加策略：AmazonRoute53FullAccess、AWSCertificateManagerFullAccess
3. 创建AccessKey
4. 记录 `AccessKeyId` 和 `SecretAccessKey`
5. 在管理界面添加云配置

## 📊 定时任务说明

系统自动执行以下定时任务：

| 任务 | 执行时间 | 说明 |
|------|--------|------|
| 证书续期检查 | 每日 2:00 | 检查即将过期的证书并自动续期 |
| DNS同步 | 每6小时 | 同步已启用自动同步的域名DNS记录 |
| 日志清理 | 每月1日 | 清理30天前的成功操作日志 |

## 🔒 安全特性

- ✅ 所有用户密码使用bcrypt加密
- ✅ 云厂商凭证使用AES-256-CBC加密
- ✅ SSL证书私钥加密存储
- ✅ JWT token认证
- ✅ Helmet安全头保护
- ✅ CORS跨域配置
- ✅ 完整的操作审计日志

## 📱 前端功能

### 仪表板
- 显示统计数据（云配置、域名、证书、今日操作）
- 系统功能概览

### 云配置管理
- 添加/编辑/删除云配置
- 测试云连接
- 查看凭证配置状态

### 域名管理
- 添加普通域名和泛域名
- 自动DNS同步
- 域名状态查询

### 证书管理
- Let's Encrypt证书申请
- 证书续期管理
- 手动上传证书
- 证书过期时间提醒

### 操作日志
- 查看所有操作记录
- 按操作类型、资源类型、状态筛选
- 分页显示

## 🐛 故障排除

### 连接失败
- 检查云厂商凭证是否正确
- 验证网络连接是否正常
- 查看系统日志获取详细错误信息

### 证书申请失败
- 确认域名已正确配置DNS
- 检查Let's Encrypt是否可以访问验证URL
- 查看操作日志了解具体错误

### DNS同步异常
- 验证云配置凭证权限
- 检查域名是否存在于对应云厂商
- 查看系统日志获取详细信息

## 📦 项目结构

```
cs/
├── server/
│   ├── index.js                    # 应用入口
│   ├── models/                     # 数据库模型
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── CloudConfig.js
│   │   ├── Domain.js
│   │   ├── Certificate.js
│   │   └── TaskLog.js
│   ├── controllers/                # 业务控制器
│   │   ├── authController.js
│   │   ├── cloudConfigController.js
│   │   ├── domainController.js
│   │   ├── certificateController.js
│   │   └── taskLogController.js
│   ├── routes/                     # API路由
│   │   ├── auth.js
│   │   ├── cloudConfig.js
│   │   ├── domain.js
│   │   ├── certificate.js
│   │   └── taskLog.js
│   ├── middleware/                 # 中间件
│   │   ├── auth.js
│   │   └── validator.js
│   ├── services/                   # 业务服务
│   │   ├── cloud/
│   │   │   ├── CloudProvider.js
│   │   │   ├── CloudProviderFactory.js
│   │   │   └── providers/
│   │   │       ├── AliYunProvider.js
│   │   │       ├── TencentCloudProvider.js
│   │   │       └── AWSProvider.js
│   │   ├── certificate/
│   │   │   └── CertificateService.js
│   │   ├── dns/
│   │   │   └── DnsService.js
│   │   └── task/
│   │       └── TaskScheduler.js
│   └── utils/
│       └── logger.js
├── client/
│   └── index.html                  # 前端管理界面
├── package.json                    # 项目配置
├── .env.example                    # 环境变量示例
├── .gitignore                      # Git忽略配置
├── start.sh                        # 启动脚本
└── README.md                       # 项目文档
```

## 📝 更新日志

### v1.0.0 (2026-05-15)
- ✅ 初始版本发布
- ✅ 支持阿里云、腾讯云、AWS
- ✅ 完整的Web管理界面
- ✅ 定时任务系统
- ✅ 操作审计日志

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📧 联系方式

- 📧 Email: support@example.com
- 🐙 GitHub: https://github.com/khankhansai477-debug/cs
- 📖 文档: https://github.com/khankhansai477-debug/cs/wiki

---

**Happy Coding! 🚀**
