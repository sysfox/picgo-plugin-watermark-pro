const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { addWatermark, generateTextWatermark } = require('./watermark-test-helper')

describe('PicGo Watermark Pro Plugin', () => {
  let testImageBuffer
  let testImagePath
  let watermarkImagePath

  beforeAll(async () => {
    // 创建测试图片
    testImagePath = path.join(__dirname, 'test-input.jpg')
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
    
    testImageBuffer = fs.readFileSync(testImagePath)

    // 创建水印图片
    watermarkImagePath = path.join(__dirname, 'test-watermark.png')
    await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 }
      }
    })
    .png()
    .toFile(watermarkImagePath)
  })

  afterAll(() => {
    // 清理测试文件
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath)
    if (fs.existsSync(watermarkImagePath)) fs.unlinkSync(watermarkImagePath)
  })

  describe('generateTextWatermark', () => {
    test('应该生成有效的文字水印 Buffer', async () => {
      const watermarkBuffer = await generateTextWatermark('测试水印', {
        fontSize: 30,
        fontColor: '#ffffff',
        opacity: 0.5
      })

      expect(watermarkBuffer).toBeInstanceOf(Buffer)
      expect(watermarkBuffer.length).toBeGreaterThan(0)
      
      // 验证 Buffer 可以被 sharp 处理
      const metadata = await sharp(watermarkBuffer).metadata()
      expect(metadata.format).toBe('svg')
    })

    test('应该处理无效的颜色值', async () => {
      const watermarkBuffer = await generateTextWatermark('测试', {
        fontSize: 30,
        fontColor: 'invalid-color',
        opacity: 0.5
      })

      expect(watermarkBuffer).toBeInstanceOf(Buffer)
      expect(watermarkBuffer.length).toBeGreaterThan(0)
    })

    test('应该限制透明度在 0-1 之间', async () => {
      const watermarkBuffer1 = await generateTextWatermark('测试', {
        fontSize: 30,
        fontColor: '#ffffff',
        opacity: -0.5  // 应该被限制为 0
      })

      const watermarkBuffer2 = await generateTextWatermark('测试', {
        fontSize: 30,
        fontColor: '#ffffff',
        opacity: 1.5  // 应该被限制为 1
      })

      expect(watermarkBuffer1).toBeInstanceOf(Buffer)
      expect(watermarkBuffer2).toBeInstanceOf(Buffer)
    })
  })

  describe('addWatermark - 文字水印', () => {
    test('应该成功添加文字水印', async () => {
      const config = {
        type: 'text',
        text: '© 2024 测试',
        position: 'bottom-right',
        opacity: 0.7,
        fontSize: 40,
        fontColor: '#ffffff'
      }

      const result = await addWatermark(testImageBuffer, config)

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)

      // 验证输出是有效的图片
      const metadata = await sharp(result).metadata()
      expect(metadata.width).toBe(800)
      expect(metadata.height).toBe(600)
    })

    test('应该支持不同的水印位置', async () => {
      const positions = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ]

      for (const position of positions) {
        const config = {
          type: 'text',
          text: '测试',
          position,
          opacity: 0.5,
          fontSize: 30,
          fontColor: '#ffffff'
        }

        const result = await addWatermark(testImageBuffer, config)
        expect(result).toBeInstanceOf(Buffer)
        
        const metadata = await sharp(result).metadata()
        expect(metadata.width).toBe(800)
      }
    })
  })

  describe('addWatermark - 图片水印', () => {
    test('应该成功添加图片水印', async () => {
      const config = {
        type: 'image',
        imagePath: watermarkImagePath,
        position: 'top-right',
        opacity: 0.6,
        scale: 0.25
      }

      const result = await addWatermark(testImageBuffer, config)

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)

      const metadata = await sharp(result).metadata()
      expect(metadata.width).toBe(800)
      expect(metadata.height).toBe(600)
    })

    test('应该处理不存在的水印图片路径', async () => {
      const config = {
        type: 'image',
        imagePath: '/nonexistent/path/watermark.png',
        position: 'bottom-right',
        scale: 0.2
      }

      const result = await addWatermark(testImageBuffer, config)

      // 应该返回原图
      expect(result).toEqual(testImageBuffer)
    })

    test('应该限制缩放比例在有效范围内', async () => {
      const config1 = {
        type: 'image',
        imagePath: watermarkImagePath,
        position: 'bottom-right',
        scale: -0.1  // 应该被限制为 0.01
      }

      const config2 = {
        type: 'image',
        imagePath: watermarkImagePath,
        position: 'bottom-right',
        scale: 2  // 应该被限制为 1
      }

      const result1 = await addWatermark(testImageBuffer, config1)
      const result2 = await addWatermark(testImageBuffer, config2)

      expect(result1).toBeInstanceOf(Buffer)
      expect(result2).toBeInstanceOf(Buffer)
    })
  })

  describe('addWatermark - 边界情况', () => {
    test('应该处理空配置', async () => {
      const config = {}
      const result = await addWatermark(testImageBuffer, config)

      // 应该返回原图
      expect(result).toEqual(testImageBuffer)
    })

    test('应该处理文字水印但文字为空', async () => {
      const config = {
        type: 'text',
        text: '',
        position: 'bottom-right'
      }

      const result = await addWatermark(testImageBuffer, config)

      // 应该返回原图
      expect(result).toEqual(testImageBuffer)
    })

    test('应该处理无效的水印类型', async () => {
      const config = {
        type: 'invalid-type',
        position: 'bottom-right'
      }

      const result = await addWatermark(testImageBuffer, config)

      // 应该返回原图
      expect(result).toEqual(testImageBuffer)
    })
  })
})
