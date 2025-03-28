const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { convert } = require('pdf-to-png-converter');

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

    const outputImages = await convert(pdfPath, {
      outputFolder: '/tmp',
      outputFileMask: `${tempName}-page`,
      pagesToProcess: [], // boşsa tüm sayfaları işler
    });

    const images = outputImages.map((img, index) => ({
      page: index + 1,
      image_base64: `data:image/png;base64,${img.content.toString('base64')}`
    }));

    fs.unlinkSync(pdfPath);

    res.json(images);
  } catch (err) {
    console.error('Conversion failed:', err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`PDF Image API running on port ${port}`));
