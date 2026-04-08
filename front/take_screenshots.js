import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  // 1. Landing full page
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/Chakka Sri Praneeth/.gemini/antigravity/brain/83339d96-74b7-4abd-b916-e4d150a967ca/puppeteer_landing_full.png', fullPage: true });

  // 2. Login Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const loginBtn = buttons.find(el => el.textContent.includes('Log In'));
    if (loginBtn) loginBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/Chakka Sri Praneeth/.gemini/antigravity/brain/83339d96-74b7-4abd-b916-e4d150a967ca/puppeteer_login_modal.png' });

  // 3. Find Charging View
  await page.evaluate(() => {
    sessionStorage.setItem('nc_user', JSON.stringify({
      _id: '123',
      name: 'Test EV Owner',
      type: 'ev-owner'
    }));
    sessionStorage.setItem('nc_view', 'find-charging');
  });
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/Chakka Sri Praneeth/.gemini/antigravity/brain/83339d96-74b7-4abd-b916-e4d150a967ca/puppeteer_find_charging.png', fullPage: true });

  // 4. EV Owner Dashboard
  await page.evaluate(() => {
    sessionStorage.setItem('nc_view', 'ev-owner');
  });
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/Chakka Sri Praneeth/.gemini/antigravity/brain/83339d96-74b7-4abd-b916-e4d150a967ca/puppeteer_dashboard.png', fullPage: true });

  await browser.close();
})();
