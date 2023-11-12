const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const baseUrl = 'URL';
const downloadPath = 'Select Download Folder';

const startChapter = "enter starting number";
const endChapter = "enter end number";


(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    for (let chapterNumber = startChapter; chapterNumber <= endChapter; chapterNumber++) {
      const url = `${baseUrl}${chapterNumber}/`;

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const dynamicContent = await page.content();
      const $ = cheerio.load(dynamicContent);

      const chapterPath = path.join(downloadPath, `chapter_${chapterNumber}/`);
      if (!fs.existsSync(chapterPath)) {
        fs.mkdirSync(chapterPath);
      }

      const imageDownloadPromises = [];

      // Select both "src" and "data-src" attributes for images
      $('img[src], img[data-src]').each((index, element) => {
        const imageUrl = $(element).attr('src') || $(element).attr('data-src');
        if (imageUrl && (imageUrl.endsWith('.png') || imageUrl.endsWith('.jpg'))) {
          const imagePromise = axios({
            method: 'get',
            url: imageUrl,
            responseType: 'stream',
          })
            .then((response) => {
              const imageFileName = path.join(chapterPath, `image_${index + 1}.jpg`);
              response.data.pipe(fs.createWriteStream(imageFileName));
              console.log('İndirilen:', imageFileName);
            })
            .catch((error) => {
              console.error('İndirme hatası:', error);
            });

          imageDownloadPromises.push(imagePromise);
        }
      });

      await Promise.all(imageDownloadPromises);
    }
  } catch (error) {
    console.error('Sayfa yüklenirken hata oluştu:', error);
  } finally {
    await browser.close();
  }
})();
