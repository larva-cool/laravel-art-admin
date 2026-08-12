# Laravel Skel Admin

基于 Vue 3 + TypeScript + Vite + Element Plus 的后台管理系统前端模板，配套后端为 [Laravel Skel Pro](https://github.com/larva-cool/laravel-skel-pro)。

> 在线演示：<https://laravel-art-admin-blush.vercel.app/>

## 技术栈

| 类别        | 技术                                               |
| ----------- | -------------------------------------------------- |
| 框架        | Vue 3.5 + TypeScript 5.6                           |
| 构建工具    | Vite 7.x                                           |
| UI 组件库   | Element Plus 2.x                                   |
| 状态管理    | Pinia 4.x + 持久化插件                             |
| 路由        | Vue Router 4.x（Hash 模式）                        |
| CSS 框架    | Tailwind CSS 4.x + SCSS                            |
| 图表        | ECharts 6.x                                        |
| HTTP 客户端 | Axios                                              |
| 国际化      | Vue I18n 11.x                                      |
| 图标        | Iconify + Element Plus Icons                       |
| 代码规范    | ESLint + Prettier + Stylelint + Husky + Commitlint |
| 包管理器    | pnpm >= 8.8.0                                      |

## 环境要求

- Node.js >= 22.0.0
- pnpm >= 8.8.0

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

开发服务器默认运行在 `http://localhost:3006`，端口可在 `.env` 中修改。

### 生产构建

```bash
pnpm build
```

构建产物输出到 `dist/` 目录。

### 本地预览生产构建

```bash
pnpm serve
```

### 代码检查与格式化

```bash
# ESLint 检查
pnpm lint

# ESLint 自动修复
pnpm fix

# Prettier 格式化
pnpm lint:prettier

# Stylelint 检查与修复
pnpm lint:stylelint
```

### Git 提交

项目使用 Commitizen 规范提交信息：

```bash
pnpm commit
```

## 目录结构

```
src/
├── api/                 # API 请求封装
│   ├── auth.ts          # 认证相关接口
│   └── system-manage.ts # 系统管理相关接口
├── assets/              # 静态资源
│   ├── images/          # 图片资源
│   ├── styles/          # 全局样式（SCSS）
│   └── svg/             # SVG 相关
├── components/          # 全局组件
│   └── core/            # 核心组件（布局、表单、表格、图表等）
├── config/              # 应用配置
├── directives/          # 自定义指令
├── enums/               # 枚举定义
├── hooks/               # 组合式函数
├── locales/             # 国际化资源（zh / en）
├── mock/                # 模拟数据
├── plugins/             # 插件配置
├── router/              # 路由配置
│   ├── core/            # 路由核心逻辑（权限、菜单处理等）
│   ├── guards/          # 路由守卫
│   ├── modules/         # 路由模块
│   └── routes/          # 静态/异步路由定义
├── store/               # Pinia 状态管理
│   └── modules/         # 各模块 Store（menu、setting、user 等）
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
│   ├── http/            # HTTP 请求封装
│   ├── storage/         # 本地存储封装
│   ├── table/           # 表格工具
│   ├── ui/              # UI 相关工具
│   └── ...
├── views/               # 页面视图
│   ├── auth/            # 登录页
│   ├── dashboard/       # 仪表盘
│   ├── exception/       # 异常页（403/404/500）
│   ├── index/           # 布局容器
│   ├── result/          # 结果页
│   ├── system/          # 系统管理（管理员、角色、菜单等）
│   └── user-center/     # 个人中心
├── App.vue
└── main.ts
```

## 环境变量

项目使用 `.env` 文件管理环境变量，支持多环境配置：

| 文件               | 说明     |
| ------------------ | -------- |
| `.env`             | 通用配置 |
| `.env.development` | 开发环境 |
| `.env.production`  | 生产环境 |

### 主要环境变量

| 变量                    | 说明                         | 默认值                         |
| ----------------------- | ---------------------------- | ------------------------------ |
| `VITE_VERSION`          | 应用版本号                   | `1.0.0`                        |
| `VITE_PORT`             | 开发服务器端口               | `3006`                         |
| `VITE_BASE_URL`         | 应用部署基础路径             | `/`                            |
| `VITE_API_URL`          | API 请求基础路径             | `/`                            |
| `VITE_API_PROXY_URL`    | 开发环境代理目标地址         | `http://laravel-skel-pro.test` |
| `VITE_ACCESS_MODE`      | 权限模式（frontend/backend） | `backend`                      |
| `VITE_WITH_CREDENTIALS` | 跨域请求是否携带 Cookie      | `false`                        |
| `VITE_OPEN_ROUTE_INFO`  | 是否开启路由信息展示         | `false`                        |
| `VITE_LOCK_ENCRYPT_KEY` | 锁屏加密密钥                 | `s3cur3k3y4adpro`              |
| `VITE_DROP_CONSOLE`     | 生产构建是否移除 console     | 开发 `false` / 生产 `true`     |

## 功能特性

- 多种菜单布局：侧边栏、顶部、混合、双列
- 多种主题风格：亮色 / 暗色 / 跟随系统
- 动态路由与权限控制（前端 / 后端两种模式）
- 标签页导航（worktab）
- 全局搜索、快速入口
- 国际化支持（中文 / 英文）
- 富文本编辑器（wangEditor）
- Excel 导入导出
- 图片裁剪
- 视频播放器
- 图表组件（ECharts）
- 锁屏功能
- 水印
- 数据持久化（Pinia + localStorage）

## 开发约定

### 路径别名

| 别名      | 路径                 |
| --------- | -------------------- |
| `@`       | `src/`               |
| `@views`  | `src/views/`         |
| `@imgs`   | `src/assets/images/` |
| `@icons`  | `src/assets/icons/`  |
| `@utils`  | `src/utils/`         |
| `@stores` | `src/store/`         |
| `@styles` | `src/assets/styles/` |

### 权限指令

```vue
<!-- 按钮级权限控制 -->
<button v-auth="'user.create'">新增</button>
<button v-roles="['admin']">管理员可见</button>
```

### API 调用

```ts
import { useHttp } from '@/utils/http'

const http = useHttp()

// GET 请求
const data = await http.get('/api/users', { params: { page: 1 } })

// POST 请求
const result = await http.post('/api/users', { name: 'test' })
```

## 配套后端

前端 API 基于 Laravel Skel Pro 后端项目，主要接口前缀：

- `/admin/*` - 后台管理接口
- `/api/*` - 通用 API 接口

默认超级管理员账号：

- 用户名：`admin`
- 密码：`12345678`

## 部署

### 构建静态文件

```bash
pnpm build
```

将 `dist/` 目录内容部署到任意静态文件服务器（Nginx 等）。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name admin.example.com;
    root /path/to/dist;
    index index.html;

    # Hash 模式不需要 try_files，History 模式需要：
    # location / {
    #     try_files $uri $uri/ /index.html;
    # }

    # 反向代理 API 请求
    location /admin/ {
        proxy_pass http://backend-server/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend-server/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## License

MIT
