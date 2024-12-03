import React, {useEffect, useRef, useState} from "react";
import axios from "axios";

const Chat = ({roomId, token, onLeaveRoom, email, opposite, stompClient}) => {
    const [messages, setMessages] = useState([]); // 채팅 메시지
    const [messageContent, setMessageContent] = useState(""); // 입력한 메시지
    const messagesEndRef = useRef(null);
    const stompClientRef = useRef(stompClient);
    const [subscribed, setSubscribed] = useState(false);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/v1/chatmessages/${roomId}`,
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const initializeUnRead = async () => {
        try {
            await axios.put(`http://localhost:5000/api/v1/unread/init`,
                {chatRoomId: roomId, username: email},
                {headers: {Authorization: `Bearer ${token}`}},
            );
        } catch (error) {
            console.error("UnRead Initialization fail:", error);
        }
    };

    const sendMessage = () => {
        if (stompClientRef.current && messageContent.trim()) {
            stompClientRef.current.publish({
                destination: `/app/chat/send/${roomId}`,
                body: JSON.stringify({
                    message: messageContent,
                    sender: email,
                    receiver: opposite,
                })
            });
            setMessageContent('');
        }
        initializeUnRead();
    };

    let subscribe;

    useEffect(() => {
        if (!subscribed) {
            fetchMessages();
            initializeUnRead();

            subscribe = stompClientRef.current.subscribe(`/topic/chatroom/${roomId}`, (message) => {
                try {
                    const chatMessage = JSON.parse(message.body);
                    setMessages((prevMessages) => [...prevMessages, chatMessage]);
                    setSubscribed(true);
                } catch (error) {
                    console.error('JSON 파싱 오류:', error);
                    console.error('받은 메시지:', message.body);
                }
            });
        }

        return () => {
            if (stompClientRef.current) {
                subscribe.unsubscribe();
            }
        };
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({behavior: 'instant'});
        }
    }, [messages]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div style={{fontFamily: "Arial, sans-serif", padding: "10px", maxWidth: "600px", margin: "auto"}}>
            <h1 style={{textAlign: "center", color: "#3cb371"}}>Chat Room: {roomId}</h1>
            <div
                style={{
                    border: "1px solid #ddd",
                    height: "300px",
                    overflowY: "scroll",
                    padding: "10px",
                    borderRadius: "10px",
                    backgroundColor: "#f9f9f9",
                }}
            >
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            justifyContent: msg.senderEmail === email ? "flex-end" : "flex-start",
                            margin: "5px 0",
                        }}
                    >
                        <div
                            style={{
                                maxWidth: "60%",
                                padding: "10px",
                                borderRadius: "10px",
                                backgroundColor: msg.senderEmail === email ? "#dcf8c6" : "#fff",
                                border: "1px solid #ddd",
                                wordWrap: "break-word",
                                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            <strong>{msg.senderName}</strong>
                            <p style={{margin: 0}}>{msg.message}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}/>
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "10px",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    backgroundColor: "#f9f9f9",
                }}
            >
                <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                        marginRight: "10px",
                        outline: "none",
                        fontSize: "14px",
                    }}
                />
                <button
                    onClick={sendMessage}
                    style={{
                        padding: "10px 15px",
                        border: "none",
                        borderRadius: "10px",
                        backgroundColor: "#3cb371",
                        color: "#fff",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "background-color 0.3s",
                    }}
                >
                    Send
                </button>
            </div>
            <button
                onClick={onLeaveRoom}
                style={{
                    marginTop: "10px",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "10px",
                    backgroundColor: "#ff6f61",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: "100%",
                    transition: "background-color 0.3s",
                }}
            >
                Leave Room
            </button>
        </div>
    );
};

export default Chat;
