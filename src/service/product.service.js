import Models from '../database/sequelize';
import formatCurrency from '../helpers/formatCurrency';
import createSlug from '../helpers/createSlug';
const productModel = Models.product;
const categoryModel = Models.category;
const brandModel = Models.brand;
const productCategoryModel = Models.product_category;
const productImagesModel = Models.product_images;
const productItemModel = Models.product_items;

class productService {
   async getAll() {
      try {
         let products = productModel.findAll();
         return products;
      } catch (err) {
         console.log('🚀 ~ file: product.service.js ~ method getAll ~ productService ~ error', error);
         return null;
      }
   }
   async getAllJoin() {
      let products = productModel.findAll({
         include: [
            { model: brandModel, as: 'BRAND' },
            {
               model: productCategoryModel,
               as: 'product_categories',
               include: [{ model: categoryModel, as: 'CATEGORY' }],
            },
         ],
      });
      let brands = brandModel.findAll();
      let product_category = productCategoryModel.findAll();
      return products;
   }
   async save(data) {
      try {
         let product = await productModel.create({
            name: data.name,
            isSelling: data.isSelling,
            sellStartDate: data.date,
            price: data.price,
            suitableFor: data.sex,
            specifications: data.detail,
            description: data.des,
            BRAND_ID: data.brand,
            slug: createSlug(data.name),
         });
         return product;
      } catch (err) {
         console.log('🚀 ~ file: product.service.js ~ method save ~ productService ~ error', err);
         return null;
      }
   }
   async getOneJoin(id){
    let product = productModel.findOne(
    { include:[{model: brandModel, as :'BRAND' },
     {model: product_categoryModel,as:'product_categories',include:[{model: categoryModel, as:'CATEGORY'}]
      }],
      where: {ID:id}
    });
     return product;
   }
   async getActiveProduct({ offset = 0, limit = 5 }) {
      const filterPropertis = { isSelling: true };
      try {
         const { count, rows } = await productModel.findAndCountAll({
            attributes: {
               exclude: ['BRAND_ID', 'sellStartDate', 'specifications', 'descriptions'],
            },
            distinct: true,
            include: [
               {
                  model: brandModel,
                  as: 'BRAND',
               },
               {
                  model: productImagesModel,
                  as: 'product_images',
               },
            ],
            where: filterPropertis,
            order: ['ID'],
            limit: limit,
            offset: offset,
         });
         const products = rows.map((product) => ({
            ...product.dataValues,
            BRAND: product.dataValues.BRAND.brandName,
            product_images: product.dataValues.product_images[0]?.imageURL,
            price: formatCurrency(product.dataValues.price * 1000),
         }));
         return { total: count, products };
      } catch (error) {
         console.log('🚀 ~ file: product.service.js ~ line 63 ~ productService ~ error', error);
         return null;
      }
   }
   async getDetailProductBySlug(slug) {
      try {
         const productResult = await productModel.findOne({
            attributes: {
               exclude: ['BRAND_ID', 'sellStartDate'],
            },
            include: [
               {
                  model: brandModel,
                  as: 'BRAND',
               },
               {
                  model: productImagesModel,
                  as: 'product_images',
               },
               {
                  model: productItemModel,
                  as: 'product_items',
                  attributes: ['inventory', 'size'],
               },
            ],
            where: { slug: slug },
         });
         if (productResult) {
            const formatedProduct = {
               ...productResult.dataValues,
               BRAND: productResult.dataValues.BRAND.dataValues.brandName,
               product_images: productResult.dataValues.product_images.map((img) => {
                  return img.imageURL;
               }),
               price: formatCurrency(productResult.dataValues.price * 1000),
               product_items: productResult.dataValues.product_items.map((product) => {
                  return product.dataValues;
               }),
            };
            return formatedProduct;
         } else {
            return null;
         }
      } catch (error) {
         console.log('🚀 ~ file: product.service.js ~ line 109 ~ productService ~ error', error);
         return false;
      }
   }

}

module.exports = new productService();
