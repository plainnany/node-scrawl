const puppeteer = require('puppeteer')
const fastcsv = require('fast-csv')
const fs = require('fs')
const ws = fs.createWriteStream('data.csv')
const codes = require('./codes')

const requestUrl = async function () {
  const browers = await puppeteer.launch({ headless: true })
  const page = await browers.newPage()
  await page.setViewport({
    width: 1920,
    height: 1080,
  })
  const data = []

  for (let i = 0; i < codes.length; i++) {
    const url = `http://fundf10.eastmoney.com/jdzf_${codes[i]}.html`
    await page.goto(url, {
      waitUntil: 'networkidle2',
    })
    console.log(`开始爬取${url}页面`)

    try {
      const name = await page.evaluate(() => {
        const node = document.querySelector('.bs_jz h4')
        return node.textContent
      })

      const links = await page.evaluate(() => {
        const result = {}
        const anchors = document.querySelectorAll('#jdzftable ul')
        anchors.forEach((item, index) => {
          if (index > 0) {
            result[item.childNodes[0].textContent] =
              item.childNodes[1].textContent
          }
        })
        return result
      })

      console.log(`get ${name} successfully`)

      data.push({
        code: codes[i],
        name,
        ...links,
      })
    } catch (e) {
      console.log('获取数据异常')
    }
  }

  console.log('start to write CSV...')

  fastcsv
    .write(data, { headers: true })
    .on('finish', function () {
      console.log('Write to CSV successfully!')
    })
    .pipe(ws)

  browers.close()
}

requestUrl()
