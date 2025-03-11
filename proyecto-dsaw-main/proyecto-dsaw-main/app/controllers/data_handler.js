

"use strict";

const fs = require('fs');
const Product = require('./products');

// fs.readFile("products.json", 'utf8', (err, data) => {
//     if (err) {
//         console.error("Error in here reading file");
//         return;
//     }

//     const products = JSON.parse(data); // load data
//     console.log(products);
// })

const fileProductsPath = './app/data/products.json';

let content = fs.readFileSync(fileProductsPath);
let products = JSON.parse(content).map(Product.createFromObject);


function getProducts() {
    return products;
}

function getProductsById(productUUID) {
    console.log(products);
    return products.find(product => product.uuid === productUUID || product._uuid === productUUID);
}

function getUUIDByTitle(title) {
    const product = products.find(product => product._title === title);

    if (product) {
        return product.uuid;
    } else {
        return null; // Product with the specified title not found
    }
}

function createProduct(product) {
    products.push(Product.createFromObject(product));
    fs.writeFileSync(fileProductsPath, JSON.stringify(products));
}

function updateProduct(productUUID, updatedProduct) {
    let productFounded = products.find(product => product.uuid === productUUID);
    let productIndex = products.findIndex(product => product.uuid === productUUID);

    if (!productFounded) {
        return false;
    }

    let newUpdatedProduct = updatedProduct;
    if (typeof updatedProduct === "string") {
        newUpdatedProduct = JSON.parse(newUpdatedProduct);
    }

    products.splice(productIndex, 1);

    console.log("NEW UPDATED PRODUCT: " + JSON.stringify(newUpdatedProduct));

    // migrate properties to product
    productFounded.title = newUpdatedProduct?.title ?? productFounded.title;
    productFounded.description = newUpdatedProduct?.description ?? productFounded.description;
    productFounded.imageUrl = newUpdatedProduct?.imageUrl ?? productFounded.imageUrl;
    productFounded.unit = newUpdatedProduct?.unit ?? productFounded.unit;
    productFounded.stock = newUpdatedProduct?.stock ?? productFounded.stock;
    productFounded.pricePerUnit = newUpdatedProduct?.pricePerUnit ?? productFounded.pricePerUnit;
    productFounded.category = newUpdatedProduct?.category ?? productFounded.category;

    products.push(newUpdatedProduct);
    
    // return if everything ok
    return true;
}

function deleteProduct(productUUID) {
    
    for (let i = 0; i < products.length; i++) {
        let elem = products[i];
        if (elem.uuid === productUUID) {
            // delete it
            products.splice(i, 1);
            fs.writeFileSync(fileProductsPath, JSON. stringify(products));
            return true;
        }
    }
    fs.writeFileSync(fileProductsPath, JSON. stringify(products));

    return false;
}


function findProduct(query) {
    // pass
}


exports.getProducts = getProducts;
exports.getProductsById = getProductsById
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.findProduct = findProduct;