const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument } = require('pdf-lib');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

app.post('/convert', async (req, res) => {
  try {
    // /tmp temizliği burada
    const tempFolder = '/tmp';
    fs.readdir(tempFolder, (err, files) => {
      if (err) {
        console.error('Failed to read /tmp:', err);
        return;
      }
      for (const file of files) {
        fs.unlink(path.join(tempFolder, file), (err) => {
          if (err) console.error('Failed to delete:', file, err);
        });
      }
    });

    const base64 = req.body.pdf_base64;
    if (!base64) {
      return res.status(400).json({ error: 'No base64 provided' });
    }

    const buffer = Buffer.from(base64, 'base64');
    const tempName = uuidv4();
    const tempPdfPath = path.join('/tmp', `${tempName}.pdf`);
    fs.writeFileSync(tempPdfPath, buffer);

    // Doğru sayfa sayısını hesapla
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

    for (let i = 1; i <= pageCount; i++) {
      try {
        const output = await convert(i);

        // Dosya gerçekten oluşmuş mu?
        if (fs.existsSync(output.path)) {
          const imgBuffer = fs.readFileSync(output.path);
          const base64Image = imgBuffer.toString('base64');
          result.push({
            page: i,
            image_base64: `data:image/png;base64,${base64Image}`,
          });
          fs.unlinkSync(output.path);
        } else {
          result.push({
            page: i,
            error: `Page ${i} could not be converted. File not found.`,
          });
        }
      } catch (innerErr) {
        result.push({
          page: i,
          error: `Error converting page ${i}: ${innerErr.message}`,
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`PDF Image API running on port ${port}`));
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});
