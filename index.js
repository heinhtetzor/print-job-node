import fetch from 'node-fetch';
import 'dotenv/config';

import escpos from 'escpos';
import Network from 'escpos-network';

import { createCanvas } from 'canvas';
import * as fs from "fs";
import Image from 'escpos';

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

const sendToPrinter = (dataToPrint) => {
    const device = new Network(printer1Address, 9100);
    const options = { encoding: "GB18030" /* default */ }
    const printer = new escpos.Printer(device, options);


    const width = 400;
    const height = 250;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    
    context.fillStyle = "#000";
    context.fillText("နေကောင်းလား", 10, 10);

    const buffer = canvas.toBuffer("image/jpeg");
    const imgPath = `./store-1-order-111.png`;
    fs.writeFileSync(imgPath, buffer);

    device.open(function(error){
        if (error) {
            return console.error(error);
        } 

        Image.load(imgPath, image => {
            console.log("printing the image...");
            printer
            .align('ct')
            .image(image)
        });

        

    //     printer
    //     .font('a')
    //     .align('ct')
    //     .style('bu')
    //     .size(1, 1)
    //     .text('The quick brown fox jumps over the lazy dog')
    //     .text('နေကောင်းလား')
    //     .barcode('1234567', 'EAN8')
    //     .table(["One", "Two", "Three"])
    //     .tableCustom(
    //       [
    //         { text:"Left", align:"LEFT", width:0.33, style: 'B' },
    //         { text:"Center", align:"CENTER", width:0.33},
    //         { text:"Right", align:"RIGHT", width:0.33 }
    //       ],
    //       { encoding: 'cp857', size: [1, 1] } // Optional
    //     )
    //     .qrimage('https://github.com/song940/node-escpos', function(err){
    //       this.cut();
    //       this.close();
    //     });
    });
}


await callApi();
