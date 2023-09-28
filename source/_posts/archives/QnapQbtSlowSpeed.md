---
layout: butt
title: QNAP中QBT慢速问题排查
date: 2023-09-18 17:16:57
cover: /images/QBT/qBittorrent.png
tags: 
  - QNAP
  - qbt
  - Linux
category: Linux
---

通常来说，经常会遇到的情况就是 tracker 问题。 红种/黄种/无法连接/今天遇到的情况/etc.

排查的步骤如下：

### I. 路由器部分

1. 首先，需要确保 UPNP 中只有一组 QB 的连接，一组中包含一个 TCP 连接和一个 UDP 连接，端口号(出入)应该和你 QB 的设置一致。
2. 如果不一致/有其他的端口/除了第一点提到其他任何情况，先将 QB 的种子全部暂停，然后完全关闭 QB。（APP CENTER）
3. 回到 UPNP，把所有的 QB 连接都删掉。然后来到“启动项”，手动重启一下 UPNP。
4. 重新打开 QB，重新开始所有的种子。此时观察 UPNP，应该只有一组 QB 连接，包含一个 TCP 和一个 UDP。

   (正常情况下，无论你是重启/关闭 QB，UPNP 里都只会有一组 QB 的连接。)


### II. NAS 部分

1. 确保 autorun 中，所有的优化已生效:

```bash
ulimit -n
#(返回的结果应该是 1048576)
sysctl -a | grep vm.swappiness
#(返回的结果应该是 10)
sysctl -a | grep -e net.ipv4.tcp_[rw]mem
#(返回的结果应该是 4096 8738000 873800000)
sysctl -a | grep -E '(fs.nr_open|fs.file-max)'
#(返回的结果应该是 fs.nr_open=1048576 和 fs.file-max=99999999)
ifconfig
#(返回的结果应该是，在 eth0 和 eth1 中，txqueuelen 显示为 10000，看到 "txqueuelen: 10000"，就是对的了)
```
![txqueuele](/images/POST/txqueuele.jpg "txqueuelen")

### III. QB 部分

1. 尝试下载其他公网的 torrent，比如 "acg.rip" 或者动漫花园的外站。
2. 10 个左右，做种人数多一些，50 或者 100 个人以上，种子大小 1GB 以上。
3. 观察下载时候的速度，是否可以跑满带宽，是否有减速等现象。
4. 如果存在一样跑不满带宽，减速等现象，转到 PC/MAC 端，使用 IDM 下载多个资源，并观察网速。

### IV. 排查&定位

1. 在公网下载的 torrent 文件可以跑满带宽并且不减速，那么说明是 m-team 的 tracker 问题。
2. 在公网下载的 torrent 文件依旧存在跑不满带宽/减速现象，但是 PC/MAC 端的 IDM 没问题，检查网络设置/tracker/硬盘/QB/autorun/UPNP。
3. 需要排查的对象为：本地 ISP，m-team 的 tracker，你的网络设置，UPNP，硬盘，大致就这几样。
- 如果第一条满足，说明你的本地 ISP 没有限速，你的网络也正常，你的 UPNP 也正常，你的硬盘也正常，说明就是 m-team 的问题。
- 如果第二条满足，说明你的本地 ISP 没有限速，你的网络也正常，但是你的 UPNP，硬盘，m-team 的 tracker 可能出现问题。如果你看过 UPNP 里的状态，在确定只有一组 QB 连接的情况下，UPNP 的问题可以被排除，此时只剩下硬盘和 m-team 的问题。
- 当剩下硬盘和 m-team 的 tracker 需要排查的时候，优先排查 m-team 的 tracker，方法为，把你的 NAS 暂时设置走代理。暂停目前 QB 中所有的种子，去 m-team 找个 1GB 左右的种子(最近发布或者做种人数较多的)，然后扔到 QB 里。
- 如果这个种子可以下载，不仅确定了 tracker 的问题，还确定了硬盘没事。
  (这里的确定了 tracker 问题，指的是 m-team 和你用来测试的公网 torrent，公网 torrent 的 tracker 有时候也会被墙，如果不开代理测试，你很难知道问题究竟出在哪。)