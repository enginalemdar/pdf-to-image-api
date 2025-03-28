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
    const pdfDoc = await
