const sharp = require('sharp')
const fs = require('fs')

// 水印位置映射
const POSITIONS = {
  'top-left': { gravity: 'northwest' },
  'top-center': { gravity: 'north' },
  'top-right': { gravity: 'northeast' },
  'middle-left': { gravity: 'west' },
  'middle-center': { gravity: 'center' },
  'middle-right': { gravity: 'east' },
  'bottom-left': { gravity: 'southwest' },
  'bottom-center': { gravity: 'south' },
  'bottom-right': { gravity: 'southeast' }
}

// 生成文字水印图片
async function generateTextWatermark(text, options) {
  const { fontSize = 30, fontColor = '#ffffff', opacity = 0.5 } = options
  
  // 计算文字图片的大小
  const width = text.length * fontSize * 0.6 + 40
  const height = fontSize * 2
  
  // 解析颜色，确保格式正确
  let color = fontColor.replace('#', '')
  // 如果颜色格式不正确，使用默认白色
  if (!/^[0-9A-Fa-f]{6}$/.test(color)) {
    color = 'ffffff'
  }
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  
  // 确保透明度在有效范围内
  const validOpacity = Math.max(0, Math.min(1, parseFloat(opacity) || 0.5))
  
  // 创建SVG文字
  const svg = `
    <svg width="${width}" height="${height}">
      <text x="20" y="${fontSize + 10}" 
            font-size="${fontSize}" 
            font-family="Arial, sans-serif" 
            fill="rgb(${r},${g},${b})" 
            fill-opacity="${validOpacity}">
        ${text}
      </text>
    </svg>
  `
  
  return Buffer.from(svg)
}

// 添加水印到图片
async function addWatermark(imageBuffer, watermarkConfig) {
  const {
    type = 'text',
    text = '',
    imagePath = '',
    position = 'bottom-right',
    opacity = 0.5,
    fontSize = 30,
    fontColor = '#ffffff',
    offsetX = 10,
    offsetY = 10,
    scale = 0.2
  } = watermarkConfig
  
  let watermarkBuffer
  
  if (type === 'text' && text) {
    // 文字水印
    const svgBuffer = await generateTextWatermark(text, { fontSize, fontColor, opacity })
    // 将 SVG 转换为 PNG
    watermarkBuffer = await sharp(svgBuffer)
      .png()
      .toBuffer()
  } else if (type === 'image' && imagePath && fs.existsSync(imagePath)) {
    // 图片水印
    const metadata = await sharp(imageBuffer).metadata()
    const imageWidth = metadata.width
    // 确保缩放比例在有效范围内 (0.01 到 1)
    const validScale = Math.max(0.01, Math.min(1, parseFloat(scale) || 0.2))
    const watermarkWidth = Math.floor(imageWidth * validScale)
    
    watermarkBuffer = await sharp(imagePath)
      .resize({ width: watermarkWidth })
      .toBuffer()
  } else {
    // 没有有效的水印配置，返回原图
    return imageBuffer
  }
  
  // 获取位置配置
  const positionConfig = POSITIONS[position] || POSITIONS['bottom-right']
  
  // 应用水印
  const result = await sharp(imageBuffer)
    .composite([{
      input: watermarkBuffer,
      gravity: positionConfig.gravity,
      blend: 'over'
    }])
    .toBuffer()
  
  return result
}

const handle = async (ctx) => {
  const config = ctx.getConfig('picgo-plugin-watermark-pro')
  
  if (!config || !config.enabled) {
    return ctx
  }
  
  try {
    const output = ctx.output
    
    for (let i = 0; i < output.length; i++) {
      const image = output[i]
      
      if (image.buffer) {
        // 添加水印
        const watermarkedBuffer = await addWatermark(image.buffer, config)
        image.buffer = watermarkedBuffer
      } else if (image.base64Image) {
        // 处理base64图片
        const buffer = Buffer.from(image.base64Image, 'base64')
        const watermarkedBuffer = await addWatermark(buffer, config)
        image.base64Image = watermarkedBuffer.toString('base64')
        image.buffer = watermarkedBuffer
      }
    }
  } catch (error) {
    ctx.log.error('添加水印失败:', error.message)
    ctx.emit('notification', {
      title: '水印添加失败',
      body: error.message
    })
  }
  
  return ctx
}

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.beforeUploadPlugins.register('watermark-pro', { handle })
  }
  
  return {
    register,
    config: (ctx) => {
      let userConfig = ctx.getConfig('picgo-plugin-watermark-pro')
      if (!userConfig) {
        userConfig = {}
      }
      
      return [
        {
          name: 'enabled',
          type: 'confirm',
          default: userConfig.enabled || true,
          message: '是否启用水印功能',
          required: false
        },
        {
          name: 'type',
          type: 'list',
          default: userConfig.type || 'text',
          choices: ['text', 'image'],
          message: '水印类型',
          required: true
        },
        {
          name: 'text',
          type: 'input',
          default: userConfig.text || '水印文字',
          message: '水印文字内容（仅文字水印有效）',
          required: false
        },
        {
          name: 'imagePath',
          type: 'input',
          default: userConfig.imagePath || '',
          message: '水印图片路径（仅图片水印有效）',
          required: false
        },
        {
          name: 'position',
          type: 'list',
          default: userConfig.position || 'bottom-right',
          choices: [
            'top-left',
            'top-center',
            'top-right',
            'middle-left',
            'middle-center',
            'middle-right',
            'bottom-left',
            'bottom-center',
            'bottom-right'
          ],
          message: '水印位置',
          required: true
        },
        {
          name: 'opacity',
          type: 'input',
          default: userConfig.opacity || 0.5,
          message: '水印透明度（0-1之间）',
          required: false
        },
        {
          name: 'fontSize',
          type: 'input',
          default: userConfig.fontSize || 30,
          message: '文字大小（仅文字水印有效）',
          required: false
        },
        {
          name: 'fontColor',
          type: 'input',
          default: userConfig.fontColor || '#ffffff',
          message: '文字颜色（十六进制颜色码，如#ffffff）',
          required: false
        },
        {
          name: 'scale',
          type: 'input',
          default: userConfig.scale || 0.2,
          message: '图片水印缩放比例（相对原图宽度，0-1之间）',
          required: false
        }
      ]
    }
  }
}
