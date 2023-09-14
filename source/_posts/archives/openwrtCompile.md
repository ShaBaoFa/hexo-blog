---
layout: butt
title: Openwrt编译札记
date: 2023-09-14 16:46:24
tags:
  - Openwrt
  - Ubuntu
cover: /images/OpenWrt/cover.png
---
# 安装OS-Ubuntu

1. 首先装好 Linux 系统，推荐 Debian 11 或 Ubuntu LTS
2. 安装编译依赖

```bash
sudo apt update -y
sudo apt full-upgrade -y
sudo apt install -y ack antlr3 aria2 asciidoc autoconf automake autopoint binutils bison build-essential \
bzip2 ccache cmake cpio curl device-tree-compiler fastjar flex gawk gettext gcc-multilib g++-multilib \
git gperf haveged help2man intltool libc6-dev-i386 libelf-dev libglib2.0-dev libgmp3-dev libltdl-dev \
libmpc-dev libmpfr-dev libncurses5-dev libncursesw5-dev libreadline-dev libssl-dev libtool lrzsz \
mkisofs msmtp nano ninja-build p7zip p7zip-full patch pkgconf python2.7 python3 python3-pip libpython3-dev qemu-utils \
rsync scons squashfs-tools subversion swig texinfo uglifyjs upx-ucl unzip vim wget xmlto xxd zlib1g-dev
```

1. 下载源码

```bash
sudo git clone https://github.com/coolsnowwolf/lede 
```

```bash
cd lede
```

```bash
sudo echo "src-git helloworld https://github.com/fw876/helloworld.git" >> "feeds.conf.default" 
```

```bash
sudo ./scripts/feeds update -a && ./scripts/feeds install -a
```

# 更改kernel版本

1. 打开lede目录/target/linux/架构/Makefile.修改位置如下 `KERNEL_PATCHVER:=x.x`
2. 额外的修改：修改路由器名称，默认地址(192.168.1.1)

```bash
nano package/base-files/files/bin/config_generate
```

地址修改位置为

`${ipaddr:-"192.168.1.1"}` (可以改成`192.168.2.1`)

名字修改位置为

```bash
set system.@system[-1].hostname='Openwrt'
```

# 编译固件

- 编译 `menuconfig`

```bash
make menuconfig
```

- 选中编译进固件为`“*”`，按`空格键`。

`Target System`，`Subtarget`，以及`Target Profile`选择好对应的自己的`路由器型号`。

`Extra Package`选择好`automount`和`autosamba`

***x86的话，应该有个类似auto x86的选项，确保都是选中的。***

进入`Luci->Applications`
选择需要的固件。以我的为例。
只保留`luci-app-ramfree`，`luci-app-samba`，`luci-app-ssr-plus`（保持它的 **默认选项** ），`luci-app-ttyd`，`luci-app-turoboacc`（保持它的**默认选项**），`luci-app-upnp`，`luci-app-vsftpd`

Network里，找到`iperf3`和`ipset`，这两个是测速工具，如果你需要的话。
Network里，`IP Addresses and Names`中，选择`bind-dig`，把DDNS和网易解锁音乐的全部去掉。
Network里，`Routing and Rediction`，检查`ip-full`是否选中，没有的话手动选择。

找到`Utilities->Editors`，我选的是`vim`，你喜欢什么编辑器就选哪个。

找到`Utilities->Shells`，选择`bash`，这个一定要，因为一些集合在里面的脚本几乎都是`bash`，其他的你需要什么就选什么。
找到`Utilities->Filesystem`，看一下`ntfs-3g`，`mkf2fs`，`f2fsck`这几个是否有选中，没有的话手动选择一下。
`Utilities`里，找到`mount-utils`和`usbutils`，这两个是和`hot-plug`相关的，如果你需要外置移动硬盘作为挂载点，进行网络共享的话。

好了，软件选择就到这里。`save`，然后`exit`。

```bash
make -j8 download V=s
```

多运行几遍，**3遍** 至少。

```bash
make -j$(($(nproc) + 1)) V=s
```

编译完成后输出路径：`/lede/bin/targets`
# 后记
{% note purple 'fa-solid fa-lightbulb' flat %}
1. dl包不要删除，它就在`lede`目录下，保存下来，以后万一删除了全部的目录，`git`好了以后，还是放在`lede`目录下，可以直接编译（如果有新的也可以重新下载，但仍然比重新下载全部的包要快）。
2. 之后路由器/软路由刷机完成了，用`winscp`登录，并找到`etc/config`里的内容。然后回到虚拟机，在`lede`目录下创建“`files`”文件夹，把拷贝的内容全部放进去即可。这样编译完成之后，配置还是和以前一样。
3. 一些常用的配置，路由器路径
{% endnote %}

| path                                         | 备注              |
|----------------------------------------------|-----------------|
| `\etc\config`                                | 各个LUCI配置        |
| `\etc\gfwlist`                               | gfwlist目录       |
| `\etc\shadow`                                | 登录密码            |
| `\etc\firewall.user`                         | 自定义防火墙规则        |
| `\usr\share\adbyby`                            | adbyby里的相关规则和设置 |
| `\usr\lib\lua\luci\view\admin_status\index.htm` | 主页样式文件，温度显示等等   |
