import { redis } from "../lib/redis.js"
import User from "../models/user.model.js"
import  jwt from "jsonwebtoken";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken }; 
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, { maxAge: 15 * 60 * 1000, httpOnly: true });
    res.cookie("refreshToken", refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
};
export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    //console.log("Signup input:", { name, email, password });

    try {
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            //console.log("User already exists for email:", email);
            return res.status(400).json({ error: "User already exists" });
        }

        // Ensure email is stored in lowercase
        const user = await User.create({ name, email: email.toLowerCase(), password });
       // console.log("User created successfully:", user);

        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        return res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "User created successfully",
        });
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ error: `Error from signupcontroller: ${error.message}` });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //console.log("Login attempt:", email, password);

        // Ensure email is in lowercase
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            //console.log("User not found for email:", email);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        console.log("Password match status:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate tokens and set cookies
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        console.log("Login successful for user:", user.email);

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const logout = async (req, res) => {
   try{
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken){
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        await redis.del(`refresh_token:${decoded.userId}`)
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken")
    res.json({message: "logged out successfully"})

 
   }
   catch(error){
    res.json({error: `error from logout ${error.message}`})
   }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ error: "No refresh token provided" });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Fetch the stored token from Redis
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`); // Match the key here

        if (!storedToken || storedToken !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        // Generate a new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        // Set the new access token as a cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        return res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.error("Error during token refresh:", error.message);
        return res.status(500).json({ error: `Error from refreshToken: ${error.message}` });
    }
};
export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

