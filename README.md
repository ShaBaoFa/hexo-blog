# 闲聊茶泡饭

“熊猫茶泡饭 Ocyaduke”的个人技术博客源码，线上地址为
[blog.wlfpanda1012.com](https://blog.wlfpanda1012.com)。

内容主要覆盖 PHP、Laravel、Python、Linux、Docker、MySQL、Redis、
Nginx、RocketMQ、云服务及家庭服务器实践。

## 技术栈

- 静态站点生成器：Hexo 6.3
- 主题：Butterfly 4.9
- 模板与样式：EJS、Pug、Stylus
- 内容格式：Markdown
- 搜索：`hexo-generator-searchdb`
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
├── tools/                    # 构建产物比较工具
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

CI 使用 Node.js 20 和 22 分别执行 `npm ci` 与 Hexo 构建。Pull Request
还会在同一个 Node.js 22/Linux 环境中分别构建目标分支和当前分支，并检查：

- 生成文件集合是否一致
- HTML、CSS、JavaScript、JSON、XML 和文本内容是否一致
- 图片、字体等二进制资源的 SHA-256 是否一致

两份源码的文件时间会先统一，避免 Git 检出时间影响文章更新时间。比较时只
忽略构建时间、Hexo 版本标记和 HTML `datetime` 属性这类不影响页面展示的
元数据。标签云原本使用随机排序和随机颜色，比较构建会临时改为按名称排序，
并忽略标签总览页的随机 RGB 值，避免主题自身的随机性造成误报。其他变化都会
使 CI 失败，防止依赖升级意外改变页面。

### 有意修改网站内容

内容、配置或主题发生预期变化时，可以在本地分别生成修改前后的站点，再运行：

```bash
npm run verify:content -- /path/to/before/public /path/to/after/public
```

Pull Request 中的内容变化应结合构建产物和页面预览审核，不应通过放宽比较
规则来隐藏。

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
检查 npm 更新；升级 PR 必须通过构建和内容一致性检查后才能合并。Hexo 7
会改变搜索索引、HTML 实体编码和标签排列，因此当前保留 Hexo 6.3；
`hexo-generator-searchdb` 1.5 也会改变索引内容，继续保留 1.4。项目已移除
会竞争写入同一个 `search.xml` 的 `hexo-generator-search`，避免搜索索引随机
变化。Butterfly 保留 4.9，主题升级应单独进行视觉回归检查。
