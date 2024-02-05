---
layout: butt
title: Laravel-Permission-V6-中文文档
date: 2024-02-04 16:29:13
category: ThreeParty
cover: /images/laravel.webp
tags:
    - Laravel
    - Permission
    - 中文文档
---
{% note orange 'fa-solid fa-lightbulb' flat %}
使用以下命令来安装 **Laravel-Permission**:
```shell
composer require spatie/laravel-permission -W
```
这是 **v6** 的文档。没有在左侧菜单切换版本的可能。使用以下命令来检查当前版本:
`composer show spatie/laravel-permission`
{% endnote %}

# Laravel-Permission-V6-中文文档

- 将`用户`与`角色`和`权限`关联起来

## 介绍
此包允许您管理数据库中的用户权限和角色。

安装后，您可以执行以下的操作:

```php
// 为用户添加权限
$user->givePermissionTo('edit articles');

// 通过赋予角色添加权限
$user->assignRole('writer');

$role->givePermissionTo('edit articles');
```

如果您使用复数看守器(`guards`)，我们也可以满足您的需求，每一个看守器都有自己的角色和权限，并且可以分配给用户。
如果你想了解更多关于复数看守器相关的信息,请查看[使用复数看守器](#使用复数看守器).
## 前提
## 在 Laravel 中安装
## 在 Lumen 中安装
## 升级版本
## 问题和事项
## 更新日志
# 基本用法
## 基本用法
## 直接使用权限
## 通过角色使用权限
## 枚举
## 通配符权限
## Blade指令
## 定义超级管理员
## 使用复数看守器
## 使用 artisan 命令
## 使用中间件
## Passport 客户端凭据授予使用
## 实例APP
# 最佳实践
## 角色 vs 权限
## 模型策略
## 性能tips
# 进阶用法
## 测试
## 数据库seeding
## 异常
## 扩展
## 缓存
## 自定义权限检测
## UUID/ULID
## phpstorm 交互
## 时间戳
## UI 选项