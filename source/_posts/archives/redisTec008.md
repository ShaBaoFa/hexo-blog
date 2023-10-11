---
layout: butt
title: Redis之数据库与缓存一致性问题
date: 2023-10-11 14:27:16
tags:
category: Redis
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
相信大家一定在面试的时候被问到过这个问题，缓存和数据库，你要如何保证一致性？
在多线程的情况下，要如何保证呢？
到底是先更新缓存再更新数据库？还是先更新数据库再更新缓存？
还是其他的一些方案？
这次就来聊聊这个问题。
{% endnote %}

# 先更新数据库，再更新缓存
举个例子，比如「请求 A 」和「请求 B 」两个请求，同时更新「同一条」数据
可能出现的问题 :
{% mermaid %}
sequenceDiagram
participant 请求A as Request A
participant 请求B as Request B
participant 数据库 as Database
participant 缓存 as Cache

    请求A->>数据库: 更新数据
    activate 数据库
    数据库-->>请求A: 更新成功
    deactivate 数据库

    请求B->>数据库: 更新数据
    activate 数据库
    数据库-->>请求B: 更新成功
    deactivate 数据库

    请求B->>缓存: 更新缓存
    activate 缓存
    缓存-->>请求B: 更新成功
    deactivate 缓存

    请求A->>缓存: 更新缓存
    activate 缓存
    缓存-->>请求A: 更新成功
    deactivate 缓存

    Note over 数据库,缓存: 数据库中是请求B的数据<br>但缓存中是请求A的数据<br>导致不一致
{% endmermaid %}
流程描述：
1. 请求A首先更新数据库。
2. 然后，请求B也更新数据库。
3. 请求B再次更新缓存。
4. 最后，请求A更新缓存。
这导致了数据库中的数据与缓存中的数据不一致：**数据库中是请求B的更新，而缓存中是请求A的更新。**

# 先更新缓存，再更新数据库

流程图:
{% mermaid %}
sequenceDiagram
participant 请求A as Request A
participant 请求B as Request B
participant 数据库 as Database
participant 缓存 as Cache

    请求A->>缓存: 更新缓存
    activate 缓存
    缓存-->>请求A: 更新成功
    deactivate 缓存

    请求B->>缓存: 更新缓存
    activate 缓存
    缓存-->>请求B: 更新成功
    deactivate 缓存

    请求B->>数据库: 更新数据
    activate 数据库
    数据库-->>请求B: 更新成功
    deactivate 数据库

    请求A->>数据库: 更新数据
    activate 数据库
    数据库-->>请求A: 更新成功
    deactivate 数据库

    Note over 数据库,缓存: 缓存中是请求B的数据<br>但数据库中是请求A的数据<br>导致不一致
{% endmermaid %}

所以，其实你无论是**【先更新数据库还是先更新缓存】**，都会导致数据不一致的问题。

# 先删除缓存，再更新数据库
那这次我们不更新缓存，直接删除缓存。是不是能解决呢？
那不管怎么更新，我都是删除缓存。
答案其实也是否定的。
因为这里涉及到了`读操作`，`写操作`。
我用流程图给你们解释一下：
{% mermaid %}
sequenceDiagram
participant 更新进程 as Update Process
participant 读进程 as Read Process
participant 数据库 as Database
participant 缓存 as Cache

    更新进程->>缓存: 删除缓存
    activate 缓存
    缓存-->>更新进程: 删除成功
    deactivate 缓存

    读进程->>缓存: 检查缓存
    activate 缓存
    缓存-->>读进程: 缓存为空
    deactivate 缓存

    读进程->>数据库: 读取数据
    activate 数据库
    数据库-->>读进程: 返回旧数据
    deactivate 数据库

    读进程->>缓存: 用旧数据更新缓存
    activate 缓存
    缓存-->>读进程: 更新成功
    deactivate 缓存

    更新进程->>数据库: 更新数据库
    activate 数据库
    数据库-->>更新进程: 更新成功
    deactivate 数据库

    Note over 数据库,缓存: 缓存中是基于旧数据库数据<br>而数据库中是新的数据<br>导致不一致
{% endmermaid %}
如流程所示，这种情况通常是由于以下原因导致的：当进行`删除缓存`操作后，另一个进程/请求从旧的数据库数据中`读取并更新缓存`。然后，当数据库更新完成时，缓存中的数据已经是基于旧的数据库数据，从而导致数据不一致。

# 先更新数据库，再删除缓存
继续用`读操作`，`写操作`的场景来分析。

{% mermaid %}
sequenceDiagram
participant 写操作 as Write Process
participant 读操作 as Read Process
participant 数据库 as Database
participant 缓存 as Cache
    
    读操作->>缓存: 检查缓存
    activate 缓存
    缓存-->>读操作: 缓存未命中
    deactivate 缓存

    读操作->>数据库: 读取数据
    activate 数据库
    数据库-->>读操作: 返回旧数据
    deactivate 数据库

    写操作->>数据库: 更新数据库
    activate 数据库
    数据库-->>写操作: 更新成功
    deactivate 数据库

    写操作->>缓存: 删除缓存
    activate 缓存
    缓存-->>写操作: 删除成功
    deactivate 缓存

    读操作->>缓存: 用旧数据更新缓存
    activate 缓存
    缓存-->>读操作: 更新成功
    deactivate 缓存

    Note over 数据库,缓存: 缓存中是旧数据<br>而数据库中是新的数据<br>导致不一致

{% endmermaid %}

如流程所示，我们先更新数据库再删除缓存。依旧无法解决数据不一致的问题。
但事实真的是这样子吗？
发生这种问题的可能性是非常低的。
我们不妨想一想，为什么我们要用缓存。
是不是因为缓存的读取速度比数据库快很多，不是一个数量级，所以我们才用缓存。
所以在实际中很难出现`写操作`已经更新了数据库并且删除了缓存，`读操作`才更新完缓存的情况。
所以其实`先更新数据库再删除缓存`的方案，是可以解决数据不一致的问题的。

但，这就万无一失了吗？真的吗？
万一，删除缓存操作{% label 失败 red %}了呢？

那有的人可能会说，那我在缓存上增加一个过期时间。
那不就是让使用方去承担等待缓存过期的时间吗？
这个操作老板不会同意的。

那要怎么解决呢？

## 把操作放进队列

程序员的直觉，如果失败，那就重试，还不行？那就通知我。
结果显而易见，MQ（队列）。

### 重试机制（MQ）

当我们遇到 Redis 缓存操作失败的情况，我们可以考虑使用消息队列 (MQ) 来实现重试机制。这样，即使第一次操作失败，我们也可以在稍后的时间进行重试。

#### 为什么使用消息队列？

- **异步处理**: 当 Redis 操作失败时，我们可以将该操作作为消息放入队列，由后台进程来异步处理和重试。
- **容错**: 消息队列提供了消息持久化的能力，即使处理消息的进程崩溃，消息也不会丢失。
- **重试**: 如果消息处理失败，可以再次将消息放回队列中，稍后再试。

#### 使用 Laravel 的队列系统

Laravel 提供了一个强大的队列系统，可以方便地实现这一功能。

##### 步骤:

1. **配置 Laravel 队列**

   Laravel 支持多种队列驱动，例如 Redis、SQS、Database 等。你需要在 `.env` 文件中选择一个队列驱动，并相应地配置它。

   例如，如果你选择 Redis 作为队列驱动：

   ```
   QUEUE_CONNECTION=redis
   ```

2. **创建一个队列任务**

   使用 Laravel 的 Artisan 命令工具创建一个队列任务。

   ```bash
   php artisan make:job RetryRedisOperation
   ```

   这将生成一个新的队列任务类，你可以在这个类中定义你的 Redis 操作逻辑。

3. **在队列任务中执行 Redis 操作**

   在 `RetryRedisOperation` 类中，你可以在 `handle` 方法中定义你的 Redis 操作逻辑。

   ```php
   public function handle()
   {
       // 你的 Redis 操作代码
       try {
           // 尝试 Redis 操作
       } catch (\Exception $e) {
           // 如果操作失败，可以考虑重新将任务放回队列
           $this->release(10);  // 10 秒后重试
       }
   }
   ```

4. **分派任务到队列**

   当你需要执行 Redis 操作时，你可以创建并分派这个队列任务。

   ```php
   RetryRedisOperation::dispatch();
   ```

5. **启动队列工作进程**

   为了处理队列中的任务，你需要启动 Laravel 的队列工作进程。

   ```bash
   php artisan queue:work
   ```

当重试 N 次之后还是失败，通知管理员，你可以在队列任务中增加一个失败次数计数器，并在达到最大失败次数时发送通知。

以下是如何实现这一逻辑：

1. **在队列任务中增加失败次数计数器**

   在 `RetryRedisOperation` 任务类中，你可以添加一个私有属性 `$tries` 来指定任务的最大尝试次数。

   ```php
   public $tries = 3;  // 最大重试次数
   ```

2. **定义失败的处理方法**

   在 `RetryRedisOperation` 类中，你可以定义一个 `failed` 方法来处理任务失败的逻辑。

   ```php
   public function failed(Exception $exception)
   {
       // 当任务尝试次数超过 $tries 时，此方法会被调用
       // 发送通知给管理员
       $this->notifyAdmin($exception);
   }

   protected function notifyAdmin($exception)
   {
       // 这里可以使用 Laravel 的通知系统，或其他方式，发送通知给管理员
       // 例如，你可以发送电子邮件、Slack 通知等
   }
   ```

3. **使用 Laravel 的通知系统**

   Laravel 提供了一个强大的通知系统，你可以使用它来发送通知。首先，你需要定义一个通知类。

   ```bash
   php artisan make:notification RedisOperationFailedNotification
   ```

   然后，在这个新的通知类中，你可以定义如何发送通知（例如，通过电子邮件、Slack 等）。

   ```php
   use Illuminate\Notifications\Notification;
   use Illuminate\Notifications\Messages\MailMessage;

   class RedisOperationFailedNotification extends Notification
   {
       public function toMail($notifiable)
       {
           return (new MailMessage)
               ->line('Redis 操作失败!')
               ->action('查看详情', url('/'))
               ->line('请尽快处理!');
       }

       // 你还可以定义其他通知渠道，如 Slack、SMS 等
   }
   ```

   最后，在 `notifyAdmin` 方法中，你可以发送这个通知。

   ```php
   protected function notifyAdmin($exception)
   {
       Notification::route('mail', 'admin@example.com')
           ->notify(new RedisOperationFailedNotification($exception));
   }
   ```

这样，当 Redis 操作连续失败 N 次后，系统会自动发送通知给管理员。你可以根据自己的需求调整这些代码，例如，增加更多的通知渠道、自定义通知内容等。

## 通过binlog来操作缓存
好的，我们继续探讨第二种方案：**订阅 MySQL binlog，再操作缓存**。

### 订阅 MySQL binlog，再操作缓存

MySQL 的 binary log（binlog）是一种日志文件，记录了对数据库进行的所有数据更改。通过订阅 binlog，我们可以实时获取数据库的更改事件，然后基于这些事件来更新 Redis 缓存。

#### 使用 `php-mysql-replication` 包

`php-mysql-replication` 是一个 PHP 库，可以帮助我们订阅并解析 MySQL 的 binlog 事件。你可以使用 Composer 来安装它：

```bash
composer require krowinski/php-mysql-replication
```

#### 配置 MySQL

为了使用 binlog，你需要确保 MySQL 已经启用了它，并且使用了 `ROW` 格式。可以在 `my.cnf` 或 `my.ini` 中进行配置：

```
[mysqld]
log-bin=mysql-bin
binlog-format=ROW
```

然后重启 MySQL。

#### 实现 binlog 订阅

使用 `php-mysql-replication`，你可以编写一个脚本或 Laravel 命令来订阅并处理 binlog 事件：

```php
use MySQLReplication\BinLog\BinLogSocketConnect;
use MySQLReplication\BinLog\BinLogSocketConnectException;
use MySQLReplication\Config\ConfigBuilder;
use MySQLReplication\Event\EventSubscribers;
use MySQLReplication\JsonBinaryDecoder\JsonBinaryDecoderException;
use MySQLReplication\MySQLReplicationFactory;
use MySQLReplication\Socket\SocketException;

$config = (new ConfigBuilder())
    ->withHost('127.0.0.1')
    ->withPort(3306)
    ->withUser('your_username')
    ->withPassword('your_password')
    ->build();

$binLogStream = new MySQLReplicationFactory($config);

$eventSubscriber = new class extends EventSubscribers {
    public function onUpdate(): void
    {
        // 当数据更新时，更新 Redis 缓存
    }

    public function onInsert(): void
    {
        // 当数据插入时，更新 Redis 缓存
    }

    public function onDelete(): void
    {
        // 当数据删除时，更新 Redis 缓存
    }
};

$binLogStream->registerSubscriber($eventSubscriber);

try {
    $binLogStream->run();
} catch (BinLogSocketConnectException $e) {
} catch (SocketException $e) {
} catch (JsonBinaryDecoderException $e) {
}
```

在上述代码中，我们定义了一个 `EventSubscribers` 子类，该类中的方法会在相应的数据库事件发生时被调用。你可以在这些方法中更新 Redis 缓存。

#### 整合到 Laravel

你可以将上述代码整合到一个 Laravel 命令中，这样你可以通过 Artisan 命令来启动 binlog 订阅服务：

```bash
php artisan make:command BinlogSubscriber
```

然后在生成的 `BinlogSubscriber.php` 文件中，将上述代码放入 `handle` 方法，并根据需要进行适当的修改。

通过这种方法，你可以实时监听 MySQL 的数据更改，并基于这些更改来更新 Redis 缓存，确保缓存数据的实时性和准确性。