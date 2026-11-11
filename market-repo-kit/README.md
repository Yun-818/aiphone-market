# 公共集市仓库 · 一键套装

把这个目录里的东西复制到你新建的 GitHub 仓库根目录，就得到一个「任何人都能投稿」的公共货架。

## 复制哪些

```
你的仓库/
├── .github/
│   ├── ISSUE_TEMPLATE/upload.yml     # 投稿表单
│   └── workflows/
│       ├── inbox.yml                 # 收到投稿 → 自动上架
│       └── index.yml                 # packs/ 有变化 → 重建索引
├── scripts/
│   ├── build-index.mjs               # 扫 packs/ 生成 index.json
│   └── inbox.mjs                     # 校验 issue 里的包
├── packs/                            # 所有包放这里（先建个空目录，加个 .gitkeep）
└── index.json                        # 自动生成，一开始可以先放个空的
```

`index.json` 的初始内容：

```json
{ "format": "aiphone-market-index", "version": 1, "name": "公共集市", "items": [] }
```

## 开仓 5 步

1. GitHub 新建一个 **Public** 仓库，名字随意（建议 `aiphone-market`）
2. 复制上面结构里的文件，提交一次
3. 仓库 **Settings → Actions → General → Workflow permissions** 选 **Read and write permissions**，保存
   （不选这个，机器人无法提交）
4. 等 Actions 跑完，仓库根目录会出现 `index.json`
5. 拿到 App 要用的地址：

```
https://cdn.jsdelivr.net/gh/<用户名>/<仓库名>@main/index.json
```

把这个地址填进 [`www/services/market/market-builtin.js`](../../www/services/market/market-builtin.js) 的 `URL` 常量 ——
之后所有装了 App 的人打开集市，不用加任何源就能看到这个仓库里的包。

## 别人怎么投稿

1. 打开仓库 → **Issues** → **New issue** → 选「投稿我的美化」
2. 填名字、类型、说明，把包文件**拖进最后一个框**
3. 点提交

大约 1 分钟后：

```
机器人下载附件 → 校验格式和大小 → 写进 packs/ → 重建 index.json → 提交
→ 回复「已上架」→ 关闭 issue
```

失败也会回复原因（没附文件 / 不是集市包 / 超 5MB / 已经存在）。

## 下架

直接在仓库里删掉 `packs/xxx.json` 并提交，索引会自动重建，所有玩家的货架同步后消失。
**已经在别人手机里装好的不受影响**——这是有意的，作者撤包不该把用户的东西删掉。

## 为什么不用域名、不用服务器

- 包和索引都在仓库里，`jsDelivr` 免费给 CDN，国内可达性好
- 机器人跑在 GitHub Actions 上，公开仓库免费
- 唯一的门槛：投稿者需要一个 GitHub 账号

## 容量

- 单包 ≤5MB，单文件 GitHub 上限 100MB（我们用不到）
- 仓库建议控制在 1GB 以内；几千个包之后再考虑按分类拆仓库（App 支持多个源）
