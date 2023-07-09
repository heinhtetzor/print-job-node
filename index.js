import fetch from 'node-fetch';
import 'dotenv/config';

import escpos from 'escpos';
import Network from 'escpos-network';

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const apiHost = process.env.API_HOST;
const storeId = process.env.STORE_ID;
const printer1Address = process.env.PRINTER_1_ADDRESS;


const initPrinter = () => {
    const device = new Network(printer1Address, 9100);
    const options = { encoding: "GB18030" /* default */ }
    const printer = new escpos.Printer(device, options);

    return {
        device,
        printer
    }
}

const generateTargetImage = (storeId, orderMenuId) => {
    const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const imgPath = path.join(__dirname, `/temp/store-${storeId}-order-${orderMenuId}.png`);
    return imgPath;
}

const generateSvgForExpressSlip = (width, height, datetime, qty, menuName, waiter) => {
    return `<svg width="${width}" height="${height}">
        <style>
        .datetime, .waiter {
            font-size: 22px;
        }
        .menu, .qty {
            font-size: 30px;
        }
        </style>
        <text class="datetime" x="5%" y="15%">${datetime}</text>
        <text class="qty" x="5%" y="50%">${qty} x</text>
        <text class="menu" x="20%" y="50%">${menuName}</text>
        <text class="waiter" x="5%" y="80%">${waiter}</text>
    </svg>`;
}

const writeOnTargetImage = (svgText, imgPath) => {
    const svgBuffer = Buffer.from(svgText);

    const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
    const bgPath = path.join(__dirname, '/default-white.png');

    sharp(bgPath)
    .composite([{input: svgBuffer}])
    .toFile(imgPath);
}

const sendToPrinter = (imgPath, device, printer) => {
    escpos.Image.load(imgPath, image => {
		console.log("Loading the image...");
		
		device.open(() => {
			console.log("Printing the image...")
			printer
			.image(image)
			.then(() => {
				printer.cut().close();
			})
		});
	});
}

const cleanUpDir = () => {
    console.debug("Clearing the temp folder..");
}


const callApi = async () => {
    let data;
    try {
        const resp = await fetch (apiHost + '/print-jobs/process', 
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({store_id: storeId})
        });
        const respJson = await resp.json();
        data = respJson.data;
    }
    catch (err) {
        console.error(err);
    }
    
    for (const dataToPrint of data) {
        console.debug(`Printing for order_menu_id - ${dataToPrint["order_menu_id"]}`);
        processExpressSlip(dataToPrint);
    }
}

const processExpressSlip = async (dataToPrint) => {
    
    const { device, printer } = initPrinter();

    const image_path = generateTargetImage(dataToPrint["store_id"], dataToPrint["order_menu_id"]);
    const svg = generateSvgForExpressSlip(
        570, 
        200, 
        dataToPrint["datetime"],
        dataToPrint["qty"],
        dataToPrint["menu_name"],
        dataToPrint["waiter"]);

    writeOnTargetImage(svg, image_path);
    sendToPrinter(image_path, device, printer);
}


setInterval (async () => {
    await callApi();
}, process.env.REFRESH_INTERVAL_SEC * 1000);
