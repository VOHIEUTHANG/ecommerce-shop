import ProductService from '../service/product.service';
import CategoryService from '../service/category.service';

import { createResponse } from '../helpers/responseCreator';
import convertFromStringToNumber from '../helpers/convertCurrencyFromStringToNmber';
import formatToCurrency from '../helpers/formatCurrency';
import getPrivatePageHandler from '../helpers/getPrivatePageHandler';
import userService from '../service/user.service';

const mainController = () => ({
   getHomePage: async (req, res) => {
      const user = req.user;
      const payloadInfo = req.payload;
      const payload = { user: {}, isLoggedIn: false, ...payloadInfo };
      if (user) {
         payload.user = user;
         payload.isLoggedIn = true;
      }
      const products = await ProductService.getActiveProduct({ offset: 0, limit: 10 });
      console.log('products ===> ', products);
      const latestProducts = await ProductService.getLatestProduct();
      if (products) {
         payload.productsData = products;
         payload.latestProducts = latestProducts;
      }
      res.render('pages/home', { ...payload });
   },
   getLoginPage: (req, res) => {
      const user = req.user;
      const payloadInfo = req.payload;
      if (user) {
         res.redirect('/');
      } else {
         res.render('pages/login', { user: {}, isLoggedIn: false, ...payloadInfo });
      }
   },
   getRegisterPage: (req, res) => {
      const user = req.user;
      const payloadInfo = req.payload;
      if (user) {
         res.redirect('/');
      } else {
         res.render('pages/register', { user: {}, isLoggedIn: false, ...payloadInfo });
      }
   },
   getWishListPage: async (req, res) => {
      const user = req.user;
      const payloadInfo = req.payload;
      const payload = { user: {}, isLoggedIn: false, ...payloadInfo };
      if (!user) return res.redirect('/');
      payload.user = user;
      payload.isLoggedIn = true;
      const username = user?.userName;
      try {
         const wishList = await userService.getAllProductsWishList(username);
         payload.wishlist = wishList;
      } catch (error) {
         res.json(createResponse('error', 'Query wishlist xảy ra lỗi !'));
      }

      res.render('pages/user-pages/wishlist', payload);
   },
   getCartPage: async (req, res) => {
      const user = req.user;
      const payloadInfo = req.payload;
      const payload = { user: {}, isLoggedIn: false, ...payloadInfo };
      if (user) {
         payload.user = user;
         payload.isLoggedIn = true;
      }
      let cartList = payloadInfo.cartList;
      console.log('cartList', cartList);

      const cartListFormated = cartList?.map((cart) => {
         let quantity = cart.quantity;
         let price = cart.PRODUCT_ITEM.PRODUCT.price;
         let discountPrice = cart.PRODUCT_ITEM.PRODUCT?.discounts?.discountPrice || null;
         if (cart.PRODUCT_ITEM.PRODUCT.discounts !== null) {
            price = cart.PRODUCT_ITEM.PRODUCT.discounts.priceAfterApplyDiscount;
         }
         price = convertFromStringToNumber(price);

         let thisDiscountPrice;
         if (discountPrice) {
            discountPrice = convertFromStringToNumber(discountPrice);
            thisDiscountPrice = Number(quantity) * discountPrice;
            thisDiscountPrice = formatToCurrency(thisDiscountPrice);
         }

         let thisPrice = Number(quantity) * price;
         thisPrice = formatToCurrency(thisPrice);

         return {
            ...cart,
            PRODUCT_ITEM: {
               ...cart.PRODUCT_ITEM,
               thisPrice,
               thisDiscountPrice: thisDiscountPrice ?? null,
            },
         };
      });
      cartListFormated.totalPrice = cartList.totalPrice;
      cartListFormated.originPrice = cartList.originPrice;
      cartListFormated.discountPrice = cartList.discountPrice;

      payload.cartList = cartListFormated;
      res.render('pages/user-pages/cart', payload);
   },
   get404Page: (req, res) => {
      res.render('pages/404');
   },
   get403Page: (req, res) => {
      res.render('pages/403');
   },
   get401Page: (req, res) => {
      res.render('pages/401');
   },
   getAllProductPage: async (req, res) => {
      const user = req.user;
      const {
         page = 1,
         sort,
         search,
         discount,
         priceFrom = 0,
         priceTo = 1000,
         cateID,
         size,
         brandID,
         categoryID,
      } = req.query;
      const priceRange = { priceFrom, priceTo };
      const offset = (page - 1) * 9;
      const payloadInfo = req.payload;
      const payload = { user: {}, isLoggedIn: false, ...payloadInfo };
      const categoriesData = await CategoryService.getAllCategoryAndCountProductsBelongTo();
      const totalActiveProductsCount = await ProductService.getTotalOfProductCount();
      const productList = await ProductService.getActiveProduct({
         offset,
         limit: 9,
         sort,
         search,
         priceRange,
         cateID,
         size,
         discount,
         brandID,
         categoryID,
      });
      payload.categoriesData = categoriesData;
      if (productList) {
         payload.productList = productList;
         payload.totalActiveProductsCount = totalActiveProductsCount;
      } else {
         res.json(createResponse('error', 'Get ProductList occured error !'));
      }
      if (user) {
         payload.user = user;
         payload.isLoggedIn = true;
      }
      res.render('pages/all-product', payload);
   },
   getProductDetailsPage: async (req, res) => {
      const { slug } = req.params;
      const targetProduct = await ProductService.getDetailProductBySlug(slug);
      const relatedProducts = await ProductService.getRelatedProductBySlug(slug);
      if (!targetProduct) {
         return res.json(createResponse('error', 'Get target product occured error !'));
      }
      const user = req.user;
      const payloadInfo = req.payload;
      const payload = { user: {}, isLoggedIn: false, ...payloadInfo };

      const comments = await ProductService.getAllProductCommentsByID(targetProduct.ID, user?.userName);
      console.log('comments ===> ', comments);
      if (user) {
         payload.user = user;
         payload.isLoggedIn = true;
      }
      payload.productDetail = targetProduct;
      payload.relatedProducts = relatedProducts;
      payload.comments = comments;
      res.render('pages/product-detail', payload);
   },
   getProfilePage: async (req, res) => {
      const user = req.user;
      if (!user) return res.redirect('/login');
      const userInfo = await userService.getUserInfo(user.userName);
      user.avatar = userInfo.avatar;
      const payloadInfo = req.payload;
      const payload = { user, isLoggedIn: true, userInfo, ...payloadInfo };
      res.render('pages/user-pages/profile', payload);
   },
   getChangePasswordPage: async (req, res) => {
      const payload = getPrivatePageHandler(req, res);
      res.render('pages/user-pages/change-password', payload);
   },
   gePurchaseOrderPage: async (req, res) => {
      const payload = getPrivatePageHandler(req, res);
      res.render('pages/user-pages/purchase-order', payload);
   },
   getDeliveryAddressPage: async (req, res) => {
      const payload = getPrivatePageHandler(req, res);
      const username = req.user?.userName;
      const addressList = await userService.getAllDeliveryAddressByUsername(username);
      console.log('🚀 ~ file: main.controller.js ~ line 207 ~ addressList', addressList);
      payload.addressList = addressList;
      res.render('pages/user-pages/delivery-address', payload);
   },
});

export default mainController();
