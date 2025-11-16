#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 查找 PicGo 插件目录
function findPicGoPluginDir() {
  const possiblePaths = [
    path.join(require('os').homedir(), '.picgo', 'plugins'),
    path.join(require('os').homedir(), 'PicGo', 'plugins'),
    path.join(require('os').homedir(), '.config', 'picgo', 'plugins')
  ]

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      return dir
    }
  }

  return null
}

function linkToPicGo() {
  console.log('🔗 开始链接插件到 PicGo...\n')

  const pluginDir = findPicGoPluginDir()
  
  if (!pluginDir) {
    console.error('❌ 未找到 PicGo 插件目录')
    console.log('\n可能的原因：')
    console.log('  1. PicGo 未安装或未运行过')
    console.log('  2. 插件目录在非标准位置\n')
    console.log('请手动创建软链接：')
    console.log(`  ln -s ${process.cwd()} <PicGo插件目录>/picgo-plugin-watermark-pro`)
    process.exit(1)
  }

  const targetLink = path.join(pluginDir, 'picgo-plugin-watermark-pro')

  // 检查是否已经存在
  if (fs.existsSync(targetLink)) {
    console.log('⚠️  链接已存在，将先删除旧链接...')
    try {
      fs.unlinkSync(targetLink)
    } catch (error) {
      console.error('❌ 删除旧链接失败:', error.message)
      process.exit(1)
    }
  }

  // 创建软链接
  try {
    fs.symlinkSync(process.cwd(), targetLink, 'dir')
    console.log('✓ 插件已成功链接到 PicGo!')
    console.log(`  源目录: ${process.cwd()}`)
    console.log(`  目标链接: ${targetLink}`)
    console.log('\n📝 下一步：')
    console.log('  1. 重启 PicGo 应用')
    console.log('  2. 进入「插件设置」查看 watermark-pro 插件')
    console.log('  3. 配置插件参数并启用')
    console.log('  4. 上传图片测试水印功能\n')
  } catch (error) {
    console.error('❌ 创建链接失败:', error.message)
    console.log('\n请尝试手动创建软链接：')
    console.log(`  ln -s ${process.cwd()} ${targetLink}`)
    process.exit(1)
  }
}

// 运行
linkToPicGo()
