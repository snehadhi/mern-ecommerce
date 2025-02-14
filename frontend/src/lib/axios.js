import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "https://ecommerce-backend-0qog.onrender.com" : "/api",
	withCredentials: true, 
});

export default axiosInstance;
