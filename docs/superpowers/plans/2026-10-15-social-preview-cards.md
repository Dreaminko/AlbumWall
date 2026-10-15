# 社交分享预览卡片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本文仅为待评审计划，不授权开始实施。

**Goal:** 分享文章链接到 Telegram / Discord 时，提供包含专辑封面、名称、艺术家、风格的图片预览。

**Architecture:** 在现有内容准备流程后，使用 Satori + Resvg 为每篇文章生成静态 PNG 和图片清单；Next.js 的 `generateMetadata` 引用图片清单，Cloudflare 静态资源负责提供图片。用户继续分享 `/album/[slug]`，无需特殊分享链接。

**Tech Stack:** Next.js 16.3.3、React 19、Node.js >=22、OpenNext / Cloudflare Workers；构建依赖 `satori`、`@resvg/resvg-js`、`sharp`，版本由 lockfile 固定。Sharp 用于完整解码与缩小封面，避免损坏图片绕过占位降级。

**Spec:** 本文“需求与范围”“图片与元信息约定”构成此次实现的需求依据。

## Global Constraints

- 用户于 2026-10-15 授权按静态 PNG 构建脚本实施，并要求代码简洁有效；上线发布仍未执行。
- 第一优先级为 Telegram / Discord 的普通文章链接预览，兼容提供 Twitter Card 元信息。
- 图片在构建时生成；Worker 请求期间不读取内容目录、不下载网易封面、不执行图片渲染。
- 沿用现有 MDX、网易元数据、文章 URL 和内容仓库触发部署流程；不引入数据库、R2 或 KV。
- 保持独立文章页、拦截弹窗、随机专辑、前进后退等现有行为。
- 实施前继续以 `node_modules/next/dist/docs/` 对应文档为准，不能套用其他 Next.js 版本的约定。

## Review Focus

- 长专辑名、多艺术家、中文及日文：文字可辨识，无方框字、越界和静默丢字；由任务 1 验证。
- 缺失风格、封面为空或下载失败：仍生成可用卡片，风格缺失时隐藏；由任务 1、2 验证。
- 图片内容改变但封面 URL 未改变：图片路径也应改变；由任务 2 验证。
- 生产域名未配置、图片清单缺项：构建失败，避免发布 localhost 或坏图片链接；由任务 3 验证。
- 爬虫直接请求文章且不执行 JavaScript：初始 HTML 的 head 包含该文章的完整 OG 信息；由任务 4 验证。

---

## 需求与范围

### 当前项目事实

- `src/app/album/[slug]/page.tsx` 已有 `generateMetadata`，包括 OG / Twitter 标题、摘要和图片；当前图片直接指向网易封面。
- `src/types/album.ts` 已有 `name`、`artist`、`coverUrl`、可选 `genre`、`year`、`trackCount`、`date`，无需修改文章 frontmatter 格式。
- `scripts/prepare-content.mjs` 在 dev / build 前生成 `src/generated/albums.json`，文章通过 `generateStaticParams` 预渲染。
- 项目通过 OpenNext 部署到 Cloudflare Workers，已有静态资源缓存配置，没有运行时内容更新。
- 根布局尚未设置 `metadataBase`，文章未显式提供 canonical 和 `og:url`。
- 当前本地生成数据共 24 篇，样本封面为空；真实封面效果须在具备元数据的构建环境中验证，不能仅凭本地占位图验收。

### 交付行为

1. 已发布文章无需手动制作图片；新文章和内容修改均随现有部署流程重新生成图片。
2. 图片内部包含封面、专辑名、艺术家；风格存在时显示，并补充有效发行年份与曲目数；不添加底部署名。
3. 平台外层标题采用“专辑名 — 艺术家 | Album Wall”，描述以风格、年份开头，再接现有乐评摘要，避免平台只显示缩略图时丢失关键信息。
4. 网站负责提供正确、公开可抓取的页面与图片。预览开关、图片大小、裁切及外层布局由平台和用户设置决定，不能承诺所有客户端显示一致。
5. MVP 不包含分享按钮、下载海报、播放控件、二维码、微信 JS-SDK、Bot / Webhook 或 Telegram Instant View。

## 方案选择

| 方案 | 收益 | 代价 / 局限 | 结论 |
| --- | --- | --- | --- |
| 构建脚本生成静态 PNG | 与现有内容管线一致，抓取只读取同域图片，渲染依赖不进入 Worker | 增加构建耗时和两项构建依赖 | 推荐 |
| Next.js `opengraph-image.tsx` + `ImageResponse` | 官方约定，支持静态优化和自动图片标签 | 需核验当前 OpenNext 的预渲染、字体及 OG 打包表现 | 可行备选，不与推荐方案混用 |
| 直接使用原始封面并补充文本标签 | 改动最少 | 图片本身没有艺术家、风格等排版 | 不满足本次完整目标 |

推荐基于部署方式与内容更新频率作出，**并非认定 Cloudflare 无法支持 `ImageResponse`**。Satori 负责文字布局及 SVG，Resvg 负责 SVG 转 PNG；二者只运行在 Node 构建阶段。[Satori 官方说明](https://github.com/vercel/satori)、[Resvg 官方说明](https://github.com/thx/resvg-js)。

## 图片与元信息约定

### 图片模板（2026-10-15 用户已确认最终设计 v3）

- 设计依据：Superdesign draft `3109c236-3dde-4b73-9f3a-d1f2e2b13983`，version 3；详见 `.superdesign/share-card.md` 和 `.superdesign/tmp/share-card.html`。后续实现忠实还原该版本。
- 输出：1200 × 630，PNG，纯白背景 #ffffff、主文字 #171717，沿用网站 Geist 字体和标题原有大小写。
- 布局：左侧 630 × 630 方形封面贴齐画布左、上、下边缘，保持完整方形比例；右侧 570 × 630 为纯白信息区。
- 信息：专辑名、艺术家、风格 / 年份 / 曲目数整体位于右下角，统一右对齐；右侧和底部内边距均为 44px，信息区左侧内边距为 48px。
- 层级：专辑名 60px、700 字重、1.15 行高；艺术家 36px、常规字重、#6b7280，与标题间隔 16px；风格 / 年份 / 曲目数为 24px、#9ca3af，置于艺术家下方 24px，项目间用中点分隔。
- 不显示底部 Album Wall 字样，不添加分隔线、按钮、阴影或额外装饰。
- 专辑名最多 3 行，艺术家最多 2 行，风格最多 2 行；先在预设字号范围内缩小，再按字素边界省略，保留完整值到元信息中。
- 不将正文排进图片，防止信息过密；不依赖页面 Tailwind 样式或浏览器截屏。
- 本地字体随项目提供并保留许可证，覆盖拉丁文及当前内容中的中日韩文字；优先使用 TTF / OTF。不把 `next/font/google` 的网页字体视为图片渲染器已有字体。
- 不支持的字形须有构建诊断；扩充本地字体后再发布，不静默产生方框字。Emoji 图片排版不作为 MVP 承诺，样图评审时明确实际内容的处理方式。
- 缺少风格则隐藏该项，不推测流派；无有效年份则隐藏年份。封面缺失或下载失败时，使用模板内的专辑占位图并保留文字。
- 单图目标不超过 1 MB；超过目标时记录并优化封面输入尺寸，硬性上限 5 MB，超过则构建失败。以上为本项目预算，不宣称是 Telegram / Discord 的统一限制。

### 地址、缓存和公开访问

- 新增构建环境变量 `SITE_URL`，值为对外 HTTPS 站点 origin；生产必须设置，开发允许 `http://localhost:3000`。
- 如需验证独立预览部署，在该构建设置其公开预览 origin，避免抓取结果误指向生产或 localhost。
- 图片路径采用 `/og/<sha256-of-final-png>.png`，清单为 `src/generated/share-images.json`，结构约定为 `Record<slug, { path, width: 1200, height: 630, alt }>`。
- hash 取最终 PNG 字节；封面字节、模板或字体导致图片变化时 URL 随之变化，同输入重复生成应得到相同 URL。
- 每次生成重建脚本独占的 `public/og/` 并输出匹配清单；不扫描或清理其他 public 资源。生成目录加入 `.gitignore`，字体与许可证提交到仓库。
- `/og/*` 可设置一年 immutable 缓存；以 Worker preview 实测响应头为准，不能仅凭 `_headers` 文件存在判定生效。
- 图片和文章必须允许公开 GET，无登录、验证码或防盗链要求；部署时检查 Cloudflare 规则是否影响抓取，不预先改动站点安全配置。
- 新 URL 避免新页面引用旧图片；**不能强制平台重新抓取文章，也不能保证旧消息刷新**。当前部署不会永久保存旧 hash 资源，如需要历史图片 URL 长期有效，应另立资源保留方案。

### 元信息

文章页设置 canonical、`og:url`、`og:site_name`、`og:type=article`、标题和描述；OG 图片显式提供绝对 HTTPS URL、1200 × 630、`image/png` 与 alt。Twitter 使用同一张图片及 `summary_large_image`，避免维护两套渲染逻辑。字段依据 [Open Graph 协议](https://ogp.me/)。

根布局设置 `metadataBase`；文章摘要保留现有清洗逻辑，本次只增加风格与年份前缀。`genre` 缺失时不输出空分隔符；标题中的 artist 指音乐人，不误填为文章作者。

爬虫直接访问 `/album/[slug]`，应得到独立详情页及其元信息。先保持拦截弹窗路由不变，通过实际 HTML 检查确认；只有回归发现问题时才补充共享元信息逻辑。

本地 Next.js 16.3.3 的 HTML-limited bot 默认规则已包含 `Discordbot`，未包含 Telegram。当前页面可预渲染，优先验证构建 HTML；若 Telegram UA 下标签仍被流式追加到 body，再补充配置，并保留 Next 默认 bot 行为。不要仅为 Telegram 设置一个正则而覆盖其他默认爬虫。

## 文件分工

实施文件及职责：

| 文件 | 职责 |
| --- | --- |
| `scripts/lib/share-image.mjs` | 独立模板与 PNG 渲染；仅构建脚本引用 |
| `scripts/generate-share-images.mjs` | 读取生成数据、下载封面、生成图片和清单 |
| `assets/share-fonts/*` | 图片使用的本地字体与许可证 |
| `src/lib/share-metadata.ts` | origin 校验、文章分享标题 / 描述 / Metadata 纯函数 |
| `src/app/layout.tsx` | 配置 metadataBase |
| `src/app/album/[slug]/page.tsx` | 引入图片清单，替换封面 URL，补充 canonical 与 OG 字段 |
| `package.json`、`package-lock.json` | 构建依赖、脚本和执行顺序 |
| `.gitignore`、`public/_headers`、`README.md` | 生成产物忽略、图片缓存及部署说明 |
| `scripts/share-images.test.mjs`、`scripts/share-metadata.test.mjs` | 图片管线与元信息测试，沿用 node:test |

## 分步实施

### Task 1：模板与可重复渲染

**Interfaces:** `renderAlbumShareImage(album, coverData: Buffer | null): Promise<Buffer>`，在 `scripts/lib/share-image.mjs` 导出；album 采用现有 Album 字段，字体从本地 assets 读取，不访问网络。

- [ ] 在 `scripts/share-images.test.mjs` 添加测试：PNG 签名正确、尺寸严格为 1200 × 630、缺少 genre 与 coverData 仍能渲染、固定输入生成相同字节。先运行 `node --test scripts/share-images.test.mjs`，确认因渲染函数缺失而失败。
- [ ] 增加两项构建依赖和本地授权字体，实现模板与占位封面，不向应用运行时导出渲染函数。
- [ ] 为中英文、日文、长名称、多艺术家和缺失风格生成样图；检查实际图片及缩至聊天显示大小后的可读性，确认无裁切或缺字。字体缺字用渲染诊断或字体覆盖检查验证，不能只靠测试“不抛异常”。
- [ ] 再次运行测试，所有断言通过；按已确认的 v3 定稿验收字号、对齐和断行，完成一次独立提交。

### Task 2：接入内容生成管线

**Interfaces:** `generateShareImages({ albums, outputDir, manifestPath, fetchImpl }): Promise<void>`，在 `scripts/generate-share-images.mjs` 导出；CLI 入口使用默认生成路径，供 npm 脚本调用，导入时不自动写文件。

- [ ] 为 CLI / 函数添加临时目录、模拟 fetch 测试：每篇文章均有清单项和实际文件；相同封面同次构建只下载一次；同 URL 返回不同字节会改变图片 hash；重复构建无失效清单项；封面超时、HTTP 错误及非图片响应生成占位卡并记录警告。
- [ ] 先运行上述测试确认失败，再实现下载与渲染；封面下载超时 15 秒、失败重试一次，与现有 API 请求约定一致；仅在构建阶段把封面字节嵌入模板。模板、字体、写文件错误直接停止构建。
- [ ] 设置 `content:prepare` 按“现有 prepare-content → generate-share-images”执行，`predev` / `prebuild` 复用该命令。`build:worker` 保持现有 OpenNext 入口，核验它实际调用 Next build 的准备步骤，不新增重复生成。
- [ ] 更新忽略规则、图片缓存配置与 README：包括 SITE_URL、构建环境需安装 devDependencies、封面降级行为、内容变更后重建方式。
- [ ] 运行 `node --test scripts/share-images.test.mjs scripts/prepare-content.test.mjs`；确认旧内容测试通过、新管线测试通过后提交。

### Task 3：为文章输出完整分享元信息

**Interfaces:** `resolveSiteUrl(value: string | undefined, production: boolean): URL` 与 `buildAlbumShareMetadata(album: Album, siteUrl: URL, image: { path: string; width: number; height: number; alt: string }): Metadata`，在 `src/lib/share-metadata.ts` 导出。

- [ ] 按现有 `album-filters.test.mjs` 的 TypeScript 内存编译方式写纯函数测试：生产缺少 / 非 HTTPS / 非 origin 的 SITE_URL 报错；开发默认 localhost；标题包含 name 和 artist；genre 缺失无空分隔符；OG 和 Twitter 指向同一图片；canonical / og:url 为文章地址；带空格或非 ASCII slug 正确编码。
- [ ] 运行 `node --test scripts/share-metadata.test.mjs` 确认失败，再实现纯函数并接入 layout 与文章页。
- [ ] 图片清单必须命中已存在文章，缺项时明确报错，并增加“已知文章缺清单项导致构建失败”的集成断言；不存在的 slug 继续 404，不生成其他专辑的卡片。保留现有页面标题、摘要清洗和 `dynamicParams=false` 行为。
- [ ] 运行 `node --test scripts/share-metadata.test.mjs`、`npm test`、`npm run lint`，确认通过后提交。

### Task 4：部署产物与双平台验收

**Produces:** 一份与真实构建版本对应的验收记录，包含文章 URL、最终图片 URL、抓取结果和平台预览截图；模拟 UA 检查不替代平台实测。

- [ ] 在具备现有网易 API / 内容配置及 SITE_URL 的环境运行 `npm run build:worker`，确认内容准备与分享图仅执行一次；检查生成文章数、图片清单数一致，所有清单文件存在。
- [ ] 使用 OpenNext 本地 preview 检查普通 UA、`Discordbot`、`TelegramBot` 的直接文章 GET：HTTP 200，head 中有对应文章的唯一有效 OG 图片、标题和描述，无 localhost 链接；未知 slug 返回 404。若发现流式元信息问题，再调整 bot 配置并重复检查。
- [ ] 抽查图片 GET：HTTP 200、`Content-Type: image/png`、尺寸 / 文件大小正确、有效缓存头；检查 Worker 运行代码未引入构建脚本或原生渲染模块。
- [ ] 回归首页到弹窗、复制当前地址后直接打开、刷新、返回和前进；新增文章及修改风格后重建，确认图片与元信息更新。
- [ ] 准备公开 HTTPS 预览部署供平台抓取；部署操作在实施阶段按当时授权执行，本计划不触发部署。
- [ ] 由用户在 Telegram Saved Messages 和 Discord 私密测试频道分享英文、中文 / 日文、长标题、无风格四类文章；确认封面与文字一致、缩略时可读、点击进入正确文章。记录平台设置与图片大小差异；封面下载失败用构建测试及占位样图补验。
- [ ] 如果平台抓取失败，依次核验公网连通、HTML 元信息、图片响应、Cloudflare 抓取规则、平台缓存；不能用 curl 成功宣告平台已通过。

## 平台行为及交付边界

- Discord 在链接被分享时抓取标题、描述和图片，也会缓存媒体；应以新测试消息验证，并注意服务端访问是否被阻拦。[Discord 官方说明](https://support.discord.com/hc/en-us/articles/42500550752919-About-Discord-Link-Previews-and-the-Discordbot)。
- Telegram 允许用户调整预览媒体尺寸和位置，因此验收以“正确图片和信息可用”为准，不要求所有客户端统一大图外观。[Telegram 官方说明](https://telegram.org/blog/reply-revolution?setln=en)。
- 自动预览依赖平台启用预览、站点可抓取及平台缓存状态，无法由网站代码强制开启。
- 本次已阅读安装版 Next.js 的 `generate-metadata.md`、`image-response.md`、`opengraph-image.md` 和 `htmlLimitedBots.md`；实施前应确认安装版本未改变。

## 工作量与实施前输入

- 预计 1–2 个工作日：模板 / 字体及样图、构建管线、元信息与自动验证、双平台验收。平台缓存或部署环境问题可能延长验收，以上不是时效承诺。
- 当前可用数据和代码结构足够确定方案；真正实施时需要填写生产 SITE_URL，并提供可公开抓取的预览域名和正常封面来源。
- 视觉已于 2026-10-15 定稿为 v3：左侧完整封面，右下角专辑信息右对齐，无 Album Wall 底部署名；后续按定稿实现，不重复发起视觉方向探索。
- 用户已授权实施；执行结果与尚待上线验收的内容见下方记录。

## 实施记录（2026-10-15）

- 已实现三个小模块：静态图片渲染、构建生成管线、文章分享元信息；未新增运行时服务。
- 已接入 dev / build / content:prepare，生成 24 张图片及清单；图片、生成数据及设计工具临时文件均忽略提交。
- 正式域名为 `https://music.dreamo.ink`；SITE_URL 通过 Next 配置写入构建产物，Worker 不再依赖运行时同名变量。
- 最终完整测试 17/17 通过，涵盖确定性 PNG、像素级排版回归、中日文字、长名称、封面下载与损坏文件降级、内容哈希更新、清单重建和元信息；lint、TypeScript 和完整 OpenNext 构建通过。
- 本地 Workers 预览验证：普通浏览器 / Discordbot / TelegramBot 的初始 head 均有唯一正确 OG PNG、canonical 和 Twitter 大图类型；PNG 200、image/png、1200 × 630、一年 immutable；首页 200，未知文章 404。
- 浏览器回归覆盖首页打开专辑弹窗、刷新为独立详情、前进后退和随机专辑导航。
- 独立代码复查发现的损坏封面与构建域名运行时依赖问题已修复，并分别通过回归测试和重新构建验证；无剩余重要发现。
- 本地未配置真实 NETEASE_API_BASE，因此完整生产构建与 Workers 验证使用明确标识的本地模拟元数据；未发布此测试产物。验证后将本地生成数据还原为正常开发模式的 frontmatter 与占位图。
- 尚待部署后由用户在 Telegram / Discord 实际分享确认平台预览；本轮未向任何聊天发送消息，未提交、推送或部署代码。
