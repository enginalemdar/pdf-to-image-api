const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

app.post('/convert', async (req, res) => {
  try {
    const base64 = req.body.pdf_base64;
    if (!base64) return res.status(400).json({ error: 'No base64 provided' });

    const pdfBuffer = Buffer.from(base64, 'base64');
    const pdfPath = path.join('/tmp', `file-${Date.now()}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    const convert = fromPath(pdfPath, {
      density: 150,
      savePath: '/tmp',
      format: 'png',
      width: 800,
      height: 600
    });

    const totalPages = 10; // istersen dinamik yaparız
    const results = [];

    for (let i = 1; i <= totalPages; i++) {
      const result = await convert(i);
      const imageBuffer = fs.readFileSync(result.path);
      const imageBase64 = imageBuffer.toString('base64');
      results.push({
        page: i,
        image_base64: `data:image/png;base64,${imageBase64}`
      });
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`PDF API listening on ${port}`));
