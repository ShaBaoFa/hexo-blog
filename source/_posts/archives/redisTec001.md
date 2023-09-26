---
layout: butt
title: Redis保存JSON结构体如何选择类型
date: 2023-09-26 16:53:32
tags:
category: Redis
---

# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
Redis 保存 JSON 结构体如何选择类型，这个问题在我工作中遇到过，当时我选择了 `string` 类型，但是后来发现 `hash` 类型更适合。
但事实上，这个问题并不是那么简单，这里我将结合实际情况，分析一下这个问题。
如果你需要对 JSON 结构体进行增删改查，那么 `hash` 类型是最好的选择，但是如果你只是需要保存 JSON 结构体，那么 `string` 类型也是可以的。
在正式开始之前，先了解一下 `hash` 和 `string` 类型的区别。
{% endnote %}

# String
string和hash都是Redis的一种数据结构。string结构常用来缓存用户信息，通常将用户信息结构体使用JSON序列化成字符串，然后将序列化后的字符串存入Redis进行缓存。
string结构体的优点是可以直接存储JSON字符串，缺点是无法对JSON结构体进行增删改查，只能对整个JSON字符串进行覆盖。

# Hash
Redis的Hash类似于Java中的Map，可以存储键值对，但是Redis的Hash只能存储字符串类型的键值对，无法存储其他类型的键值对。
不过Redis的Hash为了提高性能，会将Hash的键值对进行压缩，所以Redis的Hash比Java的Map更节省内存。
压缩的方法是，当Hash的键值对数量小于等于10个时，Redis会将Hash的键值对存储在一块连续的内存中，这样可以减少内存碎片。
Redis中的Hash 和 Java 中的HashMap 区别在于，Redis中hash（字典）的值只能是字符串。另外它们的rehash的方式也不一样，因为Java的HashMap在字典很大时，rehash是个耗时的操作，需要一次性全部rehash。Redis为了高性能，不能堵塞服务，所以采用了渐进式rehash策略。
![img.png](/images/redis/hashmap.png)
## 渐进式 rehash 策略
渐进式 rehash 会在 rehash 的同时，保留新旧两个 hash 结构，查询时会同时查询两个 hash结构，然后在后续的定时任务中以及 hash 的子指令中，循序渐进地将旧 hash 的内容一点点迁移到新的 hash 结构中。
当hash移除了最后一个元素之后，该数据结构自动被删除，内存被回收。
{% mermaid %}
classDiagram
class BankAccount
BankAccount : +String owner
BankAccount : +Bigdecimal balance
BankAccount : +deposit(amount)
BankAccount : +withdrawal(amount)
{% endmermaid %}
```flow
st=>start: 开始节点
in=>inputoutput: 输入
e=>end: 结束节点
op=>operation: 操作节点
cond=>condition: 条件节点
sub=>subroutine: 子例程
out=>inputoutput: 输出
st(right)->in->op->cond
cond(yes,right)->out->e
cond(no)->sub
```