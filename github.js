const cred = require('./cred');
const pupeteer = require('puppeteer')
const mongoose = require('mongoose');
const User = require('./mongo');



const getInfo = async () => {
  const browser = await pupeteer.launch({
    headless:false
  })
  const page = await browser.newPage()
  await page.setViewport({width:1920, height: 1080})

  // Connect
  await page.goto('https://github.com/login');
  await page.click('#login_field');
  await page.keyboard.type(cred.username);
  await page.click('#password');
  await page.keyboard.type(cred.password);
  await page.click('#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block');

  // Search page
  const searchUrl = `https://github.com/search?q=johanna&type=Users&utf8=%E2%9C%93`;
  await page.goto(searchUrl);

  // Get user list
  const userList = 'user-list-item';
  let list = await page.evaluate((sel) => {
    return document.getElementsByClassName(sel).length;
  }, userList);
  const listUsername = '#user_search_results > div.user-list > div:nth-child(id) div.d-flex > div > a';
  const listEmail = '#user_search_results > div.user-list > div:nth-child(id) > div.flex-auto > div.d-flex.flex-wrap.text-small.text-gray > div:nth-child(2) > a';

  async function getPages(page) {
    const numUser = '#js-pjax-container > div > div.col-12.col-md-9.float-left.px-2.pt-3.pt-md-0.codesearch-results > div > div.d-flex.flex-column.flex-md-row.flex-justify-between.border-bottom.pb-3.position-relative > h3';

    let inner = await page.evaluate((sel) => {
      let html = document.querySelector(sel).innerHTML;
      return html.replace(',', '').replace('users', '').trim();
    }, numUser);

    let numUsers = parseInt(inner);

    console.log('Users: ', numUsers);
    let numPages = Math.ceil(numUsers / 10);
    return numPages;
}

  let numPages = await getPages(page);

  console.log('Pages: ', numPages);

  for (let h = 1; h <= numPages; h++) {

    let pageUrl = searchUrl + '&p=' + h;

    await page.goto(pageUrl);

    let list = await page.evaluate((sel) => {
        return document.getElementsByClassName(sel).length;
      }, userList);

    for (let i = 1; i <= list; i++) {
      let usernameSelector = listUsername.replace("id", i);
      let emailSelector = listEmail.replace("id", i);

      let username = await page.evaluate((sel) => {
          return document.querySelector(sel).getAttribute('href').replace('/', '');
        }, usernameSelector);

      let email = await page.evaluate((sel) => {
          let element = document.querySelector(sel);
          return element? element.innerHTML: null;
        }, emailSelector);

      if (!email) continue;

      console.log(username, ' -> ', email);

      // Save to db
      saveUser({
        username: username,
        email: email,
      });
    }
  }
}

getInfo()

function saveUser(userObj) {
  const DB_URL = 'mongodb://localhost/git';
  if (mongoose.connection.readyState == 0) { mongoose.connect(DB_URL); }
  let conditions = { email: userObj.email };
  let options = { upsert: true, new: true, setDefaultsOnInsert: true };
  User.findOneAndUpdate(conditions, userObj, options, (err, result) => {
    if (err) throw err;
  });
}
