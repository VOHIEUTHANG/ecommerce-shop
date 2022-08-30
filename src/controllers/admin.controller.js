const express = require('express');
const productService = require('../service/product.service');
import categoryService from '../service/category.service';
import brandService from '../service/brand.service';
import formatToCurrency from '../helpers/formatCurrency';
var limit = 8;
class adminController {
   async formProduct(req, res) {
      let offset =  req.param('page') || 1;
      let user= req.userInfo;
      Promise.all([brandService.getAllBrands(), categoryService.getAllCategory(), productService.getAllJoin(Number(limit),Number((limit-1)*offset)), productService.countProduct()])
         .then((data) => {
            let brandList = data[0];
            let categoryList = data[1];
            let productList = data[2];
            productList.forEach(element => {
               element.price=formatToCurrency(element.price * 1000);
            });
           res.render('pages/admin-pages/Manage-product', { user,brandList, categoryList, productList });
         })
         .catch((err) => {
            console.log('🚀 ~ file: admin.controller.js ~ method formProduct ~ adminController ~ error', err);
         });
   }
   async homePage(req, res) {
      let user= req.userInfo;  
      res.render('pages/admin-pages/admin-home-page',{user});
   }
}
module.exports = new adminController();
