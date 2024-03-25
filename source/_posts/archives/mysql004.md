---
layout: butt
title: mysql随笔 02
date: 2024-03-14 14:38:24
category: Mysql
cover: /images/mysql.png
---

上一期我回顾了数据库的两大部分。服务器层和存储引擎。

在Mysql中存储引擎默认使用的是`InnoDB`。

记录一下 `InnoDB` 的行格式的定义。 

# InnoDB的行格式

## COMPACT

`COMPACT` 是 `InnoDB` 的默认行格式。
完成的记录是由"记录的额外信息"和"记录的真实信息"组成的。
> "记录的额外信息"是指：`NULL`值的位图、记录的头信息、可变字段长度列表。
> "记录的真实信息"是指：row_id trx_id roll_ptr 列1值 列2值 列3值。
```sql
+-------------------+-------------------+-------------------+-------------------+-------------------+-------------------+
| NULL值的位图      | 记录的头信息       | 可变字段长度列表       | row_id(无主键则创建)| trx_id(事务id)     | roll_ptr(上版本指针)|
+-------------------+-------------------+-------------------+-------------------+-------------------+-------------------+
| 1byte             | 7byte             | 0-7byte           | 6byte             | 6byte             | 7byte             |
+-------------------+-------------------+-------------------+-------------------+-------------------+-------------------+
```
{% note red 'fa-solid fa-lightbulb' flat %}
在设计数据库表的时候，通常都是建议将字段设置为 NOT NULL，这样可以至少节省 1 字节的空间（NULL 值列表至少占用 1 字节空间）。
{% endnote %}

`NULL值的位图` 和 `可变字段长度列表` 的信息都是逆向存放的,之所以这样子存放，是因为这样可以使得位置靠前的记录的真实数据和数据对应的字段长度信息可以同时在一个 CPU Cache Line 中，这样就可以提高 CPU Cache 的命中率。

# AUTO-INC 锁

> AUTO-INC 锁是特殊的表锁机制，锁不是再一个事务提交后才释放，而是再执行完插入语句后就会立即释放。

- 当 innodb_autoinc_lock_mode = 0，就采用 AUTO-INC 锁，语句执行结束后才释放锁；
- 当 innodb_autoinc_lock_mode = 2，就采用轻量级锁，申请自增主键后就释放锁，并不需要等语句执行后才释放。
- 当 innodb_autoinc_lock_mode = 1：
    - 普通 insert 语句，自增锁在申请之后就马上释放；
    - 类似 insert … select 这样的批量插入数据的语句，自增锁还是要等语句结束后才被释放；

{% note red 'fa-solid fa-lightbulb' flat %}
当 innodb_autoinc_lock_mode = 2 是性能最高的方式，但是当搭配 binlog 的日志格式是 statement 一起使用的时候，在「主从复制的场景」中会发生数据不一致的问题。
{% endnote %}

举例说明:

session A 往表 t 中插入了 4 行数据，然后创建了一个相同结构的表 t2，然后两个 session 同时执行向表 t2 中插入数据。

如果 innodb_autoinc_lock_mode = 2，意味着「申请自增主键后就释放锁，不必等插入语句执行完」。那么就可能出现这样的情况：

- session B 先插入了两个记录，(1,1,1)、(2,2,2)；
- 然后，session A 来申请自增 id 得到 id=3，插入了（3,5,5)；
- 之后，session B 继续执行，插入两条记录 (4,3,3)、 (5,4,4)。

可以看到，session B 的 insert 语句，生成的 id 不连续。

当「主库」发生了这种情况，binlog 面对 t2 表的更新只会记录这两个 session 的 insert 语句，如果 binlog_format=statement，记录的语句就是原始语句。记录的顺序要么先记 session A 的 insert 语句，要么先记 session B 的 insert 语句。

但不论是哪一种，这个 binlog 拿去「从库」执行，这时从库是按「顺序」执行语句的，只有当执行完一条 SQL 语句后，才会执行下一条 SQL。因此，在从库上「不会」发生像主库那样两个 session 「同时」执行向表 t2 中插入数据的场景。所以，在备库上执行了 session B 的 insert 语句，生成的结果里面，id 都是连续的。这时，主从库就发生了数据不一致。

要解决这问题，binlog 日志格式要设置为 row，这样在 binlog 里面记录的是主库分配的自增值，到备库执行的时候，主库的自增值是什么，从库的自增值就是什么。
所以，{%label 当innodb_autoinc_lock_mode=2时,并且binlog_format=row red%}，既能提升并发性，又不会出现数据一致性问题。
