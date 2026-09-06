import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {


    // User's connexion data
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Backend notifications 
    const [notification, setNotification] = useState({message: "", type: ""});

    // Notification Triggerer 
    const triggierNotification = (message, type) => {
        setNotification({message, type});
        setTimeout(() => {setNotification({message: "", type:  ""})}, 5000);
    }

    const navigate = useNavigate();

    // Submit function
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Sending data to the login service
        console.log("email:", email);
        console.log("password:", password);
        try{
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json",},
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
            });

            console.log(response.status);

            const data = await response.json();

            const {message, user, token} = data;
            console.log(token);
            localStorage.setItem("accessToken", token);
            // If some thing wrong occured
            if (!response.ok) {
                if (message === "invalid credentials") {
                    triggierNotification("L'adresse email ou le mot de passe est incorrect.", 'error');
                } else if (message === "email and password are empty") {
                    triggierNotification("L'adresse email ou le mot de passe est vide.", 'error');
                } else {
                    triggierNotification("Une erreur est survenue lors de la connexion.", 'error');
                }
                return;
            }

            // If every thing's good
            if (response.status === 200 && message === "User found successfully") {
                triggierNotification("Utilisateur trouvé avec succes! Redirection...", 'succes');
            }
            // Navigate to the base of the app
            navigate("/hdquote");
        } catch(error) {
            console.error("Backend Login error:", error);
        }
    }

    // The forgot password function
        const handleForgotPass = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/auth/forgotpassword", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({email: email}),
                });

                const data = await response.json();
                console.log(data);
                // Obtaining the token and the message from the backend
                const {token, message} = data;

                // If every thing is good
                if (response.status === 200 && message === "if an acount is associated to this address, a reset link has been sent") {
                    triggierNotification("Lien de réinitialisation de mot de passe envoyé (expire dans 15min)", 'succes');
                    localStorage.setItem('resetToken', token);
                } else {
                    triggierNotification("Une erreur est survenue lors de l'envoie du lien", 'error');
                    return;
                }
            } catch (error) {
                console.error("Erreur de réinitialisation:", error);
            }
        }

    return (
        <div className="registration-page h-[100%] w-[50%] relative align-center flex flex-col justify-center items-center bg-[#eef2f7] ovrflow-hidden border border-white/70 rounded-lg backdrop-blur-[12px] backdrop-sature-[160%] shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] ">
                    
                    <div className="login-form w-[90%] h-[100%] relative flex flex-col justify-center items-center" >
                        <form onSubmit={handleSubmit} className="h-full w-full p-8 flex flex-col justify-center items-center bg-white/70 border border-white/90 rounded-3xl shadow-xl backdrop-blur-md space-y-5">
                            <h2 className="text-2xl font-bold text-center text-slate-900">Connexion</h2>
                            
                            <label className="block text-xs font-semibold text-slate-600 uppercase" htmlFor="email">Email: </label>
                            <input 
                                type="email"
                                required
                                placeholder="my@example.com"
                                value={email}
                                name="email"
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 bg-white/80 border border-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all ease"
                            />
                            
                            <label className="block text-xs font-semibold text-slate-600 uppercase" htmlFor="password1">Mot de passe: </label>
                            <input 
                                type="password"
                                value={password}
                                name="password"
                                min="6"
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 bg-white/80 border border-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all ease"
                            />
                            
                            <div className="flex flex-row justify-between items-center" >
                                <button type="submit" className="text-cyan-800 h-12 px-2 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-semibold text-md cursor-pointer hover:-translate-y-0.7 transition-all duration-150 active:translate-y-1 active:shadow-md" >Se connecter</button>
                                <p className="h-12 px-2 py-2 m-3 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-medium text-base cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md"><Link to="/">S'incrire ?</Link></p>
                            </div>
                            <button 
                            type="button"
                                onClick={handleForgotPass}
                                className="h-12 px-2 py-2 m-3 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-medium text-base cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md"
                            >Forgot password?</button>
                        </form>
                        {notification.message && (
                            <div className={`max-w-sm p-4 z-50 rounded-xl border text-sm font-medium shadow-lg transition-all duration-500 ease-out
                            ${notification.type === 'succes'
                                ? 'bg-[#14231c] border-emerald-500/30 text-emerald-400'
                                : 'bg-[#291415] border-red-500/30 text-red-400'
                            }`} >
                                <span>{notification.message}</span>
                            </div>
                        )}
                    </div>
                </div>
    )
}

export default  Login;