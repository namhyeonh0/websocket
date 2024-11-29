import React, {useEffect, useState} from 'react';
import {Client} from '@stomp/stompjs';
import {jwtDecode} from "jwt-decode";

const ChatRoomComponent = () => {
    const [stompClient, setStompClient] = useState(null); // Stomp 클라이언트
    const [messages, setMessages] = useState([]); // 메시지 목록
    const [messageContent, setMessageContent] = useState(''); // 입력한 메시지
    const [username, setUsername] = useState(''); // 사용자의 이름
    const [setChatRoomId] = useState('');
    const [isChatRoomSelected, setIsChatRoomSelected] = useState(false);
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJjYXRlZ29yeSI6ImFjY2VzcyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3MzI1MjQ0MTcsImV4cCI6MTczMjUyNTAxN30.1cj8yo7F7PGk8b5kEHkZ8Fev-rfqxfwX4rozL6Tb0C0';


    useEffect(() => {
        const decodedToken = jwtDecode(token);
        console.log(decodedToken);
    },[])

    useEffect(() => {

        // const socket = new WebSocket('http://localhost:5000/ws'); // WebSocket 연결
        const client = new Client({
            brokerURL: 'ws://localhost:5000/ws', // WebSocket 서버 URL
            connectHeaders: {
                'Authorization': `Bearer ${token}`,
            },
            onConnect: () => {
                // 채팅방 구독
                client.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
                    try {
                        // 서버에서 온 메시지 파싱
                        const chatMessage = JSON.parse(message.body);
                        setMessages((prevMessages) => [...prevMessages, chatMessage]);
                    } catch (error) {
                        console.error('JSON 파싱 오류:', error);
                        console.error('받은 메시지:', message.body);
                    }
                });
            },
            onStompError: (frame) => {
                console.error(`STOMP error: ${frame}`);
            },
        });

        // 연결 및 클라이언트 상태 설정
        client.activate();
        setStompClient(client);

        return () => {
            if (client) {
                client.deactivate();
            }
        };
    }, []); // chatRoomId가 변경될 때마다 재연결

    const handleJoinRoom = () => {
        if (chatRoomId.trim()) {
            setIsChatRoomSelected(true);
        }
    };

    const sendMessage = () => {
        if (stompClient && messageContent.trim() && username) {
            // 메시지 전송
            stompClient.publish({
                destination: `/app/chat/send/${chatRoomId}`,  // 서버에서 메시지를 받을 엔드포인트
                body: JSON.stringify({
                    message: messageContent,
                    sender: username,
                })
            });
            setMessageContent('');
        }
    };

    return (

        <div>
            <h2>채팅방 {chatRoomId}</h2>
            <div style={{border: '1px solid #ddd', height: '300px', overflowY: 'scroll'}}>
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.sender}: </strong>{msg.message} ({msg.chatDate})
                    </div>
                ))}
            </div>
            <div>
                <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="메시지 입력"
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatRoomComponent;
