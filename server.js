const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
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
    const tempPdfPath = path.join('/tmp', `${tempName}.pdf`);
    fs.writeFileSync(tempPdfPath, buffer);

    const options = {
      density: 150,
      saveFilename: `${tempName}`,
      savePath: '/tmp',
      format: 'png',
      width: 1280,
      height: 720,
    };

    const convert = fromPath(tempPdfPath, options);
    const totalPages = parseInt(req.body.page_count || '10'); // Manuel page count da alabilirsin

    const result = [];

    for (let i = 1; i <= totalPages; i++) {
      const output = await convert(i);
      const imgBuffer = fs.readFileSync(output.path);
      const base64Image = imgBuffer.toString('base64');
      result.push({
        page: i,
        image_base64: `data:image/png;base64,${base64Image}`,
      });
      fs.unlinkSync(output.path);
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
