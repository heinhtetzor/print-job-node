import fetch from 'node-fetch';
import 'dotenv/config';

import escpos from 'escpos';
import Network from 'escpos-network';

const apiHost = process.env.API_HOST;
const storeId = process.env.STORE_ID;
const printer1Address = process.env.PRINTER_1_ADDRESS;


const callApi = async () => {
    const resp = await fetch (apiHost+'/print-jobs/process?store_id='+storeId);
    const data = await resp.json();
    
    console.log(data);
    sendToPrinter(data);
}

const sendToPrinter = (dataToPrint) => {
    const device = new Network(printer1Address, 9100);
    const options = { encoding: "GB18030" /* default */ }
    const printer = new escpos.Printer(device, options);

    console.log(device)
    device.open(function(error){
        if (error) {
            return console.error(error);
        } 
        printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('The quick brown fox jumps over the lazy dog')
        .text('နေကောင်းလား')
        .barcode('1234567', 'EAN8')
        .table(["One", "Two", "Three"])
        .tableCustom(
          [
            { text:"Left", align:"LEFT", width:0.33, style: 'B' },
            { text:"Center", align:"CENTER", width:0.33},
            { text:"Right", align:"RIGHT", width:0.33 }
          ],
          { encoding: 'cp857', size: [1, 1] } // Optional
        )
        .qrimage('https://github.com/song940/node-escpos', function(err){
          this.cut();
          this.close();
        });
      });
}


await callApi();
