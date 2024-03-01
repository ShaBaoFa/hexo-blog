---
layout: butt
title: 认识laravel artisan
date: 2023-12-22 11:29:13
tags:
category: Laravel
cover: /images/laravel.webp
---
{% note purple 'fa-solid fa-lightbulb' flat %}
Laravel 的 Artisan 是一个命令行工具，它提供了许多有用的命令，可以帮助开发者完成各种任务。本文将介绍 Artisan 的一些常用命令和用法。
{% endnote %}

### Laravel 控制台命令详解

在 Laravel 中，控制台命令是开发者与应用程序交互的重要方式之一。以下是一些常用的控制台命令及其详细解释和示例。

#### `$this->argument('{参数名称}')`

这个方法用于获取控制台命令中传递的参数值。

```php
public function handle()
{
    $argumentValue = $this->argument('参数名称');
    // 使用参数值执行其他逻辑
}
```

#### `$this->arguments()`

该方法用于获取所有传递给控制台命令的参数。

```php
public function handle()
{
    $arguments = $this->arguments();
    // 处理所有参数
}
```

#### `$this->option('{选项名称}')`

用于获取控制台命令中传递的选项值。

```php
public function handle()
{
    $optionValue = $this->option('选项名称');
    // 使用选项值执行其他逻辑
}
```

#### `$this->options()`

获取所有传递给控制台命令的选项。

```php
public function handle()
{
    $options = $this->options();
    // 处理所有选项
}
```

#### `$this->ask('{询问信息提示}')`

用于向用户提问并获取用户输入的信息。

```php
public function handle()
{
    $answer = $this->ask('请输入您的姓名：');
    $this->info('您输入的姓名是：' . $answer);
}
```

#### `$this->secret('{密码信息提示}')`

类似于 `ask()` 方法，但用户输入的是密码，不会显示在控制台上。

```php
public function handle()
{
    $password = $this->secret('请输入您的密码：');
    // 处理密码
}
```

#### `$this->confirm('{确认信息提示}')`

用于向用户确认某个信息。

```php
public function handle()
{
    if ($this->confirm('您确认要执行此操作吗？')) {
        // 执行操作
    } else {
        $this->info('已取消操作。');
    }
}
```

#### `$this->anticipate('{自动补全信息提示}', ['{选项}'])`

提供自动补全功能，根据用户输入的前缀自动匹配选项。

```php
public function handle()
{
    $answer = $this->anticipate('请选择您的操作：', ['create', 'update', 'delete']);
    // 根据用户选择执行相应操作
}
```

#### `$this->choice('{选择信息提示}', ['{选项}'])`

与 `anticipate()` 类似，提供选项供用户选择。

```php
public function handle()
{
    $answer = $this->choice('请选择您的操作：', ['create', 'update', 'delete']);
    // 根据用户选择执行相应操作
}
```

#### 输出逻辑

Laravel 提供了多种输出逻辑，可以通过不同方法展示不同类型的信息。

- `line()`：输出一行普通文本信息。
- `info()`：输出信息性文本。
- `comment()`：输出注释信息。
- `question()`：输出问题信息，期待用户回答。
- `error()`：输出错误信息，用于指示错误发生。

```php
public function handle()
{
    $this->line('这是一行普通文本');
    $this->info('这是一条信息');
    $this->comment('这是一条注释');
    $this->question('这是一个问题');
    $this->error('这是一个错误');
}
```

#### 表格输出

`table()` 方法用于将数据以表格形式输出到控制台。

```php
public function handle()
{
    $data = [
        ['姓名', '年龄'],
        ['张三', 25],
        ['李四', 30],
    ];

    $this->table(['姓名', '年龄'], $data);
}
```

#### 进度条输出

`bar()` 方法用于显示任务的进度条。

```php
public function handle()
{
    $this->output->progressStart(10);

    for ($i = 0; $i < 10; $i++) {
        sleep(1);
        $this->output->progressAdvance();
    }

    $this->output->progressFinish();
}
```

以上是 Laravel 控制台命令的详细解释和示例。使用这些命令可以方便地与用户交互，并灵活地输出信息到控制台。

## 自定义 Laravel Artisan 命令 完成批量发送短信

为了实现自定义的 Laravel Artisan 命令来批量发送短信，并且让命令具有良好的人机交互和可视化，我们可以按照以下步骤进行操作：

### 1. 创建命令文件

首先，我们需要创建一个新的 Artisan 命令文件。在 Laravel 项目中，运行以下 Artisan 命令来生成一个新的命令文件：

```bash
php artisan make:command SendBulkSMS
```

这将在 `app/Console/Commands` 目录下创建一个名为 `SendBulkSMS.php` 的新命令文件。

### 2. 定义命令结构

在 `SendBulkSMS.php` 文件中，我们需要定义命令的名称、描述和签名。这样用户就能够正确地使用命令。

```php
protected $signature = 'sms:send-bulk';
protected $description = '批量发送短信';
```

### 3. 完善人机交互和可视化

下面是一种可能的实现方式：

```php
    #[ArrayShape(['SMS1234567' => "string", 'SMS1234568' => "string", 'SMS1234569' => "string"])]
    private function templates() :array
    {
        return ['SMS1234567' => '广告短信1', 'SMS1234568' => '广告短信2', 'SMS1234569' => '广告短信3'];
    }
    
    public function handle(): void
    {
        // 选择短信模版
        $template = $this->choice('请选择您这次使用的短信模版：', $this->templates());
        if (!$this->confirm('您确认选择使用'. $template .'短信模版？')) {
            $this->info('已取消操作。');
            return;
        }
        $this->
        // 获取手机号
        $phoneNumbers = [];
        $phoneNumber = $this->ask('请输入手机号（输入 "stop" 停止输入）：');
        while ($phoneNumber !== 'stop') {
            $phoneNumbers[] = $phoneNumber;
            $phoneNumber = $this->ask('请输入手机号（输入 "stop" 停止输入）：');
        }

        // 发送短信并显示进度条
        $progressBar = $this->output->createProgressBar(count($phoneNumbers));
        foreach ($phoneNumbers as $phoneNumber) {
            // 发送短信的逻辑处理，此处省略
            sleep(1); // 模拟发送短信的延迟
            $progressBar->advance();
        }
        $progressBar->finish();
        $this->info("\n短信发送完成！");

        // 显示发送失败的手机号和失败原因
        $failedNumbers = [
            ['phone_number' => '13888888888', 'template' => 'SMS1234567', 'reason' => '手机号格式错误'],
            ['phone_number' => '13999999999', 'template' => 'SMS1234567', 'reason' => '发送失败，请重试'],
        ];
        $this->table(['手机号', '短信模版', '失败原因'], $failedNumbers);
    }
```

在这个例子中，我们使用了 `$this->choice()` `$this->confirm()` 和 `$this->ask()` 方法来与用户进行交互，使用 `$this->output->createProgressBar()` 来创建进度条，使用 `$this->table()` 来显示发送失败的手机号和失败原因。

完成以上步骤后，您就可以在 Laravel 项目中使用 `php artisan sms:send-bulk` 命令来批量发送短信，并且具有良好的人机交互和可视化效果。