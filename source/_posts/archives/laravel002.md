---
layout: butt
title: laravel 队列小技巧
date: 2023-12-07 16:10:17
tags:
category: Laravel
cover: /images//laravel.webp
---

# 前言

{% note purple 'fa-solid fa-lightbulb' flat %}
在使用`laravel`的队列的时候，常常会用到`fail`，`failed`，`retry`，`attempts`，`release`等方法，做一个笔记，方便以后查阅。
{% endnote %}

# attempts retry

- `attempts` 当前重试次数
- `retry` 重试次数

每一个`attempts`都伴随着一个`retry`，所谓相生相克（~~不是~~）

每一个队列job，都会伴随着 attempt

这会告诉我们当前重试次数在第几次.

比如当重试次数大于1次之后，通知运维管理人员。 需要关注一下该队列任务。

比如 直播平台 需要将 `.ts` 文件 转换成 `.mp4` 文件，并且上传至 `阿里云OSS` 进行存储

```php

    /**
     * @var int 重试次数
     */
public int $tries = 3;

public function handle(Transcoder $transcoder)
    {
        // 告诉运维管理人员该任务在重试，需要关注。
        if ($this->attempts() > 1) {
            User::operationer()->notify(new RetryingVideoTranscode($this->video, $this->attempts());
        }
    }
```

# failed fail

从字面意思上来看，我以为`fail`是每次重试都会触发，`failed`是最终失败才会触发。

但经过测试，发现并不是，`fail`是 **主动** 去让job失败。

而 `failed` 是 **重试次数结束之后** 的去监听job失败。

可以想象这么一个场景，我们的目的是 将 `.ts` 文件 转换成 `.mp4` 文件

那需要获取 `.ts` 文件,但结果文件在存储空间中找不到了！那就应该主动进行 `fail` 而不是重试之后再失败。

```php
if($this->video->getTsFile() === null) {
    // 通知运维人员.
    User::operationer()->notify(new VideoTranscodeFailed($this->video));
    // 主动令任务失败
    $this->fail(new \Exception('ts file not found'));
}
```

# release

队列的主要目的之一是为了消峰填谷,当我们的队列任务过多的时候，可以通过`release`来延迟任务的执行。

```php
if($transcoder->isBusy()) {
    // 延迟10分钟执行
    $this->release(600);
}
```

# 其他

当队列任务传入的 `model` 不存在的时候, 可以利用 `deleteWhenMissingModels` 来进行 对应任务的删除。
[传送门](https://laravel.com/docs/10.x/queues#ignoring-missing-models)
```php
/**
 * Delete the job if its models no longer exist.
 *
 * @var bool
 */
public $deleteWhenMissingModels = true;
```