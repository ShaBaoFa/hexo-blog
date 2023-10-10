---
layout: butt
title: Redis之缓存穿透
date: 2023-10-10 09:33:46
tags:
category: Redis
mathjax: true
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
缓存穿透是指查询一个一定不存在的数据，由于缓存是不命中时需要从数据库查询，查不到数据则不写入缓存，这将导致这个不存在的数据每次请求都要到数据库去查询，失去了缓存的意义。在流量大时，可能DB就挂掉了，要是有人利用不存在的key频繁攻击我们的应用，这就是漏洞。
在接下来的文章中，我们将介绍一种解决方案--布隆过滤器。
{% endnote %}

# 流程图

{% mermaid %}
graph TD
A[客户端查询数据]
B{检查缓存}
C[数据库查询]
D[数据存在 ? ]
E[返回数据给客户端]
F[缓存此数据]
G[返回‘数据不存在’给客户端]

    A --> B
    B -->|数据不在缓存中| C
    C --> D
    D -->|是| E
    D -->|否| G
    E --> F



{% endmermaid %}

这个流程图是不是乍一看很合理？
缓存查询不到就去查询数据库。然后将数据返回给客户端，同时将数据缓存起来。
但是这些都是针对“正人君子”的。如果碰到“坏人”，恶意的查询大量不存在的数据。那么就会导致数据库压力过大，甚至宕机。

那么应该如何处理这种问题呢？
这就需要提到上面说过的布隆过滤器了。

# 布隆过滤器
布隆过滤器（Bloom Filter）是一个非常高效的、用于大数据集的成员查询的数据结构。它能够告诉你一个元素是不是在一个集合中，但它有一个小小的错误率：它可能会错误地告诉你某个元素在集合中（虽然实际上不在），但它永远不会告诉你某个元素不在集合中（如果它实际上在的话）。

在布隆过滤器中，当你想添加一个元素时，你会将该元素通过多个哈希函数进行哈希，然后在bitmap中设置相应的位。当你想检查一个元素是否在集合中时，你也会将该元素通过所有的哈希函数进行哈希，并检查相应的位是否都已经被设置。如果有任何一个位没有被设置，那么该元素肯定不在集合中。但是，如果所有位都被设置了，该元素可能在集合中，也可能不在（因为可能有其他的元素设置了同样的位）。

当我们的需求是在大量的数据中,判断某个元素是否存在时,利用`bitmap`来实现布隆过滤器是非常高效的,因为它不需要存储元素本身,而是通过多个哈希函数来判断元素是否存在,这样就大大减少了存储空间。

## 代码实现

### 创建布隆过滤器服务

在 Laravel 中，你可以创建一个服务来实现布隆过滤器的逻辑。例如，创建一个名为 `BloomFilterService` 的服务：

```bash
php artisan make:service BloomFilterService
```

在新创建的服务文件中，你可以编写以下逻辑：

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

class BloomFilterService
{
    private $hashFunctions;
    private $key = 'bloomfilter';

    public function __construct()
    {
        // 使用多个 hash 函数来降低误报率
        $this->hashFunctions = [
            'crc32',
            'md5',
            'sha1',
        ];
    }

    public function add($item)
    {
        foreach ($this->hashFunctions as $hashFunction) {
            $hash = hash($hashFunction, $item);
            $position = intval($hash, 16) % 1000000; // 这里的 1000000 是 Bitmap 的大小，可以根据实际需求调整
            Redis::setbit($this->key, $position, 1);
        }
    }

    public function exists($item)
    {
        foreach ($this->hashFunctions as $hashFunction) {
            $hash = hash($hashFunction, $item);
            $position = intval($hash, 16) % 1000000;
            if (Redis::getbit($this->key, $position) == 0) {
                return false; // 如果任何一个位置上的位为 0，那么该元素肯定不在集合中
            }
        }
        return true; // 否则，该元素可能在集合中
    }
}
```

### 使用布隆过滤器服务

现在，你可以在 Laravel 中的控制器、任务或其他逻辑中使用 `BloomFilterService` 来添加元素到布隆过滤器或检查元素是否存在。

例如：

```php
use App\Services\BloomFilterService;

$bloomFilter = new BloomFilterService();

$bloomFilter->add('example@example.com');

if ($bloomFilter->exists('example@example.com')) {
    echo "Item exists in the filter!";
} else {
    echo "Item does not exist in the filter!";
}
```

注意：布隆过滤器可能会误报，即错误地认为某个元素存在于集合中，但它不会漏报，即不会错误地认为某个元素不在集合中。

上面是一个简单的布隆过滤器实现。在实际生产环境中，你可能需要调整一些参数，例如选择更多的 hash 函数或调整 Bitmap 的大小，以满足特定的误报率和性能要求。
## Redis自带布隆过滤器
从 `Redis4.x`开始，Redis提供一个模块系统，允许开发者扩展Redis功能，其中 `RedisBloom` 是一个非常流行的模块，为 Redis 提供了布隆过滤器（Bloom Filter）、计数最小值过滤器（Count-Min Sketch）以及其他数据结构。
是的，从 Redis 4.2 开始，Redis 提供了一个模块系统，允许开发者扩展 Redis 功能。其中，RedisBloom 是一个非常流行的模块，为 Redis 提供了布隆过滤器（Bloom Filter）、计数最小值过滤器（Count-Min Sketch）以及其他数据结构。
### 编译&安装 RedisBloom
当然可以。以下是在 Redis 中安装和配置 RedisBloom 模块的详细步骤：


#### **下载并编译 RedisBloom**:

- 克隆 RedisBloom 的 GitHub 仓库：

```bash
git clone https://github.com/RedisBloom/RedisBloom.git
```

- 进入 RedisBloom 目录并编译：

```bash
cd RedisBloom
make
```

完成后，你应该能在 `src` 目录下看到一个名为 `redisbloom.so` 的共享库文件。

#### **配置 Redis 加载 RedisBloom 模块**:

要让 Redis 在启动时加载 RedisBloom 模块，你需要修改 Redis 的配置文件。

1. 找到你的 Redis 配置文件，通常名为 `redis.conf`。如果你不确定配置文件的位置，可以使用以下命令找到它（例如，在 Ubuntu 上）：
```bash
sudo find / -name redis.conf
```
2. 使用文本编辑器打开 `redis.conf` 文件，并添加以下行：
```bash
loadmodule /path/to/redisbloom.so
```
请确保 `/path/to/` 是 `redisbloom.so` 文件的实际路径。
3. 重启 Redis 以应用更改：
```bash
sudo systemctl restart redis-server
```
或者，如果你没有使用 systemd：
```bash
sudo service redis-server restart
```
#### **验证 RedisBloom 的安装**:

连接到 Redis 服务器并尝试执行 RedisBloom 的命令来验证模块是否已正确加载。例如：

```bash
redis-cli
127.0.0.1:6379> BF.ADD myfilter item1
```

如果没有错误并且你收到了预期的输出，那么 RedisBloom 已经成功安装并加载到 Redis 中。

以上就是在 Redis 中安装和配置 RedisBloom 的步骤。安装完成后，你就可以开始使用 RedisBloom 提供的各种功能了。
### 布隆过滤器在 RedisBloom 中的使用：

1. **创建布隆过滤器**:
```redis
BF.ADD key item [item ...]
```
这个命令会添加一个或多个项到布隆过滤器中。

2. **检查某个元素是否存在**:
```redis
BF.EXISTS key item
```
如果该项可能存在于过滤器中，这个命令会返回 1，否则返回 0。

3. **一次检查多个元素**:
```redis
BF.MEXISTS key item [item ...]
```
对于给定的每个项，这个命令都会返回它的存在性。

4. **创建布隆过滤器，设置参数**:
```redis
BF.RESERVE key error_rate initial_capacity
```
使用 `BF.RESERVE` 可以预先设定布隆过滤器的错误率和初始容量。这会影响布隆过滤器的大小和所使用的哈希函数的数量。

### 什么时候使用 RedisBloom：

1. **大数据集查找**: 当你有一个非常大的数据集，并且想要快速查找一个元素是否存在，而不需要存储整个数据集。
2. **防止缓存穿透**: 在缓存层，使用布隆过滤器可以帮助你快速判断一个元素是否可能在数据库中，从而避免对数据库的无效查询。
3. **系统去重**: 在数据流处理中，布隆过滤器可以帮助你判断一个元素是否已经被处理过，从而避免重复处理。

# 防止缓存穿透
使用布隆过滤器可以帮助我们防止缓存穿透。在缓存层，使用布隆过滤器可以帮助你快速判断一个元素是否可能在数据库中，从而避免对数据库的无效查询。
以下是流程图:
{% mermaid %}
graph TD
A[客户端请求数据]
B[检查布隆过滤器]
C[数据在布隆过滤器中]
D[从缓存中获取数据]
E[数据不在布隆过滤器中]
F[返回数据不存在]

A --> B
B -- 存在 --> C
C --> D
D -- 命中缓存 --> G[返回缓存数据]
D -- 缓存未命中 --> H[查询数据库]
H --> I[更新缓存]
H --> G
B -- 不存在 --> E
E --> F
{% endmermaid %}

# 总结
在本文中，我们介绍了缓存穿透的概念，以及如何使用布隆过滤器来防止缓存穿透。我们还介绍了如何在 Laravel 中使用布隆过滤器。最后，我们还介绍了 RedisBloom 模块，它为 Redis 提供了布隆过滤器和其他数据结构。
{% note purple 'fa-solid fa-lightbulb' flat %}
在实际生产环境中，你可能需要调整一些参数，例如选择更多的 hash 函数或调整 Bitmap 的大小，以满足特定的误报率和性能要求。
{% endnote %}
