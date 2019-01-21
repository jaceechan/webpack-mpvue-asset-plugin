const path = require('path')
const upath = require('upath')
const relative = require('relative')

const emitHandle = (compilation, callback) => {
  Object.keys(compilation.entrypoints).forEach(key => {
    const { chunks } = compilation.entrypoints[key]
    const entryChunk = chunks.pop()

    entryChunk.files.forEach(filePath => {
      const assetFile = compilation.assets[filePath]
      const extname = path.extname(filePath)

      // sourcemap文件无需添加资源引用，否则报错
      if (extname === '.map') { return }

      let content = assetFile.source()

      chunks.reverse().forEach(chunk => {
        chunk.files.forEach(subFile => {
          if (path.extname(subFile) === extname && assetFile) {
            let relativePath = upath.normalize(relative(filePath, subFile))
            // 百度小程序 js 引用不支持绝对路径，改为相对路径
            if (extname === '.js' && !/^\.(\.)?\//.test(relativePath)) {
              relativePath = `./${relativePath}`
            }

            if (/^(\.wxss)|(\.ttss)|(\.acss)|(\.css)$/.test(extname)) {
              // @improt语句必须加上;否则开发工具解析有问题
              content = `@import "${relativePath}";\n${content}`;
            } else {
              // require后需要加上;否则开发工具解析有问题
              content = `require("${relativePath}");\n${content}`;
            }
          }
        })
        assetFile.source = () => content
      })
    })
  })
  callback()
}

function MpvuePlugin() { }
MpvuePlugin.prototype.apply = compiler => compiler.plugin('emit', emitHandle)

module.exports = MpvuePlugin
