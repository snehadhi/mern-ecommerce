import express from "express";
import updateFeaturedProductsCache, { createProduct, deleteProduct, getAllProducts, getFeaturedProducts, getProductsByCategory, getRecommendedProducts, toggleFeaturedProduct } from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",protectRoute, adminRoute, getAllProducts )
router.patch("/", updateFeaturedProductsCache)
router.get("/featured", getFeaturedProducts)
router.get("/category/:category", getProductsByCategory)
router.get("/recommendations", getRecommendedProducts)
router.post("/",protectRoute, adminRoute, createProduct)
router.delete("/:id", protectRoute, adminRoute, deleteProduct)
router.patch("/:id", protectRoute,adminRoute, toggleFeaturedProduct)

export default router;