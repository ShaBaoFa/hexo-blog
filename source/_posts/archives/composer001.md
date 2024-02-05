---
layout: butt
title: 创建和使用自己的composer包
date: 2024-01-31 14:43:48
category: Composer
cover: /images/composer.png
---
# 前言

{% note purple 'fa-solid fa-lightbulb' flat %}
在开发过程中，我们经常会用到一些三方包,比如 easywechat,laravel-ide-helper等等，这些包都是通过composer来安装的
然而，我们在开发过程中，会用到一些自己自定义的组件，仅仅在公司内部使用，这时候，我们就需要自己创建一个composer包了。
并且我们需要将这个包发布在私有仓库中，这样就能保证包的安全。
{% endnote %}

# 自定义组建包

## 创建组件包

### component-creator
这里我们直接使用 `component-creator` 来创建组件包
```
composer create-project hyperf/component-creator
```

## 本地引入方式
将组件包放入项目的vendor目录下(不强制,也可与使用项目同级)，然后在composer.json中添加如下配置
```json
{
    "repositories": {
        "local": {
            "type": "path",
            "url": "path/to/plt-common"
        }
    }
}
```
## git子模块方式
由于 GitHub 在2021年8月13日移除了对密码认证的支持所致。你需要使用基于令牌的认证方式来代替。以下是解决方法：

1. **生成个人访问令牌**：
    - 登录到你的 GitHub 帐户。
    - 点击头像，选择 "Settings"（设置）。
    - 在侧边栏中选择 "Developer settings"（开发者设置）。
    - 选择 "Personal access tokens"（个人访问令牌）。
    - 点击 "Generate new token"（生成新令牌）。
    - 给令牌起一个描述性的名称，并为它授予适当的权限（至少需要 repo 权限）。
    - 点击 "Generate token"（生成令牌）。
    - 复制生成的访问令牌。

2. **使用个人访问令牌进行认证**：
    - 在命令行中使用 `git submodule add` 添加子模块时，不再需要输入用户名和密码，而是使用生成的个人访问令牌来代替。
    - 在命令行中执行 `git submodule add` 时，使用如下格式的 URL：`https://<token>@github.com/ShaBaoFa/plt-common.git`

请确保令牌的安全性，不要将其泄露给他人。如果你的令牌泄露或不再需要，记得及时撤销。
```shell
git submodule add --force https://<token>@github.com/ShaBaoFa/plt-common.git submodule/plt-common
```

当然如果你的库是公开的,则不需要那么麻烦,直接使用对应的仓库 `url` 即可

此方法与本地引入方法类似,将git仓库作为子模块引入项目中,然后在 `composer.json` 中添加如下配置
```json
{
    "repositories": {
        "sub": {
            "type": "path",
            "url": "./submodule/*"
        }
    }
}
```

## 私有库方式
### 私有库搭建
- 点击 [coding.net](https://coding.net) 注册一个账号 

- 创建一个项目

- 点击创建新建好的项目 `Composer`

![new](/images/Composer/new.png)

- 点击 `制品管理` -> `制品仓库` -> `创建制品仓库`

![new](/images/Composer/new2.png)

- 点击 `操作指引` -> `配置访问令牌` 使用 `token` 进行认证 然后根据 `推送` 和 `拉取` 进行配置

### 发布脚本
```shell
rm -rf zip/
mkdir zip
zip -r zip/pakeage.zip . -x "./vendor/*" -x "./.github/*" -x "./.idea/*" -x "./.git/*" -x "./.gitignore" -x "./zip/*"
curl -T zip/pakeage.zip -u <ACCOUNT>:<TOKEN> "https://g-rtsg9040-composer.pkg.coding.net/composer/wlfpanda1012?version=<VERSION>"
```



