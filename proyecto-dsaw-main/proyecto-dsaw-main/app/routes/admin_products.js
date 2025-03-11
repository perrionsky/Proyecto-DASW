'use strict';

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
    .post(verifyContentType, (req, res) => {
        let product = req.body;
        const requiredProperties = ['uuid', 'imageUrl', 'title', 'description', 'unit', 'category', 'pricePerUnit', 'stock'];
    
        // Check if all required properties exist in the product object
        for (const property of requiredProperties) {
            if (!product.hasOwnProperty(property)) {
                return res.status(400).send(`Missing property: ${property}`);
            }
        }

        // properties check done

        try {
            dataHandler.createProduct(product);
        } catch (e) {
            res.status(400).send("Problem creating the product");
        }
        res.status(201).send("Product admin was created");
    });

router.route('/:id')
    .put(verifyContentType, (req, res) => {
        let id = req.params.id;
        let product = req.body;

        console.log(id);
        console.log(product);

        const requiredProperties = ['imageUrl', 'title', 'description', 'unit', 'category', 'pricePerUnit', 'stock'];
    
        // Check if all required properties exist in the product object
        for (const property of requiredProperties) {
            if (!product.hasOwnProperty(property)) {
                return res.status(400).send(`Missing property: ${property}`);
            }
        }

        try {
            let isUpdated = dataHandler.updateProduct(id, product);
            if (!isUpdated) { // its beacuse the product is not existing
                res.status(404).send("Product does not exist!");
            }
        } catch (e) {
            console.log(e);
            res.status(400).send("Problem updating the product");
        }

        res.status(200).send("Product was updated");
    })
    .delete((req, res) => {
        let id = req.params.id;
        try {
            let resDelete = dataHandler.deleteProduct(id);
            if (!resDelete) {
                res.status(404).send("Product does not exist! could not delete it");
            }
        } catch (e) {
            res.status(400).send("Problem deleting the product");
        }
        res.status(200).send("Product was deleted");
    });

module.exports = router;