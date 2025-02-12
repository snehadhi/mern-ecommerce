import cloudinary from "../lib/cloudinary.js"
import { redis } from "../lib/redis.js"
import Product from "../models/product.model.js"


export const getAllProducts = async (req, res) => {
    try{
        const products = await Product.find({})
        res.json({products})

    }
    catch(error){
        res.status(500).json({error: `error from getallproducts ${error.message}`})

    }

}
export const getFeaturedProducts = async (req, res) => {
    try{
        let featuredProducts = await redis.get("featured_products")
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts))
        }
        featuredProducts = await Product.find({isFeatured: true}).lean();
        if(!featuredProducts){
            return res.json({ error: "no featured product found"});
        }
        await redis.set("featured_products", JSON.stringify(featuredProducts))
        res.json(featuredProducts)
    }
    catch(error){
        return res.status(500).json({error: `error from getfeaturedproducts ${error.message}`})
    }
}
export const createProduct = async (req, res) => {
    try {
        const {name, description, price, image, category} = req.body;
        let cloudinaryResponse = null
        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image,{folder: "products"})
        }
        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category,
        })
        res.status(201).json(product)
     
    } catch (error) {
        res.json({error: `error from createproduct ${error.message}`})
        
    }
    

}
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if(!product) {
            return res.status(404).json({error: "product not found"})
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`)
                console.log("deleted from cloudinary")
              
            } catch (error) {
                console.log("error from deleting image from cloudinary", error.message)        
            }
        }
        await Product.findByIdAndDelete(req.params.id)
        res.json({ message: "product deleted successfully" })
        
    } catch (error) {
        res.status(500).json({error: `error from deleteProduct ${error.message}`})

        
    }
}
export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: {size:3}
            },
            {
                $project:{
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        ])
        res.json(products)
        
    } catch (error) {
        res.json({error: `error from getRecommendedProducts ${error.message}`})
        
    }
    
}
export const getProductsByCategory = async (req,res) => {
    const {category} = req.params;
    try {
        const products = await Product.find({category})
        res.json({products})
        
        } catch (error) {
            res.json({error: `error from getProductsByCategory ${error.message}`})     
    }
}
export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updateProduct = await product.save();
            await updateFeaturedProductsCache();
            res.json(updateProduct)
        }
        else{
            res.status(404).json({message: "no product found"})

        }
        
    } catch (error) {
        res.status(500).json({error: `error from toggleFeaturedProduct ${error.message}`})
        
    }
}
async function updateFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({ isFeatured: true}).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts))
  
    } catch (error) {
        res.status(500).json({error: `error from updateFeaturedProductsCache ${error.message} `})
    }
    
}
export default updateFeaturedProductsCache;