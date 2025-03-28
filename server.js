const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { fromPath } = require('pdf2pic');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

app.post('/convert', async (req, res) => {
  try {
    const base64 = req.body.pdf_base64;
    if (!base64) {
      return res.status(400).json({ error: 'No base64 provided' });
    }

    const buffer = Buffer.from(base64, 'base64');
    const tempName = uuidv4();
    const pdfPath = path.join('/tmp', `${tempName}.pdf`);
    fs.writeFileSync(pdfPath, buffer);

    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    const converter = fromPath(pdfPath, {
      density: 200,
      saveFilename: `${tempName}`,
      savePath: "/tmp",
      format: "png",
      width: 1280,
      height: 720
    });

    const images = [];

    for (let i = 1; i <= pageCount; i++) {
      const output = await converter(i);
      const imgBuffer = fs.readFileSync(output.path);
      const base64Image = imgBuffer.toString('base64');

      images.push({
        page: i,
        image_base64: `data:image/png;base64,${base64Image}`
      });

      fs.unlinkSync(output.path);
    }

    fs.unlinkSync(pdfPath);

    res.json(images);
  } catch (err) {
    console.error('Conversion failed:', err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ PDF Image API running on port ${port}`));
