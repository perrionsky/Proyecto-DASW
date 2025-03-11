"use strict";

const express = require('express');
const router = express.Router();
const dataHandler = require('./../controllers/data_handler');

function verifyContentType(req, res, next) {
    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
        next();
    } else {
        res.status(400).send('Content-Type must be application/json');
    }
}

router.route('/')
    .get((req, res) => {
        let query = req.query.filter;

        let products;
        if (query === undefined) {
            // regresamos la lista
            try {
                products = dataHandler.getProducts();
            } catch (e) {
                res.status(400).send("error");
            }

            res.status(200).json(products);
        } else {

        }
    });

router.route('/cart')
    .post(verifyContentType, (req, res) => {
        let proxies = req.body;
        let products = [];

        if (!Array.isArray(proxies)) {
            res.status(400).send("Productos del carrito no cumplen el formato");
        }
        try {
            for (let proxy of proxies) {
                let product = dataHandler.getProductsById(proxy.uuid);
                console.log(product);
                if (product !== undefined) { // product does not exist in website
                    // console.log("ENTERING...");
                    products.push(product);
                }
            }
    
            res.json(products);
        } catch (e) {
            res.status(400).send("Something went wrong with your request");
        }
    });

router.route('/:id')
    .get((req, res) => {
        let uuid = req.params.id;
        let product = dataHandler.getProductsById(uuid);
        if (product != undefined) {
            res.status(200).json(product);
        } else { 
            // mensaje de error, no se encontro
            res.status(404).send("Producto no se encontro");
        }
    });


module.exports = router;