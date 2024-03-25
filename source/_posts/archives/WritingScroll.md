---
title: 写作宝典
description: 编写一篇新文章，从新建文件起到静态托管的全流程
sticky: 5
keywords: Butterfly, Hexo, markdown
top_img: /images/archive/books.jpg
cover: /images/archive/books.jpg
tags:
  - markdown
categories:
  - Archives
date: 2022-07-03 16:56:44
updated: 2022-07-06 15:06:44
---

> 仅适用于本博客，若要原封不用的使用，请参考[建站宝典](/archives/BuildingScroll)

> 写作约定: 以双花括号 `{{ }}` 包裹起来的字符串为参数名，实际使用时需要{% label 将参数名连同双花括号 orange %}一同替换为{% label 具体的内容 green %}

## 文章发布基本流程

### 新建文件

```bash
hexo new butt "{{title}}" -p {{folder}}/{{file_name}}
```

| 名称              | 用法  |
|-----------------|-----|
| `{{title}}`     | 标题  |
| `{{folder}}`    | 文件夹 |
| `{{file_name}}` | 文件名 |

例如

```bash
hexo new butt "写作宝典" -p archives/WritingScroll
```

### 运行本地环境进行预览

```bash
./local_server.sh
```

### 部署至 OSS

```bash
./upload_oss.sh
```

## 美化

### 字体图标

Butterfly支持 [font-awesome v6](https://fontawesome.com/icons) 图标.

### 标签外挂

```markdown
{% note {{color}} {{icon}} {{style}} %}
Any content (support inline tags too.io).
{% endnote %}
```

| 名称 | 用法 |
| ----- | ----- |
| `{{color}}` | 【可选】顔色 (default / blue / pink / red / purple / orange / green) |
| `{{icon}}` | 【可选】可配置自定义 icon (只支持 [font-awesome v6](https://fontawesome.com/icons) 图标, 也可以配置 no-icon ) |
| `{{style}}` | 【可选】可以覆盖配置中的 style（simple/modern/flat/disabled） |


```markdown  eg:
{% note purple 'far fa-hand-scissors' flat %}
剪刀石头布
{% endnote %}
```

### 按钮

```markdown
{% btn {{url}}, {{text}}, {{icon}}, {{color}} {{style}} {{layout}} {{position}} {{size}} %}
```

| 名称 | 用法 |
| ----- | ----- |
| `{{url}}` | 链接 |
| `{{text}}` | 按钮文字 |
| `{{icon}}` | [可选] 图标 |
| `{{color}}` | [可选] 按钮背景顔色(默认style时）|
|  | 按钮字体和边框顔色(outline时) |
|  | default/blue/pink/red/purple/orange/green |
| `{{style}}` | [可选] 按钮样式 默认实心; outline/留空 |
| `{{layout}}` | [可选] 按钮佈局 默认为line; block/留空 |
| `{{position}}` | [可选] 按钮位置 前提是设置了layout为block 默认为左边; center/right/留空 |
| `{{size}}` | [可选] 按钮大小; larger/留空 |

```markdown eg:
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block center larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,green larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline green larger %}
```

### label

```markdown
{% label {{text}} {{color}} %}
```

| 参数 | 解释 |
| ----- | ----- |
| `{{text}}` | 文字 |
| `{{color}}` | 【可选】背景颜色，默认为 default |
|  | default/blue/pink/red/purple/orange/green |

```markdown  eg:
臣亮言：{% label 先帝 %}创业未半，而{% label 中道崩殂 blue %}。今天下三分，{% label 益州疲敝 pink %}，此诚{% label 危急存亡之秋 red %}也！然侍衞之臣，不懈于内；{% label 忠志之士 purple %}，忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气；不宜妄自菲薄，引喻失义，以塞忠谏之路也。
宫中、府中，俱为一体；陟罚臧否，不宜异同。若有{% label 作奸 orange %}、{% label 犯科 green %}，及为忠善者，宜付有司，论其刑赏，以昭陛下平明之治；不宜偏私，使内外异法也。
```

臣亮言：{% label 先帝 %}创业未半，而{% label 中道崩殂 blue %}。今天下三分，{% label 益州疲敝 pink %}，此诚{% label 危急存亡之秋 red %}也！然侍衞之臣，不懈于内；{% label 忠志之士 purple %}，忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气；不宜妄自菲薄，引喻失义，以塞忠谏之路也。
宫中、府中，俱为一体；陟罚臧否，不宜异同。若有{% label 作奸 orange %}、{% label 犯科 green %}，及为忠善者，宜付有司，论其刑赏，以昭陛下平明之治；不宜偏私，使内外异法也。

## 排版

### 绘图

使用mermaid标籤可以绘製Flowchart（流程图）、Sequence diagram（时序图 ）、Class Diagram（类别图）、State Diagram（状态图）、Gantt（甘特图）和Pie Chart（圆形图），具体可以查看 [mermaid](https://mermaid-js.github.io/mermaid/#/) 文档

### 选项卡

```markdown
{% tabs {{unique_name}}, {{index}} %}
<!-- tab {{tab_caption}} {{@icon}} -->
Any content (support inline tags too).
<!-- endtab -->
{% endtabs %}
```

| 名称 | 用法 |
| ----- | ----- |
| `{{unique_name}}` | 选项卡名称，不可使用逗号 |
|  | 只需在当前页面唯一 |
| `{{index}}` | 默认选中的序号 |
|  | 如果未设置则默认选中第一个 |
|  | 如果设置为 -1 则默认收起全部 |
| `{{tab_caption}}` | 选项卡标题 |
| `{{@icon}}` | 图标，只支持 [font-awesome v6](https://fontawesome.com/icons) 图标 |

```markdown  eg:
{% tabs test 2 %}
<!-- tab 第一个Tab -->
**tab名字为第一个Tab**
<!-- endtab -->

<!-- tab @fab fa-apple-pay -->
**只有图标 没有Tab名字**
<!-- endtab -->

<!-- tab 炸弹@fas fa-bomb -->
**名字+icon**
<!-- endtab -->
{% endtabs %}
```
