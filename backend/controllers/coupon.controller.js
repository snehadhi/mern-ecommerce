import Coupon from '../models/coupon.model.js'
export const getCoupon = async (req, res) =>{
    try {
        const coupon = await Coupon.findOne({userId:req.user._id, isActive: true})
        res.json(coupon || null)     
    } catch (error) {
        res.json({error: `error from getCoupon ${error.message}`})
       
    }
}
export const validateCoupon = async (req, res) => {
    try {
        const {code} = req.body;
        const coupon = await Coupon.findOne({code:code, userId:req.user._id, isActive:true});
        if(!coupon){
            return res.json({error: "coupon not found"})
        }
        if(coupon.expirationDate < new Date()){
            coupon.isActive = false;
            await coupon.save();
            return res.status(404).json({error: "coupon expired"})
        }
        res.json({
            message: "coupon is valid",
            code: coupon.code,
            discountPercentage: coupon.discountPercentage
        })
    } catch (error) {
         res.json({error: `error from validateCoupon ${error.message}`})
    }
}