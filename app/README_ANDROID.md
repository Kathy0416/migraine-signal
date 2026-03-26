# 偏头痛记录应用 - Android构建指南

## 项目概述

这是一个将现有偏头痛记录网页应用转换为Android应用的项目。应用使用WebView来加载和显示现有网页，同时提供类似原生应用的体验。

## 构建环境要求

- Android Studio 2023.1.1 (Hedgehog) 或更高版本
- JDK 11 或更高版本
- Android SDK 34 或更高版本
- Android Build Tools 34.0.0 或更高版本

## 项目结构

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/migraineapp/tracker/
│   │       │   └── MainActivity.java
│   │       ├── res/
│   │       │   ├── layout/
│   │       │   │   └── activity_main.xml
│   │       │   ├── mipmap-hdpi/
│   │       │   ├── mipmap-mdpi/
│   │       │   ├── mipmap-xhdpi/
│   │       │   ├── mipmap-xxhdpi/
│   │       │   ├── mipmap-xxxhdpi/
│   │       │   └── values/
│   │       │       ├── colors.xml
│   │       │       ├── strings.xml
│   │       │       └── styles.xml
│   │       └── webapp/ (需要手动创建，复制网页文件)
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## 构建步骤

### 1. 准备Web应用文件

1. 在`android/app/src/main/`目录下创建`webapp`目录
2. 将所有网页文件（index.html, diary.html, sleep.html, tips.html, styles.css, script.js, sw.js）复制到`webapp`目录
3. 确保所有文件的路径都是相对路径

### 2. 配置应用图标

1. 准备不同尺寸的应用图标
2. 将图标文件复制到相应的mipmap目录：
   - mipmap-mdpi: 48x48px
   - mipmap-hdpi: 72x72px
   - mipmap-xhdpi: 96x96px
   - mipmap-xxhdpi: 144x144px
   - mipmap-xxxhdpi: 192x192px
3. 文件名应为`ic_launcher.png`和`ic_launcher_round.png`

### 3. 打开项目

1. 启动Android Studio
2. 选择"Open an existing project"
3. 导航到`android`目录并选择它
4. 等待Android Studio完成项目同步

### 4. 配置构建变体

1. 在Android Studio中，从Build Variants面板中选择"release"
2. 确保Gradle配置正确

### 5. 生成签名密钥

1. 在Android Studio中，选择Build > Generate Signed Bundle / APK
2. 选择"Android App Bundle"或"APK"
3. 点击"Create new..."生成新的签名密钥
4. 填写密钥信息并保存

### 6. 构建发布版本

1. 选择Build > Generate Signed Bundle / APK
2. 选择之前创建的签名密钥
3. 选择"release"构建类型
4. 点击"Finish"
5. 构建完成后，APK或AAB文件将生成在`android/app/build/outputs/`目录下

## 发布到Google Play商店

1. 访问[Google Play Console](https://play.google.com/console)
2. 创建新应用或选择现有应用
3. 填写应用信息，包括标题、描述、截图等
4. 上传构建版本（APK或AAB）
5. 配置应用的发布国家和地区
6. 提交应用进行审核
7. 等待审核通过后，应用将在Google Play商店上架

## 注意事项

1. 确保应用符合Google Play商店的政策和指南
2. 测试应用在不同设备和Android版本上的兼容性
3. 定期更新应用，修复bug并添加新功能
4. 考虑添加更多原生功能，如推送通知、位置服务等

## 常见问题

### 1. WebView无法加载本地文件

确保`android/app/src/main/AndroidManifest.xml`中添加了正确的权限：
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### 2. 应用在某些设备上崩溃

检查`MainActivity.java`中的WebView配置，确保它支持所有Android版本。

### 3. 本地存储数据丢失

WebView的本地存储是独立于浏览器的，确保应用正确处理数据迁移和备份。

## 联系方式

如有任何问题或建议，请联系开发团队。