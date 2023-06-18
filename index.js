import fetch from 'node-fetch';
import 'dotenv/config';

import escpos from 'escpos';
import Network from 'escpos-network';

import * as fs from "fs";
import Image from 'escpos';

import sharp from 'sharp';

const apiHost = process.env.API_HOST;
const storeId = process.env.STORE_ID;
const printer1Address = process.env.PRINTER_1_ADDRESS;


const callApi = async () => {
    const resp = await fetch (apiHost+'/print-jobs/process?store_id='+storeId);
    const data = await resp.json();
    
    for (const dataToPrint of data) {
        console.log(dataToPrint["menu_name"])
    }
    sendToPrinter(data);
}

const sendToPrinter = async (dataToPrint) => {
    const device = new Network(printer1Address, 9100);
    const options = { encoding: "GB18030" /* default */ }
    const printer = new escpos.Printer(device, options);

    const imgPath = `./store-1-order-111.png`;
    const bgPath = `./default-white.png`;

    const width = 570;
    const height = 200;

    const svgText = `
    <svg width="${width}" height="${height}">
        <style>
        .datetime, .waiter {
            font-size: 22px;
        }
        .menu, .qty {
            font-size: 30px;
        }
        </style>
        <text class="datetime" x="5%" y="15%">11:32 AM 18-Jun-2023</text>
        <text class="qty" x="5%" y="50%">2 x</text>
        <text class="menu" x="20%" y="50%">ကြက်သားဟင်း</text>
        <text class="waiter" x="5%" y="80%">Ouk Kur Min</text>
    </svg>
    `;

    const svgBuffer = Buffer.from(svgText);

    sharp(bgPath)
    .composite([{input: svgBuffer}])
    .toFile(imgPath);

    device.open(function(error){
        if (error) {
            return console.error(error);
        } 

        Image.load(imgPath, image => {
            console.log("printing the image...");
            printer
            .image(image)
        });
    });
}


await callApi();
