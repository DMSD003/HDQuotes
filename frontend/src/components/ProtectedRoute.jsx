import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children}) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = '/login';
        return <Navigate to="/login" replace />
    }

    return children;
}

export default ProtectedRoute;