#!/bin/bash

TARGET_BUCKET=wlfpanda-blog

echo "uploading..."

hexo clean
hexo g

./ossutilmac64 -c ossutil.cfg rm -rf oss://$TARGET_BUCKET/
./ossutilmac64 -c ossutil.cfg cp -rf public/ oss://$TARGET_BUCKET/

echo "done"
