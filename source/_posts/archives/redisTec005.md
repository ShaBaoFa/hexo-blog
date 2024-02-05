---
layout: butt
title: Redis之实用功能-排行榜
date: 2023-10-07 15:31:33
tags:
category: Redis
mathjax: true
cover: /images/redis.png
---
## 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
排行榜，这功能真的太常见，而且也很实用。比如说，我们可以用排行榜来记录用户的积分，然后根据积分来排名。这个功能在游戏中也很常见，比如王者荣耀的排行榜，就是根据用户的积分来排名的。
遥想当年，还有人使用mysql直接来进行排行榜查询，这个效率真的是低到爆炸。
既然是Redis的文章，我就抛砖引玉，提供2种方式。
ZSET和Sort
不过在此之前，我先来一波Mysql的排行榜查询。
{% endnote %}
## Mysql

### 表设计
```sql
-- 用户表
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL, -- hashed password
    email VARCHAR(255) UNIQUE NOT NULL,
    points INT DEFAULT 0 -- 用户积分
);

-- 文章表
CREATE TABLE articles (
    article_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id)
);

-- 文章点赞表
CREATE TABLE article_likes (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    article_id INT,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, article_id), -- 一个用户只能对一篇文章点赞一次
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (article_id) REFERENCES articles(article_id)
);
```
查找文章的点赞数咱们就用这个查询语句
要查找每篇文章的点赞数量，你可以使用以下SQL查询：

```sql
SELECT 
    a.article_id,
    a.title,
    COUNT(al.like_id) AS like_count
FROM 
    articles a
LEFT JOIN 
    article_likes al ON a.article_id = al.article_id
GROUP BY 
    a.article_id, a.title
ORDER BY 
    like_count DESC;
```

这条查询将返回每篇文章的ID、标题和相应的点赞数量。文章按照点赞数量从多到少进行排序。使用`LEFT JOIN`确保即使文章没有点赞，也会出现在结果中，并且点赞数量为0。

当然这个设计非常的简单,但是如果数据量大的话，这个查询效率就会非常的低，所以我们需要使用Redis来进行优化。

## Redis ZSET(有序集合)

使用 Redis 的有序集合 (ZSET) 来实现排行榜功能是一种常见且高效的方法。对于时间范围的排行榜，你可以通过设计合适的 key 来实现。

假设你要为每篇文章的点赞数量创建一个月榜，你可以使用当前月份作为 key 的一部分，比如：

```
article_likes:2023:10  (表示2023年10月的文章点赞月榜)
```

当用户为文章点赞时，你可以使用 `ZINCRBY` 命令增加相应文章的点赞计数：

```redis
ZINCRBY article_likes:2023:10 1 article_id
```

这里，`article_id` 是你要增加点赞数量的文章的ID，`1` 是点赞的数量（通常为1，但如果有其他需求，可以调整）。

当你要获取排行榜时，可以使用 `ZRANGE` 命令（从高到低排序）：

从 Redis 6.2 开始，`ZRANGE` 命令已经进行了增强，现在支持了多种排序方式。在之前的版本中，`ZRANGE` 仅按分数从低到高排序，而 `ZREVRANGE` 从高到低排序。但从 Redis 6.2 开始，你可以使用 `BY` 选项来指定排序方式，这使得 `ZRANGE` 更加灵活。

以下是 `ZRANGE` 在 Redis 6.2+ 的新语法：

```
ZRANGE key start stop [BY {SCORE|LEX}] [REV] [LIMIT offset count] [WITHSCORES]
```

- **BY SCORE|LEX**: 按分数或字典序排序。默认是 `SCORE`。
- **REV**: 反转排序结果，即从高到低。
- **LIMIT offset count**: 限制返回的元素数量。
- **WITHSCORES**: 返回元素的分数。

例如，要获取2023年10月点赞数量最高的前10篇文章及其点赞数量，你可以使用：

```redis
ZRANGE article_likes:2023:10 0 9 BY SCORE REV WITHSCORES
```

这会返回2023年10月点赞数量最高的前10篇文章及其点赞数量。

随着时间的推移，你可以为每个月创建一个新的 key，这样就可以轻松地管理各个时间段的排行榜，而不必担心数据混淆。此外，你还可以为每日、每周或每年的排行榜设定类似的 key。

### 问题点
如果（极限状态下）榜单的数据量占比很大，比如说，一共就10万篇文章，结果你排行要排9.9万篇，这就非常不乐观了。
`ZRANGE` 的时间复杂度基于返回的元素数量。对于有序集合，`ZRANGE` 的时间复杂度是 $\(O(\log(N) + M)\)$  ，其中 $\(N\)$ 是有序集合的元素数量，而 $\(M\)$ 是返回的元素数量。

在你的例子中，有序集合的大小 $\(N\)$ 是10万篇文章，你要返回的元素数量 $\(M\)$ 是9.9万篇。

所以，时间复杂度为 $\(O(\log(100,000) + 99,000)\)$。

我们可以计算 $\(O(\log(100,000))\)$ 的具体值。
```python
import math

# Calculate log base 2 of 100,000
log_value = math.log2(100000)
```
```bash
log_value = 16.609640474436812
```
计算得到，$\(\log_2(100,000)\)$ 的值约为 16.61。

所以，`ZRANGE` 的时间复杂度为 $\(O(16.61 + 99,000)\)$，这主要是由返回的元素数量 $\(M = 99,000\)$ 决定的。在实际操作中，返回这么大数量的数据可能会导致性能问题，特别是在网络传输上。因此，在实际应用中，通常建议分页或限制返回的数据量。

## Redis Sort

Sort是Redis提供的一个非常强大的功能，它可以对Redis中的List、Set、ZSet、Hash等类型的数据进行排序。
比如Hash类型的数据。当文章的属性，除了点赞数之外，还有评论数、浏览数、收藏数等等，这时候我们就可以使用Sort来进行排序。
你可以将 `likes`、`collects` 等作为 `article:1` 的哈希字段来存储，使用 Redis 的哈希结构（`HASH`）来实现。这样，每篇文章只需要一个键，其中包含多个属性。

这是如何使用哈希结构来存储和操作文章属性的示例：

1. **设置属性**:
   ```redis
   HSET article:1 likes 0 collects 0 comments 0 stars 0
   ```

2. **增加属性值**:
   ```redis
   HINCRBY article:1 likes 1
   HINCRBY article:1 collects 1
   ```

3. **获取属性值**:
   ```redis
   HGET article:1 likes
   HGETALL article:1
   ```

### 使用 `SORT` 和哈希结构实现排行榜：

如果你决定使用 `SORT` 命令来实现排行榜，并将属性存储为哈希结构，你可以使用以下方法：

1. 存储文章ID在一个列表中。
2. 使用 `SORT` 命令并结合 `GET` 选项来获取排序后的结果。

示例：

```redis
LPUSH article_ids 1 2 3 ...
HSET article:1 likes 10 collects 5
HSET article:2 likes 15 collects 8
...

SORT article_ids BY article:*->likes DESC
```

这将根据 `likes` 对文章ID进行排序。

复杂**亿**点的示例
```shell
SORT key [BY pattern] [LIMIT offset count] [GET pattern [GET pattern
  ...]] [ASC | DESC] [ALPHA] [STORE destination]
```
- **key**: 要排序的列表、集合、有序集合或哈希的键。
- **BY pattern**: 用于指定排序时要使用的外部键模式。例如，如果你要对哈希的字段进行排序，可以使用 `BY article:*->likes`。
- **LIMIT offset count**: 限制返回的元素数量。
- **GET pattern [GET pattern ...]**: 用于指定要获取的外部键模式。例如，如果你要获取哈希的字段，可以使用 `GET article:*->likes`。
- **ASC | DESC**: 指定排序顺序。默认是 `ASC`。
- **ALPHA**: 按字典序排序。默认是按分数排序。
- **STORE destination**: 将排序结果存储到指定的键中。
- 
```redis
LPUSH article_ids 1 2 3 ...
HSET article:1 likes 10 collects 5
HSET article:2 likes 15 collects 8
...

SORT article_ids BY article:*->likes LIMIT 0 10 GET article:*->likes article:*->collects DESC STORE sorted_articles

```
执行此命令后，你可以使用 `LRANGE sorted_articles 0 -1` 来查看排序后的结果。这个命令将返回一个数组，其中包括每篇文章的 `likes` 和 `collects` 属性。

### Laravel
```php
use Illuminate\Support\Facades\Redis;

// 添加文章ID到列表
Redis::lpush('article_ids', [1, 2, 3]);

// 为文章设置 likes 和 collects 属性
Redis::hset('article:1', ['likes' => 10, 'collects' => 5]);
Redis::hset('article:2', ['likes' => 15, 'collects' => 8]);

// 使用 SORT 命令进行排序并获取结果
$sortedArticles = Redis::sort('article_ids', [
    'by' => 'article:*->likes',
    'limit' => [0, 10],
    'get' => ['article:*->likes', 'article:*->collects'],
    'sort' => 'desc',
    'store' => 'sorted_articles'
]);

// 如果你要检索排序后的结果，你可以像这样获取：
// $results = Redis::lrange('sorted_articles', 0, -1);
```

为了防止`laravel`默认的`Redis`配置会自带`prefix`，所以我们需要在`config/database.php`中进行配置。
```php
        'my_redis' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '2'),
            'options' => [
                'prefix' => '',
            ],
        ],
```
只有这样子设置才能保证`sort`不会因为`prefix`而出错。
但`prefix`是有用的，不仅可以防止对`Redis`的默认键产生冲突，还可以让我们更好的管理`Redis`的键。
之所以选择暂时将`prefix`设置为空，是因为我们需要使用`sort`命令，而`sort`命令的`by`选项是需要使用`*`来进行模糊匹配的，而`prefix`会导致`*`失效。
如果要在`Laravel`默认配置下使用`sort`命令，那么我们需要在搜索条件中添加对应的前缀。

### 利用 sort 实现月榜
实现月榜的关键是将数据分隔到不同的键中，这样就可以为每个月维护一个独立的排行榜。以下是如何在使用 `SORT` 命令和哈希结构的上下文中实现月榜的步骤：

1. **为每个月使用一个独立的列表来存储文章ID**:

   以2023年10月为例：
   ```redis
   LPUSH article_ids:2023:10 1 2 3 ...
   ```

2. **为每篇文章的属性使用哈希结构**:

   当你添加或更新文章时，确保在适当的月份键中设置它们：
   ```redis
   HSET article:1:2023:10 likes 10 collects 5
   HSET article:2:2023:10 likes 15 collects 8
   ...
   ```

3. **使用 `SORT` 命令获取月榜**:

   为了获取2023年10月的按 `likes` 排序的前10篇文章的月榜，你可以执行：
   ```redis
   SORT article_ids:2023:10 BY article:*:2023:10->likes LIMIT 0 10 GET article:*:2023:10->likes article:*:2023:10->collects DESC STORE sorted_articles:2023:10
   ```

### 注意：

- 当一个新的月份开始时，确保创建一个新的月份键来存储文章ID和相应的属性。
- 这种方法确保每个月的数据是隔离的，不会与其他月份的数据混淆。
- 根据具体的需求和数据量，可能需要考虑定期清理旧的数据以释放存储空间。

这种方法使用了多个键来组织数据，确保每个月的排行榜数据都是独立的，这使得月榜的实现变得简单并且易于维护。

## 总结：

### 效率对比：

1. **时间复杂度**:
    - 使用 `SORT` 的时间复杂度是 $\(O(N \log N)\)$，其中 $\(N\)$ 是要排序的元素数量。
    - 使用 `ZSET` 的 `ZINCRBY` 的时间复杂度是 $\(O(\log N)\)$。
    - 获取排名（例如使用 `ZRANK`）的时间复杂度也是 $\(O(\log N)\)$。

2. **空间复杂度**:
    - 使用 `SORT` 需要为每个属性维护一个独立的键，这可能会增加存储需求。
    - `ZSET` 也需要为每个属性维护一个独立的有序集合。

3. **灵活性**:
    - `SORT` 提供了对多个属性的排序能力，但可能更复杂和更慢。
    - `ZSET` 提供了快速的增量更新和排名检索。

### 结论：

- 对于大多数排行榜应用，`ZSET` 可能更为高效和灵活。特别是当你经常更新分数（例如点赞）并需要快速访问排名时。
- 如果你需要根据多个属性排序，并且这些排序操作不是很频繁，那么使用 `SORT` 可能会有所帮助。但是，这通常需要更多的存储和更复杂的命令语法。

总的来说，对于大多数排行榜应用，特别是在需要快速更新和检索排名的场景中，`ZSET` 可能是更好的选择。