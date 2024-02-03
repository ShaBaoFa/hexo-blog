---
layout: butt
title: Laravel N+1 问题
date: 2023-09-19 13:43:25
cover: /images/Laravel/laravel.png
tags:
  - Laravel
categories:
  - Laravel
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
我曾经接手过一个项目，每次获取数据的速度都特别慢，当然，获取数据速度慢的原因有千千万，这次碰到的问题是因为 `N+1` 什么是 `N+1`想一下，你收到了 100 个来自数据库的对象，并且每条数据都有一个关联的模型，（belongsTo）使用默认的ORM查询就会产生  101 条查询。
本文使用的是 `Laravel` 框架，但是 `N+1` 问题并不是 `Laravel` 独有的，只是 `Laravel` 的 ORM 查询方式比较简单，更容易出现这个问题。
{% endnote %}
# N+1
{% note purple 'fa-solid fa-lightbulb' flat %}
tip:可以使用下面这段代码进行数据库监听，方便查看数据库的查询情况.
{% endnote %}
```php
DB::listen(function ($query) {
            Log::error(
                $query->sql,
                $query->bindings,
            );
        });
```

如下面这段`php`代码所示:

这是最常见的N+1困境。当你需要在返回的`resource`里附带上所有`User` 的`Hall` 信息时，最简单的方法就是获取利用对应模型里面里预先写好的`BelongTo`方法去获取`hall`的信息。

```php
$users = User::query()->get(); //1次
foreach ($users as $user) {
		$user->hall; // N次
}
```

反应到数据库上，就是1+N次的查询。在数量级非常大的情况下，这一次查询就将对性能造成影响。

监听数据库日志如下

```sql
select * from `users` where `users`.`deleted_at` is null
select `halls`.*, `hall_user`.`user_id` as `laravel_through_key` from `halls` inner join `hall_user` on `hall_user`.`hall_id` = `halls`.`id` where `hall_user`.`user_id` = ? and `halls`.`deleted_at` is null and `hall_user`.`deleted_at` is null limit 1 [1]
select `halls`.*, `hall_user`.`user_id` as `laravel_through_key` from `halls` inner join `hall_user` on `hall_user`.`hall_id` = `halls`.`id` where `hall_user`.`user_id` = ? and `halls`.`deleted_at` is null and `hall_user`.`deleted_at` is null limit 1 [2]
select `halls`.*, `hall_user`.`user_id` as `laravel_through_key` from `halls` inner join `hall_user` on `hall_user`.`hall_id` = `halls`.`id` where `hall_user`.`user_id` = ? and `halls`.`deleted_at` is null and `hall_user`.`deleted_at` is null limit 1 [3]
```

# 预加载（解决方案）

---

ORM 是 "懒惰" 加载关联。如果您打算使用关联的模型数据，则可以使用预加载将 101 次查询缩减为 2 次查询。您只需要告诉模型你渴望它加载什么。

```php
$users = User::query()->with('hall')->get();// 2次
```

利用`with` 在第一次查询时就对需要的关联模型进行预加载。反应在数据库IO上就是从`N+1`缩减到了`1+1` ，`with` 的传参是  `string 或 array` 你可以使用`[’hall’,’roles’,’reviews’]` 进行复数个模型的关联。（PS: 复数个模型对应的数据库查询次数 为 `1+关联模型数`）

```sql
select * from `users` where `users`.`deleted_at` is null
select `halls`.*, `hall_user`.`user_id` as `laravel_through_key` from `halls`
inner join `hall_user` on `hall_user`.`hall_id` = `halls`.`id` 
where `hall_user`.`user_id` in (1, 2, 3, 4, 5, 6) 
and `halls`.`deleted_at` is null and `hall_user`.`deleted_at` is null
```

# 拓展

当你需要获取`user`对应的`hall` 以及`hall`对应的所有的`areas` ，对于这个问题，`Laravel`也很贴心的支持使用`点链接` 的方式，直接可以关联到.

```php
$users = User::query()->with('hall.areas')->get();// 3次
```

对应的数据库监控如下，一共3次查询

```sql
select * from `users` where `users`.`deleted_at` is null
select `halls`.*, `hall_user`.`user_id` as `laravel_through_key` from `halls`
inner join `hall_user` on `hall_user`.`hall_id` = `halls`.`id` 
where `hall_user`.`user_id` in (1, 2, 3, 4, 5, 6) 
and `halls`.`deleted_at` is null and `hall_user`.`deleted_at` is null
select `areas`.*, `area_hall`.`hall_id` as `laravel_through_key` from `areas` inner join `area_hall` on `area_hall`.`area_id` = `areas`.`id` where `area_hall`.`hall_id` in (1, 2, 4, 5, 12, 13, 18, 19, 20, 47, 48) and `areas`.`deleted_at` is null and `area_hall`.`deleted_at` is null
```

# 总结

希望你能了解到更多关于预加载模型的相关知识，并且了解它是如何在更加深入底层的工作方式。 [预加载文档](https://learnku.com/docs/laravel/5.4/eloquent-relationships#eager-loading) 是非常全面的，我希望额外的一些代码实现可以帮助您更好的优化关联查询。