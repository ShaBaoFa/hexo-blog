---
layout: butt
title: Redis保存JSON结构体之String VS HASH
date: 2023-09-26 16:53:32
tags:
category: Redis
cover: /images/redis.png
---

# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
Redis 保存 JSON 结构体如何选择类型，这个问题在我工作中遇到过，当时我选择了 `string` 类型，但是后来发现 `hash` 类型更适合。
但事实上，这个问题并不是那么简单，这里我将结合实际情况，分析一下这个问题。
{% endnote %}

# String
string和hash都是Redis的一种数据结构。string结构常用来缓存用户信息，通常将用户信息结构体使用JSON序列化成字符串，然后将序列化后的字符串存入Redis进行缓存。
string结构体的优点是可以直接存储JSON字符串，缺点是无法对JSON结构体进行增删改查，只能对整个JSON字符串进行覆盖。

{% mermaid %}
classDiagram
class DynamicString {
+len: int
+capacity: int
+data: char[]
}

note for DynamicString "DynamicString 表示 Redis中的动态字符串."
note for DynamicString"它的内部结构类似于 Java 的 ArrayList ，其中 capacity 通常大于 len "

{% endmermaid %}


# Hash
Redis的Hash类似于Java中的Map，可以存储键值对，但是Redis的Hash只能存储字符串类型的键值对，无法存储其他类型的键值对。
不过Redis的Hash为了提高性能，会将Hash的键值对进行压缩，所以Redis的Hash比Java的Map更节省内存。

**以下是HashMap的流程示意图**

{% mermaid %}
graph TD

st[开始节点]:::startEndStyle
cond1{table 是否为空 or length = 0}:::conditionStyle
op1[resize 扩容]:::operationStyle
op2[根据键值 key 计算 hash 值得到插入的数组索引 i]:::operationStyle
cond2{table 的数组索引 i 是否为空}:::conditionStyle
cond3{是否存在 key}:::conditionStyle
op3[将 key-value 插入到 table 的数组索引 i 中]:::operationStyle
op4[将 key 的 value 替换为新的 value]:::operationStyle
cond4{++size > threshold}:::conditionStyle
cond5{table 的数组索引 i 是否为 treeNode}:::conditionStyle
op5[resize 扩容]:::operationStyle
op6[红黑树直接插入 key-value]:::operationStyle
op7[开始遍历链表准备插入]:::operationStyle
cond6{链表长度是否大于 8}:::conditionStyle
op8[将链表转换为红黑树,插入 key-value]:::operationStyle
op9[链表插入 若key存在直接覆盖value]:::operationStyle
e[结束节点]:::startEndStyle

st --> cond1
cond1 -->|No| op1
op1 --> op2
cond1 -->|Yes| op2
op2 --> cond2
cond2 -->|Yes| op3
cond2 -->|No| cond3
cond3 -->|Yes| op4
cond3 -->|No| cond5
cond5 -->|Yes| op6
op6 --> cond4
cond5 -->|No| op7
op7 --> cond6
cond6 -->|Yes| op8
cond6 -->|No| op9
op8 --> cond4
op9 --> cond4
op3 --> cond4
op4 --> cond4
cond4 -->|Yes| op5
op5 --> e
cond4 -->|No| e

classDef startEndStyle fill:#D4EDDA,stroke:#333,stroke-width:2px;
classDef conditionStyle fill:#FFEEBA,stroke:#333,stroke-width:2px;
classDef operationStyle fill:#D5D8DC,stroke:#333,stroke-width:2px;
{% endmermaid %}

压缩的方法是，当Hash的键值对数量小于等于10个时，Redis会将Hash的键值对存储在一块连续的内存中，这样可以减少内存碎片。
Redis中的Hash 和 Java 中的HashMap 区别在于，Redis中hash（字典）的值只能是字符串。另外它们的rehash的方式也不一样，因为Java的HashMap在字典很大时，rehash是个耗时的操作，需要一次性全部rehash。Redis为了高性能，不能堵塞服务，所以采用了渐进式rehash策略。
## 渐进式 rehash 策略
渐进式 rehash 会在 rehash 的同时，保留新旧两个 hash 结构，查询时会同时查询两个 hash结构，然后在后续的定时任务中以及 hash 的子指令中，循序渐进地将旧 hash 的内容一点点迁移到新的 hash 结构中。
当hash移除了最后一个元素之后，该数据结构自动被删除，内存被回收。

**以下是渐进式 rehash 的示意图**

{% mermaid %}
sequenceDiagram
participant Client as 客户端
participant OldHash as 旧hash结构
participant NewHash as 新hash结构
participant BackgroundTask as 后台任务

    Client->>OldHash: 查询元素
    OldHash-->>Client: 返回元素 (如果存在)
    
    Client->>NewHash: 查询元素
    NewHash-->>Client: 返回元素 (如果存在)

    BackgroundTask->>OldHash: 从旧hash中迁移一个元素
    OldHash-->>BackgroundTask: 返回待迁移元素

    BackgroundTask->>NewHash: 将元素加入新hash
    NewHash-->>BackgroundTask: 确认添加成功

    BackgroundTask->>OldHash: 移除迁移的元素
    OldHash-->>BackgroundTask: 确认移除成功
    
    Note over OldHash: 当旧hash为空时<br/>自动被删除，<br/>内存被回收
{% endmermaid %}

# String VS Hash
如果你需要对 JSON 结构体进行增删改查，那么 `hash` 类型是最好的选择，但是如果你只是需要保存 JSON 结构体，那么 `string` 类型也是可以的。

1. 存储整个对象，其中JSON序列化过的字符串作为key
```bash
SET user:{id} '{"name":"Fred","age":25}'
```
- 优势:JSON解析特别块，尤其是一次性查询很多个字段的时候
- 劣势:如果只查询一个字段，速度就显得比较慢了

2. 在hash中存储每个对象的属性
```bash
HMSET user:{id} name "Fred" age 25
```
- 优势:不需要解析json,获取单一字段非常方便。支持更新、删除等操作。
- 劣势:因为不允许单个字段过期，因此不允许嵌套数据结构。

# 题外话

在这次学习过程中，我翻阅了部分redis的文档，其中关于内存优化的内容，让我对redis的hash有了进一步的认知。
某种程度上，上面的一些关于redis-hash的定义是存在错误的（不完全是）。因为redis的开发团队在针对hash的存储进行了优化，只有当哈希超过指定的元素数量或元素大小时，它才会被转换为真正的哈希表。
具体内存优化的内容翻译，我会专门开一篇文章进行翻译。
传送门:[Redis 内存优化](/2023/09/27/archives/redisTec002/) 