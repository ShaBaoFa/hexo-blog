# 闲聊茶泡饭

“熊猫茶泡饭 Ocyaduke”的个人技术博客源码，线上地址为
[blog.wlfpanda1012.com](https://blog.wlfpanda1012.com)。

内容主要覆盖 PHP、Laravel、Python、Linux、Docker、MySQL、Redis、
Nginx、RocketMQ、云服务及家庭服务器实践。

## 技术栈

- 静态站点生成器：Hexo 7
- 主题：Butterfly 4.9
- 模板与样式：EJS、Pug、Stylus
- 内容格式：Markdown
- 搜索：`hexo-generator-search`、`hexo-generator-searchdb`
- 自动化：GitHub Actions
- 生产发布：仓库保留了阿里云 OSS 上传脚本

## 目录结构

```text
.
├── .github/workflows/ci.yml  # 构建与内容一致性检查
├── scaffolds/                # Hexo 页面和文章模板
├── source/
│   ├── _data/                # 友情链接等结构化数据
│   ├── _posts/               # 博客文章
│   └── images/               # 文章与站点图片
├── tools/                    # 构建产物比较工具与基线
├── _config.yml               # Hexo 主配置
├── _config.butterfly.yml     # Butterfly 主题配置
└── package.json              # 命令和依赖
```

## 本地开发

推荐使用 Node.js 20 或 22。

```bash
npm ci
npm run server
```

默认的 Hexo 开发服务可通过 `http://localhost:4000` 访问。

生成生产站点：

```bash
npm run clean
npm run build
```

生成结果位于 `public/`。

## 持续集成

GitHub Actions 会在以下场景运行：

- 向 `main` 推送代码
- 创建或更新 Pull Request
- 手动触发工作流

CI 使用 Node.js 20 和 22 分别执行 `npm ci` 与 Hexo 构建。Node.js 22
任务还会将生成结果与 `tools/build-baseline.json` 比较，检查：

- 生成文件集合是否一致
- HTML、CSS、JavaScript、JSON、XML 和文本内容是否一致
- 图片、字体等二进制资源的 SHA-256 是否一致

比较时只忽略 Hexo 版本标记和 HTML `datetime` 属性这类不影响页面展示的
元数据。其他变化都会使 CI 失败，防止依赖升级意外改变页面。

### 有意修改网站内容

确认页面变化符合预期后，重新生成并更新基线：

```bash
npm run clean
npm run build
node tools/compare-builds.mjs public tools/build-baseline.json --write-manifest
```

基线更新必须和对应的文章、配置或主题修改一起审核。

## 发布到 OSS

`upload_oss.sh` 会重新构建网站，清空目标 Bucket 后上传整个 `public/`
目录。执行前需要从 `ossutil.cfg.example` 创建本地 `ossutil.cfg`。

```bash
cp ossutil.cfg.example ossutil.cfg
./upload_oss.sh
```

`ossutil.cfg` 已被 `.gitignore` 排除。不要将 AccessKey、Secret 或其他凭据
提交到仓库。上传脚本包含远端递归删除操作，生产执行前应确认 Bucket 名称和
备份策略。

## 依赖维护

依赖由 `package-lock.json` 固定，安装时应使用 `npm ci`。Dependabot 每日
检查 npm 更新；升级 PR 必须通过构建和内容一致性检查后才能合并。
