---
layout: butt
title: QNAP linux core 优化
date: 2023-09-18 16:37:25
cover: /images/QNAP/qnap.jpeg
tags:
category: QNAP
---

# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
最近购入了一台 QNAP-464C , 终于可以跑PT站了！为了能满速跑PT站，我对系统进行了一些优化，这里记录一下。
{% endnote %}

# QNAP配置
## **手动编辑autorun.sh**

1. 使用 SSH 登录您的 QNAP 设备，例如使用 Putty
2. 可选：安装nano；使用**`ipkg install nano`**并使用 nano 而不是 vi 进行编辑
3. 通过在下面找到您的特定型号来安装配置 ramblock：
    - 所有基于 HAL 的 Intel 和 AMD NAS：

      **注意：** 从 **QTS 4.3.3** 开始，需要在 `控制面板` -> `硬件` -> `常规`：运行用户定义的启动进程 (autorun.sh) 中启用 autorun.sh 处理

        - QTS 5.x

          `sudo -i`

          `mount $(/sbin/hal_app --get_boot_pd port_id=0)6 /tmp/config`


## **创建/编辑/tmp/config/autorun.sh**

1. 使用以下命令通过 vi 编辑 `autorun.sh` # `vi /tmp/config/autorun.sh` 然后**按 a进入编辑模式**
    1. 编辑您需要的任何内容
    2. 退出编辑模式：**按ESC**
    3. 保存并退出：**x**
2. 或者使用台式电脑和 SFTP 等编辑 `autorun.sh`
3. 使用此命令确保 `/tmp/config/autorun.sh` 可执行 # `chmod +x /tmp/config/autorun.sh`
4. **重要提示：**使用此命令卸载已安装的闪存分区 # `umount /tmp/config`

# core 优化
```bash
sysctl -w fs.file-max=99999999
sysctl -w fs.nr_open=1048576
sysctl -w fs.inotify.max_user_watches=524288
sysctl -w vm.dirty_background_ratio=10
sysctl -w vm.dirty_expire_centisecs=3000
sysctl -w vm.dirty_ratio=15
sysctl -w vm.dirty_writeback_centisecs=500
sysctl -w vm.dirtytime_expire_seconds=43200
sysctl -w vm.extfrag_threshold=500
sysctl -w vm.lowmem_reserve_ratio=256 256 32
sysctl -w vm.max_map_count=65530
sysctl -w vm.min_free_kbytes=67584
sysctl -w vm.min_slab_ratio=5
sysctl -w vm.mmap_min_addr=65536
sysctl -w vm.overcommit_ratio=50
sysctl -w vm.swappiness=10
sysctl -w vm.vfs_cache_pressure=50
sysctl -w vm.watermark_boost_factor=15000
sysctl -w vm.watermark_scale_factor=10
sysctl -w net.core.flow_limit_table_len=4096
sysctl -w net.core.somaxconn=65535
sysctl -w net.core.netdev_max_backlog=250000
sysctl -w net.core.netdev_budget=300
sysctl -w net.core.netdev_budget_usecs=2000
sysctl -w net.core.optmem_max=25165824
sysctl -w net.core.rmem_default=212992
sysctl -w net.core.wmem_default=212992
sysctl -w net.core.rmem_max=873800000
sysctl -w net.core.wmem_max=873800000
sysctl -w net.core.netdev_tstamp_prequeue=1
sysctl -w net.core.rps_sock_flow_entries=0
sysctl -w net.ipv4.inet_peer_maxttl=600
sysctl -w net.ipv4.inet_peer_minttl=120
sysctl -w net.ipv4.inet_peer_threshold=65664
sysctl -w net.ipv4.tcp_early_demux=1
sysctl -w net.ipv4.tcp_early_retrans=3
sysctl -w net.ipv4.tcp_ecn_fallback=1
sysctl -w net.ipv4.tcp_fastopen_blackhole_timeout_sec=3600
sysctl -w net.ipv4.tcp_limit_output_bytes=1048576
sysctl -w net.ipv4.tcp_max_reordering=300
sysctl -w net.ipv4.tcp_min_rtt_wlen=300
sysctl -w net.ipv4.tcp_min_tso_segs=2
sysctl -w net.ipv4.tcp_moderate_rcvbuf=1
sysctl -w net.ipv4.tcp_probe_interval=600
sysctl -w net.ipv4.tcp_probe_threshold=8
sysctl -w net.ipv4.tcp_recovery=1
sysctl -w net.ipv4.tcp_reordering=3
sysctl -w net.ipv4.tcp_retrans_collapse=1
sysctl -w net.ipv4.tcp_tso_win_divisor=3
sysctl -w net.ipv4.tcp_workaround_signed_windows=1
sysctl -w net.ipv4.udp_early_demux=1
sysctl -w net.ipv4.udp_l3mdev_accept=0
sysctl -w net.ipv4.xfrm4_gc_thresh=32768
sysctl -w net.ipv4.tcp_notsent_lowat=4294967295
sysctl -w net.ipv4.tcp_max_syn_backlog=1024
sysctl -w net.ipv4.tcp_synack_retries=2
sysctl -w net.ipv4.tcp_syn_retries=6
sysctl -w net.ipv4.tcp_max_orphans=131072
sysctl -w net.ipv4.tcp_orphan_retries=0
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
sysctl -w net.ipv4.ip_nonlocal_bind=0
sysctl -w net.ipv4.ip_no_pmtu_disc=1
sysctl -w net.ipv4.ip_unprivileged_port_start=1024
sysctl -w net.ipv4.tcp_mem="383247 510997 766494"
sysctl -w net.ipv4.udp_mem="766494 1021995 1532988"
sysctl -w net.ipv4.tcp_rmem="4096 8738000 873800000"
sysctl -w net.ipv4.tcp_wmem="4096 8738000 873800000"
sysctl -w net.ipv4.udp_rmem_min=16384
sysctl -w net.ipv4.udp_wmem_min=16384
sysctl -w net.ipv4.tcp_max_tw_buckets=1440000
sysctl -w net.ipv4.tcp_low_latency=0
sysctl -w net.ipv4.tcp_retries2=15
sysctl -w net.ipv4.tcp_retries1=3
sysctl -w net.ipv4.tcp_sack=1
sysctl -w net.ipv4.tcp_fack=1
sysctl -w net.ipv4.tcp_dsack=1
sysctl -w net.ipv4.tcp_timestamps=1
sysctl -w net.ipv4.tcp_rfc1337=1
sysctl -w net.ipv4.tcp_fin_timeout=30
sysctl -w net.ipv4.tcp_keepalive_time=600
sysctl -w net.ipv4.tcp_keepalive_probes=5
sysctl -w net.ipv4.tcp_keepalive_intvl=15
sysctl -w net.ipv4.tcp_window_scaling=1
sysctl -w net.ipv4.tcp_no_metrics_save=1
sysctl -w net.ipv4.tcp_tw_reuse=1
sysctl -w net.ipv4.tcp_fastopen=1
sysctl -w net.ipv4.tcp_ecn=2
sysctl -w net.ipv4.tcp_slow_start_after_idle=0
sysctl -w net.ipv4.tcp_mtu_probing=1
sysctl -w net.ipv4.tcp_abort_on_overflow=0
sysctl -w net.ipv4.neigh.default.gc_thresh3=1024
sysctl -w net.ipv4.neigh.default.gc_thresh2=512
sysctl -w net.ipv4.neigh.default.gc_thresh1=128
sysctl -w net.ipv4.neigh.default.gc_stale_time=60
sysctl -w net.ipv4.neigh.default.gc_interval=30
sysctl -w net.ipv6.conf.all.disable_ipv6=1
ulimit -n 1048576
ip link set eth0 txqueuelen 10000
ip link set eth1 txqueuelen 10000
ethtool -G eth0 rx 4096
ethtool -G eth0 tx 4096
ethtool -G eth1 rx 4096
ethtool -G eth1 tx 4096
ethtool -K eth0 tso off gso off
ethtool -K eth0 tx-nocache-copy on
ethtool -K eth1 tso off gso off
ethtool -K eth1 tx-nocache-copy on
echo kyber > /sys/block/sda/queue/scheduler
echo kyber > /sys/block/sdb/queue/scheduler
echo kyber > /sys/block/sdc/queue/scheduler
echo kyber > /sys/block/sdd/queue/scheduler
```

# 硬盘读写测试
```bash
dd if=/dev/mapper/cachedev2 bs=1024 count=1000000 of=/1Gb.file
hdparm -Tt /dev/mapper/cachedev1
# cachedev对应的是硬盘名称,请根据自己的情况修改
```