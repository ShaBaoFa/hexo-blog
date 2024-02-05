---
layout: butt
title: 通过Octane(swoole)来提升Laravel性能
date: 2024-01-25 09:10:10
category: Laravel
cover: /images/laravel.webp
tags:
---

# 前言

{% note purple 'fa-solid fa-lightbulb' flat %}
Laravel 8.0 引入了一个新的包，名为 Octane，它是一个 Laravel 的高性能服务，它使用 Swoole 作为 HTTP 服务器，可以大大提高
Laravel 应用的性能。
{% endnote %}

# 安装

## 安装 swoole

在安装 Octane 之前，需要先安装 swoole 扩展，可以通过 pecl 安装，也可以通过源码安装。

这里介绍使用源码安装的方法。

在 macOS 环境下为 PHP 8.3 编译 Swoole 插件需要一些步骤。请按照以下步骤进行操作：

1. **安装 Homebrew**：
   确保你已经安装了 Homebrew，它是 macOS 上的包管理器。如果未安装，请在终端中运行以下命令：

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **安装依赖**：
   Swoole 依赖一些库，你需要先安装这些库。在终端中运行以下命令：

   ```bash
   brew install openssl
   ```

3. **安装 PHP 8.3**：
   使用 Homebrew 安装 PHP 8.3：

   ```bash
   brew install php@8.3
   ```

4. **下载 Swoole 源码**：
   在终端中执行以下命令，下载 Swoole 源码：

   ```bash
   git clone https://github.com/swoole/swoole-src.git
   ```

5. **进入 Swoole 源码目录**：
   使用 `cd` 命令进入 Swoole 源码目录：

   ```bash
   cd swoole-src
   ```

6. **配置并编译 Swoole**：
   在终端中运行以下命令配置和编译 Swoole：

   ```bash
   /usr/local/opt/php@8.3/bin/phpize
   ./configure --with-php-config=/usr/local/opt/php@8.3/bin/php-config
   make
   ```

7. **安装 Swoole**：
   编译完成后，运行以下命令安装 Swoole：

   ```bash
   make install
   ```

8. **配置 PHP 扩展**：
   在 PHP 配置文件中添加 Swoole 扩展。可以通过编辑 `/usr/local/etc/php/8.3/php.ini` 文件来实现。添加以下行：

   ```ini
   extension=swoole
   ```

   保存并关闭文件。

现在，Swoole 应该已经成功编译并与 PHP 8.3 集成。你可以通过运行 `php -m` 或 `php --ri swoole` 命令来检查 Swoole 是否被正确加载。

## 安装 Octane

安装 Octane 可以通过 Composer 安装，运行以下命令：

```bash
composer require laravel/octane --dev
```

安装完 Octane 后，运行以下命令发布 Octane 的配置文件：

```bash
php artisan octane:install
```

## 使用

启动 Octane 服务：

```bash
php artisan octane:start
```

如果你需要通过 HTTPS 来为应用提供服务的话

```bash
php artisan octane:start --secure
```

因为 Octane 在服务启动时会预加载应用，所以在启动服务之前，你需要先运行以下命令：

```bash
php artisan config:cache
php artisan route:cache
```

并且你如果需要对应用程序文件进行修改的话,需要重启服务。当然你也可以使用监听模式来进行开发。

```bash
php artisan octane:start --watch
```

你可以使用应用程序的 config/octane.php 配置文件中的 watch 配置选项来配置应该被监视的目录和文件。

```php
'watch' => [
    'app',
    'bootstrap',
    'config',
    'database',
    'public',
    'resources',
    'routes',
    'storage',
],
```

一般来说，指定工作进程数是根据CPU核心数量来决定的。比如你的服务器有8个CPU核心，那么你可以指定8个工作进程。
    
```php
'workers' => env('OCTANE_WORKERS', 8),
```

使用 Swoole 应用程序服务器，则还可以指定要启动的任务工作进程数量，一般是核心数量的2倍。
    
```php
'task_workers' => env('OCTANE_TASK_WORKERS', 16),
```

之后是一些简单的octane的命令

- `php artisan octane:stop` 停止服务
- `php artisan octane:status` 查看服务状态
- `php artisan octane:restart` 重启服务
- `php artisan octane:reload` 重载服务

当你的应用运行在内存中时，你需要管理内存泄漏的问题。
Octane 在请求之间保留应用程序，因此将数据添加到静态维护的数组中将导致内存泄漏。例如，以下控制器具有内存泄漏，因为对应用程序的每个请求将继续向静态的 `$data` 数组添加数据：
    
```php
use App\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * 处理传入的请求。
 */
public function index(Request $request): array
{
    Service::$data[] = Str::random(10);

    return [
        // ...
    ];
}
```

使用 `swoole` 可以通过轻量级的后台任务并发执行一些操作，比如发送邮件，发送短信，生成报表等等。

可以使用 `Octane::concurrently` 方法来实现。

以简单的批量写入数据库为例：

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Laravel\Octane\Facades\Octane;

class QueryPerformanceTest extends Command
{
    protected $signature = 'app:write-performance';

    protected $description = 'Test performance of writing data with and without Octane::concurrently';

    public function handle()
    {
        $totalRecords = 64;

        // Test without Octane::concurrently
        $this->info('Testing without Octane::concurrently...');
        $without_start = microtime(true);
        User::writeData($totalRecords);
        $without_end = microtime(true);
        $this->info('Time taken without Octane::concurrently: ' . ($without_end - $without_start) . ' seconds');

        // Test with Octane::concurrently
        $this->info('Testing with Octane::concurrently...');
        $start = microtime(true);
        try {
            Octane::concurrently([
                fn () => User::writeData($totalRecords/8),
                fn () => User::writeData($totalRecords/8),
                fn () => User::writeData($totalRecords/8),
                fn () => User::writeData($totalRecords/8),
                fn () => User::writeData($totalRecords/8),
                fn () => User::writeData($totalRecords/8),
                fn () => User::writeData($totalRecords/8),
                fn () => User::writeData($totalRecords/8),
            ]);
        }catch (\Exception $e){
            $this->info($e->getMessage());
        }

        $end = microtime(true);
        $this->info('Time taken with Octane::concurrently: ' . ($end - $start) . ' seconds');
        // 百分比
        $this->info('Percentage: ' . (($without_end - $without_start) / ($end - $start) * 100) . '%');
    }
}
```

64条数据,直接写入和使用8个进程并发写入的时间对比，结论如下

```shell
$ /usr/local/Cellar/php/8.3.2/bin/php artisan app:write-performance
Testing without Octane::concurrently...
Time taken without Octane::concurrently: 13.787473917007 seconds
Testing with Octane::concurrently...
Time taken with Octane::concurrently: 1.8669948577881 seconds
Percentage: 738.48483617904%
```

Octane::concurrently 方法接收一个数组，数组中的每个元素都是一个闭包，每个闭包都会在一个单独的进程中运行。

## 优化

### 优化路由

在使用 Octane 时，你需要使用 `Octane::route()` 方法来定义路由，而不是使用 `Route::get()` 或 `Route::post()` 方法

```php
use Laravel\Octane\Facades\Octane;

Octane::route('GET', '/user/{id}', function ($id) {
    return User::findOrFail($id);
});
```

但是，如果你的应用程序使用了 `Route::middleware()` 方法来定义路由中间件，那么你需要使用 `Octane::route()` 方法的第四个参数来定义路由中间件。

```php
use Laravel\Octane\Facades\Octane;

Octane::route('GET', '/user/{id}', function ($id) {
    return User::findOrFail($id);
}, ['auth']);
```
