---
layout: butt
title: hyperf-CacheAhead 源码解析
date: 2024-01-31 16:20:18
category: Hyperf
---

# 源码
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
namespace Hyperf\Cache\Aspect;

use Hyperf\Cache\Annotation\CacheAhead;
use Hyperf\Cache\AnnotationManager;
use Hyperf\Cache\CacheManager;
use Hyperf\Cache\Driver\KeyCollectorInterface;
use Hyperf\Di\Aop\AbstractAspect;
use Hyperf\Di\Aop\ProceedingJoinPoint;

class CacheAheadAspect extends AbstractAspect
{
    public array $classes = [];

    public array $annotations = [
        CacheAhead::class,
    ];

    public function __construct(protected CacheManager $manager, protected AnnotationManager $annotationManager)
    {
    }

    public function process(ProceedingJoinPoint $proceedingJoinPoint)
    {
        $className = $proceedingJoinPoint->className;
        $method = $proceedingJoinPoint->methodName;
        $arguments = $proceedingJoinPoint->arguments['keys'];
        $now = time();

        [$key, $ttl, $group, $annotation] = $this->annotationManager->getCacheAheadValue($className, $method, $arguments);

        $driver = $this->manager->getDriver($group);

        [$has, $result] = $driver->fetch($key);
        if ($has && isset($result['expired_time'], $result['data'])) {
            if ($now < $result['expired_time']) {
                return $result['data'];
            }

            if (! $driver->getConnection()->set($key . ':lock', '1', ['NX', 'EX' => $annotation->lockSeconds])) {
                return $result['data'];
            }
        }

        $result = $proceedingJoinPoint->process();

        if (! in_array($result, (array) $annotation->skipCacheResults, true)) {
            $driver->set(
                $key,
                [
                    'expired_time' => $now + $annotation->ttl - $annotation->aheadSeconds,
                    'data' => $result,
                ],
                $ttl
            );

            if ($driver instanceof KeyCollectorInterface && $annotation instanceof CacheAhead && $annotation->collect) {
                $driver->addKey($annotation->prefix . 'MEMBERS', $key);
            }
        }

        return $result;
    }
}

```

# 解析

这段代码实现了一个名为缓存预热（Cache Ahead）的切面，是在 Hyperf 框架下实现的。缓存预热是一种优化策略，它通过在缓存过期之前更新缓存数据，以确保用户在请求数据时能够快速获取到最新的数据，从而提高系统的性能和响应速度。

首先，让我们逐步分析这段代码的主要功能：

1. **切面类定义与注解声明：**

   这个切面类继承自 Hyperf 框架的 `AbstractAspect` 类，用于实现面向切面编程。在类中定义了 `$classes` 和 `$annotations` 两个属性，分别用于指定该切面要拦截的类和注解，这里指定了 `CacheAhead` 注解。

2. **构造函数注入依赖：**

   构造函数中注入了 `CacheManager` 和 `AnnotationManager` 对象，这些对象用于管理缓存和注解信息，后续会在方法中使用它们来获取缓存和注解的相关信息。

3. **核心处理方法 `process`：**

   这是切面类中最重要的方法，它接收一个 `ProceedingJoinPoint` 对象，表示一个切点，即被拦截的方法调用。

    - 首先，从 `ProceedingJoinPoint` 对象中获取了当前方法所在的类名、方法名和参数，以及当前时间戳。

    - 然后，通过注解管理器 `AnnotationManager` 获取了缓存预热相关的注解信息，包括缓存键、过期时间等。

    - 接着，通过缓存管理器 `CacheManager` 获取了对应缓存组的驱动器对象。

    - 在获取了缓存驱动器之后，首先尝试从缓存中读取数据，如果缓存数据存在且未过期，则直接返回缓存数据。

    - 如果缓存数据不存在或已过期，则尝试获取锁，避免多个请求同时更新缓存。如果成功获取到锁或者锁已存在（即有其他请求已经在更新缓存），则继续执行目标方法（被拦截的方法），获取最新的数据。

    - 获取到最新数据后，将数据更新到缓存中，并设置新的过期时间。

    - 如果需要收集缓存键，则在驱动器中进行相应操作。

    - 最后，返回最新的数据给调用方。

通过以上分析，可以看出这段代码的核心思想是在方法执行前检查缓存是否过期，如果过期则执行目标方法获取最新数据，并更新缓存。在高并发情况下，通过加锁机制确保只有一个请求可以更新缓存，其他请求获取老数据，从而避免了缓存击穿问题，提高了系统的稳定性和性能。