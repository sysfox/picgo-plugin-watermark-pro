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
    watermarkBuffer = await generateTextWatermark(text, { fontSize, fontColor, opacity })
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

module.exports = {
  addWatermark,
  generateTextWatermark
}
