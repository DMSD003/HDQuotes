import React, { useState, useEffect } from 'react';

const WorkerInfo = ({accessToken}) => {

const[userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    user_phone: ""
});

    useEffect(() => {
        const getUserInfo = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/auth/user", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                const result = await response.json();
                console.log(result);
                const user = result.user;
                setUserInfo(user);
            } catch (error) {
                console.error("get use error:", error);
            }
        };
        getUserInfo();
    },[]);

    // On change handler
    const onChange = (event) => {
        const {name, value} = event.target;

        setUserInfo(prevUser => ({
            ...prevUser,
            [name]: value
        }));
    };

    return (
        <div className='flex flex-col justify-center'>
            <p>informations du prestataire</p>
            <input 
                name='name'
                value={userInfo.name}
                readOnly
            />
            <input 
                name='email'
                value={userInfo.email}
                readOnly
            />
            <input 
                name='phone'
                value={userInfo.user_phone}
                readOnly
            />
        </div>
    )
    
}

export default WorkerInfo;