import axios from 'axios';

const apiBaseURL = 'https://atchatbot.pythonanywhere.com';
// const apiBaseURL = 'http://localhost:5000';

const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow all origins (development only)
    },
};

export const initRecordingConversation = (userId) => {
    return axios.post(`${apiBaseURL}/init_recording_conversation`, { user_id: userId });
};

export const startChat = (userId) => {
    return axios.post(`${apiBaseURL}/start_chat`, { user_id: userId });
};
// let axiosConfig = {
//     headers: {
//         'Content-Type': 'application/json;charset=UTF-8',
//         "Access-Control-Allow-Origin": "*",
//     }
// };
export const sendMessage = (userId, message) => {
    console.log(userId);
    console.log(message);
    return axios.post(`${apiBaseURL}/handle_chat`, { user_id: userId, message: message }, axiosConfig);
};

export const submitUserDetails = (userId, details) => {
    return axios.post(`${apiBaseURL}/submit_details`, { user_id: userId, message: details });
};

export const submitCallbackPreference = (userId, preference) => {
    return axios.post(`${apiBaseURL}/submit_callback_preference`, { user_id: userId, message: preference });
};

export const submitSatisfaction = (userId, satisfaction) => {
    return axios.post(`${apiBaseURL}/submit_satisfaction`, { user_id: userId, message: satisfaction });
};

export const terminateChat = (userId) => {
    return axios.post(`${apiBaseURL}/terminate`, { user_id: userId });
};
export const handleTerminateResponse = async (userId, response) => {
    try {
        const apiResponse = await axios.post(`${apiBaseURL}/terminate_response`, { user_id: userId, response });
        if (response === 'Y') {
            const reconnectMessage = "Please wait while we reconnect you...";

            return reconnectMessage;
        } else if (response === 'N') {
            const thankYouMessage = 'Thank you for using our service. Have a great day!';
            return thankYouMessage;
        }
    }
    catch (error) {
        console.error('Error sending terminate response:', error);
        throw new Error('Error sending terminate response. Please try again later.');

    }
};

export const submitQuery = (userId, query) => {
    return axios.post(`${apiBaseURL}/submit_query`, { user_id: userId, user_query: query });
};
