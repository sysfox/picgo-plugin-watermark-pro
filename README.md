# picgo-plugin-watermark-pro

> 用于PicGo的专业水印插件，支持文字和图片水印，功能齐全

## 功能特性

- ✅ 支持文字水印
- ✅ 支持图片水印
- ✅ 9个方向的水印位置选择
- ✅ 可调节水印透明度
- ✅ 文字水印支持自定义字体大小和颜色
- ✅ 图片水印支持缩放比例调整
- ✅ 自动处理上传前的图片

## 安装

### 通过PicGo插件界面安装

1. 打开PicGo应用
2. 进入「插件设置」
3. 搜索「watermark-pro」
4. 点击「安装」按钮

### 通过命令行安装

```bash
picgo install watermark-pro
```

## 配置说明

安装后在PicGo的插件设置中进行配置，支持以下配置项：

### 基础配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| enabled | 布尔值 | true | 是否启用水印功能 |
| type | 选择 | text | 水印类型：text（文字）或 image（图片） |
| position | 选择 | bottom-right | 水印位置，见下方位置说明 |
| opacity | 数字 | 0.5 | 水印透明度，范围0-1，0为完全透明，1为完全不透明 |

### 文字水印配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| text | 文本 | 水印文字 | 水印显示的文字内容 |
| fontSize | 数字 | 30 | 文字大小（像素） |
| fontColor | 文本 | #ffffff | 文字颜色，十六进制颜色码 |

### 图片水印配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| imagePath | 文本 | - | 水印图片的绝对路径 |
| scale | 数字 | 0.2 | 水印图片缩放比例（相对原图宽度），范围0-1 |

### 水印位置说明

支持以下9个位置：

```
top-left        top-center        top-right
┌─────────────────────────────────────────┐
│  ●               ●                  ●   │
│                                         │
│                                         │
middle-left    middle-center    middle-right
│  ●               ●                  ●   │
│                                         │
│                                         │
bottom-left    bottom-center    bottom-right
│  ●               ●                  ●   │
└─────────────────────────────────────────┘
```

## 使用示例

### 文字水印

在PicGo插件配置中设置：

```
启用水印功能: 是
水印类型: text
水印文字内容: © 2024 我的版权
水印位置: bottom-right
透明度: 0.5
文字大小: 30
文字颜色: #ffffff
```

### 图片水印

在PicGo插件配置中设置：

```
启用水印功能: 是
水印类型: image
水印图片路径: /home/user/watermark.png
水印位置: bottom-right
透明度: 0.5
缩放比例: 0.2
```

## 工作原理

本插件使用 PicGo 的 `beforeUploadPlugins` 机制，在图片上传前自动添加水印：

1. 拦截待上传的图片
2. 根据配置生成对应的水印（文字或图片）
3. 将水印合成到原图上
4. 将处理后的图片继续上传流程

## 依赖说明

本插件使用 [sharp](https://sharp.pixelplumbing.com/) 进行图片处理，这是一个高性能的Node.js图片处理库。

## 本地开发指南

### 环境要求

- Node.js >= 12.0.0（推荐使用 Node.js 16 或 18）
- macOS 需要安装 libvips：`brew install vips`
- Linux 需要安装 libvips：`apt-get install libvips-dev`（Ubuntu/Debian）
- Windows 用户：sharp 会自动下载预编译的二进制文件

### 开发步骤

1. **克隆仓库并安装依赖**

```bash
git clone https://github.com/sysfox/picgo-plugin-watermark-pro.git
cd picgo-plugin-watermark-pro
npm install
```

2. **运行本地测试**

```bash
# 运行本地快速测试（生成带水印的测试图片）
npm run dev:test

# 运行单元测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

3. **链接到 PicGo 进行调试**

```bash
# 自动将插件链接到 PicGo 插件目录
npm run dev:link

# 或者手动创建软链接
ln -s $(pwd) ~/.picgo/plugins/picgo-plugin-watermark-pro
```

然后：
- 重启 PicGo 应用
- 进入「插件设置」查看并启用 watermark-pro
- 配置水印参数
- 上传图片测试

4. **代码规范检查**

```bash
npm run lint
```

### 项目结构

```
picgo-plugin-watermark-pro/
├── src/
│   └── index.js           # 插件主文件
├── test/
│   ├── local-test.js      # 本地快速测试脚本
│   ├── watermark.test.js  # Jest 单元测试
│   └── watermark-test-helper.js  # 测试辅助函数
├── scripts/
│   └── link-to-picgo.js   # 自动链接到 PicGo 的脚本
├── .github/
│   └── workflows/
│       ├── ci.yml         # CI 配置
│       └── release.yml    # 发布配置
├── package.json
├── .eslintrc.js
├── .gitignore
├── CHANGELOG.md
└── README.md
```

### 调试技巧

1. **查看 PicGo 日志**：PicGo 应用的日志通常在 `~/.picgo/picgo.log`
2. **使用本地测试脚本**：修改代码后运行 `npm run dev:test` 快速验证
3. **添加 console.log**：在 `src/index.js` 中添加日志输出
4. **检查水印输出**：本地测试会在 `test/` 目录生成带水印的图片

### 常见开发问题

#### sharp 安装失败

```bash
# macOS
brew install vips
npm rebuild sharp --force

# 确保 Xcode Command Line Tools 已安装
xcode-select --install
```

#### 插件未在 PicGo 中显示

- 确认软链接创建成功：`ls -la ~/.picgo/plugins/`
- 重启 PicGo 应用
- 检查 PicGo 日志是否有错误信息

#### 修改代码后不生效

- 如果使用 PicGo 桌面应用，需要重启应用
- 清理 `node_modules` 并重新安装：`rm -rf node_modules && npm install`

## 依赖说明

本插件使用 [sharp](https://sharp.pixelplumbing.com/) 进行图片处理，这是一个高性能的Node.js图片处理库。

## 常见问题

### Q: 水印不显示怎么办？
A: 请检查以下几点：
1. 确认「启用水印功能」已开启
2. 如果是文字水印，确认「水印文字内容」不为空
3. 如果是图片水印，确认「水印图片路径」正确且文件存在
4. 检查透明度设置，如果设置为0则水印完全透明

### Q: 图片水印显示不正常？
A: 请确保：
1. 水印图片路径使用绝对路径
2. 水印图片文件格式正确（推荐使用PNG格式以支持透明背景）
3. 缩放比例设置合理（建议0.1-0.3之间）

### Q: 如何调整水印大小？
A: 
- 文字水印：调整「文字大小」参数
- 图片水印：调整「缩放比例」参数

### Q: 支持哪些图片格式？
A: 支持常见的图片格式，包括 JPEG、PNG、WebP、GIF、SVG 等

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持文字和图片水印
- 支持9个方向的位置选择
- 支持透明度、颜色、大小等参数配置
