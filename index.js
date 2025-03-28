const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

app.post('/convert', async (req, res) => {
  try {
    const base64 = req.body.pdf_base64;
    if (!base64) {
      return res.status(400).json({ error: 'No base64 provided' });
    }

    // 1. PDF dosyasını yaz
    const buffer = Buffer.from(base64, 'base64');
    const tempName = uuidv4();
    const pdfPath = path.join('/tmp', `${tempName}.pdf`);
    fs.writeFileSync(pdfPath, buffer);

    // 2. Sayfa sayısını tespit et
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    // 3. Puppeteer başlat
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    const images = [];

    for (let i = 0; i < pageCount; i++) {
      const pdfUrl = `file://${pdfPath}#page=${i + 1}`;
      await page.goto(pdfUrl, { waitUntil: 'networkidle2' });
      await page.setViewport({ width: 1280, height: 800 });

      const screenshotPath = path.join('/tmp', `${tempName}-page-${i + 1}.png`);
      await page.screenshot({ path: screenshotPath });

      const imgBuffer = fs.readFileSync(screenshotPath);
      const base64Image = await sharp(imgBuffer).png().toBuffer().then(buf => buf.toString('base64'));

      images.push({
        page: i + 1,
        image_base64: `data:image/png;base64,${base64Image}`
      });

      // Geçici görseli sil
      fs.unlinkSync(screenshotPath);
    }

    await browser.close();
    fs.unlinkSync(pdfPath); // PDF dosyasını da temizle

    res.json(images);
  } catch (err) {
    console.error('Conversion failed:', err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`PDF Image API listening on port ${port}`));
