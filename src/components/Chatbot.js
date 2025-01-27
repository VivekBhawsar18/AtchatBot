import React, { useState, useEffect, useRef } from "react";
import {
    initRecordingConversation,
    startChat,
    sendMessage,
    submitUserDetails,
    submitCallbackPreference,
    submitSatisfaction,
    terminateChat,
    handleTerminateResponse as terminateResponse,
    submitQuery
} from "../services/ChatbotService"; // Ensure the path is correct
import "./Chatbot.css";
import logo from '../components/images/logo.png';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [chatbotId, setChatbotId] = useState(() => {
        const storedId = localStorage.getItem("chatbotId");
        return storedId || "";
    });
    const [options, setOptions] = useState([]);
    const [conversation, setConversation] = useState([]);
    const [disabledOptions, setDisabledOptions] = useState(new Set());
    const [userDetails, setUserDetails] = useState({ name: '', number: '', email: '' });
    const [userSatisfaction, setUserSatisfaction] = useState({ review: '', satisfactionLevel: 0 });
    const [currentStep, setCurrentStep] = useState(0);
    const [currentSliderValue, setCurrentSliderValue] = useState(5);
    const [currentQuery, setCurrentQuery] = useState('');
    const [isQueryDisabled, setIsQueryDisabled] = useState(false);
    const [isRatingDisabled, setIsRatingDisabled] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const conversationEndRef = useRef(null);

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation]);

    const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);
    const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@(gmail\.com|test\.com)$/.test(email);
    const isValidNumber = (number) => /^[6-9]\d{9}$/.test(number);

    const generateId = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let uniqueID = "#";
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            uniqueID += characters[randomIndex];
        }
        return uniqueID;
    };

    const toggleChatbot = async () => {
        if (!isOpen) {
            const newId = generateId();
            console.log(newId);
            setChatbotId(newId);
            localStorage.setItem("chatbotId", newId);

            setOptions([]);
            setConversation([]);
            setDisabledOptions(new Set());
            setUserDetails({ name: '', number: '', email: '' });
            setUserSatisfaction({ review: '', satisfactionLevel: 0 });
            setCurrentStep(0);
            setCurrentSliderValue(5);
            setIsQueryDisabled(false);

            try {
                await initRecordingConversation(newId);
                console.log("Conversation recording initialized");

                const response = await startChat(newId);
                console.log("Start Chat Response:", response.data);

                const initialOptions = ["Our Services", "Book A Demo"];
                setOptions(initialOptions);
                setConversation([
                    { text: response.data.message.join(' '), isBot: true },
                    { text: "Choose an option:", isBot: true, options: initialOptions }
                ]);
            } catch (error) {
                console.error("Error starting chatbot:", error);
            }
            setIsOpen(true); // Open the chatbot
        }

    };

    const handleClose = async () => {
        try {
            const response = await terminateChat(chatbotId);
            console.log("Terminate Chat Response:", response.data);
            setConversation((prev) => [...prev, { text: response.data.message, isBot: true, options: ['Y', 'N'] }]);
        } catch (error) {
            console.log('Error during termination', error);
            setConversation((prev) => [...prev, { text: 'Error terminating the conversation. Please try again later.', isBot: true, options: [] }]);
        }
    };

    // Example function to simulate typing animation
    const simulateTyping = (message) => {
        setIsTyping(true);
        setTimeout(() => {
            setConversation((prev) => [...prev, { text: message, isBot: true }]);
            setIsTyping(false);
        }, 2000); // Adjust time as needed
    };

    const handleOptionClick = async (option) => {
        if (['Y', 'N'].includes(option)) {
            setDisabledOptions(new Set(['Y', 'N']));
            await handleTerminateResponse(chatbotId, option).catch(error => {
                console.error('Error sending terminate response:', error);
                setConversation((prev) => [
                    ...prev,
                    { text: 'Error sending your response. Please try again later.', isBot: true, options: [] },
                ]);
            });
        } else {
            setConversation((prev) => [
                ...prev,
                { text: option, isBot: false, isUser: true },
            ]);
            setDisabledOptions(new Set([...disabledOptions, ...options]));

            try {
                const response = await sendMessage(chatbotId, option);
                simulateTyping(); // Call simulateTyping here
                console.log("Handle Option Click Response:", response.data);

                if (option === "Our Services") {
                    const serviceOptions = [
                        "Website Development",
                        "Mobile App Development",
                        "Social Media Marketing",
                        "ECommerce",
                        "AI Based Custom Solution",
                        "Documents Automation",
                        "Cyber Security Service",
                        "Update an Existing Application",
                        "Other"
                    ];
                    setOptions(serviceOptions);
                    setConversation((prev) => [
                        ...prev,
                        { text: "Here are our services:", isBot: true },
                        { text: "Choose a service:", isBot: true, options: serviceOptions }
                    ]);
                } else if (["Website Development", "Mobile App Development", "Social Media Marketing", "ECommerce", "AI Based Custom Solution", "Documents Automation", "Cyber Security Service", "Update an Existing Application", "Other"].includes(option)) {
                    const startOptions = ["Start Immediately", "Within a month"];
                    setOptions(startOptions);
                    setConversation((prev) => [
                        ...prev,
                        { text: "When do you wish to start?", isBot: true, options: startOptions }
                    ]);
                } else if (["Start Immediately", "Within a month"].includes(option)) {
                    setConversation((prev) => [
                        ...prev,
                        { text: "Kindly provide your details to help us provide you the best service:", isBot: true },
                        { text: "Please provide your name.", isBot: true },
                        // { text: "Enter your name", isBot: true },
                    ]);
                    setCurrentStep(1);
                } else if (option === "Book A Demo" || response.data.message.includes("Kindly provide your details to help us provide you the best service:")) {
                    setConversation((prev) => [
                        ...prev,
                        { text: "Kindly provide your details to help us provide you the best service:", isBot: true },
                        { text: "Please provide your name.", isBot: true },
                        // { text: "Enter your name", isBot: true },
                    ]);
                    setCurrentStep(1);
                } else if (currentStep === 4) { // When handling callback preference
                    if (option === "Yes!" || option === "No") {
                        setConversation((prev) => [
                            ...prev,
                            { text: "Please provide your satisfaction ratings (*).", isBot: true },
                        ]);
                        setCurrentStep(5); // Move to satisfaction ratings step
                    }
                } else {
                    setConversation((prev) => [
                        ...prev,
                        { text: response.data.message, isBot: true, options: response.data.options || [] },
                    ]);
                    setOptions(response.data.options || []);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    // const handleSubmitDetails = async (detail) => {
    //     let updatedDetails = { ...userDetails };

    //     let isValid = false;
    //     if (currentStep === 1) {
    //         // Validate Name
    //         isValid = isValidName(detail);
    //         if (!isValid) {
    //             setConversation((prev) => [
    //                 ...prev,
    //                 { text: 'Invalid name. Please enter alphabetic characters only.', isBot: true },
    //             ]);
    //             return;
    //         }
    //         updatedDetails.name = detail;
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: detail, isBot: false, isUser: true },
    //             { text: 'Please provide your email address.', isBot: true },
    //         ]);
    //         setCurrentStep(2);
    //     } else if (currentStep === 2) {
    //         //Validate Email
    //         isValid = isValidEmail(detail);
    //         if (!isValid) {
    //             setConversation((prev) => [
    //                 ...prev,
    //                 { text: 'Invalid email. Please enter a valid email with @gmail.com or @test.com.', isBot: true },
    //             ]);
    //             return;
    //         }
    //         updatedDetails.email = detail;
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: detail, isBot: false, isUser: true },
    //             { text: 'Please provide your phone number (without country code).', isBot: true },
    //         ]);
    //         setCurrentStep(3);

    //     } else if (currentStep === 3) {
    //         // Validate Phone Number
    //         isValid = isValidNumber(detail);
    //         if (!isValid) {
    //             setConversation((prev) => [
    //                 ...prev,
    //                 { text: 'Invalid phone number. Please enter a 10-digit number starting with 6-9.', isBot: true },
    //             ]);
    //             return;
    //         }
    //         updatedDetails.number = detail;
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: detail, isBot: false, isUser: true },
    //         ]);
    //         try {
    //             // Submit user details to the server
    //             const response = await submitUserDetails(chatbotId, `${updatedDetails.name},${updatedDetails.number},${updatedDetails.email}`);
    //             //Replay the stored query after collecting details
    //             setConversation((prev) => [
    //                 ...prev,
    //                 { text: currentQuery, isBot: false, isUser: true },//Replay user's query
    //                 { text: response.data.message || "Thank you for providing your details. Your query has been registered.", isBot: true },
    //                 // {text:"Do you wish to request a call back?",isBot:true},
    //             ]);


    //             setOptions([]); // Clear options for the callback preference step
    //             setConversation((prev) => [
    //                 ...prev,
    //                 { text: "Do you wish to request a call back?", isBot: true },
    //                 // options: ["Yes Please!", "No Please!"] },


    //             ]);
    //             setCurrentStep(4); // Move to callback preference step
    //         } catch (error) {
    //             console.error('Error sending user details:', error);
    //         }
    //     }
    //     setUserDetails(updatedDetails);
    // };



    const handleSubmitDetails = async (detail) => {
        let updatedDetails = { ...userDetails };

        let isValid = false;
        if (currentStep === 1) {
            isValid = isValidName(detail);
            if (!isValid) {
                setConversation((prev) => [
                    ...prev,
                    { text: 'Invalid name. Please enter alphabetic characters only.', isBot: true },
                ]);
                return;
            }
            updatedDetails.name = detail;
            setConversation((prev) => [
                ...prev,
                { text: detail, isBot: false, isUser: true },
                { text: 'Please provide your email address.', isBot: true },
            ]);
            setCurrentStep(2);
        } else if (currentStep === 2) {
            isValid = isValidEmail(detail);
            if (!isValid) {
                setConversation((prev) => [
                    ...prev,
                    { text: 'Invalid email. Please enter a valid email with @gmail.com or @test.com.', isBot: true },
                ]);
                return;
            }
            updatedDetails.email = detail;
            setConversation((prev) => [
                ...prev,
                { text: detail, isBot: false, isUser: true },
                { text: 'Please provide your phone number (without country code).', isBot: true },
            ]);
            setCurrentStep(3);

        } else if (currentStep === 3) {
            isValid = isValidNumber(detail);
            if (!isValid) {
                setConversation((prev) => [
                    ...prev,
                    { text: 'Invalid phone number. Please enter a 10-digit number starting with 6-9.', isBot: true },
                ]);
                return;
            }
            updatedDetails.number = detail;
            setConversation((prev) => [
                ...prev,
                { text: detail, isBot: false, isUser: true },
            ]);
            try {
                const response = await submitUserDetails(chatbotId, `${updatedDetails.name},${updatedDetails.number},${updatedDetails.email}`);
                setOptions([]); // Clear options for the callback preference step
                setConversation((prev) => [
                    ...prev,
                    { text: "Do you wish to request a call back?", isBot: true },
                    // options: ["Yes Please!", "No Please!"] },


                ]);
                setCurrentStep(4); // Move to callback preference step
            } catch (error) {
                console.error('Error sending user details:', error);
            }
        }
        setUserDetails(updatedDetails);
    };




    const handleReviewSubmit = async (detail, isSatisfaction = false) => {
        let updatedReviewDetails = { ...userSatisfaction };
        if (currentStep === 5 && isSatisfaction) {
            updatedReviewDetails.satisfactionLevel = detail;
            const fullStars = Math.floor(detail);
            const hasHalfStar = detail % 1 !== 0;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

            const visualStars = '★'.repeat(fullStars) + (hasHalfStar ? '★' : '') + '☆'.repeat(emptyStars);

            setConversation((prev) => [
                ...prev,
                { text: `Ratings: ${visualStars} (${detail}/5)`, isBot: false, isUser: true },
                { text: 'Thank you for providing ratings(*) .', isBot: true },


            ]);

            setOptions([]); // Disable options after submission
            setIsRatingDisabled(true); //Disable the rating submission

            try {
                await submitSatisfaction(chatbotId, updatedReviewDetails.satisfactionLevel);
            } catch (error) {
                console.error('Error submitting satisfaction:', error);
            }
            setUserSatisfaction(updatedReviewDetails);
        }
    };

    // const handleQuerySubmit = async () => {
    //     if (!currentQuery.trim()) {
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: 'Please enter a query before submitting.', isBot: true },
    //         ]);
    //         return;
    //     }

    //     try {
    //         setIsQueryDisabled(true);
    //         const response = await submitQuery(chatbotId, currentQuery);
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: currentQuery, isBot: false, isUser: true },
    //             { text: response.data.message, isBot: true },
    //         ]);
    //         setCurrentQuery('');
    //     } catch (error) {
    //         console.error('Error submitting query:', error);
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: 'There was an error submitting your query. Please try again later.', isBot: true },
    //         ]);
    //     }
    //     finally {
    //         setIsQueryDisabled(false);
    //     }
    // };

    // const handleQuerySubmit = async () => {
    //     if (!currentQuery.trim() || isQueryDisabled) return;

    //     //Check if users details are missing 
    //     if (!userDetails.name || !userDetails.email || !userDetails.number) {
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: "Kindly provide your details to help us provide you the best service:", isBot: true },
    //             { text: "Please provide your name.", isBot: true },
    //         ]);
    //         setCurrentStep(1); // Move to the step for collecting user details
    //         return;
    //     }

    //     try {
    //         setIsQueryDisabled(true); // Disable the query button after submission
    //         const response = await submitQuery(chatbotId, currentQuery);
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: currentQuery, isBot: false, isUser: true }, // Display user's query
    //             { text: response.data.message, isBot: true }, // Display chatbot's response
    //             { text: "Thank you for providing your details. Your query has been registered.", isBot: true },
    //             { text: "Do you wish to request a call back?", isBot: true },
    //             // { text: 'Have a Great Day! .', isBot: true },
    //         ]);
    //         setOptions(["Yes", "No"]); //Add callback options

    //         setCurrentQuery(' '); // Clear the query input
    //     } catch (error) {
    //         console.error('Error submitting query:', error);
    //         setConversation((prev) => [
    //             ...prev,
    //             { text: 'There was an error submitting your query. Please try again later.', isBot: true },
    //         ]);
    //     }
    // };


    const handleQuerySubmit = async () => {
        if (!currentQuery.trim() || isQueryDisabled) return;

        try {
            setIsQueryDisabled(true); // Disable the query button after submission
            const response = await submitQuery(chatbotId, currentQuery);
            setConversation((prev) => [
                ...prev,
                { text: currentQuery, isBot: false, isUser: true },
                { text: response.data.message, isBot: true },
                { text: 'Have a Great Day! .', isBot: true },
            ]);
            setCurrentQuery('');
        } catch (error) {
            console.error('Error submitting query:', error);
            setConversation((prev) => [
                ...prev,
                { text: 'There was an error submitting your query. Please try again later.', isBot: true },
            ]);
        }
    };



    const handleSubmitCallbackPreference = async (preference) => {
        try {
            await submitCallbackPreference(chatbotId, preference);
            setConversation((prev) => [
                ...prev,
                { text: 'Callback preference submitted successfully.', isBot: true, options: [] },
            ]);
            //Procced to review submission 
            setConversation((prev) => [
                ...prev,
                { text: 'Please give us a Ratings(*).', isBot: true, options: [] },
            ]);
            setCurrentStep(5); //Move to review step
        } catch (error) {
            console.error('Error submitting callback preference:', error);
            setConversation((prev) => [
                ...prev,
                { text: 'Error submitting callback preference. Please try again later.', isBot: true, options: [] },
            ]);
        }
    };

    const handleTerminateResponse = async (chatbotId, option) => {
        try {
            await terminateResponse(chatbotId, option);
            console.log(`User selected: ${option}`); // Log the user's choice

            if (option === 'Y') {
                const reconnectMessage = "Please wait while we reconnect you...";
                setConversation((prev) => [...prev, { text: reconnectMessage, isBot: true, options: [] }]);
            } else if (option === 'N') {
                const thankYouMessage = 'Thank you for using our service. Have a great day!';
                setConversation((prev) => [...prev, { text: thankYouMessage, isBot: true, options: [] }]);
                setTimeout(() => {
                    setIsOpen(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error sending terminate response:', error);
            setConversation((prev) => [
                ...prev,
                { text: 'Error sending your response. Please try again later.', isBot: true, options: [] },
            ]);
        }
    };


    const handleMicInput = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Sorry, your browser does not support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Recognized speech:", transcript);
            setCurrentQuery(transcript); // Set the recognized speech as the query input
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
            console.log("Speech recognition ended.");
        };
    };
    return (
        <div className="chatbot-container">
            <button className="chatbot-logo" onClick={toggleChatbot}>
                💬
            </button>
            {isOpen && (
                <div className="chatbot-frame">
                    <div className="chatbot-header">
                        <nav className="chatbot-navbar">
                            <img src={logo} alt="Logo" className="chatbot-logo-image" />
                            <h2 className="chatbot-title">ATai Chatbot</h2>
                            <button className="chatbot-close-button" onClick={handleClose}>
                                &times;
                            </button>
                        </nav>
                    </div>
                    <div className="chatbot-conversation">
                        {conversation.map(({ text, isBot, options }, index) => (
                            <div key={index}>
                                <div className={`chatbot-message ${isBot ? 'bot' : 'user'}`}>
                                    {text}
                                </div>
                                {isBot && options && options.length > 0 && (
                                    <div className="chatbot-options">
                                        {options.map((option, i) => (
                                            <button
                                                key={i}
                                                className="chatbot-option-button"
                                                onClick={() => handleOptionClick(option)}
                                                disabled={disabledOptions.has(option)}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={conversationEndRef} />

                        {isTyping && (
                            <div className="typing">
                                <div className="typing-indicator"></div>
                                <div className="typing-indicator"></div>
                                <div className="typing-indicator"></div>
                            </div>
                        )}

                    </div>
                    {currentStep > 0 && currentStep <= 3 && (
                        <div className="user-details-input">
                            <input
                                type="text"
                                placeholder={
                                    currentStep === 1
                                        ? 'Enter your name'
                                        : currentStep === 2
                                            ? 'Enter your email address'
                                            : currentStep === 3
                                                ? 'Enter your phone number'
                                                : ''
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubmitDetails(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                    )}

                    {currentStep === 4 && !conversation.some(item => item.text === 'Your Callback Preference Submitted') && (
                        <div className="callback-preference">
                            <button onClick={() => handleSubmitCallbackPreference('Yes Please!')}>Yes </button>
                            <button onClick={() => handleSubmitCallbackPreference('No Please!')}>No</button>
                        </div>
                    )}

                    {/* {currentStep === 5 && ( *
                    //     <div className="review-details-input">
                    //         <p>Please rate your satisfaction:</p>
                    //         <div className="star-rating">
                    //             {[1, 2, 3, 4, 5].map((rating) => (
                    //                 <button
                    //                     key={rating}
                    //                     className={`star-button ${currentSliderValue >= rating ? 'filled' : ''}`}
                    //                     onClick={() => handleReviewSubmit(rating, true)}
                    //                     disabled={isRatingDisabled} // Disable after submission
                    //                 >
                    //                     ★
                    //                 </button>
                    //             ))}
                    //         </div>
                    //     </div>
                    // )}


                    {/* <div className="query-submission">
                        <input
                            type="text"
                            placeholder="Enter your query.."
                            value={currentQuery}
                            onChange={(e) => setCurrentQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleQuerySubmit();
                            }}
                            disabled={isQueryDisabled}
                        />
                        <button onClick={handleQuerySubmit} disabled={isQueryDisabled}>
                            Submit
                        </button>
                    </div> */}

                    {currentStep === 5 && !isRatingDisabled && (
                        <div className="review-details-input">
                            <p>Please rate your satisfaction:</p>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        className={`star-button ${currentSliderValue >= rating ? 'filled' : ''}`}
                                        onClick={() => handleReviewSubmit(rating, true)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}



                    {!isQueryDisabled && (
                        <div className="query-submission">
                            <div className="query-input-container">
                                <input
                                    type="text"
                                    placeholder="Type  your query here..."
                                    value={currentQuery}
                                    onChange={(e) => setCurrentQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleQuerySubmit();
                                    }}
                                />
                                <div className="input-icons">
                                    <button className="mic-button" onClick={handleMicInput}>
                                        <i className="fa fa-microphone" aria-hidden="true"></i>
                                    </button>
                                    <button className="send-button" onClick={handleQuerySubmit}>
                                        <i className="fa fa-paper-plane" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                    )}


                </div >

            )}
        </div >
    );
};

export default Chatbot;
