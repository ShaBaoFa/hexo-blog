---
layout: butt
title: 压测工具(Jmeter)在Mac上的安装
date: 2024-04-07 14:09:25
category: Jmeter
cover: /images/jmeter/img.png
---

{% note purple 'fa-solid fa-lightbulb' flat %}
Jmeter是一个开源的压力测试工具，它可以用来对各种不同的服务器，服务，协议进行压力测试。
{% endnote %}

# 安装

0. 安装JDk


1. 下载安装包
```bash
wget https://mirrors.tuna.tsinghua.edu.cn/apache/jmeter/binaries/apache-jmeter-5.6.3.tgz
```

2. 解压安装包
```bash
tar -zxvf apache-jmeter-5.6.3.tgz
```

3. 运行
```bash
cd apache-jmeter-5.6.3/bin
./jmeter
```