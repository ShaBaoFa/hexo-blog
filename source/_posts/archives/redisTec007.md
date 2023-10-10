---
layout: butt
title: Redis之缓存击穿&缓存雪崩
date: 2023-10-10 16:02:40
tags:
category: Redis
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
缓存击穿是指一个key非常热点，在不停的扛着大并发，大并发集中对这一个点进行访问，当这个key在失效的瞬间，持续的大并发就穿破缓存，直接请求数据库，就像在一个屏障上凿开了一个洞。
缓存雪崩是指在我们设置缓存时采用了相同的过期时间，导致缓存在某一个时间段内集体失效，请求全部转发到DB，DB瞬时压力过重雪崩。
{% endnote %}
为什么我两种情况放在一起说呢？
其实缓存雪崩和缓存击穿，两件事情本质上是非常相似的。都是因为缓存失效导致请求直接打到数据库，而数据库无法承受如此大的查询负载，导致服务崩溃。
你可以认为缓存击穿是缓存雪崩的一个子集。
# 缓存击穿
## 场景
在现实生活中，有很多业务场景都有可能因为缓存击穿而瘫痪。
以下是几个比较典型的场景:
1. **秒杀活动**：
   当一个热门的商品开始秒杀，大量的用户同时进行抢购。如果这些用户的请求都直接到达数据库，那么数据库可能会因为压力过大而崩溃，导致整个秒杀活动失败。

2. **热点新闻或文章**：
   当某个新闻或文章突然火爆，大量的用户都想查看这个内容。如果这些内容没有在缓存中，而且这些请求全部打到数据库，那么数据库可能承受不住这样的流量。

3. **特定的搜索关键词**：
   如果某个搜索关键词突然变得非常热门，而这个关键词对应的数据并不在缓存中，那么所有的搜索请求都会直接打到数据库，导致数据库压力过大。

4. **系统启动或重启时**：
   当一个大型的系统在启动或者重启后，大量的数据可能还没有加载到缓存中。这时，大量的用户请求可能都会直接打到数据库，导致数据库的压力过大。

5. **恶意攻击**：
   某些恶意用户可能会故意频繁请求某些不存在的数据，导致这些请求都直接打到数据库，从而实现对数据库的拒绝服务攻击。

## 解决方案
1. **设置热点数据永不过期**：
   对于热点数据（经常被访问的数据），可以考虑将其设置为永不过期。这样，你可以确保这些数据始终在缓存中，从而避免缓存击穿的问题。

2. **互斥锁**：
   当缓存失效的时候，不是立即去加载数据库，而是先使用缓存工具的某些数据结构（如 Redis 的 setnx）来设置一个互斥锁。第一个获得锁的请求去数据库加载数据并放到缓存，而其他请求等待。这样，只有一个请求会去加载数据，其他的请求会等待，减少了对数据库的压力。

   例如，使用 Redis 的 `setnx` 和 `expire` 命令来实现锁。

3. **数据预热**：
   在系统启动后，预先将可能被大量访问的数据加载到缓存中。这可以避免在高流量情况下突然大量的请求去查询数据库。

4. **使用布隆过滤器**：
   布隆过滤器可以用来判断一个元素是否可能在集合中。对于缓存，可以使用布隆过滤器来判断数据是否在缓存中。如果布隆过滤器表示数据不在缓存中，则不需要查询数据库。只有当布隆过滤器表示数据可能在缓存中时，才查询数据库。

5. **分布式缓存**：
   使用分布式缓存解决方案，如 Redis Cluster，可以增加系统的容错性和可用性。即使某些节点出现问题，其他节点仍然可以提供服务。

6. **设置不同的过期时间**：
   对于相同的数据，可以为每个请求设置稍微不同的过期时间，这样可以避免大量的请求在同一时间查询数据库。

7. **后台异步更新**：
   当数据在缓存中过期时，不是立即从数据库中加载数据，而是返回旧的缓存数据，并异步触发后台进程从数据库中重新加载数据并更新缓存。这样可以避免在高流量下立即对数据库造成压力。

以上是几种比较常见的解决方案，但是并不是每种方案都适合你的业务场景。你需要根据自己的业务场景选择合适的方案。

下面我详细讲解以下使用**互斥锁**来解决缓存击穿的问题。
### 互斥锁（代码实现）
以下我就使用php+laravel框架来实现互斥锁的逻辑。
当然可以。以下是一个使用 Laravel 和 Redis 实现互斥锁以防止缓存击穿的示例：

1. **首先**，确保你已经安装了 Laravel 的 Redis 支持。在你的 `composer.json` 文件中，应该有如下依赖：

```json
"predis/predis": "^1.1"
```

如果没有，你可以使用 Composer 安装它：

```bash
composer require predis/predis
```

2. **其次**，在 `.env` 文件中配置 Redis 连接信息。

3. **接着**，编写代码来实现互斥锁：

```php
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

public function getFromCacheWithMutexLock($cacheKey, $lockKey, $expiration, $callback)
{
    $data = Cache::get($cacheKey);

    // 如果数据已经在缓存中，直接返回
    if (!is_null($data)) {
        return $data;
    }

    // 尝试获得锁
    $lock = Redis::set($lockKey, 1, 'NX', 'EX', 10);

    // 如果成功获得锁
    if ($lock) {
        // 从数据库或其他地方获取数据
        $data = $callback();

        // 存储数据到缓存
        Cache::put($cacheKey, $data, $expiration);

        // 释放锁
        Redis::del($lockKey);

        return $data;
    } else {
        // 如果没有获得锁，稍等一会再尝试
        sleep(1);
        return $this->getFromCacheWithMutexLock($cacheKey, $lockKey, $expiration, $callback);
    }
}
```
{% note blue 'fa-solid fa-lightbulb' flat %}
我们使用 `Redis::set($lockKey, 1, 'NX', 'EX', 10);` 来尝试获得一个持续 10 秒的锁。`NX` 选项确保只有当 `$lockKey` 不存在时才设置该键，而 `EX` 选项设置该键的过期时间为 10 秒。
{% endnote %}
4. **使用该函数**：

```php
$user = $this->getFromCacheWithMutexLock('user_'.$userId, 'lock_user_'.$userId, 86400, function() use ($userId) {
    return User::find($userId);
});
```

这段代码首先尝试从缓存中获取数据。如果数据不在缓存中，它会尝试获得一个互斥锁。如果获得锁，它会从数据库中加载数据，存储到缓存，并释放锁。如果没有获得锁，它会稍等一会然后重试。

这样，即使有大量并发请求，也只有一个请求会去加载数据，其他的请求会等待，从而减少了对数据库的压力。

# 缓存雪崩
## 原因
通常我们为了保证缓存中的数据和`DB`中的数据保证一致性，会给Redis里的数据设置一个过期时间，比如`1天`，`1周`，`1个月`等等。
然而当大量数据在同一时间失效时，会导致大量的请求直接打到数据库，从而导致数据库压力过大，甚至宕机。
其实除了缓存失效，还有其他原因也会导致缓存雪崩，比如：
- **Redis宕机**：
   当Redis宕机后，所有的请求都会直接打到数据库，导致数据库压力过大。
- **大量写请求**：
   当大量写请求打到Redis时，Redis可能会因为压力过大而宕机，导致所有的请求都直接打到数据库。
- **内存溢出**：
   当Redis的内存使用量超过物理内存限制时，Redis可能会因为内存溢出而宕机，导致所有的请求都直接打到数据库。
但归根结底，原因都是因为Redis宕机。
### 流程图
{% mermaid %}
sequenceDiagram
participant 客户端 as Client
participant 缓存 as Cache
participant 数据库 as Database

    loop 循环请求
        客户端->>缓存: 请求数据
        activate 缓存
        缓存-->>客户端: 返回数据
        deactivate 缓存
        Note over 缓存: 缓存失效（例如过期）
        客户端->>缓存: 请求数据
        activate 缓存
        缓存-->>数据库: 请求数据
        activate 数据库
        数据库-->>缓存: 返回数据
        缓存-->>客户端: 返回数据
        deactivate 数据库
        deactivate 缓存
    end
    Note over 数据库,缓存: 当大量缓存同时失效<br>数据库可能面临巨大压力<br>可能导致宕机
{% endmermaid %}
## 解决方案

1. **缓存数据过期时间随机**:
   为了避免大量数据同时过期，可以为每个缓存设置随机的过期时间，这样可以确保缓存的过期时间分散，不会同时发生。

2. **数据预热**:
   在缓存数据过期前，就开始重新加载数据。例如，如果数据的过期时间是 24 小时，可以在 20-23 小时之间就开始预热数据，确保数据在真正的过期前已经被重新加载。
{% note blue 'fa-solid fa-lightbulb' flat %}
如果用户数据非常庞大，每小时全量预热数据确实可能会对系统性能产生很大的消耗，并且可能不是最佳的策略。这不仅会增加数据库的压力，还会导致大量不必要的缓存写入。
- 在生成的 `CachePreheat` 命令类中添加逻辑：
```php
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CachePreheat extends Command
{
    protected $signature = 'cache:preheat';
    protected $description = 'Preheat cache items before they expire';

    public function handle()
    {
        // 示例：预热用户数据
        $users = User::all();  // 从数据库中获取所有用户数据
        foreach ($users as $user) {
            $key = 'user_' . $user->id;
            if (!Cache::has($key)) {  // 如果缓存中没有用户数据
                $this->setCacheWithRandomExpiration($key, $user);  // 重新设置缓存
            }
        }

        $this->info('Cache preheat completed.');
    }

    protected function setCacheWithRandomExpiration($key, $value)
    {
        $expiration = random_int(50, 70);
        Cache::put($key, $value, now()->addMinutes($expiration));
    }
}
```
- 在 `app/Console/Kernel.php` 文件中添加以下行：
```php
protected function schedule(Schedule $schedule)
{
    // ... 其他已有的任务

    // 每小时运行一次预热命令
    $schedule->command('cache:preheat')->hourly();
}
```
{% endnote %}
3. **热点数据永不过期**:
   对于访问非常频繁的热点数据，可以考虑设置为永不过期，或者使用一个非常长的过期时间。
{% note blue 'fa-solid fa-lightbulb' flat %}
但是，这种方法并不适用于所有的热点数据。如果热点数据的数量非常多，那么可能会导致大量的缓存占用内存，从而影响系统的性能。
```php
use Illuminate\Support\Facades\Cache;

public function cacheHotData($key, $value)
{
    // 设置一个非常长的过期时间，例如一年
    $longExpiration = now()->addYear(1);

    Cache::put($key, $value, $longExpiration);
}

public function getFromCache($key)
{
    return Cache::get($key);
}
```
{% endnote %}
4. **双层缓存**:
   对于每种数据，可以使用两层缓存：一个短期缓存和一个长期缓存。短期缓存的过期时间比长期缓存短。当短期缓存过期时，可以从长期缓存中获取数据，并启动后台进程重新加载数据。这样，即使短期缓存过期，请求也不会直接击中数据库。
{% note blue 'fa-solid fa-lightbulb' flat %}
但是，这种方法需要维护两个缓存，增加了系统的复杂性。
并且，如果短期缓存过期后，长期缓存也过期了，那么请求就会直接击中数据库。
为了解决这个问题，可以结合前面提到的`“缓存数据过期时间随机”`策略：
- 当设置长期缓存时，给它一个随机的过期时间，这样可以确保不是所有的长期缓存都在同一时间过期。
- 你可以设置一个范围，比如长期缓存的过期时间是在50到70分钟之间随机选择。
```php
if (!$data) {
    $data = Cache::get($longTermKey);

    if (!$data) {
        // 如果长期缓存中也没有数据，回退到数据源获取
        $data = $callback();
        $longExpiration = random_int(50, 70);  // 随机选择过期时间
        Cache::put($longTermKey, $data, now()->addMinutes($longExpiration));
    }

    // 异步更新短期缓存
    Cache::put($shortTermKey, $data, now()->addMinutes(5));
}
```
{% endnote %}
5. **使用分布式缓存**:
   使用分布式缓存解决方案，如 Redis Cluster 或其他分布式缓存产品，可以增加系统的容错性和可用性。这样，即使某些节点出现问题，其他节点仍然可以提供服务。

6. **备份 Redis 实例**:
   可以运行一个备份的 Redis 实例，并定期将数据从主实例同步到备份实例。如果主实例出现问题，可以迅速切换到备份实例，从而避免大量请求击中数据库。
{% note blue 'fa-solid fa-lightbulb' flat %}
主从基本是标配，但这增加了维护的实例数，并且增加了系统的复杂性。
redis 备份方式有RDB和AOF两种，RDB是指在指定的时间间隔内将内存中的数据集快照写入磁盘，AOF是指将每次写入的操作以日志的形式记录下来，当服务器重启的时候会重新执行这些命令来恢复原始的数据。
（回头写一份关于RDB和AOF的文~~（挖坑）~~）
{% endnote %}
7. **限流和降级**:
   当系统出现异常或过载时，可以使用限流措施来控制请求的速率，或者使用降级策略，如返回简化的数据或错误页面，从而避免系统崩溃。
{% note blue 'fa-solid fa-lightbulb' flat %}
但是，这种方法并不能从根本上解决问题，只是将问题转移到了其他地方。如果系统出现异常或过载，那么可能会导致用户体验变差，甚至导致用户流失。
{% endnote %}
限流示范:
   使用 Laravel 和 Redis 实现一个简单的限流器：
```php
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Response;

public function rateLimiter($user_id) {
    $key = 'rate_limit:' . $user_id;
    $maxAttempts = 10;  // 每分钟最大请求次数
    $expireTime = 60;   // 计数器的过期时间

    // 获取当前的请求次数
    $attempts = Redis::get($key) ?: 0;

    if ($attempts >= $maxAttempts) {
        // 超出请求限制
        return Response::make('Too Many Requests', 429);
    } else {
        // 增加计数器
        Redis::multi();
        Redis::incr($key);
        Redis::expire($key, $expireTime);
        Redis::exec();

        // 继续处理请求...
        return "Request Processed";
    }
}
```
### laravel自带的limiter中间件
是的，Laravel 自带了一个非常强大的限流功能，它基于 Redis 或其他缓存驱动来工作。你完全可以使用 Laravel 提供的这个功能，而不必自己从头开始实现。

以下是如何使用 Laravel 的限流器 (`limiter`) 的简介：

#### 在路由中使用限流器

Laravel 允许你直接在路由定义中使用限流器。例如，以下代码限制一个特定路由每分钟只能被请求 60 次：

```php
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/api/data', 'ApiController@getData');
});
```

在上面的代码中，`throttle:60,1` 表示在 1 分钟内允许最多 60 个请求。

#### 自定义限流响应

你可以通过自定义一个限流响应来修改默认的 429 Too Many Requests 响应。在 `App\Exceptions\Handler` 类的 `render` 方法中，捕获 `Illuminate\Http\Exceptions\ThrottleRequestsException` 异常：

```php
use Illuminate\Http\Exceptions\ThrottleRequestsException;

public function render($request, Throwable $exception)
{
    if ($exception instanceof ThrottleRequestsException) {
        return response()->json(['message' => 'Too Many Requests'], 429);
    }

    return parent::render($request, $exception);
}
```

#### 动态限流

你还可以基于用户的属性或其他因素动态地设置限流参数。例如，你可以根据用户的角色提供不同的限流设置：

```php
Route::middleware(['throttle:rate_limit,1'])->group(function () {
    Route::get('/api/data', 'ApiController@getData');
});

// 在 RouteServiceProvider 的 boot 方法中
public function boot()
{
    parent::boot();

    RateLimiter::for('rate_limit', function (Request $request) {
        // 根据用户角色动态返回限流值
        return $request->user()->isAdmin() ? 100 : 60;
    });
}
```

Laravel 的限流器非常灵活，并提供了许多内置的功能，这可以让你轻松地为应用添加限流功能，而无需自己实现整个机制。

降级示范:
```php
public function getData() {
    $data = null;

    try {
        // 尝试从缓存或数据库获取数据
        $data = Cache::get('some_key');
    } catch (\Exception $e) {
        // 数据获取失败时的降级策略
        $data = [
            'error' => 'Service is currently unavailable, please try again later.'
        ];
    }

    return response()->json($data);
}
```