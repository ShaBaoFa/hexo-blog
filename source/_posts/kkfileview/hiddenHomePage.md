---
title: kkfileview隐藏主页
date: 2024-09-23 17:24:44
tags:
category: Nginx
cover: /images/kkfileview.png
---

# 前提
{% note purple 'fa-solid fa-lightbulb' flat %}
`KKfileview`是非常有名的一款多格式预览服务,通过`springboot`部署也十分的方便，虽然官方提供了将配置文件中的 `file.upload.disable` 值设置为 `false` 来防止被上传恶意文件，但本人作为有强迫症的典型，我希望将页面整个都隐藏或者无法访问，这样才能让我安心。
{% endnote %}

# 思路

因为本身业务服务就是通过 `nginx` 代理 `kkfileview` 服务来实现预览的。

```bash
    location /preview/ {
        proxy_pass http://127.0.0.1:8012;
}
```

但这样子就会造成演示页面暴露出去,这不是我希望的。

所以我打算通过 代理的方式 先将 8012 反向代理到一个高位端口，然后高位端口的配置里将 8012 的根目录和index `return 403 ;` 禁止访问。

然后再将业务服务的 `preview` 代理这个高位端口，以二重代理的方式解决这个问题。

# 解决方案

为了实现这个多级代理结构：

1. **NGINX 监听 19050 端口**，并将请求代理到 **18080 端口**。
2. **18080 端口的 NGINX** 再将请求代理到运行在 **8012 端口** 的服务。
3. 如果访问的是 `/` 或 `/index`，返回 **"Forbidden"**。

我们可以分成两部分来实现。

---

### 1. **配置 18080 端口反向代理到 8012**（第一级 NGINX 代理）

首先，在 **18080** 端口上，配置 NGINX 将请求转发到 **8012** 服务。

### NGINX 配置（18080 端口）：

```bash
server {
    listen 18080;

    # 禁止访问根目录，例如：<http://ip:18080/>
    location = / {
        return 403 "Forbidden\\n";
    }

    # 禁止访问 /index，例如：<http://ip:18080/index>
    location = /index {
        return 403 "Forbidden\\n";
    }

    # 反向代理到 8012 端口
    location / {
        proxy_pass <http://127.0.0.1:8012>;  # 将请求代理到本地的 8012 端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

```

### 说明：

- **18080 端口**会直接代理到 **8012** 服务（除了 `/` 和 `/index` 返回 403 Forbidden）。
- 配置完成后，确保检查 NGINX 配置语法，并重新加载 NGINX。

---

### 2. **配置 19050 端口代理到 18080**（第二级 NGINX 代理）

然后，在 **19050** 端口上配置另一个 NGINX，将请求代理到 **18080** 端口。

### NGINX 配置（19050 端口）：

```bash
server {
    listen 19505;  # 监听19505端口或其他对外开放的端口
    add_header X-Frame-Options SAMEORIGIN;

    access_log /usr/local/etc/nginx/logs/zly-access.log;  # 自定义访问日志路径

    location / {
        # 允许局域网内的 IP，拒绝其他访问
        allow 10.99.0.0/16;  # 允许局域网 IP 段
        deny all;  # 拒绝其他 IP 的访问

        proxy_pass http://127.0.0.1:9505;  # 转发到本地 9505 服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 添加跨域支持的头信息
        add_header 'Access-Control-Allow-Origin' '*' always;  # 允许所有域名访问
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;  # 允许的方法
        add_header 'Access-Control-Allow-Headers' 'User-Agent,Keep-Alive,Content-Type,Authorization' always;  # 允许的头信息

        # 处理OPTIONS预检请求，避免跨域问题
        if ($request_method = OPTIONS) {
            return 204;  # 返回204 No Content 响应
        }
    }

    # 将 /preview 请求代理到 18080 端口
    location /preview {
        proxy_pass http://127.0.0.1:18080;  # 转发到本地的 18080 端口服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 添加同样的跨域支持头
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'User-Agent,Keep-Alive,Content-Type,Authorization' always;

        # 处理OPTIONS预检请求
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
}

```

### 说明：

- **`rewrite ^/preview/(.*)$ /$1 break;`**:
    - 这条指令将匹配 `/preview/` 后的所有路径，并去除 `/preview` 前缀，使路径变成 `/onlinePreview`，这符合您在 **18080** 端口访问的路径格式。
- **`proxy_pass http://127.0.0.1:18080;`**:
    - 将请求代理到 **18080** 端口。

---

### 最终实现步骤：

1. **设置第一级代理（18080 -> 8012）**：
    - 编辑并保存 `/etc/nginx/conf.d/18080_proxy.conf` 配置文件。
    - 运行命令：

    ```bash
    sudo nginx -t  # 检查配置语法是否正确
    sudo systemctl reload nginx  # 重新加载配置
    
    ```

2. **设置第二级代理（19050 -> 18080）**：
    - 编辑并保存 `/etc/nginx/conf.d/19050_proxy.conf` 配置文件。
    - 运行命令：

    ```bash
    sudo nginx -t  # 检查配置语法是否正确
    sudo systemctl reload nginx  # 重新加载配置
    
    ```


### 结果：

- 通过 `http://10.99.21.159:19505/preview/onlinePreview?url=...` 访问时，`rewrite` 指令会去掉 `/preview` 前缀，使其代理到正确的路径 `http://127.0.0.1:18080/onlinePreview?url=...`。

这样，通过 **19050** 端口访问时，您就实现了多级代理，成功将请求通过 **18080** 最终代理到 **8012**。