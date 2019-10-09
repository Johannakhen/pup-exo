const pupeteer = require('puppeteer')

const BASE_URL ='https://www.instagram.com/accounts/login/'

const instagram = async() => {
  const browser = await pupeteer.launch({headless: false})
  const page = await browser.newPage()
  await page.goto(BASE_URL)
  const context = browser.defaultBrowserContext()
  await context.overridePermissions(BASE_URL, ['notifications'])
  await page.waitForSelector('input[name=username]')

  await page.type('input[name=username]', '')
  await page.type('input[name=password]', '')
  await page.click('button[type=submit]')
  await page.waitForNavigation()


  await page.waitForSelector("article:nth-child(1) span[aria-label=J’aime]")
  await page.click("article:nth-child(1) span[aria-label=J’aime]")
  await page.waitForSelector("article:nth-child(2) span[aria-label=J’aime]")
  await page.click("article:nth-child(2) span[aria-label=J’aime]")
  await page.waitForSelector("article:nth-child(3) span[aria-label=J’aime]")
  await page.click("article:nth-child(3) span[aria-label=J’aime]")

  // const icons = await page.evaluate(() => {
  //   let likes = document.querySelectorAll("span[aria-label=J’aime]")
  //   likes = Array.prototype.slice.call(likes).slice(0,3)
  //   likes.forEach(like => {
  //    await page.click(like)
  //   })
  //   return likes
  // })
  browser.close()
}

instagram()
.then(console.log)
.catch(console.error)