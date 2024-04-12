---
layout: butt
title: 解决 laravel passport token 缓存
date: 2024-04-01 14:29:57
category: Laravel
cover: /images/laravel.webp
---

# 前言

{% note purple 'fa-solid fa-lightbulb' flat %}
laravel passport 是一个 OAuth2 服务端的实现，它提供了一套完整的授权系统，包括授权码授权、密码授权、客户端授权、个人访问令牌等。
目前有一个场景，需要在用户登录的时候，将用户的 token 缓存到 redis 中，这样可以在用户退出登录的时候，将 token 从 redis 中删除。
因为当出现高并发的场景下，如果让passport频繁的去数据库中查询 token，会对数据库造成很大的压力。
{% endnote %}

# 场景
当 使用 Laravel Passport 时，api 中间件会自动验证用户的 token，如果 token 无效，会返回 401 错误。

每次进行验证时，都会去数据库中查询 token，这样会对数据库造成很大的压力。

下面是验证 token 会发生的Sql

```shell
[2024-04-01 11:48:41] local.INFO: TokenRepository find id: cf0e54e73d2bd0c7acb15e89db5ef2d5ca9c86a439d13e46263ad1450448c848fc36d11c57c11414  
[2024-04-01 11:48:41] local.INFO: select * from `oauth_access_tokens` where `id` = ? limit 1 ["cf0e54e73d2bd0c7acb15e89db5ef2d5ca9c86a439d13e46263ad1450448c848fc36d11c57c11414"] 
[2024-04-01 11:48:41] local.INFO: ClientRepository find id: 2  
[2024-04-01 11:48:41] local.INFO: select * from `oauth_clients` where `id` = ? limit 1 ["2"] 
[2024-04-01 11:48:41] local.INFO: TokenRepository find id: cf0e54e73d2bd0c7acb15e89db5ef2d5ca9c86a439d13e46263ad1450448c848fc36d11c57c11414  
[2024-04-01 11:48:41] local.INFO: select * from `oauth_access_tokens` where `id` = ? limit 1 ["cf0e54e73d2bd0c7acb15e89db5ef2d5ca9c86a439d13e46263ad1450448c848fc36d11c57c11414"]
```

一共3条sql查询，虽然都是通过 id 主键 去进行查询，能保证 mysql 使用 const 查询，但是在高并发的场景下，还是会对数据库造成很大的压力。

# 解决方案

## 思路

> 使用**服务容器 (Service Container)** 的方式来注册一个**单例 (Singleton)**。
> 使 `TokenRepository` `ClientRepository` 具备缓存能力。

## 方案

专门写了一个 composer package 来解决这个问题，[laravel-passport-cache](https://github.com/ShaBaoFa/laravel-passport-cache)

**Laravel passport cache**

### Installing

```shell
$ composer require wlfpanda1012/laravel-passport-cache -vvv
```

### Usage

**config/passport.php**
```php
            return [
                //...
                'cache' => [
                    'token' => [
                        // Cache key prefix
                        'prefix' => 'passport_token',

                        // The lifetime of token cache,
                        // Unit: second
                        'expires_in' => 300,

                        // Cache tags
                        'tags' => [],
                    ],
                    'client' => [
                        // Cache key prefix
                        'prefix' => 'passport_client',

                        // The lifetime of token cache,
                        // Unit: second
                        'expires_in' => 300,

                        // Cache tags
                        'tags' => [],
                    ],
                ],
            ];
```