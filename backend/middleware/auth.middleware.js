import jwt from "jsonwebtoken"
import User from "../models/user.model.js";


export const protectRoute = async (req, res, next) => {
    try{
        const accessToken = req.cookies.accessToken;
        if(!accessToken){
            return res.json({error: "unauthorized - No access token provided"})
        }
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select("-password")
        if(!user){
            return res.status(404).json({error: "user not found"})
        }
        req.user = user;
        next();   
        } catch (error) {
            if (error.name === "TokenExpiredError"){
                return res.status(401).json({ error: "unauthoprized - Access token expired"})
            }
        }
    }
    catch(error){
        res.status(500).json({error: `error from protectroute ${error.message}`})
    }
}


export const adminRoute = async (req, res, next) => {

    if (req.user && req.user.role === "admin"){
        next()
    }
    else{
        return res.status(403).json({ error: "access denied - Admin only"})
    }
}
export default protectRoute;