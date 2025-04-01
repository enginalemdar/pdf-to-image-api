const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument } = require('pdf-lib');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

// Sağlık kontrolü endpointi
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.post('/convert', async (req, res) => {
  try {
    // /tmp temizliği burada (await ile tam işlem bitene kadar bekletiyoruz)
    const tempFolder = '/tmp';
    await new Promise((resolve, reject) => {
      fs.readdir(tempFolder, (err, files) => {
        if (err) return reject(err);
        let pending = files.length;
        if (!pending) return resolve();
        files.forEach((file) => {
          fs.unlink(path.join(tempFolder, file), (err) => {
            if (err) console.error('Failed to delete:', file, err);
            if (!--pending) resolve();
          });
        });
      });
    });

    const base64 = req.body.pdf_base64;
    if (!base64) {
      return res.status(400).json({ error: 'No base64 provided' });
    }

    const buffer = Buffer.from(base64, 'base64');
    const tempName = uuidv4();
    const tempPdfPath = path.join('/tmp', `${tempName}.pdf`);
    fs.writeFileSync(tempPdfPath, buffer);

    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    const options = {
      density: 150,
      saveFilename: `${tempName}`,
      savePath: '/tmp',
      format: 'png',
      width: 1280,
      height: 720,
    };

    const convert = fromPath(tempPdfPath, options);
    const result = [];

    // Paralel olarak tüm sayfaları dönüştür
    const convertPromises = [];
    for (let i = 1; i <= pageCount; i++) {
      convertPromises.push(convert(i));
    }

    const convertedPages = await Promise.allSettled(convertPromises);

    for (let i = 0; i < convertedPages.length; i++) {
      const pageNum = i + 1;
      const pageResult = convertedPages[i];
      if (pageResult.status === 'fulfilled' && fs.existsSync(pageResult.value.path)) {
        const imgBuffer = fs.readFileSync(pageResult.value.path);
        const base64Image = imgBuffer.toString('base64');
        result.push({
          page: pageNum,
          image_base64: `data:image/png;base64,${base64Image}`,
        });
        fs.unlinkSync(pageResult.value.path);
      } else {
        result.push({
          page: pageNum,
          error: `Page ${pageNum} could not be converted.`,
        });
      }
    }

    fs.unlinkSync(tempPdfPath);
    res.json(result);
  } catch (err) {
    console.error('Conversion failed:', err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`PDF Image API running on port ${port}`));
