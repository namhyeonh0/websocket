import React, {useState} from "react";
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

    const fetchChatRooms = async () => {
        const decodedToken = jwtDecode(token)
        setEmail(decodedToken.email);
        try {
            const response = await axios.get(`http://localhost:5000/api/v1/chatrooms/user/${decodedToken.email}`, {
                headers: {Authorization: `Bearer ${token}`},
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
            client.connect({Authorization: `Bearer ${token}`}, () => {

                client.subscribe(`/user/queue/notifications`, (message) => {
                    const notice = JSON.parse(message.body);
                    alert(notice.content);
                    fetchChatRooms();
                });
            });
            setStompClient(client);
        }
    };

    const createChatRoom = async () => {
        try {
            const response = await axios.post(
                "http://localhost:5000/api/v1/chatrooms",
                {user1: email, user2: opposite},
                {headers: {Authorization: `Bearer ${token}`}}
            );
            const newChatRoom = response.data;
            const isDuplicate = chatRooms.some((room) => room.chatRoomId === newChatRoom.chatRoomId);
            if (!isDuplicate) {
                setChatRooms([...chatRooms, newChatRoom]);
            }
            setOpposite("");
        } catch (error) {
            console.error("Error creating chat room:", error);
        }
    };

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
