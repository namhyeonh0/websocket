import React, {useState} from "react";
import axios from "axios";
import Chat from "./components/Chat";
import {Stomp} from "@stomp/stompjs";

const App = () => {
    const [token, setToken] = useState(""); // JWT 토큰
    const [chatRooms, setChatRooms] = useState([]); // 채팅방 목록
    const [selectedRoomId, setSelectedRoomId] = useState(null); // 선택된 채팅방 ID
    const [opposite, setOpposite] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [stompClient, setStompClient] = useState(null);
    const [isLogined, setIsLogined] = useState(false);

    const fetchChatRooms = async (access) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/v1/chatrooms/user`, {
                headers: {Authorization: `${access}`},
            });
            setChatRooms(response.data);
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    let socket;
    const connectWebSocket = (access) => {
        console.log(`connect websocket, token: ${access}`);
        if (!socket || socket.readyState === WebSocket.CLOSED) {
            socket = new WebSocket(`ws://localhost:5000/ws?authorization=${access}`);
            const client = Stomp.over(socket);
            client.connect({Authorization: `${access}`}, () => {

                client.subscribe(`/user/queue/notifications`, (message) => {
                    const notice = JSON.parse(message.body);
                    alert(notice.content);
                    fetchChatRooms(access);
                });
            });
            setStompClient(client);
        }
    };

    const login = async (event) => {
        event.preventDefault();

        const formData = new URLSearchParams();
        formData.append('email', email);
        formData.append('password', password);
        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(), // URL 인코딩된 데이터
                credentials: "include",
            });

            if (response.ok) {
                setIsLogined(true);
                const responseToken = response.headers.get("Authorization")
                setToken(response.headers.get("Authorization"));
                console.log(`로그인 성공: ${token}`);
                alert("로그인에 성공하셨습니다.");
                fetchChatRooms(responseToken);
                connectWebSocket(responseToken);
            } else {
                const errorMessage = await response.text();
                console.error(`오류 발생: ${response.status} - ${errorMessage}`);
                alert(`로그인 실패: ${errorMessage.split("\"")[3]}`);
            }
        } catch (error) {
            console.error("로그인 요청 실패:", error);
            alert("로그인 요청 중 오류가 발생했습니다.");
        }
    };

    const createChatRoom = async () => {
        try {
            const response = await axios.post(
                "http://localhost:5000/api/v1/chatrooms",
                {user1: email, user2: opposite},
                {headers: {Authorization: `${token}`}}
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
        fetchChatRooms(token);
    };

    return (
        <div>
            {!isLogined ? (
                <form onSubmit={login}>
                    <div>
                        <div>
                            <input
                                type="text"
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Email"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                            />
                        </div>
                    </div>
                    <button type="submit">Login</button>
                </form>
            ) : (
                <h2>환영합니다!</h2>
            )
            }


            {!selectedRoomId ? (
                <div>
                    <h1>Chat Rooms</h1>
                    <ul>
                        {chatRooms.map((room) => (
                            <li key={room.chatRoomId}>
                                <button onClick={() => {
                                    setSelectedRoomId(room.chatRoomId);
                                    setOpposite(room.oppositeEmail);
                                }}>
                                    {room.oppositeName}
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
                        fetchChatRooms(token);
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
