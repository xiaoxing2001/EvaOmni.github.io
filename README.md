# EvaOmni project page

蓝紫白配色的纯静态英文项目页。无需 npm、打包或后端，所有图片与数据均在本目录内。

## 本地预览

在仓库根目录运行：

```bash
python3 -m http.server 8000 --directory Webpage
```

打开 <http://localhost:8000>。也可直接打开 `index.html`；复制引用优先使用剪贴板接口，不可用时会选中引用文本供手动复制。Google Fonts 不可用时自动使用系统字体。

## GitHub Pages 部署

**独立网页仓库：** 将 `Webpage` 目录内的全部文件（包含 `.nojekyll`）放到网页仓库根目录，在 Settings → Pages 中选择 Deploy from a branch，选择 `main` 和 `/ (root)`，保存即可。

**放在 EvaOmni 项目仓库内：** 将此目录作为 `Webpage/` 提交，用 GitHub Actions 发布该子目录。把以下文件保存到项目仓库的 `.github/workflows/pages.yml`，然后在 Settings → Pages → Source 中选择 GitHub Actions。若默认分支不是 `main`，同步调整分支名。

```yaml
name: Deploy EvaOmni project page
on:
  push:
    branches: [main]
    paths: ['Webpage/**', '.github/workflows/pages.yml']
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: Webpage
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

所有资源使用相对路径，兼容 `https://用户名.github.io/仓库名/`。此初版仅创建静态文件，尚未发布线上。

## 修改内容

- `index.html`：标题、作者个人主页、Highlights、资源地址、BibTeX，以及无 JavaScript 时的排行榜与首个 case。
- `styles.css`：配色、排版和移动端适配。
- `data.js`：24 个模型和人类参考结果，及三个真实标注样例。分数数组顺序为 `[Acc., C.G., B.G.]`，单位为百分数。
- `script.js`：按分数降序排列、指标/层级/类型筛选、搜索、展开全部模型、切换 Level 样例、证据时间段播放、返回完整视频、复制引用。
- `assets/`：来自项目的吉祥物、论文图及局部裁剪的视觉示例；图标为本地 SVG。

作者、链接、引用和分数来自 `Github/EvaOmni/README.md`；案例来自 `Huggingface/test_file.json`（各 Level 按数据顺序取第一条：Level 1 / QA 2，Level 2 / QA 1，Level 3 / QA 11）。24 个模型默认显示前 10 个，可展开全部。All models 展示总榜名次；Open-weight 和 Proprietary 按当前指标、层级分别从第 1 名排名。各榜前三名显示金、银、铜牌；搜索保留所在榜单的原始名次。每个模型的 logo 来自 `figures/content/evaomni/`，Qwen 和 Doubao 的 PDF 图标已转为 PNG；人类参考单独展示，不参与模型排名。更新分数时同时更新 `data.js` 和 HTML 中的静态表格，以保证无脚本版本与交互版本一致。

## 视频样例

样例左侧通过 YouTube 隐私增强嵌入域名展示原始视频，右侧为完整问题、八个选项、标注答案、音视频证据及已有推理链。点击证据时间段，在左侧播放对应片段；“Full video” 返回完整视频。切换 Level 会替换播放器，停止之前的视频。

视频播放需要访问 YouTube，且取决于原视频是否允许嵌入；无法嵌入时可使用下方原始视频链接。建议通过本地 HTTP 服务或 GitHub Pages 浏览，直接打开本地文件时 YouTube 可能因缺少 HTTP Referer 拒绝播放。
