"use strict";

const Product = require("./products")
class ShoppingCart {
    constructor() {
        this._products = [];
        this._productsProxies = [];
    }

    get products() {
        return this._products;
    }

    set products(value) {
        this._products = [];
        
        let res = undefined;

        if (Array.isArray(value)) {
            for (let elem of value) {
                this._products.push(elem);
            }
        } else {
            this._products.push(Product.createFromJson(value));
        }
    }

    get productsProxies() {
        return this._productsProxies;
    }

    set productsProxies(value) {
        throw new ShoppingCartException("ShoppingCart not able to modify proxies directly");
    }

    addItem(productUUID, amount) {
        if (amount === 0) return;
        if (amount < 0) {
            throw new ShoppingCartException("Cannot have negative values");
        }

        for (let elem of this._productsProxies) {
            if (elem.uuid === productUUID) {
                // item already seen
                this._productsProxies.amount += amount;
                return;
            } 
        }

        this._productsProxies.push({
            uuid: productUUID, amount
        });
    }

    updateItem(productUUID, amount) {
        if (amount === 0) return;
        if (amount < 0) {
            throw new ShoppingCartException("Cannot have negative values");
        }

        for (let i = 0; i < this._productsProxies.length; i++) {
            let elem = this._productsProxies[i];
            if (elem.uuid === productUUID) {
                // item already seen
                this._productsProxies[i].amount = amount;
                return;
            } 
        }

        throw new ProductException("Product not found in product proxies")
    }

    removeItem(productUUID) {
        for (let i = 0; i < this._productsProxies.length; i++) {
            if (this._productsProxies[i].uuid ===  productUUID) {
                this._productsProxies.splice(i, 1);
                return;
            }
        }

        throw new ProductException("Product not found in product proxies")
    }

    calculateTotal() {
        let total = 0;
        for (let _obj of this._productsProxies) {
            let productUUID = _obj.uuid;
            for (let product of  this._products) {
                if (product.uuid === productUUID) {
                    // is the same product
                    total += _obj.amount * product.pricePerUnit;
                    break;
                }
            }
        }

        return total;
    }
}


class ProductProxy {
    constructor(productUUID, amount) {
        this.productUUID = productUUID;
        this.amount = amount;
    }
}


class ShoppingCartException {
    constructor(errorMessage) {
        this.errorMessage = errorMessage;
    }
}


module.exports = ShoppingCart;