import express from "express";
import { upload } from "../auth/image.js"; // Default import

import {
  addFavoriteProduct,
  addProduct,
  showProduct,
  updateProduct,
  getFavoriteProducts,
  showUserAddProduct,
  searchProduct,
  getAllProducts,
  getProductById,
  addOtherProduct,
  getProductByCategory,
  getProductsByUser,
  deleteProduct,
  deleteProductImage,
  toggleProductVisibility,
  getProductType,
  getSubProductType,
  filterProduct,
  getProductTypesWithSubCategories,
  trackProductView,
} from "../controller/product.js";
import { authenticate } from "../auth/middle.js";
// In routes or other files
//import { protect, admin } from '../auth/productAuth.js';

const router = express.Router();

router.get("/get", authenticate,searchProduct);
router.get("/showProduct", authenticate, showProduct);
router.get("/getProduct", authenticate,showUserAddProduct);
router.put("/update", authenticate, updateProduct);
router.post("/favorites", authenticate, addFavoriteProduct);
router.get(
  "/getFavoriteProduct/:userId",
  authenticate,
  getFavoriteProducts
);
router.post("/add-other-product", authenticate, addOtherProduct);

router.post("/add", authenticate, addProduct);

router.get("/get-product", authenticate, getAllProducts);
router.get("/get-product-by-id", authenticate, getProductById);
router.get("/get-product-by-category", authenticate, getProductByCategory);
router.get("/get-product-by-userId", authenticate, getProductsByUser);

router.delete(
  "/softDelete/:productId/:productType",
  authenticate,
  deleteProduct
);
router.delete("/delete-product-image", authenticate, deleteProductImage);
router.post(
  "/product-active-inactive",
  authenticate,
  toggleProductVisibility
);
router.get("/get-product-type", authenticate, getProductType);
router.get(
  "/get-product-sub-type-by-id/:productSubTypeId",
  authenticate,
  getSubProductType
);
router.get(
  "/get-get-product-types-with-sub-categories",
  authenticate,
  getProductTypesWithSubCategories
);


router.post("/track-product-view", authenticate, trackProductView);
router.get("/filter", authenticate, filterProduct);
router.get("/get-optimize-products", authenticate, getAllProducts);

export default router;

