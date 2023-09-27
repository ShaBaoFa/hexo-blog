---
layout: butt
title: butt-文章发布格式
date: 2023-09-13 17:06:23
---

{% note purple 'far fa-hand-scissors' flat %}
剪刀石头布
{% endnote %}


{% mermaid %}
pie
title Key elements in Product X
"Calcium" : 42.96
"Potassium" : 50.05
"Magnesium" : 10.01
"Iron" :  5
{% endmermaid %}

This is my website, click the button 
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block center larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,green larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline green larger %}

{% tabs test2, 3 %}
<!-- tab -->
**This is Tab 1.**
<!-- endtab -->

<!-- tab -->
**This is Tab 2.**
<!-- endtab -->

<!-- tab -->
**This is Tab 3.**
<!-- endtab -->
{% endtabs %}


你看我长得漂亮不

![](https://i.loli.net/2021/03/19/2P6ivUGsdaEXSFI.png)

我觉得很漂亮 {% inlineImg https://i.loli.net/2021/03/19/5M4jUB3ynq7ePgw.png 150px %}


```flow

st=>start: 开始节点

cond1=>condition: table 是否为空 or length = 0

op1=>operation: resize 扩容

op2=>operation: 根据键值 key 计算 hash 值得倒插入的数组索引 i

cond2=>condition: table[i] 是否为空

cond3=>condition: 是否存在 key

op3=>operation: 将 key-value 插入到 table[i] 中

op4=>operation: 将 key 的 value 替换为新的 value

cond4=>condition: ++size > threshold

cond5=>condition: table[i] 是否为 treeNode

op5=>operation: resize 扩容

op6=>operation: 红黑树直接插入 key-value

op7=>operation: 开始遍历链表准备插入

cond6=>condition: 链表长度是否大于 8

op8=>operation: 将链表转换为红黑树,插入 key-value

op9=>operation: 链表插入 若key存在直接覆盖value

e=>end: 结束节点

st(bottom)->cond1

cond1(no)->op1->op2

cond1(yes)->op2

op2->cond2

cond2(yes)->op3

cond2(no)->cond3

cond3(yes)->op4

cond3(no)->cond5

cond5(yes)->op6->cond4

cond5(no)->op7->cond6

cond6(yes)->op8(left)->cond4

cond6(no)->op9->cond4

op3->cond4

op4->cond4

cond4(yes)->op5->e

cond4(no)->e

```