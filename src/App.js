import React, { useState } from "react";
import axios from "axios";
import Chat from "./components/Chat";
import {jwtDecode} from "jwt-decode";
import {Stomp} from "@stomp/stompjs";

const App = () => {
    const [token, setToken] = useState(""); // JWT 토큰
    const [chatRooms, setChatRooms] = useState([]); // 채팅방 목록
    const [selectedRoomId, setSelectedRoomId] = useState(null); // 선택된 채팅방 ID
    const [opposite, setOpposite] = useState("");
    const [email, setEmail] = useState("");
    const [stompClient, setStompClient] = useState(null);

    // JWT 토큰을 이용해 채팅방 목록 조회
    const fetchChatRooms = async () => {
        const decodedToken = jwtDecode(token)
        setEmail(decodedToken.email);
        try {
            const response = await axios.get(`http://localhost:5000/api/v1/chatrooms/user/${decodedToken.email}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setChatRooms(response.data);
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    let socket;
    const connectWebSocket = () => {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
            socket = new WebSocket(`ws://localhost:5000/ws?token=${token}`);
            const client = Stomp.over(socket);
            client.connect({ Authorization: `Bearer ${token}` }, () => {
                console.log('Connected to WebSocket');


                client.subscribe(`/user/queue/close`, (message) => {
                    const notification = message.body;
                    if (notification === "중복 연결 감지") {
                        alert('중복 연결 감지~~~');
                        client.deactivate();
                    }
                });

                // 구독: 새로운 채팅방 알림
                client.subscribe(`/user/queue/subscribe`, (message) => {
                    const chatRoomId = JSON.parse(message.body);
                    alert('새로운 채팅방에 초대되었습니다!');
                    fetchChatRooms();
                });

                // 구독: 새로운 채팅 알림
                client.subscribe(`/user/queue/notifications`, (message) => {
                    // alert('새로운 채팅 메시지가 도착했습니다!');
                    fetchChatRooms();
                });

                // client.unsubscribe() => 방을 떠나면 구독 해제할 수 있도록 로직 작성
            });
            setStompClient(client); // 클라이언트 상태 설정
        }
    };

    function handleMessage(message) {
        const messageData = JSON.parse(message.body);

        // 메시지를 UI에 추가
        const chatBox = document.getElementById('chat-box');
        const newMessage = document.createElement('div');
        newMessage.textContent = `${messageData.sender}: ${messageData.message}`;
        chatBox.appendChild(newMessage);
    }

    // 새 채팅방 생성
    const createChatRoom = async () => {
        try {
            const response = await axios.post(
                "http://localhost:5000/api/v1/chatrooms",
                { user1: email, user2 : opposite},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const newChatRoom = response.data;
            const isDuplicate = chatRooms.some((room) => room.chatRoomId === newChatRoom.chatRoomId);
            if (!isDuplicate) {
                setChatRooms([...chatRooms, newChatRoom]); // 새 채팅방 추가
            }
            setOpposite(""); // 입력 필드 초기화
        } catch (error) {
            console.error("Error creating chat room:", error);
        }
    };

    // JWT 토큰 입력 후 채팅방 목록 조회
    const handleTokenSubmit = (e) => {
        e.preventDefault();
        if (token) {
            fetchChatRooms();
            connectWebSocket();
        }
    };

    return (
        <div>
            {!selectedRoomId ? (
                <div>
                    <h1>Chat Rooms</h1>
                    <form onSubmit={handleTokenSubmit}>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter JWT token"
                        />
                        <button type="submit">Fetch Chat Rooms</button>
                    </form>

                    <ul>
                        {chatRooms.map((room) => (
                            <li key={room.chatRoomId}>
                                <button onClick={() => {
                                    setSelectedRoomId(room.chatRoomId);
                                    if (email === room.user1) {
                                        setOpposite(room.user2);
                                    } else {
                                        setOpposite(room.user1);
                                    }
                                }}>
                                    {email === room.user1 ? room.user2 : room.user1}
                                </button>
                                <div>
                                    {room.unReadCount}
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div>
                        <h2>Create New Chat Room</h2>
                        <input
                            type="text"
                            value={opposite}
                            onChange={(e) => setOpposite(e.target.value)}
                            placeholder="Enter username you want to chat"
                        />
                        <button onClick={createChatRoom}>Create</button>
                    </div>
                </div>
            ) : (
                <Chat
                    roomId={selectedRoomId}
                    token={token}
                    onLeaveRoom={() => {
                        setSelectedRoomId(null);
                        fetchChatRooms();
                    }}
                    email={email}
                    opposite={opposite}
                    stompClient={stompClient}
                />
            )}
        </div>
    );
};

export default App;
