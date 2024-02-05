---
layout: butt
title: Redis之批量删除keys
date: 2023-09-30 23:53:06
tags:
category: Redis
cover: /images/redis.png
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
在Redis中，删除key有很多种办法，比如一种是使用`DEL`命令，一种是使用`UNLINK`命令，或者 `EXPIRE {keyname} {ttl}'`命令。
但我们如果要批量删除呢？比如删除所有以`user`开头的key，或者删除所有的key。
来看看如何丝滑的处理这些问题。
{% endnote %}

# 删除所有key
如果你想删除所有的key，那么可以使用`FLUSHALL`命令，但是这个命令会删除所有的key，包括系统的key，所以不建议使用。
```shell
FLUSHALL
```
如果你只想删除自己的key，那么可以使用`FLUSHDB`命令，这个命令只会删除当前数据库的key。
```shell
FLUSHDB
```
# 删除所有以`user`开头的key
## key 数量比较少或者测试环境
如果你想删除所有以`user`开头的key，那么可以使用`KEYS`命令，这个命令会返回所有符合条件的key，然后使用`DEL`命令删除。
```shell
redis-cli -h {hostname} -p {port} -a {password} -n {database} --raw keys "user*" | xargs -I {} redis-cli -h {hostname} -p {port} -a {password} -n {database} DEL "{}"
```

### 命令详解

这是一个组合的命令，主要用于连接 Redis 数据库并删除匹配给定模式的所有键。命令的核心部分是 `redis-cli`，它是 Redis 客户端的命令行工具，用于与 Redis 服务器交互。接下来我会逐个解释这个命令中的每个参数：

1. `redis-cli`: 这是 Redis 的命令行接口工具。

2. `-h {hostname}`: 指定要连接的 Redis 服务器的主机名或 IP 地址。

3. `-p {port}`: 指定要连接的 Redis 服务器的端口号。

4. `-a {password}`: 如果 Redis 服务器设置了密码，使用此选项和相应的密码进行身份验证。

5. `-n {database}`: 选择 Redis 数据库的编号。Redis 默认有 16 个数据库，编号从 0 到 15。

6. `--raw`: 这个选项确保输出是原始的，没有任何转义或格式化。

7. `keys "{pattern}"`: 这是一个 Redis 命令，用于列出所有与给定模式匹配的键。

8. `|`: 这是 Unix/Linux 的管道符号，用于将一个命令的输出传递给另一个命令。

9. `xargs`: 这是一个 Unix/Linux 命令，它可以从输入（通常是标准输入或其他命令的输出）中读取参数，并将这些参数传递给另一个命令。

10. `-I {}`: 这是 `xargs` 的一个选项，它定义了一个替换字符串。在后续的命令中，每次出现 `{}` 都会被替换为从输入中读取的参数。

11. `redis-cli -h {hostname} -p {port} -a {password} -n {database} DEL "{}"`: 这是 `xargs` 执行的命令。它会为从前面的 `keys` 命令输出中获取的每一个键执行一次删除操作。

首先列出所有与指定模式匹配的 Redis 键，然后使用 `xargs` 命令为每一个键执行删除操作。

这种操作是有限制的，并且最好不要在正式环境使用，因为`KEYS`命令会阻塞Redis的其他操作，如果你的key数量很多，那么这个命令会阻塞很长时间。
## key 数量比较多或者正式环境
如果你想删除所有以`user`开头的key，那么可以使用`SCAN`命令，这个命令会返回所有符合条件的key，然后使用`DEL`命令删除。
```shell
redis-cli -h {hostname} -p {port} -a {password} -n {database} --raw --scan --pattern "user*" | xargs -I {} redis-cli -h {hostname} -p {port} -a {password} -n {database} DEL "{}"
```
让我们逐个分析这个命令中的参数：

### 第一部分：获取匹配的键

1. `redis-cli`: Redis 的命令行工具，用于与 Redis 服务器交互。

2. `-h {hostname}`: 指定要连接的 Redis 服务器的主机名或 IP 地址。

3. `-p {port}`: 指定要连接的 Redis 服务器的端口号。

4. `-a {password}`: 如果 Redis 服务器设置了密码，使用此选项和相应的密码进行身份验证。

5. `-n {database}`: 选择 Redis 数据库的编号。Redis 默认有 16 个数据库，编号从 0 到 15。

6. `--raw`: 确保输出为原始格式，不进行任何转义或格式化。

7. `--scan`: 使用 `SCAN` 命令进行迭代，这是一个游标基于的迭代器，不会像 `KEYS` 那样阻塞服务器。

8. `--pattern "user*"`: 只返回匹配给定模式（在这里是以 "user" 开头的键）的 key。

### 第二部分：删除获取到的键

1. `|`: Unix/Linux 的管道符号，将前一个命令的输出传递给后一个命令。

2. `xargs`: Unix/Linux 命令，从输入（通常是前一个命令的输出）中读取参数，并将这些参数传递给另一个命令。

3. `-I {}`: 这是 `xargs` 的一个选项，它定义了一个替换字符串。在后续的命令中，每次出现 `{}` 都会被替换为从前面的 `--scan` 命令输出中获取的键。

4. `redis-cli -h {hostname} -p {port} -a {password} -n {database} DEL "{}"`: 这是 `xargs` 执行的命令。对于从前面的 `--scan` 命令输出中获取的每一个键，都会执行一次删除操作。

首先使用 `SCAN` 和 `--pattern` 选项从 Redis 中获取匹配的 key，然后使用 `xargs` 命令为每一个获取到的 key 执行删除操作。

## 使用脚本完成删除

### Laravel
要在 Laravel 中完成这个任务，您可以创建一个 Artisan 命令，然后使用 Laravel 的任务调度功能来定期执行它。以下是如何完成这个任务的步骤：

### 1. 创建一个新的 Artisan 命令：

首先，使用以下命令生成一个新的 Artisan 命令：

```bash
php artisan make:command DeleteRedisKeys
```

这将在 `app/Console/Commands` 目录下创建一个 `DeleteRedisKeys.php` 文件。

### 2. 修改新创建的 Artisan 命令：

打开 `DeleteRedisKeys.php` 文件并进行以下更改：

1. 设置命令名称和描述：

```php
protected $signature = 'redis:delete-keys {pattern=user*}';
protected $description = 'Delete Redis keys based on a pattern';
```

2. 在 `handle` 方法中添加键删除逻辑：

```php
public function handle()
{
    $pattern = $this->argument('pattern');
    
    $redis = app()->make('redis');
    $cursor = 0;
    do {
        list($cursor, $keys) = $redis->scan($cursor, 'match', $pattern, 'count', 1000);

        if ($keys) {
            $redis->del($keys);
        }
    } while ($cursor !== 0);

    $this->info("Keys matching pattern '{$pattern}' have been deleted.");
}
```

### 3. 在 Laravel 的任务调度中添加此命令：

打开 `app/Console/Kernel.php` 文件，在 `schedule` 方法中添加以下行：

```php
$schedule->command('redis:delete-keys', ['your_pattern_here'])->dailyAt('02:00');
```

替换 `'your_pattern_here'` 为你想匹配的模式。

### 4. 设置 Laravel 的任务调度：

确保您已经在服务器的 `crontab` 文件中设置了 Laravel 的任务调度器：

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

这会每分钟检查是否有需要运行的任务。

现在，您已经成功地在 Laravel 中设置了一个任务，该任务将每天凌晨2点基于指定的模式删除 Redis 键。

### shell
如果你不使用 `Laravel` 框架 或者你甚至不使用PHP ，这里提供一份shell脚本，并且可以使用`crontab`定时执行。
为了创建一个可在 `crontab` 中定时执行的 shell 脚本，你需要：

1. 写一个 shell 脚本并保存到文件（例如 `delete_redis_keys.sh`）。
2. 在 `crontab` 中为此脚本设置一个定时任务。

以下是 `delete_redis_keys.sh` 脚本的示例：

```bash
#!/bin/bash

# Redis 服务器的配置
HOSTNAME="your_redis_hostname"
PORT="your_redis_port"
PASSWORD="your_redis_password"
DATABASE="your_redis_database"

# 匹配模式，可以根据需要修改
MATCH_PATTERN=${1:-user*}  # 使用传递的第一个参数，或默认值 "user*"

cursor=0
first_iteration=1

while [ "$cursor" -ne 0 ] || [ "$first_iteration" -eq 1 ]; do
    response=$(redis-cli -h $HOSTNAME -p $PORT -a $PASSWORD -n $DATABASE SCAN $cursor MATCH $MATCH_PATTERN COUNT 1000)
    cursor=$(echo "$response" | head -n 1)
    keys=$(echo "$response" | tail -n +2)

    if [ ! -z "$keys" ]; then
        redis-cli -h $HOSTNAME -p $PORT -a $PASSWORD -n $DATABASE DEL $keys
    fi

    first_iteration=0
done
```

首先，确保此脚本有执行权限：

```bash
chmod +x delete_redis_keys.sh
```

然后，你可以在 `crontab` 中为此脚本设置一个定时任务。例如，要每天凌晨 2 点执行该脚本，你可以添加以下行：

```bash
0 2 * * * /path/to/delete_redis_keys.sh
```

如果你想传递一个匹配模式到脚本，例如 `session*`，可以这样做：

```bash
0 2 * * * /path/to/delete_redis_keys.sh session*
```

请确保替换 `/path/to/` 为脚本的实际路径，并根据你的 Redis 配置更新脚本中的 `HOSTNAME`、`PORT`、`PASSWORD` 和 `DATABASE`。

## 思考:使用expire来代替del是否更好？
当我们在思考这个问题的时候，首先需要问自己，我们的诉求到底是什么？
因为使用expire和使用del，它们是用不同的用途和效果的。
以下是两者大致的区别:
### EXPIRE：

1. **延迟删除**：当你使用 `EXPIRE` 命令为一个键设置过期时间时，该键将在指定的时间后被自动删除。
2. **内存友好**：如果你知道某些数据只在一段时间内是有效的，设置过期时间可以帮助你自动清理不再需要的数据，从而节省内存。
3. **避免阻塞**：与 `DEL` 命令不同，`EXPIRE` 并不会立即删除数据，所以它不会导致可能的延迟或阻塞。
4. **自动化**：一旦设置了过期时间，Redis 会自动处理数据的清理，无需人工干预。

### DEL：

1. **立即删除**：`DEL` 命令会立即删除指定的键及其关联的数据。
2. **确定性**：使用 `DEL` 命令，你可以确定数据已被删除，而不是等待它过期。
3. **清理大量数据**：如果你需要立即清理大量不再需要的数据，`DEL` 或 `MDEL` 是合适的选择。

### 是否使用 `EXPIRE` 代替 `DEL`？

- **预期的数据生命周期**：如果你知道数据只在一段时间内是有用的，最好在插入时就设置一个过期时间。
- **即时清理需求**：如果因某种原因（如数据不一致或错误的数据插入）需要立即删除数据，使用 `DEL` 是合适的。
- **性能考虑**：在删除大量数据时，使用 `DEL` 可能会导致短暂的阻塞。相反，设置过期时间则没有这个问题，因为实际的删除操作是由 Redis 的内部清理进程异步执行的。

选择 `EXPIRE` 还是 `DEL` 取决于你的具体需求。在许多情况下，预先知道数据的生命周期并为其设置过期时间是一个好的做法，因为这样可以自动清理旧数据并节省内存。但在某些情况下，你可能需要更确定性或即时性的数据清理，这时 `DEL` 命令是更好的选择。

