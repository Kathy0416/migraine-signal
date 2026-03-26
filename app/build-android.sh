#!/bin/bash

# 构建脚本：将网页文件复制到Android项目的assets目录中

echo "开始构建偏头痛记录应用..."

# 检查是否存在android目录
if [ ! -d "android" ]; then
    echo "错误：android目录不存在！"
    exit 1
fi

# 创建assets目录
mkdir -p android/app/src/main/assets/www

echo "复制网页文件到assets目录..."

# 复制所有网页文件
cp index.html android/app/src/main/assets/www/
cp diary.html android/app/src/main/assets/www/
cp sleep.html android/app/src/main/assets/www/
cp tips.html android/app/src/main/assets/www/
cp styles.css android/app/src/main/assets/www/
cp script.js android/app/src/main/assets/www/
cp sw.js android/app/src/main/assets/www/

# 复制图片资源（如果有）
if [ -f "睡眠.png" ]; then
    cp 睡眠.png android/app/src/main/assets/www/
fi

echo "网页文件复制完成！"
echo "\n下一步：使用Android Studio打开android目录，然后构建发布版本。"
echo "详细步骤请参考README_ANDROID.md文件。"