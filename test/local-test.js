const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

// 导入核心函数（需要模拟一个简单的 ctx）
const pluginModule = require('../src/index.js')

// 创建一个简单的测试图片
async function createTestImage() {
  const testImagePath = path.join(__dirname, 'input.jpg')
  
  // 如果测试图片不存在，创建一个简单的测试图片
  if (!fs.existsSync(testImagePath)) {
    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .jpeg()
    .toFile(testImagePath)
    
    console.log('✓ 已创建测试图片: test/input.jpg')
  }
  
  return testImagePath
}

// 创建一个简单的水印图片
async function createWatermarkImage() {
  const watermarkPath = path.join(__dirname, 'watermark.png')
  
  if (!fs.existsSync(watermarkPath)) {
    await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 }
      }
    })
    .png()
    .toFile(watermarkPath)
    
    console.log('✓ 已创建水印图片: test/watermark.png')
  }
  
  return watermarkPath
}

// 测试文字水印
async function testTextWatermark() {
  console.log('\n=== 测试文字水印 ===')
  
  const testImagePath = await createTestImage()
  const inputBuffer = fs.readFileSync(testImagePath)
  
  // 模拟 PicGo ctx
  const mockCtx = {
    output: [{
      buffer: inputBuffer,
      fileName: 'test-text.jpg'
    }],
    getConfig: (key) => {
      if (key === 'picgo-plugin-watermark-pro') {
        return {
          enabled: true,
          type: 'text',
          text: '© 2024 测试水印',
          position: 'bottom-right',
          opacity: 0.7,
          fontSize: 40,
          fontColor: '#ffffff'
        }
      }
      return null
    },
    log: {
      error: (msg, err) => console.error('Error:', msg, err),
      info: (msg) => console.log('Info:', msg)
    },
    emit: (event, data) => console.log('Event:', event, data)
  }
  
  // 创建插件实例
  const plugin = pluginModule(mockCtx)
  
  // 注册插件
  plugin.register()
  
  // 模拟 beforeUploadPlugins 的处理
  const handler = mockCtx.helper?.beforeUploadPlugins?.registeredPlugins?.['watermark-pro']
  
  // 直接测试处理逻辑（因为我们没有完整的 PicGo 环境）
  // 我们需要手动调用 addWatermark 函数
  const { addWatermark } = require('./watermark-test-helper')
  
  const watermarkedBuffer = await addWatermark(inputBuffer, mockCtx.getConfig('picgo-plugin-watermark-pro'))
  
  // 保存结果
  const outputPath = path.join(__dirname, 'output-text.jpg')
  fs.writeFileSync(outputPath, watermarkedBuffer)
  
  // 验证输出
  const metadata = await sharp(watermarkedBuffer).metadata()
  console.log(`✓ 文字水印测试完成`)
  console.log(`  输出图片: ${outputPath}`)
  console.log(`  尺寸: ${metadata.width}x${metadata.height}`)
  console.log(`  格式: ${metadata.format}`)
}

// 测试图片水印
async function testImageWatermark() {
  console.log('\n=== 测试图片水印 ===')
  
  const testImagePath = await createTestImage()
  const watermarkPath = await createWatermarkImage()
  const inputBuffer = fs.readFileSync(testImagePath)
  
  const mockCtx = {
    output: [{
      buffer: inputBuffer,
      fileName: 'test-image.jpg'
    }],
    getConfig: (key) => {
      if (key === 'picgo-plugin-watermark-pro') {
        return {
          enabled: true,
          type: 'image',
          imagePath: watermarkPath,
          position: 'top-right',
          opacity: 0.6,
          scale: 0.25
        }
      }
      return null
    },
    log: {
      error: (msg, err) => console.error('Error:', msg, err),
      info: (msg) => console.log('Info:', msg)
    },
    emit: (event, data) => console.log('Event:', event, data)
  }
  
  const { addWatermark } = require('./watermark-test-helper')
  
  const watermarkedBuffer = await addWatermark(inputBuffer, mockCtx.getConfig('picgo-plugin-watermark-pro'))
  
  const outputPath = path.join(__dirname, 'output-image.jpg')
  fs.writeFileSync(outputPath, watermarkedBuffer)
  
  const metadata = await sharp(watermarkedBuffer).metadata()
  console.log(`✓ 图片水印测试完成`)
  console.log(`  输出图片: ${outputPath}`)
  console.log(`  尺寸: ${metadata.width}x${metadata.height}`)
  console.log(`  格式: ${metadata.format}`)
}

// 运行所有测试
async function runTests() {
  try {
    console.log('PicGo 水印插件本地测试\n')
    
    await testTextWatermark()
    await testImageWatermark()
    
    console.log('\n✓ 所有测试通过！')
    console.log('\n生成的文件:')
    console.log('  - test/input.jpg (测试输入图片)')
    console.log('  - test/watermark.png (水印图片)')
    console.log('  - test/output-text.jpg (文字水印结果)')
    console.log('  - test/output-image.jpg (图片水印结果)')
  } catch (error) {
    console.error('\n✗ 测试失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

runTests()
