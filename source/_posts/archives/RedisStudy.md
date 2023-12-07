---
layout: butt
title: Redis命令大全
mathjax: true
date: 2023-09-19 15:36:07
tags:
category: Redis
---

# 前言

写这篇Redis基础学习的文章的目的，主要是为了巩固自己对Redis的基础知识的掌握和归档。之后会涉及到的，包括但不限于Redis使用场景介绍,Redis的可存储数据类型（命令大全）,主从设置，哨兵模式等。

# 介绍

Redis是一个开源的内存数据库，它可以用来存储和管理数据（单键值对默认最大支持512MB大小数据，可以通过配置参数 `maxmemory`来进行调整）。Redis的名字是"Remote Dictionary Server"的缩写，它最初是一个键值对存储系统，但后来发展成一个多功能的数据存储和缓存系统。并且它是经典的NOSQL数据库。

## 使用场景

- **缓存层**：Redis作为缓存层，可以加速应用程序对数据库的访问，减轻数据库负载，提高性能。

- **会话存储**：Redis可用于存储用户会话数据，适用于构建具有状态的Web应用程序。

- **计数器和排行榜**：Redis的原子操作使其非常适合用于实时计数和排行榜应用。

- **消息队列**：Redis的发布订阅功能使其可以用作消息队列，用于处理异步任务。

- **实时分析**：Redis支持复杂的数据结构，可以用于实时数据分析和统计。

## 支持的数据类型

- **字符串（Strings）**：存储文本或二进制数据。

- **列表（Lists）**：有序的字符串元素列表，可以用于实现队列或堆栈。

- **集合（Sets）**：无序的唯一元素集合。

- **有序集合（Sorted Sets）**：与集合类似，但每个元素都关联一个分数，用于实现排名和范围查询。

- **散列（Hashes）**：存储字段和与之相关联的值，类似于关联数组。

- **位图（Bitmaps）**：位级别的操作，可用于实现布隆过滤器等。

- **位域（Bitfields）**： Redis允许你对字符串进行位级别的操作，这在某些场景下非常有用，比如实现布隆过滤器或处理二进制数据。

- **流（Streams）**： Streams是Redis的消息数据结构，可以用于日志处理和消息传递。它支持按时间顺序存储消息，每个消息都有一个唯一的ID，适用于实时事件处理。

- **地理空间（Geospatial indices）**： Redis支持地理位置数据类型，可以用来存储地理位置信息（如经度和纬度），并执行地理位置相关的查询，如附近的位置搜索。

- **基数统计（HyperLogLog）**： HyperLogLog是一种用于估算集合基数（不重复元素数量）的数据结构，它以极小的内存占用估算大型数据集的基数，适用于大规模数据的统计分析。

- **发布订阅（Pub/Sub）**： Redis支持发布订阅模式，可以用于构建消息系统。

# 命令

## 字符串（Strings）

### APPEND

- **语法**
  ```bash
  APPEND key value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$（不考虑平均每次增加字符串的长度）

- **命令描述**
  如果key已经存在并且是一个字符串，APPEND命令将value追加到key原来的值的末尾。如果key不存在，APPEND就简单地将给定key设为value。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 将"World"追加到"Hello"
SET mykey "Hello"
APPEND mykey " World"  # 返回值为11，因为"Hello World"的长度为11。
```

### DECR

- **语法**
  ```bash
  DECR key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将key中储存的数字值减一。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey 10
DECR mykey  # 返回值为9。
```

### DECRBY

- **语法**
  ```bash
  DECRBY key decrement
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将key所储存的值减去给定的decrement。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey 10
DECRBY mykey 3  # 返回值为7。
```

### GET

- **语法**
  ```bash
  GET key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  返回key所关联的字符串值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey "Hello"
GET mykey  # 返回："Hello"
```

### GETDEL

- **语法**
  ```bash
  GETDEL key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  返回key的值，并将key从数据库中删除。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey "Hello"
GETDEL mykey  # 返回："Hello"，同时key被删除。
```

### GETEX

- **语法**
  ```bash
  GETEX key [PERSIST][EX seconds][PX milliseconds][EXAT timestamp][PXAT milliseconds-timestamp]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取key的值，并为key设置新的过期时间。

- **命令选项**
    - **PERSIST** : 移除给定key的过期时间。
    - **EX seconds** : 设置key的过期时间，单位为秒。
    - **PX milliseconds** : 设置key的过期时间，单位为毫秒。
    - **EXAT timestamp** : 设置key在给定的Unix时间戳时过期。
    - **PXAT milliseconds-timestamp** : 设置key在给定的Unix时间戳毫秒数时过期。

- **Examples**

```bash
SET mykey "Hello"
GETEX mykey EX 10  # 返回："Hello"，并将key的过期时间设置为10秒。
```

### GETRANGE

- **语法**
  ```bash
  GETRANGE key start end
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是返回的字符串的长度。

- **命令描述**
  返回key中字符串值的子字符串，子字符串由start和end两个偏移量决定。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey "This is a test"
GETRANGE mykey 0 3  # 返回："This"
```

### GETSET

- **语法**
  ```bash
  GETSET key value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将key的值设为value，并返回key的旧值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey "Hello"
GETSET mykey "World"  # 返回："Hello"
```

### INCR

- **语法**
  ```bash
  INCR key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将key中存储的数字值加一。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey 10
INCR mykey  # 返回值为11。
```

### INCRBY

- **语法**
  ```bash
  INCRBY key increment
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将key所存储的值增加给定的increment。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey 10
INCRBY mykey 5  # 返回值为15。
```

### INCRBYFLOAT

- **语法**
  ```bash
  INCRBYFLOAT key increment
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将key所存储的值增加给定的浮点increment。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey 10.5
INCRBYFLOAT mykey 1.5  # 返回值为12。
```

### LCS

- **语法**
  ```bash
  LCS key1 key2 [LEN] [IDX] [MINMATCHLEN min-match-len] [WITHMATCHLEN]
  ```
- **时间复杂度**
  $\( \mathcal{O}(M*N) \)$，其中M和N是两个字符串的长度。
- **命令描述**
  返回两个字符串的最长公共子串。
- **命令选项**
    - **LEN** : 返回最长公共子串的长度。
    - **IDX** : 返回最长公共子串在第一个字符串中的起始位置。
    - **MINMATCHLEN min-match-len** : 设置最小匹配长度。
    - **WITHMATCHLEN** : 返回最长公共子串及其长度。
- **Examples**

```bash
SET key1 "abcdef"
SET key2 "cdefgh"
LCS key1 key2  # 返回："cdef"
```

### MGET

- **语法**
  ```bash
  MGET key1 [key2...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是给定key的数量。

- **命令描述**
  返回所有给定key的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET key1 "Hello"
SET key2 "World"
MGET key1 key2  # 返回：["Hello", "World"]
```

### MSET

- **语法**
  ```bash
  MSET key1 value1 [key2 value2...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是给定key的数量。

- **命令描述**
  同时设置一个或多个key-value对。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
MSET key1 "Hello" key2 "World"
```

### MSETNX

- **语法**
  ```bash
  MSETNX key1 value1 [key2 value2...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是给定key的数量。

- **命令描述**
  同时设置一个或多个key-value对，仅当所有给定key都不存在。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
MSETNX key1 "Hello" key2 "World"  # 如果key1和key2都不存在，则设置它们的值。
```

### PSETEX

- **语法**
  ```bash
  PSETEX key milliseconds value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  设置key的值和过期时间（毫秒级）。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
PSETEX mykey 1000 "Hello"  # 设置key的值为"Hello"，并在1000毫秒后过期。
```

### SET

- **语法**
  ```bash
  SET key value [EX seconds] [PX milliseconds] [NX|XX]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  设置key的值。可以指定过期时间和其他选项。

- **命令选项**
    - **EX seconds** : 设置键的过期时间为seconds秒。
    - **PX milliseconds** : 设置键的过期时间为milliseconds毫秒。
    - **NX** : 仅在键不存在时，才对键进行设置操作。
    - **XX** : 仅在键已经存在时，才对键进行设置操作。

- **Examples**

```bash
SET mykey "Hello" EX 10
```

### SETEX

- **语法**
  ```bash
  SETEX key seconds value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  设置key的值和过期时间。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SETEX mykey 10 "Hello"  # 设置key的值为"Hello"，并在10秒后过期。
```

### SETNX

- **语法**
  ```bash
  SETNX key value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  仅在key不存在时，才设置key的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SETNX mykey "Hello"  # 如果mykey不存在，则设置其值为"Hello"。
```

### SETRANGE

- **语法**
  ```bash
  SETRANGE key offset value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$ 如果新的值和旧的值有相同的长度，否则 $\( \mathcal{O}(value.length) \)$

- **命令描述**
  从指定的偏移量开始，覆盖key储存的字符串值的子字符串。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey "Hello World"
SETRANGE mykey 6 "Redis"  # mykey的值变为"Hello Redis"
```

### STRLEN

- **语法**
  ```bash
  STRLEN key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  返回key储存的字符串值的长度。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey "Hello World"
STRLEN mykey  # 返回值为11。
```

### SUBSTR

- **语法**
  ```bash
  SUBSTR key start end
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是返回的字符串的长度。

- **命令描述**
  返回key中字符串值的子字符串，子字符串由start和end两个偏移量决定。这个命令已经过时，建议使用GETRANGE。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SET mykey "This is a test"
SUBSTR mykey 0 3  # 返回："This"
```

## 列表（Lists）

### BLMOVE

- **语法**
  ```bash
  BLMOVE source destination LEFT|RIGHT LEFT|RIGHT timeout
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  从`source`列表的头部或尾部移动一个元素到`destination`列表的头部或尾部。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BLMOVE sourceList destList LEFT RIGHT 10
```

### BLMPOP

- **语法**
  ```bash
  BLMPOP timeout key [key ...] LEFT|RIGHT
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  从一个或多个列表的左侧或右侧移除并获取第一个元素，或在超时前阻塞直到有可用元素为止。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BLMPOP 10 myList LEFT
```

### BLPOP

- **语法**
  ```bash
  BLPOP key [key ...] timeout
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  移除并返回列表的第一个元素，或在超时前阻塞直到有可用元素为止。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BLPOP myList 10
```

### BRPOP

- **语法**
  ```bash
  BRPOP key [key ...] timeout
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  移除并返回列表的最后一个元素，或在超时前阻塞直到有可用元素为止。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BRPOP myList 10
```

### BRPOPLPUSH

- **语法**
  ```bash
  BRPOPLPUSH source destination timeout
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  从一个列表的尾部移除一个元素，并将其添加到另一个列表的头部，或在超时前阻塞直到有可用元素为止。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BRPOPLPUSH myList1 myList2 10
```

### LINDEX

- **语法**
  ```bash
  LINDEX key index
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是列表的长度。

- **命令描述**
  通过索引获取列表中的元素。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LINDEX myList 2  # 获取列表myList中索引为2的元素。
```

### LINSERT

- **语法**
  ```bash
  LINSERT key BEFORE|AFTER pivot value
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是列表的长度。

- **命令描述**
  在列表中的元素前或后插入一个值。

- **命令选项**
    - **BEFORE** : 在pivot元素之前插入。
    - **AFTER** : 在pivot元素之后插入。

- **Examples**

```bash
LINSERT myList BEFORE "world" "hello"
```

### LLEN

- **语法**
  ```bash
  LLEN key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  返回列表的长度。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LLEN myList  # 返回列表myList的长度。
```

### LMOVE

- **语法**
  ```bash
  LMOVE source destination LEFT|RIGHT LEFT|RIGHT timeout
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  从source列表的头部或尾部移动一个元素到destination列表的头部或尾部。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LMOVE sourceList destList LEFT RIGHT 10
```

### LMPOP

- **语法**
  ```bash
  LMPOP timeout key [key ...] LEFT|RIGHT
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  从一个或多个列表的左侧或右侧移除并获取第一个元素，或在超时前阻塞直到有可用元素为止。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LMPOP 10 myList LEFT
```

### LPOP

- **语法**
  ```bash
  LPOP key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  移除并返回列表的第一个元素。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LPOP myList
```

### LPOS

- **语法**
  ```bash
  LPOS key element [RANK rank] [COUNT num]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是列表的长度。

- **命令描述**
  查找列表中元素的位置，可以指定元素的排名和数量。

- **命令选项**
    - **RANK rank** : 查找排名大于等于rank的元素。
    - **COUNT num** : 返回最多num个匹配的元素。

- **Examples**

```bash
LPOS myList "world" RANK 2 COUNT 3  # 查找列表myList中排名大于等于2且最多3个的元素。
```

### LPUSH

- **语法**
  ```bash
  LPUSH key value [value ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是列表的长度。

- **命令描述**
  将一个或多个值插入列表的头部。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LPUSH myList "value1" "value2"
```

### LPUSHX

- **语法**
  ```bash
  LPUSHX key value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将值插入到已存在的列表的头部。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LPUSHX myList "value3"
```

### LRANGE

- **语法**
  ```bash
  LRANGE key start stop
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是返回的元素的数量。

- **命令描述**
  返回列表中指定范围内的元素。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LRANGE myList 0 2  # 返回列表myList中索引为0到2的元素。
```

### LREM

- **语法**
  ```bash
  LREM key count value
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是列表的长度。

- **命令描述**
  移除列表中与给定值相等的元素。

- **命令选项**
    - **count** : 控制移除操作的数量，可以是正数、负数或零。
        - 正数：从列表的头部开始移除指定数量的元素。
        - 负数：从列表的尾部开始移除指定数量的元素。
        - 零：移除所有与给定值相等的元素。

- **Examples**

```bash
LREM myList 2 "value"
```

### LSET

- **语法**
  ```bash
  LSET key index value
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是列表的长度。

- **命令描述**
  设置列表中指定索引位置的元素值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LSET myList 1 "new_value"
```

### LTRIM

- **语法**
  ```bash
  LTRIM key start stop
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是被移除的元素的数量。

- **命令描述**
  修剪列表，只保留指定范围内的元素。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
LTRIM myList 0 2  # 保留列表myList中索引为0到2的元素，移除其他元素。
```

### RPOP

- **语法**
  ```bash
  RPOP key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  移除并返回列表的最后一个元素。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
RPOP myList
```

### RPOPLPUSH

- **语法**
  ```bash
  RPOPLPUSH source destination
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  移除源列表的最后一个元素，并将其添加到目标列表的头部。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
RPOPLPUSH myList1 myList2
```

### RPUSH

- **语法**
  ```bash
  RPUSH key value [value ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是列表的长度。

- **命令描述**
  将一个或多个值插入列表的尾部。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
RPUSH myList "value1" "value2"
```

### RPUSHX

- **语法**
  ```bash
  RPUSHX key value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将值插入到已存在的列表的尾部。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
RPUSHX myList "value3"
```

## 集合（Sets）

### SADD

- **语法**
  ```bash
  SADD key member [member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$ 平均复杂度。

- **命令描述**
  将一个或多个成员添加到集合中。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SADD myset "member1" "member2"
```

### SCARD

- **语法**
  ```bash
  SCARD key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取集合的成员数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SCARD myset  # 获取集合myset的成员数量。
```

### SDIFF

- **语法**
  ```bash
  SDIFF key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是所有集合的成员数量的总和。

- **命令描述**
  返回多个集合的差集，即属于第一个集合但不属于其他集合的成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SDIFF set1 set2  # 返回set1中属于set1但不属于set2的成员。
```

### SDIFFSTORE

- **语法**
  ```bash
  SDIFFSTORE destination key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是所有集合的成员数量的总和。

- **命令描述**
  计算多个集合的差集，并将结果保存到目标集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SDIFFSTORE resultSet set1 set2  # 计算set1和set2的差集，并将结果保存到resultSet。
```

### SINTER

- **语法**
  ```bash
  SINTER key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是所有集合的成员数量的总和。

- **命令描述**
  返回多个集合的交集，即同时属于所有集合的成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SINTER set1 set2  # 返回set1和set2的交集。
```

### SINTERCARD

- **语法**
  ```bash
  SINTERCARD key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是所有集合的成员数量的总和。

- **命令描述**
  获取多个集合的交集的成员数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SINTERCARD set1 set2  # 获取set1和set2的交集的成员数量。
```

### SINTERSTORE

- **语法**
  ```bash
  SINTERSTORE destination key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是所有集合的成员数量的总和。

- **命令描述**
  计算多个集合的交集，并将结果保存到目标集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SINTERSTORE resultSet set1 set2  # 计算set1和set2的交集，并将结果保存到resultSet。
```

### SISMEMBER

- **语法**
  ```bash
  SISMEMBER key member
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  检查一个成员是否属于集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SISMEMBER myset "member1"  # 检查"member1"是否属于myset集合。
```

### SMEMBERS

- **语法**
  ```bash
  SMEMBERS key
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是集合的成员数量。

- **命令描述**
  返回集合中的所有成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SMEMBERS myset  # 返回myset集合中的所有成员。
```

### SMISMEMBER

- **语法**
  ```bash
  SMISMEMBER key member [member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是集合的成员数量。

- **命令描述**
  检查一个或多个成员是否属于集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SMISMEMBER myset "member1" "member2"  # 检查"member1"和"member2"是否属于myset集合。
```

### SMOVE

- **语法**
  ```bash
  SMOVE source destination member
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将一个成员从源集合移动到目标集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SMOVE sourceSet destSet "member1"  # 将"member1"从sourceSet移动到destSet。
```

### SPOP

- **语法**
  ```bash
  SPOP key [count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是移除的成员数量。

- **命令描述**
  随机移除集合中的一个或多个成员，并返回被移除的成员。

- **命令选项**
    - **count** : 指定要移除的成员数量。

- **Examples**

```bash
SPOP myset  # 随机移除myset集合中的一个成员。
SPOP myset 3  # 随机移除myset集合中的3个成员。
```

### SRANDMEMBER

- **语法**
  ```bash
  SRANDMEMBER key [count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是返回的成员数量。

- **命令描述**
  返回集合中的一个或多个随机成员，不移除成员。

- **命令选项**
    - **count** : 指定要返回的成员数量。如果为负数，则会返回不同的成员。

- **Examples**

```bash
SRANDMEMBER myset  # 返回myset集合中的一个随机成员。
SRANDMEMBER myset 3  # 返回myset集合中的3个随机成员，可能包含重复的成员。
SRANDMEMBER myset -3  # 返回myset集合中的3个不同的随机成员。
```

### SREM

- **语法**
  ```bash
  SREM key member [member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是被移除的成员数量。

- **命令描述**
  从集合中移除一个或多个成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SREM myset "member1" "member2"  # 从myset集合中移除"member1"和"member2"。
```

### SSCAN

- **语法**
  ```bash
  SSCAN key cursor [MATCH pattern] [COUNT count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$ 每次调用的时间复杂度，但需要多次调用才能遍历整个集合。

- **命令描述**
  遍历集合中的所有成员，使用游标来进行分页遍历。

- **命令选项**
    - **MATCH pattern** : 指定匹配的模式。
    - **COUNT count** : 指定每次迭代返回的元素数量。

- **Examples**

```bash
SSCAN myset 0 MATCH "member*" COUNT 10  # 遍历myset集合中以"member"开头的成员，每次返回10个。
```

### SUNION

- **语法**
  ```bash
  SUNION key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是所有集合的成员数量的总和。

- **命令描述**
  返回多个集合的并集，即包含所有集合的成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SUNION set1 set2  # 返回set1和set2的并集。
```

### SUNIONSTORE

- **语法**
  ```bash
  SUNIONSTORE destination key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是所有集合的成员数量的总和。

- **命令描述**
  计算多个集合的并集，并将结果保存到目标集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
SUNIONSTORE resultSet set1 set2  # 计算set1和set2的并集，并将结果保存到resultSet。
```

## 有序集合（Sorted Sets）

### BZMPOP

- **语法**
  ```bash
  BZMPOP timeout key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  阻塞式弹出一个或多个有序集合中的最大分值的成员，直到超时或有成员可用。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BZMPOP 10 myzset  # 阻塞式弹出myzset中的最大分值成员，最长等待10秒。
```

### BZPOPMAX

- **语法**
  ```bash
  BZPOPMAX timeout key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  阻塞式弹出一个或多个有序集合中的最大分值的成员，直到超时或有成员可用。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BZPOPMAX 10 myzset1 myzset2  # 阻塞式弹出myzset1和myzset2中的最大分值成员，最长等待10秒。
```

### BZPOPMIN

- **语法**
  ```bash
  BZPOPMIN timeout key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  阻塞式弹出一个或多个有序集合中的最小分值的成员，直到超时或有成员可用。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
BZPOPMIN 10 myzset1 myzset2  # 阻塞式弹出myzset1和myzset2中的最小分值成员，最长等待10秒。
```

### ZADD

- **语法**
  ```bash
  ZADD key [NX|XX] [CH] [INCR] score member [score member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是要被添加的成员数量。

- **命令描述**
  向有序集合中添加一个或多个成员，或者更新已存在成员的分值。

- **命令选项**
    - **NX** : 仅在成员不存在时添加成员。
    - **XX** : 仅在成员已存在时更新成员。
    - **CH** : 修改返回值为被修改的成员数量，而不是新增和更新的成员数量。
    - **INCR** : 通过分值的增量添加成员。

- **Examples**

```bash
ZADD myzset 1 "member1"  # 向myzset中添加"member1"，分值为1。
ZADD myzset NX CH 2 "member2"  # 仅在"member2"不存在时，向myzset中添加"member2"，分值为2，返回1。
```

### ZCARD

- **语法**
  ```bash
  ZCARD key
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取有序集合的成员数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZCARD myzset  # 获取myzset有序集合的成员数量。
```

### ZCOUNT

- **语法**
  ```bash
  ZCOUNT key min max
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是指定范围内的成员数量。

- **命令描述**
  计算有序集合中分值在指定范围内的成员数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZCOUNT myzset 2 4  # 计算myzset中分值在2和4之间的成员数量。
```

### ZDIFF

- **语法**
  ```bash
  ZDIFF numkeys key [key ...] [WITHSCORES]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是所有输入有序集合的成员数量的总和。

- **命令描述**
  计算多个有序集合

之间的差集。

- **命令选项**
    - **WITHSCORES** : 返回成员及其分值。

- **Examples**

```bash
ZDIFF 2 myzset1 myzset2 WITHSCORES  # 计算myzset1和myzset2之间的差集，返回成员及其分值。
```

### ZDIFFSTORE

- **语法**
  ```bash
  ZDIFFSTORE destination numkeys key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是所有输入有序集合的成员数量的总和。

- **命令描述**
  计算多个有序集合之间的差集，并将结果保存到目标有序集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZDIFFSTORE myzset3 2 myzset1 myzset2  # 计算myzset1和myzset2之间的差集，并将结果保存到myzset3。
```

### ZINCRBY

- **语法**
  ```bash
  ZINCRBY key increment member
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  为有序集合中的成员增加分值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZINCRBY myzset 2 "member1"  # 将myzset中"member1"的分值增加2。
```

### ZINTER

- **语法**
  ```bash
  ZINTER numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N) + M \log(M)) \)$ 其中N是最小输入有序集合的基数，M是输入有序集合的个数。

- **命令描述**
  计算多个有序集合的交集。

- **命令选项**
    - **WEIGHTS weight [weight ...]** : 指定输入有序集合的权重。
    - **AGGREGATE SUM|MIN|MAX** : 指定聚合方式。

- **Examples**

```bash
ZINTER 2 myzset1 myzset2 WEIGHTS 2 3 AGGREGATE SUM  # 计算myzset1和myzset2的交集，按照权重2和3相加。
```

### ZINTERCARD

- **语法**
  ```bash
  ZINTERCARD numkeys key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是最小输入有序集合的基数。

- **命令描述**
  获取多个有序集合的交集的成员数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZINTERCARD 2 myzset1 myzset2  # 获取myzset1和myzset2的交集的成员数量。
```

### ZINTERSTORE

- **语法**
  ```bash
  ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N) + M \log(M)) \)$ 其中N是最小输入有序集合的基数，M是输入有序集合的个数。

- **命令描述**
  计算多个有序集合的交集，并将结果保存到目标有序集合。

- **命令选项**
    - **WEIGHTS weight [weight ...]** : 指定输入有序集合的权重。
    - **AGGREGATE SUM|MIN|MAX** : 指定聚合方式。

- **Examples**

```bash
ZINTERSTORE myzset3 2 myzset1 myzset2 WEIGHTS 2 3 AGGREGATE SUM  # 计算myzset1和myzset2的交集，按照权重2和3相加，并将结果保存到myzset3。
```

### ZLEXCOUNT

- **语法**
  ```bash
  ZLEXCOUNT key min max
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是在给定字典范围内的成员数量。

- **命令描述**
  计算有序集合中字典范围内的成员数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZLEXCOUNT myzset "[alpha" "[omega"  # 计算myzset中字典范围在"[alpha"和"[omega"之间的成员数量。
```

### ZMPOP

- **语法**
  ```bash
  ZMPOP timeout key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  阻塞式弹出一个或多个有序集合中的最小分值的成员，直到超时或有成员可用。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZMPOP 10 myzset  # 阻塞式弹出myzset中的最小分值成员，最长等待10秒。
```

### ZMSCORE

- **语法**
  ```bash
  ZMSCORE key member
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取有序集合中成员的分值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZMSCORE myzset "member1"  # 获取myzset中"member1"的分值。
```

### ZPOPMAX

- **语法**
  ```bash
  ZPOPMAX key [count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是返回的成员数量。

- **命令描述**
  弹出有序集合中的最大分值的成员。

- **命令选项**
    - **count** : 指定要弹出的成员数量。

- **Examples**

```bash
ZPOPMAX myzset  # 弹出myzset中的最大分值成员。
ZPOPMAX myzset 3  # 弹出myzset中的3个最大分值成员。
```

### ZPOPMIN

- **语法**
  ```bash
  ZPOPMIN key [count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是返回的成员数量。

- **命令描述**
  弹出有

序集合中的最小分值的成员。

- **命令选项**
    - **count** : 指定要弹出的成员数量。

- **Examples**

```bash
ZPOPMIN myzset  # 弹出myzset中的最小分值成员。
ZPOPMIN myzset 3  # 弹出myzset中的3个最小分值成员。
```

### ZRANDMEMBER

- **语法**
  ```bash
  ZRANDMEMBER key [count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  从有序集合中随机获取一个或多个成员，不移除成员。

- **命令选项**
    - **count** : 指定要返回的成员数量。如果为负数，则可能包含重复的成员。

- **Examples**

```bash
ZRANDMEMBER myzset  # 从myzset中随机获取一个成员。
ZRANDMEMBER myzset 3  # 从myzset中随机获取3个成员，可能包含重复的成员。
```

### ZRANGE

- **语法**
  ```bash
  ZRANGE key start stop [WITHSCORES]
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)+M) \)$ 其中N是有序集合的基数，M是返回的成员数量。

- **命令描述**
  获取有序集合中指定范围内的成员。

- **命令选项**
    - **WITHSCORES** : 返回成员及其分值。

- **Examples**

```bash
ZRANGE myzset 0 2  # 获取myzset中排名在0到2之间的成员。
ZRANGE myzset 0 2 WITHSCORES  # 获取myzset中排名在0到2之间的成员及其分值。
```

### ZRANGEBYLEX

- **语法**
  ```bash
  ZRANGEBYLEX key min max [LIMIT offset count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)+M) \)$ 其中N是有序集合的基数，M是返回的成员数量。

- **命令描述**
  获取有序集合中字典范围内的成员。

- **命令选项**
    - **LIMIT offset count** : 指定返回结果的偏移和数量。

- **Examples**

```bash
ZRANGEBYLEX myzset "[alpha" "[omega"  # 获取myzset中字典范围在"[alpha"和"[omega"之间的成员。
ZRANGEBYLEX myzset "[alpha" "[omega" LIMIT 0 2  # 获取myzset中字典范围在"[alpha"和"[omega"之间的前2个成员。
```

### ZRANGEBYSCORE

- **语法**
  ```bash
  ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)+M) \)$ 其中N是有序集合的基数，M是返回的成员数量。

- **命令描述**
  获取有序集合中分值范围内的成员。

- **命令选项**
    - **WITHSCORES** : 返回成员及其分值。
    - **LIMIT offset count** : 指定返回结果的偏移和数量。

- **Examples**

```bash
ZRANGEBYSCORE myzset 2 4  # 获取myzset中分值在2和4之间的成员。
ZRANGEBYSCORE myzset (2 4  # 获取myzset中分值在(2和4之间的成员，不包括2和4。
ZRANGEBYSCORE myzset 2 4 WITHSCORES  # 获取myzset中分值在2和4之间的成员及其分值。
ZRANGEBYSCORE myzset 2 4 LIMIT 0 2  # 获取myzset中分值在2和4之间的前2个成员。
```

### ZRANGESTORE

- **语法**
  ```bash
  ZRANGESTORE destination key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是输入有序集合的基数的总和。

- **命令描述**
  计算多个有序集合的并集，并将结果保存到目标有序集合。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZRANGESTORE myzset3 myzset1 myzset2  # 计算my

zset1和myzset2的并集，并将结果保存到myzset3。
```

### ZRANK

- **语法**
  ```bash
  ZRANK key member
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)) \)$ 其中N是有序集合的基数。

- **命令描述**
  获取有序集合中成员的排名，从0开始计数。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZRANK myzset "member1"  # 获取myzset中"member1"的排名。
```

### ZREM

- **语法**
  ```bash
  ZREM key member [member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$ 其中N是被移除的成员数量。

- **命令描述**
  从有序集合中移除一个或多个成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZREM myzset "member1" "member2"  # 从myzset中移除"member1"和"member2"。
```

### ZREMRANGEBYLEX

- **语法**
  ```bash
  ZREMRANGEBYLEX key min max
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是在给定字典范围内的成员数量。

- **命令描述**
  移除有序集合中字典范围内的成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZREMRANGEBYLEX myzset "[alpha" "[omega"  # 移除myzset中字典范围在"[alpha"和"[omega"之间的成员。
```

### ZREMRANGEBYRANK

- **语法**
  ```bash
  ZREMRANGEBYRANK key start stop
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是被移除的成员数量。

- **命令描述**
  移除有序集合中指定排名范围内的成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZREMRANGEBYRANK myzset 0 2  # 移除myzset中排名在0到2之间的成员。
```

### ZREMRANGEBYSCORE

- **语法**
  ```bash
  ZREMRANGEBYSCORE key min max
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$ 其中N是被移除的成员数量。

- **命令描述**
  移除有序集合中分值范围内的成员。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZREMRANGEBYSCORE myzset 2 4  # 移除myzset中分值在2和4之间的成员。
```

### ZREVRANGE

- **语法**
  ```bash
  ZREVRANGE key start stop [WITHSCORES]
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)+M) \)$ 其中N是有序集合的基数，M是返回的成员数量。

- **命令描述**
  获取有序集合中指定范围内的成员，按分值从高到低排列。

- **命令选项**
    - **WITHSCORES** : 返回成员及其分值。

- **Examples**

```bash
ZREVRANGE myzset 0 2  # 获取myzset中排名在0到2之间的成员，按分值从高到低排列。
ZREVRANGE myzset 0 2 WITHSCORES  # 获取myzset中排名在0到2之间的成员及其分值，按分值从高到低排列。
```

### ZREVRANGEBYLEX

- **语法**
  ```bash
  ZREVRANGEBYLEX key max min [LIMIT offset count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)+M) \)$ 其中N是有序集合的基数，M是返回的成员数量。

- **命令描述**
  获取有序集合中字典范围内的成员，按字典顺序从高到低排列。

- **命令选项**
    - **LIMIT offset count** : 指定返回结果的偏移和数量。

- **Examples**

```bash
ZREVRANGEBYLEX myzset "[omega" "[alpha"  # 获取myzset中字典范围在"[alpha"和"[omega"之间的成员，按字典顺序从高到低排列。
ZREVRANGEBYLEX myzset "[omega" "[alpha" LIMIT 0 2  # 获取myzset中字典范围在"[alpha"和"[omega"之间的前2个成员，按字典顺序从高到低排列。
```

### ZREVRANGEBYSCORE

- **语法**
  ```bash
  ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)+M) \)$ 其中N是有序集合的基数，M是返回的成员数量。

- **命令描述**
  获取有序集合中分值范围内的成员，按分值从高到低排列。

- **命令选项**
    - **WITHSCORES** : 返回成员及其分值。
    - **LIMIT offset count** : 指定返回结果的偏移和数量。

- **Examples**

```bash
ZREVRANGEBYSCORE myzset 4 2  # 获取myzset中分值在4和2之间的成员，按分值从高到低排列。
ZREVRANGEBYSCORE myzset 4 2 WITHSCORES  # 获取myzset中分值在4和2之间的成员及其分值，按分值从高到低排列。
ZREVRANGEBYSCORE myzset 4 2 LIMIT 0 2  # 获取myzset中分值在4和2之间的前2个成员，按分值从高到低排列。
```

### ZREVRANK

- **语法**
  ```bash
  ZREVRANK key member
  ```

- **时间复杂度**
  $\( \mathcal{O}(\log(N)) \)$ 其中N是有序集合的基数。

- **命令描述**
  获取有序集合中成员的排名，从0开始计数，按分值从高到低排列。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZREVRANK myzset "member1"  # 获取myzset中"member1"的排名，按分值从高到低排列。
```

### ZSCAN

- **语法**
  ```bash
  ZSCAN key cursor [MATCH pattern] [COUNT count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$ 每次调用的时间复杂度较低。

- **命令描述**
  迭代有序集合中的成员。

- **命令选项**
    - **MATCH pattern** : 匹配模式。
    - **COUNT count** : 指定返回的成员数量。

- **Examples**

```bash
ZSCAN myzset 0  # 迭代myzset中的所有成员。
ZSCAN myzset 0 MATCH "member*" COUNT 5  # 迭代myzset中名称匹配"member*"的前5个成员。
```

### ZSCORE

- **语法**
  ```bash
  ZSCORE key member
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取有序集合中成员的分值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
ZSCORE myzset "member1"  # 获取myzset中"member1"的分值。
```

### ZUNION

- **语法**
  ```bash
  ZUNION numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N) + M \log(M)) \)$ 其中N是最小输入有序集合的基数，M是输入有序集合的个数。

- **命令描述**
  计算多个有序集合的并集。

- **命令选项**
    - **WEIGHTS weight [weight ...]** : 指定输入有序集合的权重。
    - **AGGREGATE SUM|MIN|MAX** :

指定聚合方式。

- **Examples**

```bash
ZUNION 2 myzset1 myzset2 WEIGHTS 2 3 AGGREGATE SUM  # 计算myzset1和myzset2的并集，按照权重2和3相加。
```

### ZUNIONSTORE

- **语法**
  ```bash
  ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N) + M \log(M)) \)$ 其中N是最小输入有序集合的基数，M是输入有序集合的个数。

- **命令描述**
  计算多个有序集合的并集，并将结果保存到目标有序集合。

- **命令选项**
    - **WEIGHTS weight [weight ...]** : 指定输入有序集合的权重。
    - **AGGREGATE SUM|MIN|MAX** : 指定聚合方式。

- **Examples**

```bash
ZUNIONSTORE myzset3 2 myzset1 myzset2 WEIGHTS 2 3 AGGREGATE SUM  # 计算myzset1和myzset2的并集，按照权重2和3相加，并将结果保存到myzset3。
```

## 散列（Hashes）

### HDEL

- **语法**
  ```bash
  HDEL key field [field ...]
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为要删除的field数量。

- **命令描述**
  删除哈希表key中的一个或多个指定字段，不存在的字段将被忽略。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 在哈希表myhash中删除字段field1和field2
HDEL myhash field1 field2
```

### HEXISTS

- **语法**
  ```bash
  HEXISTS key field
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  检查哈希表key中，指定的字段field是否存在。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 检查在哈希表myhash中是否存在字段field1
HEXISTS myhash field1
```

### HGET

- **语法**
  ```bash
  HGET key field
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取哈希表key中指定字段field的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取哈希表myhash中字段field1的值
HGET myhash field1
```

### HGETALL

- **语法**
  ```bash
  HGETALL key
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为哈希表的字段数量。

- **命令描述**
  获取哈希表key中所有字段和值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取哈希表myhash中所有字段和值
HGETALL myhash
```

### HINCRBY

- **语法**
  ```bash
  HINCRBY key field increment
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  为哈希表key中的指定字段field的整数值加上增量increment。如果字段不存在，将其设置为增量的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 在哈希表myhash中字段field1的值加上5
HINCRBY myhash field1 5
```

### HINCRBYFLOAT

- **语法**
  ```bash
  HINCRBYFLOAT key field increment
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  为哈希表key中的指定字段field的浮点数值加上增量increment。如果字段不存在，将其设置为增量的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 在哈希表myhash中字段field1的值加上3.14
HINCRBYFLOAT myhash field1 3.14
```

### HKEYS

- **语法**
  ```bash
  HKEYS key
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为哈希表的字段数量。

- **命令描述**
  获取哈希表key中的所有字段名。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取哈希表myhash中所有字段名
HKEYS myhash
```

### HLEN

- **语法**
  ```bash
  HLEN key
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取哈希表key中字段的数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取哈希表myhash中字段的数量
HLEN myhash
```

### HMGET

- **语法**
  ```bash
  HMGET key field [field ...]
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为要获取的字段数量。

- **命令描述**
  获取哈希表key中一个或多个指定字段的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取哈希表myhash中字段field1和field2的值
HMGET myhash field1 field2
```

### HMSET

- **语法**
  ```bash
  HMSET key field value [field value ...]
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为要设置的字段数量。

- **命令描述**
  同时将多个field-value对设置到哈希表key中。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 设置哈希表myhash中字段field1和field2的值
HMSET myhash field1 "value1" field2 "value2"
```

### HRANDFIELD

- **语法**
  ```bash
  HRANDFIELD key [count]
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为count参数的值，或者哈希表的大小。

- **命令描述**
  从哈希表key中随机获取一个或多个字段的名字。

- **命令选项**
    - **count** : 指定要返回的随机字段的数量。

- **Examples**

```bash
# 从哈希表myhash中随机获取一个字段的名字
HRANDFIELD myhash
# 从哈希表myhash中随机获取3个字段的名字
HRANDFIELD myhash 3
```

### HSCAN

- **语法**
  ```bash
  HSCAN key cursor [MATCH pattern] [COUNT count]
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为被迭代的元素数量。

- **命令描述**
  迭代哈希表key中的字段，返回所有字段的名字。

- **命令选项**
    - **cursor** : 游标，用于迭代。
    - **MATCH pattern** : 指定匹配的字段名模式。
    - **COUNT count** : 指定每次迭代返回的最大元素数量。

- **Examples**

```bash
# 迭代哈希表myhash中的所有字段
HSCAN myhash 0
# 迭代哈希表myhash中匹配模式为"field*"的字段
HSCAN myhash 0 MATCH field*
# 迭代哈希表myhash中返回2个元素
HSCAN myhash 0 COUNT 2
```

### HSET

- **语法**
  ```bash
  HSET key field value
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将哈希表key中的字段field的值设为value。如果字段不存在，新建字段并设置值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 设置哈希表myhash中字段field1的值为"value1"
HSET myhash field1 "value1"
```

### HSETNX

- **语法**
  ```bash
  HSETNX key field value
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  只在字段field不存在时，将哈希表key中的字段field的值设为value。如果字段已经存在，该命令无效。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 仅当哈希表myhash中字段field1不存在时，设置其值为"value1"
HSETNX myhash field1 "value1"
```

### HSTRLEN

- **语法**
  ```bash
  HSTRLEN key field
  ```
- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  返回哈希表key中字段field的字符串长度（字节数）。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取哈希表myhash中字段field1的字符串长度
HSTRLEN myhash field1
```

### HVALS

- **语法**
  ```bash
  HVALS key
  ```
- **时间复杂度**
  $\( \mathcal{O}(N) \)$，N为哈希表的字段数量。

- **命令描述**
  获取哈希表key中所有字段的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取哈希表myhash中所有字段的值
HVALS myhash
```

## 位图（Bitmaps）

### BITCOUNT

- **语法**
  ```bash
  BITCOUNT key [start end]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是位的数量。

- **命令描述**
  计算并返回指定key中，从start到end范围内所有位被设置为1的数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 设置一个二进制字符串
SET mykey "\xff\xf0"
# 计算mykey中位被设置为1的数量
BITCOUNT mykey  # 返回：12
```

### BITFIELD

- **语法**
  ```bash
  BITFIELD key [GET type offset] [SET type offset value] [INCRBY type offset increment] [OVERFLOW WRAP|SAT|FAIL]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  对位域执行各种操作。可以执行获取、设置和增减等操作。

- **命令选项**
    - **GET type offset** : 获取指定位域的值。
    - **SET type offset value** : 设置指定位域的值。
    - **INCRBY type offset increment** : 增加指定位域的值。
    - **OVERFLOW WRAP|SAT|FAIL** : 指定溢出时的处理方式。

- **Examples**

```bash
# 设置一个位域值
SETBIT mykey 7 1
# 获取位域值
BITFIELD mykey GET u4 0  # 返回：1
```

### BITFIELD_RO

- **语法**
  ```bash
  BITFIELD_RO key [GET type offset]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  只读方式获取位域的值。

- **命令选项**
    - **GET type offset** : 获取指定位域的值。

- **Examples**

```bash
# 获取位域值
BITFIELD_RO mykey GET u4 0  # 返回：1
```

### BITOP

- **语法**
  ```bash
  BITOP operation destkey key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是所有输入位串中的最长位串的长度。

- **命令描述**
  对多个key执行位操作，并将结果保存在destkey中。

- **命令选项**
    - **operation** : 位操作类型，支持AND、OR、XOR、NOT等。
    - **destkey** : 结果保存的key。
    - **key** : 参与位操作的key列表。

- **Examples**

```bash
# 设置两个二进制字符串
SET key1 "\xff\xf0"
SET key2 "\xf0\xff"
# 对两个二进制字符串执行OR操作，并保存结果
BITOP OR result key1 key2
```

### BITPOS

- **语法**
  ```bash
  BITPOS key bit [start] [end]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是被扫描的位数。

- **命令描述**
  查找在指定范围内第一次出现指定位(bit)的位置。

- **命令选项**
    - **bit** : 要查找的位，0或1。
    - **start** : 开始搜索的位置，默认为0。
    - **end** : 结束搜索的位置，默认为最后一个位。

- **Examples**

```bash
# 设置一个二进制字符串
SET mykey "\xff\xf0"
# 查找第一个1出现的位置
BITPOS mykey 1 0  # 返回：12
```

### GETBIT

- **语法**
  ```bash
  GETBIT key offset
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  获取指定key的二进制字符串在偏移量(offset)处的位的值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 设置一个二进制字符串
SETBIT mykey 7 1
# 获取偏移量7处的位的值
GETBIT mykey 7  # 返回：1
```

### SETBIT

- **语法**
  ```bash
  SETBIT key offset value
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  设置指定key的二进制字符串在偏移量(offset)处的位的值为指定的value。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 设置偏移量7处的位的值为1
SETBIT mykey 7 1
```

## 流（Streams）

### XACK

- **语法**
  ```bash
  XACK stream group ID [ID ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是要确认的消息数目。

- **命令描述**
  XACK命令用于向消费者组确认已经处理了特定消息。它从流的消费者组中删除指定的消息ID。

- **命令选项**
  无

- **Examples**

```bash
# 从名为mystream的流中的mygroup消费组中确认消息ID为"1585991860000-0"和"1585991860000-1"的消息已处理。
XACK mystream mygroup "1585991860000-0" "1585991860000-1"
```

### XADD

- **语法**
  ```bash
  XADD stream [MAXLEN [~|=] count] [ID field value [field value ...]]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XADD命令用于向指定的流添加新消息。它会生成一个唯一的消息ID，并将消息添加到流的末尾。

- **命令选项**
    - **MAXLEN [~|=] count** : 限制流的长度，可以是近似值或精确值。
    - **ID field value [field value ...]** : 消息的内容，由field-value对组成。

- **Examples**

```bash
# 向名为mystream的流添加一条消息，内容为{"name": "Alice", "message": "Hello, Redis Streams"}。
XADD mystream * name Alice message "Hello, Redis Streams"
```

### XAUTOCLAIM

- **语法**
  ```bash
  XAUTOCLAIM stream group consumer min-idle-time [IDLE max-idle-time [TIME ms-count]]
  ```

- **时间复杂度**
  $\( \mathcal{O}(log(N)+M) \)$，其中N是流的长度，M是消费者组的未确认消息数量。

- **命令描述**
  XAUTOCLAIM命令用于自动将流的未确认消息分配给消费者。它可用于自动处理流中的消息。

- **命令选项**
  无

- **Examples**

```bash
# 将名为mystream的流中的未确认消息分配给消费者组mygroup中的消费者，如果消息在队列中空闲超过1000毫秒，将其分配给该消费者。
XAUTOCLAIM mystream mygroup myconsumer 1000
```

### XCLAIM

- **语法**
  ```bash
  XCLAIM stream group consumer min-idle-time ID [ID ...] [TIME ms-count] [RETRYCOUNT count] [FORCE]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是要认领的消息数目。

- **命令描述**
  XCLAIM命令用于手动认领并处理流中的消息。它允许消费者指定要认领的消息，以及处理消息的消费者。

- **命令选项**
    - **TIME ms-count** : 将消息标记为已处理后的空闲时间（以毫秒为单位）。
    - **RETRYCOUNT count** : 设置消息的重试计数器。
    - **FORCE** : 强制认领消息，即使其他消费者也试图认领。

- **Examples**

```bash
# 将名为mystream的流中的消息ID为"1585991860000-0"和"1585991860000-1"的消息认领给消费者myconsumer，并标记为已处理。
XCLAIM mystream mygroup myconsumer 0 "1585991860000-0" "1585991860000-1"
```

### XDEL

- **语法**
  ```bash
  XDEL stream ID [ID ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是要删除的消息数目。

- **命令描述**
  XDEL命令用于从流中永久删除指定的消息。

- **命令选项**
  无

- **Examples**

```bash
# 从名为mystream的流中永久删除消息ID为"1585991860000-0"和"1585991860000-1"的消息。
XDEL mystream "1585991860000-0" "1585991860000-1"
```

### XGROUP CREATE

- **语法**
  ```bash
  XGROUP CREATE stream groupname id-or-$ [MKSTREAM]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是流的长度。

- **命令描述**
  XGROUP CREATE命令用于创建一个新的消费者组。它允许多个消费者以协作方式处理流中的消息。

- **命令选项**
    - **MKSTREAM** : 如果流不存在，则创建流。

- **Examples**

```bash
# 创建一个名为mygroup的消费者组，用于处理名为mystream的流中的消息。
XGROUP CREATE mystream mygroup $ MKSTREAM
```

### XGROUP CREATECONSUMER

- **语法**
  ```bash
  XGROUP CREATECONSUMER stream groupname consumername
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XGROUP CREATECONSUMER命令用于创建消费者组中的新消费者。每个消费者代表一个独立的处理单元。

- **命令选项**
  无

- **Examples**

```bash
# 在名为mygroup的消费者组中创建一个名为myconsumer的新消费者。
XGROUP CREATECONSUMER mystream mygroup myconsumer
```

### XGROUP DELCONSUMER

- **语法**
  ```bash
  XGROUP DELCONSUMER stream groupname consumername
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XGROUP DELCONSUMER命令用于从消费者组中删除指定的消费者。这将停止该消费者处理该组的消息。

- **命令选项**
  无

- **Examples**

```bash
# 从名为mygroup的消费者组中删除名为myconsumer的消费者。
XGROUP DELCONSUMER mystream mygroup myconsumer
```

### XGROUP DESTROY

- **语法**
  ```bash
  XGROUP DESTROY stream groupname
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是流中未确认消息的数量。

- **命令描述**
  XGROUP DESTROY命令用于销毁消费者组以及

与之相关的未确认消息。

- **命令选项**
  无

- **Examples**

```bash
# 销毁名为mygroup的消费者组以及与之相关的未确认消息。
XGROUP DESTROY mystream mygroup
```

### XGROUP SETID

- **语法**
  ```bash
  XGROUP SETID stream groupname id-or-$
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XGROUP SETID命令用于设置消费者组的偏移量。这决定了消费者组从流中读取消息的位置。

- **命令选项**
  无

- **Examples**

```bash
# 将名为mygroup的消费者组的偏移量设置为流中最新的消息位置。
XGROUP SETID mystream mygroup $
```

### XINFO CONSUMERS

- **语法**
  ```bash
  XINFO CONSUMERS stream groupname
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XINFO CONSUMERS命令用于获取消费者组中的消费者列表以及它们的状态信息。

- **命令选项**
  无

- **Examples**

```bash
# 获取名为mygroup的消费者组中的消费者列表和状态信息。
XINFO CONSUMERS mystream mygroup
```

### XINFO GROUPS

- **语法**
  ```bash
  XINFO GROUPS stream
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XINFO GROUPS命令用于获取流中的消费者组列表以及它们的状态信息。

- **命令选项**
  无

- **Examples**

```bash
# 获取流中的消费者组列表和状态信息。
XINFO GROUPS mystream
```

### XINFO STREAM

- **语法**
  ```bash
  XINFO STREAM stream
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XINFO STREAM命令用于获取流的有关信息，包括长度、最早消息ID、最新消息ID等。

- **命令选项**
  无

- **Examples**

```bash
# 获取流的有关信息，如长度、最早消息ID、最新消息ID等。
XINFO STREAM mystream
```

### XLEN

- **语法**
  ```bash
  XLEN stream
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XLEN命令用于获取流的长度，即流中消息的数量。

- **命令选项**
  无

- **Examples**

```bash
# 获取名为mystream的流的长度。
XLEN mystream
```

### XPENDING

- **语法**
  ```bash
  XPENDING stream groupname
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是流中未确认消息的数量。

- **命令描述**
  XPENDING命令用于获取消费者组的待处理消息信息，包括消息数量、最早消息ID、最新消息ID等。

- **命令选项**
  无

- **Examples**

```bash
# 获取名为mygroup的消费者组中的待处理消息信息。
XPENDING mystream mygroup
```

### XRANGE

- **语法**
  ```bash
  XRANGE stream start end [COUNT count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(log(N)+M) \)$，其中N是流的长度，M是返回的消息数量。

- **命令描述**
  XRANGE命令用于获取流中的消息范围。您可以指定开始和结束的消息ID，并选择要返回的消息数量。

- **命令选项**
    - **COUNT count** : 指定要返回的消息数量。

- **Examples**

```bash
# 获取名为mystream的流中的消息，从ID为"1585991860000-0"到ID为"1585991860000-5"的范围内。
XRANGE mystream "1585991860000-0" "1585991860000-5"
```

### XREAD

- **语法**
  ```bash
  XREAD [BLOCK milliseconds] [COUNT count] STREAMS stream [ID] [stream2 [ID] ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XREAD命令用于从多个流中读取消息。它可以阻塞等待新消息到达，也可以限制返回的消息数量。

- **命令选项**
    - **BLOCK milliseconds** : 指定阻塞等待的毫秒数。
    - **COUNT count** : 指定要返回的消息数量。

- **Examples**

```bash
# 从名为mystream的流中读取新消息，并阻塞等待10秒。
XREAD BLOCK 10000 STREAMS mystream $

# 从多个流中读取消息，每个流返回2条消息。
XREAD COUNT 2 STREAMS mystream myotherstream
```

### XREADGROUP

- **语法**
  ```bash
  XREADGROUP GROUP groupname consumername [BLOCK milliseconds] [COUNT count] [NOACK] STREAMS stream [ID] [stream2 [ID] ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XREADGROUP命令用于消费者组从多个流中读取消息。它可以阻塞等待新消息到达，也可以限制返回的消息数量。

- **命令选项**
    - **GROUP groupname consumername** : 指定消费者组和消费者的名称。
    - **BLOCK milliseconds** : 指定阻塞等待的毫秒数。
    - **COUNT count** : 指定要返回的消息数量。
    - **NOACK** : 指定不要自动确认消息，需要手动确认。

- **Examples**

```bash
# 从名为mystream的流中消费者组mygroup中的myconsumer读取消息，阻塞等待10秒。
XREADGROUP GROUP mygroup myconsumer BLOCK 10000 STREAMS mystream $

# 从多个流中读取消息，每个流返回2条消息，不自动确认。
XREADGROUP GROUP mygroup myconsumer COUNT 2 NOACK STREAMS mystream myotherstream
```

### XREVRANGE

- **语法**
  ```bash
  XREVRANGE stream end start [COUNT count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(log(N)+M) \)$，其中N是流的长度，M是返回的消息数量。

- **命令描述**
  XREVRANGE命令用于获取流中的消息范围，与XRANGE相反，它按逆序返回消息。

- **命令选项**
    - **COUNT count** : 指定要返回的消息数量。

- **Examples**

```bash
# 获取名为mystream的流中的消息，从ID为"1585991860000-5"到ID为"1585991860000-0"的范围内，按逆序返回。
XREVRANGE mystream "1585991860000-5" "1585991860000-0"
```

### XSETID

- **语法**
  ```bash
  XSETID stream id-or-$
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  XSETID命令用于设置流的最新消息ID。这可以用于重置消费者组的位置。

- **命令选项**
  无

- **Examples**

```bash
# 将名为mystream的流的最新消息ID设置为流中最新的消息位置。
XSETID mystream $


```

### XTRIM

- **语法**
  ```bash
  XTRIM stream [MINIDLE milliseconds]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是被删除的消息数量。

- **命令描述**
  XTRIM命令用于删除流中的过期消息。可以根据消息的空闲时间来删除消息。

- **命令选项**
    - **MINIDLE milliseconds** : 指定消息的最小空闲时间，只有满足这个条件的消息才会被删除。

- **Examples**

```bash
# 删除名为mystream的流中的过期消息，空闲时间超过1000毫秒的消息将被删除。
XTRIM mystream MINIDLE 1000
```

## 地理空间（Geospatial indices）

### GEOADD

- **语法**
  ```bash
  GEOADD key longitude latitude member [longitude latitude member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是添加到地理位置集合的成员数量。

- **命令描述**
  将一个或多个成员元素及其经纬度信息添加到指定的key中，用于表示地理位置。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 添加地理位置信息
GEOADD myplaces 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
```

### GEODIST

- **语法**
  ```bash
  GEODIST key member1 member2 [unit]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  返回两个成员之间的距离，可以选择以不同的单位（m、km、mi、ft）返回距离，默认单位是米。

- **命令选项**
    - **unit** : 可选，用于指定距离的单位，可以是"m"（米），"km"（千米），"mi"（英里），"ft"（英尺）。

- **Examples**

```bash
# 计算两个成员之间的距离，以默认单位米返回
GEODIST myplaces "Palermo" "Catania"
```

### GEOHASH

- **语法**
  ```bash
  GEOHASH key member [member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是要获取地理位置的成员数量。

- **命令描述**
  返回一个或多个成员的地理位置的Geohash值。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取成员的Geohash值
GEOHASH myplaces "Palermo" "Catania"
```

### GEOPOS

- **语法**
  ```bash
  GEOPOS key member [member ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$，其中N是要获取地理位置的成员数量。

- **命令描述**
  返回一个或多个成员的地理位置的经度和纬度。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取成员的地理位置的经度和纬度
GEOPOS myplaces "Palermo" "Catania"
```

### GEORADIUS

- **语法**
  ```bash
  GEORADIUS key longitude latitude radius m|km|mi|ft [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$，其中N是地理位置集合中成员的数量。

- **命令描述**
  根据给定的经纬度和半径，返回满足条件的成员列表。

- **命令选项**
    - **WITHCOORD** : 返回成员的经纬度坐标。
    - **WITHDIST** : 返回成员与中心之间的距离，以与单位相对应的形式。
    - **WITHHASH** : 返回成员的Geohash值。
    - **COUNT count** : 限制返回的结果数量。

- **Examples**

```bash
# 查找半径为100千米内的成员
GEORADIUS myplaces 13.361389 38.115556 100 km
```

### GEORADIUS_RO

- **语法**
  ```bash
  GEORADIUS_RO key longitude latitude radius m|km|mi|ft [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$，其中N是地理位置集合中成员的数量。

- **命令描述**
  读取命令，根据给定的经纬度和半径，返回满足条件的成员列表。此命令用于只读操作。

- **命令选项**
    - **WITHCOORD** : 返回成员的经纬度坐标。
    - **WITHDIST** : 返回成员与中心之间的距离，以与单位相对应的形式。
    - **WITHHASH** : 返回成员的Geohash值。
    - **COUNT count** : 限制返回的结果数量。

- **Examples**

```bash
# 查找半径为100千米内的成员（只读模式）
GEORADIUS_RO myplaces 13.361389 38.115556 100 km
```

### GEORADIUSBYMEMBER

- **语法**
  ```bash
  GEORADIUSBYMEMBER key member radius m|km|mi|ft [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$，其中N是地理位置集合中成员的数量。

- **命令描述**
  根据指定成员的位置，返回与该成员距离在一定范围内的成员列表。

- **命令选项**
    - **WITHCOORD** : 返回成员的经纬度坐标。
    - **WITHDIST** : 返回成员与中心之间的距离，以与单位相对应的形式。
    - **WITHHASH** : 返回成员的Geohash值。
    - **COUNT count** : 限制返回的结果数量。

- **Examples**

```bash
# 查找与指定成员在50千米范围内的成员
GEORADIUSBYMEMBER myplaces "Palermo" 50 km
```

### GEORADIUSBYMEMBER_RO

- **语法**
  ```bash
  GEORADIUSBYMEMBER_RO key member radius m|km|mi|ft [WITHCOORD] [WITHDIST] [WITH

HASH] [COUNT count]

  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$，其中N是地理位置集合中成员的数量。

- **命令描述**
  读取命令，根据指定成员的位置，返回与该成员距离在一定范围内的成员列表。此命令用于只读操作。

- **命令选项**
  - **WITHCOORD** : 返回成员的经纬度坐标。
  - **WITHDIST** : 返回成员与中心之间的距离，以与单位相对应的形式。
  - **WITHHASH** : 返回成员的Geohash值。
  - **COUNT count** : 限制返回的结果数量。

- **Examples**
```bash
# 查找与指定成员在50千米范围内的成员（只读模式）
GEORADIUSBYMEMBER_RO myplaces "Palermo" 50 km
```

### GEOSEARCH

- **语法**
  ```bash
  GEOSEARCH key [FROMMEMBER member] [FROMMEMBER_RO member] [BYBOX width height unit] [BYRADIUS radius unit] [ASC|DESC] [COUNT count] [WITHCOORD] [WITHDIST] [WITHHASH]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$，其中N是地理位置集合中成员的数量。

- **命令描述**
  根据不同的条件进行地理位置搜索，并返回满足条件的成员列表。

- **命令选项**
    - **FROMMEMBER member** : 从指定成员开始搜索。
    - **FROMMEMBER_RO member** : 读取命令，从指定成员开始搜索。
    - **BYBOX width height unit** : 根据指定的矩形框范围进行搜索。
    - **BYRADIUS radius unit** : 根据指定的半径范围进行搜索。
    - **ASC|DESC** : 指定结果的升序或降序排列。
    - **COUNT count** : 限制返回的结果数量。
    - **WITHCOORD** : 返回成员的经纬度坐标。
    - **WITHDIST** : 返回成员与中心之间的距离，以与单位相对应的形式。
    - **WITHHASH** : 返回成员的Geohash值。

- **Examples**

```bash
# 以升序方式返回与指定成员在50千米范围内的成员，并包含距离信息
GEOSEARCH myplaces FROMMEMBER "Palermo" BYRADIUS 50 km ASC WITHDIST
```

### GEOSEARCHSTORE

- **语法**
  ```bash
  GEOSEARCHSTORE dest key [FROMMEMBER member] [FROMMEMBER_RO member] [BYBOX width height unit] [BYRADIUS radius unit] [ASC|DESC] [COUNT count] [WITHCOORD] [WITHDIST] [WITHHASH]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N \log(N)) \)$，其中N是地理位置集合中成员的数量。

- **命令描述**
  根据不同的条件进行地理位置搜索，并将满足条件的成员列表保存到dest键中。

- **命令选项**
    - **dest** : 结果存储的目标键。
    - **FROMMEMBER member** : 从指定成员开始搜索。
    - **FROMMEMBER_RO member** : 读取命令，从指定成员开始搜索。
    - **BYBOX width height unit** : 根据指定的矩形框范围进行搜索。
    - **BYRADIUS radius unit** : 根据指定的半径范围进行搜索。
    - **ASC|DESC** : 指定结果的升序或降序排列。
    - **COUNT count** : 限制返回的结果数量。
    - **WITHCOORD** : 返回成员的经纬度坐标。
    - **WITHDIST** : 返回成员与中心之间的距离，以与单位相对应的形式。
    - **WITHHASH** : 返回成员的Geohash值。

- **Examples**

```bash
# 以升序方式返回与指定成员在50千米范围内的成员，并保存到dest键中
GEOSEARCHSTORE myresults myplaces FROMMEMBER "Palermo" BYRADIUS 50 km ASC
```

## HyperLogLog(基数统计)

### PFADD

- **语法**
  ```bash
  PFADD key element [element ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  将一个或多个元素添加到HyperLogLog数据结构中，如果HyperLogLog不存在，会自动创建。

- **命令选项**
  该命令不包含选项。

- **Examples**

```bash
# 添加元素到HyperLogLog
PFADD myloglog "element1" "element2" "element3"
```

### PFCOUNT

- **语法**
  ```bash
  PFCOUNT key [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  返回给定 HyperLogLog 的基数估算值（即不重复元素的数量），如果多个 HyperLogLog 合并为一个，则返回总的基数估算值。

- **命令选项**
  该命令不包含选项。

- **Examples**

```bash
# 返回HyperLogLog的基数估算值
PFCOUNT myloglog
```

### PFDEBUG

- **语法**
  ```bash
  PFDEBUG subcommand [key ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(1) \)$

- **命令描述**
  用于在调试模式下执行HyperLogLog命令。

- **命令选项**
    - **subcommand** : 调试子命令，可选值为`HELP`、`TOGGLE`、`LOG`、`REPLY`、`FLUSH`。
    - **key** : 需要调试的HyperLogLog键。

- **Examples**

```bash
# 打开HyperLogLog的调试模式
PFDEBUG TOGGLE myloglog
```

### PFMERGE

- **语法**
  ```bash
  PFMERGE destkey sourcekey [sourcekey ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$

- **命令描述**
  将多个HyperLogLog合并成一个HyperLogLog，并将结果存储在目标键中。

- **命令选项**
  该命令不包含选项。

- **Examples**

```bash
# 合并多个HyperLogLog到一个目标HyperLogLog中
PFMERGE mydestlog myloglog1 myloglog2 myloglog3
```

### PFSELFTEST

- **语法**
  ```bash
  PFSELFTEST
  ```

- **时间复杂度**
  $\( \mathcal{O}(N) \)$

- **命令描述**
  执行HyperLogLog自检。

- **命令选项**
  该命令不包含选项。

- **Examples**

```bash
# 执行HyperLogLog自检
PFSELFTEST
```

## 发布订阅（Pub/Sub）

### PSUBSCRIBE

- **语法**
  ```bash
  PSUBSCRIBE pattern [pattern ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是被订阅的模式的数量

- **命令描述**
  订阅一个或多个符合给定模式的频道。一旦接收到与模式匹配的消息，客户端就会接收到通知。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 订阅以"news:"开头的所有频道
PSUBSCRIBE news:*

# 订阅两个不同的模式
PSUBSCRIBE sports.* weather.*
```

### PUBLISH

- **语法**
  ```bash
  PUBLISH channel message
  ```

- **时间复杂度**
  $\( \mathcal{O}(N+M)\)$ 其中N是订阅给定频道的客户端数量，M是所有订阅模式的客户端数量。

- **命令描述**
  将message发布到指定的channel。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 发布一条消息到名为"news"的频道
PUBLISH news "Breaking News: Redis is awesome!"

# 发布一条消息到名为"sports:football"的频道
PUBLISH sports:football "Goal!"

```

### PUBSUB CHANNELS

- **语法**
  ```bash
  PUBSUB CHANNELS [pattern]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是符合给定模式的频道的数量。

- **命令描述**
  获取所有符合给定模式的频道列表。

- **命令选项**
    - **pattern (可选)** : 匹配频道名的模式。

- **Examples**

```bash
# 获取所有频道的列表
PUBSUB CHANNELS

# 获取以"news:"开头的所有频道的列表
PUBSUB CHANNELS news:*
```

### PUBSUB NUMPAT

- **语法**
  ```bash
  PUBSUB NUMPAT
  ```

- **时间复杂度**
  $\( \mathcal{O}(1)\)$

- **命令描述**
  获取当前被订阅的模式数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取当前被订阅的模式数量
PUBSUB NUMPAT
```

### PUBSUB NUMSUB

- **语法**
  ```bash
  PUBSUB NUMSUB channel [channel ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是给定频道的数量。

- **命令描述**
  获取一个或多个频道的订阅者数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取"news"频道的订阅者数量
PUBSUB NUMSUB news

# 获取多个频道的订阅者数量
PUBSUB NUMSUB news sports
```

### PUBSUB SHARDCHANNELS

- **语法**
  ```bash
  PUBSUB SHARDCHANNELS
  ```

- **时间复杂度**
  $\( \mathcal{O}(1)\)$

- **命令描述**
  获取所有sharded channel的列表。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取所有sharded channel的列表
PUBSUB SHARDCHANNELS
```

### PUBSUB SHARDNUMSUB

- **语法**
  ```bash
  PUBSUB SHARDNUMSUB channel [channel ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是给定频道的数量。

- **命令描述**
  获取一个或多个sharded channel的订阅者数量。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 获取"news" sharded channel的订阅者数量
PUBSUB SHARDNUMSUB news

# 获取多个sharded channel的订阅者数量
PUBSUB SHARDNUMSUB news sports
```

### PUNSUBSCRIBE

- **语法**
  ```bash
  PUNSUBSCRIBE [pattern [pattern ...]]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是被取消订阅的模式的数量。

- **命令描述**
  取消一个或多个符合给定模式的频道的订阅。

- **命令选项**
    - **pattern (可选)** : 匹配频道名的模式，如果省略，则取消所有订阅。

- **Examples**

```bash
# 取消订阅以"news:"开头的所有频道
PUNSUBSCRIBE news:*

# 取消订阅"news"和"sports"频道
PUNSUBSCRIBE news sports
```

### SPUBLISH

- **语法**
  ```bash
  SPUBLISH channel message
  ```

- **时间复杂度**
  $\( \mathcal{O}(N+M)\)$ 其中N是订阅给定频道的客户端数量，M是所有订阅模式的客户端数量。

- **命令描述**
  将消息发布到指定的sharded channel。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 发布一条消息到名为"news"的sharded channel
SPUBLISH news "Breaking News: Redis is awesome!"

# 发布一条消息到名为"sports:football"的sharded channel
SPUBLISH sports:football "Goal!"
```

### SSUBSCRIBE

- **语法**
  ```bash
  SSUBSCRIBE shard [shard ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是被订阅的shard的数量。

- **命令描述**
  订阅一个或多个shard。一旦接收到消息，客户端就会接收到通知。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 订阅shard "shard-1"
SSUBSCRIBE shard-1

# 订阅多个shard
SSUBSCRIBE shard-1 shard-2
```

### SUBSCRIBE

- **语法**
  ```bash
  SUBSCRIBE channel [channel ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是被订阅的频道的数量。

- **命令描述**
  订阅一个或多个频道。一旦接收到消息，客户端就会接收到通知。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 订阅频道"news"
SUBSCRIBE news

# 订阅多个频道
SUBSCRIBE news sports
```

### SUNSUBSCRIBE

- **语法**
  ```bash
  SUNSUBSCRIBE shard [shard ...]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是被取消订阅的shard的数量。

- **命令描述**
  取消一个或多个shard的订阅。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 取消订阅shard "shard-1"
SUNSUBSCRIBE shard-1

# 取消订阅多个shard
SUNSUBSCRIBE shard-1 shard-2
```

### UNSUBSCRIBE

- **语法**
  ```bash
  UNSUBSCRIBE [channel [channel ...]]
  ```

- **时间复杂度**
  $\( \mathcal{O}(N)\)$ 其中N是被取消订阅的频道的数量。

- **命令描述**
  取消一个或多个频道的订阅。

- **命令选项**
  该命令不含有选项。

- **Examples**

```bash
# 取消订阅频道"news"
UNSUBSCRIBE news

# 取消订阅多个频道
UNSUBSCRIBE news sports
```
