import React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import flags from 'react-phone-number-input/flags';

const Register = () => {

    const navigate = useNavigate();
    // State to store the user's info
    const [userObject, setUserObject] = useState({
        name: "",
        email: "",
    });

    const [phoneNumber, setPhoneNumber] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");

    const [notification, setNotification] = useState({message: '', type: ''});

    const triggerNotification = (message, type='succes') => {
        setNotification({message, type});
        setTimeout(() => {
            setNotification({message: '', type:''});
        }, 5000);
    };
    
    // State to store validation Errors
    const [errors, setErrors] = useState({});

    // Validation regexps
    const regexName = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
    const regexEmail = /^[\w.%+-;]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Changes Manager
    const handleChange = (e) => {
        const {name, value} = e.target;
        setUserObject((prevUser) => ({
            ...prevUser,
            [name]: value,
        }));


        if (errors[name]) {
            setErrors({ ...errors, [name]: ''});
        }
    }

    // Validation function 
    const validationForm = () => {
        let tempErrors = {};

        if (!regexName.test(userObject.name)) {
            tempErrors.name = "Le nom doit contenir au moins 2 lettres (pas de chiffres)."
        }

        if (!regexEmail.test(userObject.email)) {
            tempErrors.email = "L'adresse Email n'est pas valide."
        }

        if (password1.length < 6) {
            tempErrors.password1 = "Le mot de passe doit contenir au moins 6 caractères."
        }

        if (password2 != password1) {
            tempErrors.password2 = "Les mots de passe ne correspondent pas."
        } 
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    }

    // Submit function
    const handleSubmit = async (e) => {
            e.preventDefault();
        if (!validationForm()) {
            console.log("Echec de la validation");
            return;
        }
        console.log(password1, phoneNumber);
        try {
            const response = await fetch("http://localhost:5000/api/auth/register", 
                {method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: userObject.name,
                        email: userObject.email,
                        password: password1,
                        phone: phoneNumber
                    }),
                }
            );

            const data = await response.json();
            const {message, userToken} = data;
            console.log(response.status);
            console.log(data.userToken.token, data.message);
            if (!response.ok) {
                
                if (message === "EMAIL_ALREADY_EXISTS") {
                    triggerNotification("Cette adresse email est déjà enregistrée. Veuillez vous connecter.", 'error');
                } else {
                    triggerNotification("Une erreur est survenue lors de l'inscription.", 'error');
                }
                return; 
            }

            if (response.status === 201 && message === "User created successfully") {
                triggerNotification("Utilisateur enregistré avec succès! Redirection...", 'succes');
            }
            localStorage.setItem("accessToken", userToken.token);
            navigate("/hdquote");
        } catch (error) {
            console.error("Error Backend registration",error);

        }
    } 
    return (
        <div className="registration-page h-[100%] w-[50%] relative align-center flex flex-col justify-center items-center bg-[#eef2f7] ovrflow-hidden border border-white/70 rounded-lg backdrop-blur-[12px] backdrop-sature-[160%] shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] ">
            
            <div className="registration-form w-[90%] h-[100%] relative flex flex-col justify-center items-center" >
                <form onSubmit={handleSubmit} className="h-full w-full p-8 flex flex-col justify-center items-center bg-white/70 border border-white/90 rounded-3xl shadow-xl backdrop-blur-md space-y-3">
                    <h2 className="text-2xl font-bold text-center text-slate-900">Créer un compte</h2>
                    <label className="block text-xs font-semibold text-slate-600 uppercase" htmlFor="name">Noms: </label>
                    <input 
                    type="text"
                    required
                    placeholder="John Doe"
                    name="name"
                    value={userObject.name}
                    onChange={handleChange}
                    className="w-full h-8 px-4 bg-white/80 border border-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all ease"
                    />
                    {errors.name && (
                        <p className="text-xs text-red-500 font-medium pl-1 mt-1 animate-pulse">{errors.name}</p>
                    )}

                    <label className="block text-xs font-semibold text-slate-600 uppercase" htmlFor="email">Email: </label>
                    <input 
                        type="email"
                        required
                        placeholder="my@example.com"
                        value={userObject.email}
                        name="email"
                        onChange={handleChange}
                        className="w-full h-8 px-4 bg-white/80 border border-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all ease"
                    />
                    {errors.email && (
                        <p className="text-xs text-red-500 font-medium pl-1 mt-1 animate-pulse">{errors.email}</p>
                    )}

                    <label className="block text-xs font-semibold text-slate-600 uppercase" htmlFor="password1">Mot de passe: </label>
                    <input 
                        type="password"
                        value={password1}
                        name="passsword1"
                        required
                        min="6"
                        onChange={(e) => setPassword1(e.target.value)}
                        className="w-full h-8 px-4 bg-white/80 border border-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all ease"
                    />
                    {errors.password1 && (
                        <p className="text-xs text-red-500 font-medium pl-1 mt-1 animate-pulse">{errors.password1}</p>
                    )}
                    
                    <label className="block text-xs font-semibold text-slate-600 uppercase" htmlFor="password2">confirmez votre mot de passe: </label>
                    <input 
                        type="password"
                        required
                        value={userObject.password2}
                        name="passsword2"
                        min="6"
                        onChange={(e) => setPassword2(e.target.value)}
                        className="w-full h-8 px-4 bg-white/80 border border-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all ease"
                    />
                    {errors.password2 && (
                        <p className="text-xs text-red-500 font-medium pl-1 mt-1 animate-pulse">{errors.password2}</p>
                    )}

                    <label className="block text-xs font-semibold text-slate-600 uppercase" htmlFor="password2">Telephone: </label>
                    <PhoneInput 
                        flags={flags}
                        defaultCountry="FR"
                        value={phoneNumber}
                        onChange={(value) => setPhoneNumber(value)}
                        className="w-full h-8 px-4 bg-white/80 border border-slate-500 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all ease"
                    />
                    <div className="flex flex-row justify-between items-center" >
                        <button type="submit" className="bg-cyan-100 text-cyan-800 h-12 px-4 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-medium text-md cursor-pointer duration-150 active:translate-y-1 active:shadow-md transition-all ease" >S'inscrire</button>
                        <p className="h-12 w-21 px-1 py-3 m-3 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-medium duration-150 active:translate-y-1 active:shadow-md transition-all cursor-pointer"><Link to="/login">connexion</Link></p>
                    </div>
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
    );
}

export default Register;